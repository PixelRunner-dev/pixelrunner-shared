import { spawn, spawnSync, type ChildProcessWithoutNullStreams, type SpawnOptions as NodeSpawnOptions } from 'node:child_process';
import { Readable } from 'node:stream';

type SpawnOptions = {
  cmd: string;
  args?: string[];
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  useShell?: boolean;           // spawn with shell if true
  streamOutput?: boolean;       // if true, return streams alongside live buffers
  maxBufferBytes?: number;      // safety limit for in-memory buffers (default small)
};

type SpawnResult = {
  pid?: number;
  stdoutBuffer: string;
  stderrBuffer: string;
  stdoutStream?: Readable;
  stderrStream?: Readable;
  process: ChildProcessWithoutNullStreams;
};

type InternalSpawnOpts = Pick<NodeSpawnOptions, 'cwd' | 'env' | 'shell'>;

export class ChildManager {
  // Track running processes by PID -> ChildProcess
  private processes = new Map<number, ChildProcessWithoutNullStreams>();
  private pidless = new Set<ChildProcessWithoutNullStreams>();
  // Default max buffer ~256KB to avoid RasPi Zero memory pressure
  private readonly DEFAULT_MAX_BUFFER = 256 * 1024;

  /**
   * Spawns a command and returns a result with either live streams or bounded strings for stdout/stderr.
   * @param {SpawnOptions} opts - spawn options
   * @returns {SpawnResult} - result with either live streams or bounded strings for stdout/stderr
   * @remarks The returned buffers are captured by reference; caller should read final .stdoutBuffer/.stderrBuffer
   * after process close to get full content. To keep this up-to-date, provide getters that read current values.
   */
  spawnCommand(opts: SpawnOptions): SpawnResult {
    const args = opts.args ?? [];
    const spawnOpts: InternalSpawnOpts = {
      cwd: opts.cwd,
      env: opts.env ?? process.env,
      shell: !!opts.useShell,
    };

    const child = spawn(opts.cmd, args, spawnOpts) as ChildProcessWithoutNullStreams;
    if (typeof child.pid === 'number') this.processes.set(child.pid, child);
    else this.pidless.add(child);

    const maxBuffer = opts.maxBufferBytes ?? this.DEFAULT_MAX_BUFFER;
    let stdoutBuf = '';
    let stderrBuf = '';

    // Optionally expose streams: we return original child.stdout/stderr
    const exposeStreams = !!opts.streamOutput;

    // Keep incrementally but bound buffers
    child.stdout.on('data', (chunk: Buffer | string) => {
      const s = chunk.toString('utf8');
      if (Buffer.byteLength(stdoutBuf, 'utf8') + Buffer.byteLength(s, 'utf8') <= maxBuffer) {
        stdoutBuf += s;
      } else {
        // drop oldest data if exceeding (circular trim) to preserve tail info
        const combined = stdoutBuf + s;
        stdoutBuf = combined.slice(-maxBuffer);
      }
    });

    child.stderr.on('data', (chunk: Buffer | string) => {
      const s = chunk.toString('utf8');
      if (Buffer.byteLength(stderrBuf, 'utf8') + Buffer.byteLength(s, 'utf8') <= maxBuffer) {
        stderrBuf += s;
      } else {
        const combined = stderrBuf + s;
        stderrBuf = combined.slice(-maxBuffer);
      }
    });

    // Cleanup on exit
    child.on('close', () => {
      if (typeof child.pid === 'number') this.processes.delete(child.pid);
      else this.pidless.delete(child);
    });
    child.on('error', () => {
      if (typeof child.pid === 'number') this.processes.delete(child.pid);
      else this.pidless.delete(child);
    });

    const result: SpawnResult = {
      pid: child.pid,
      stdoutBuffer: stdoutBuf,
      stderrBuffer: stderrBuf,
      process: child,
    };

    if (exposeStreams) {
      result.stdoutStream = child.stdout;
      result.stderrStream = child.stderr;
    }

    // Note: buffers are captured by reference; caller should read final .stdoutBuffer/.stderrBuffer
    // after process close to get full content.
    // To keep this up-to-date, provide getters that read current values:
    Object.defineProperty(result, 'stdoutBuffer', {
      get: () => stdoutBuf,
      enumerable: true,
    });
    Object.defineProperty(result, 'stderrBuffer', {
      get: () => stderrBuf,
      enumerable: true,
    });

    return result;
  }

  /**
   * execPromise is a promisified version of spawn that returns the final stdout/stderr buffers, exit code, and
   * signal. It also provides an optional timeout and max buffer size.
   *
   * @param {string} cmd The command to execute.
   * @param {string[]} args The arguments to pass to the command.
   * @param {{ cwd?: string; env?: NodeJS.ProcessEnv; timeoutMs?: number; maxBufferBytes?: number; useShell?: boolean; }} opts
   *   Options object with the following properties:
   *   - cwd: The working directory of the command.
   *   - env: The environment variables to pass to the command.
   *   - timeoutMs: The timeout in milliseconds. If the command does not finish within this time, it will be killed.
   *   - maxBufferBytes: The maximum number of bytes to buffer from stdout/stderr.
   *   - useShell: If true, the command will be executed through the shell.
   * @returns {Promise<{ code: number | null; signal: NodeJS.Signals | null; stdout: string; stderr: string; pid?: number; }>}
   */
  execPromise(cmd: string, args?: string[], opts?: { cwd?: string; env?: NodeJS.ProcessEnv; timeoutMs?: number; maxBufferBytes?: number; useShell?: boolean; }): Promise<{ code: number | null; signal: NodeJS.Signals | null; stdout: string; stderr: string; pid?: number; }> {
    return new Promise((resolve, reject) => {
      const spawnOpts: InternalSpawnOpts = {
        cwd: opts?.cwd,
        env: opts?.env ?? process.env,
        shell: !!opts?.useShell,
      };
      const child = spawn(cmd, args ?? [], spawnOpts) as ChildProcessWithoutNullStreams;
      if (typeof child.pid === 'number') this.processes.set(child.pid, child);
      else this.pidless.add(child);

      const maxBuffer = opts?.maxBufferBytes ?? this.DEFAULT_MAX_BUFFER;
      let stdout = '';
      let stderr = '';

      const onDataAppend = (buf: string, target: 'stdout' | 'stderr') => {
        if (target === 'stdout') {
          const combined = stdout + buf;
          stdout = Buffer.byteLength(combined) > maxBuffer ? combined.slice(-maxBuffer) : combined;
        } else {
          const combined = stderr + buf;
          stderr = Buffer.byteLength(combined) > maxBuffer ? combined.slice(-maxBuffer) : combined;
        }
      };

      child.stdout.on('data', (c) => onDataAppend(c.toString('utf8'), 'stdout'));
      child.stderr.on('data', (c) => onDataAppend(c.toString('utf8'), 'stderr'));

      let timedOut = false;
      let timeoutHandle: NodeJS.Timeout | undefined;
      if (opts?.timeoutMs && opts.timeoutMs > 0) {
        timeoutHandle = setTimeout(() => {
          timedOut = true;
          if (typeof child.pid === 'number') this.killByPid(child.pid);
        }, opts.timeoutMs);
      }

      child.on('error', (err) => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        if (typeof child.pid === 'number') this.processes.delete(child.pid);
        else this.pidless.delete(child);
        reject(err);
      });

      child.on('close', (code, signal) => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        if (typeof child.pid === 'number') this.processes.delete(child.pid);
        else this.pidless.delete(child);
        if (timedOut) {
          reject(new Error('Process timed out'));
        } else {
          resolve({ code, signal, stdout, stderr, pid: child.pid });
        }
      });
    });
  }

  /**
   * Spawn a command and wait for it to finish synchronously.
   * @remarks This is a spawnSync wrapper returning stdout/stderr as strings; use only for short commands
   * @param {string} cmd - command to execute
   * @param {string[]} [args] - arguments to pass to the command
   * @param {Object} [opts] - spawn options
   * @param {string} [opts.cwd] - current working directory to use
   * @param {NodeJS.ProcessEnv} [opts.env] - environment variables to use
   * @param {BufferEncoding} [opts.encoding] - encoding to use when returning stdout/stderr as strings
   * @param {number} [opts.maxBufferBytes] - maximum number of bytes to capture in stdout/stderr
   * @returns {Object} - result of the command
   * @returns {number | null} result.status - exit status of the command
   * @returns {string} result.stdout - output of the command
   * @returns {string} result.stderr - error output of the command
   */
  spawnSyncCommand(cmd: string, args?: string[], opts?: { cwd?: string; env?: NodeJS.ProcessEnv; encoding?: BufferEncoding; maxBufferBytes?: number; }): { status: number | null; stdout: string; stderr: string } {
    const maxBuffer = opts?.maxBufferBytes ?? this.DEFAULT_MAX_BUFFER;
    const syncResult = spawnSync(cmd, args ?? [], {
      cwd: opts?.cwd,
      env: opts?.env ?? process.env,
      encoding: undefined,
      maxBuffer: maxBuffer,
      shell: false,
    }) as { stdout: Buffer | string | null; stderr: Buffer | string | null; status: number | null; };
    const encodingUsed = opts?.encoding ?? 'utf8';

    let out: string;
    if (syncResult.stdout === null || syncResult.stdout === undefined) {
      out = '';
    } else if (syncResult.stdout instanceof Buffer) {
      out = syncResult.stdout.toString(encodingUsed);
    } else {
      out = syncResult.stdout as string;
    }
    let err: string;
    if (syncResult.stderr === null || syncResult.stderr === undefined) {
      err = '';
    } else if (syncResult.stderr instanceof Buffer) {
      err = syncResult.stderr.toString(encodingUsed);
    } else {
      err = syncResult.stderr as string;
    }

    return { status: syncResult.status, stdout: out, stderr: err };
  }

  /**
   * Kills a tracked child process by its PID.
   * @param {number} pid - pid of the child process to kill
   * @param {NodeJS.Signals | number} [signal='SIGTERM'] - signal to send to the child process
   * @returns {boolean} - true if the process was successfully killed, false otherwise
   */
  killByPid(pid: number, signal: NodeJS.Signals | number = 'SIGTERM'): boolean {
    const proc = this.processes.get(pid);
    if (!proc) return false;
    try {
      proc.kill(signal);
      // leave deletion to 'close' event; attempt immediate remove for safety
      this.processes.delete(pid);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Kills a tracked child process by its command name.
   * @param {string} cmdName - name of the command to kill
   * @param {NodeJS.Signals | number} [signal='SIGTERM'] - signal to send to the child process
   * @returns {boolean} - true if the process was successfully killed, false otherwise
   * @remarks Proc.spawnfile is undocumented; we check proc.spawnargs[0] instead.
   */
  killByCommand(cmdName: string, signal: NodeJS.Signals | number = 'SIGTERM'): boolean {
    for (const [pid, proc] of this.processes.entries()) {
      // proc.spawnfile is undocumented; check proc.spawnargs[0] instead
      const spawned = proc.spawnargs && proc.spawnargs.length > 0 ? proc.spawnargs[0] : '';
      if (spawned === cmdName || spawned.endsWith('/' + cmdName)) {
        return this.killByPid(pid, signal);
      }
    }
    return false;
  }

  /**
   * Returns a list of PIDs of all tracked child processes that are currently running.
   * @returns {number[]} - list of PIDs of running child processes
   */
  listRunning(): number[] {
    return Array.from(this.processes.keys());
  }
}

export const cm = new ChildManager();
