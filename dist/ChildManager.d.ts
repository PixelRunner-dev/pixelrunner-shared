import { type ChildProcessWithoutNullStreams } from 'node:child_process';
import { Readable } from 'node:stream';
type SpawnOptions = {
    cmd: string;
    args?: string[];
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    useShell?: boolean;
    streamOutput?: boolean;
    maxBufferBytes?: number;
};
type SpawnResult = {
    pid?: number;
    stdoutBuffer: string;
    stderrBuffer: string;
    stdoutStream?: Readable;
    stderrStream?: Readable;
    process: ChildProcessWithoutNullStreams;
};
export declare class ChildManager {
    private processes;
    private pidless;
    private readonly DEFAULT_MAX_BUFFER;
    /**
     * Spawns a command and returns a result with either live streams or bounded strings for stdout/stderr.
     * @param {SpawnOptions} opts - spawn options
     * @returns {SpawnResult} - result with either live streams or bounded strings for stdout/stderr
     * @remarks The returned buffers are captured by reference; caller should read final .stdoutBuffer/.stderrBuffer
     * after process close to get full content. To keep this up-to-date, provide getters that read current values.
     */
    spawnCommand(opts: SpawnOptions): SpawnResult;
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
    execPromise(cmd: string, args?: string[], opts?: {
        cwd?: string;
        env?: NodeJS.ProcessEnv;
        timeoutMs?: number;
        maxBufferBytes?: number;
        useShell?: boolean;
    }): Promise<{
        code: number | null;
        signal: NodeJS.Signals | null;
        stdout: string;
        stderr: string;
        pid?: number;
    }>;
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
    spawnSyncCommand(cmd: string, args?: string[], opts?: {
        cwd?: string;
        env?: NodeJS.ProcessEnv;
        encoding?: BufferEncoding;
        maxBufferBytes?: number;
    }): {
        status: number | null;
        stdout: string;
        stderr: string;
    };
    /**
     * Kills a tracked child process by its PID.
     * @param {number} pid - pid of the child process to kill
     * @param {NodeJS.Signals | number} [signal='SIGTERM'] - signal to send to the child process
     * @returns {boolean} - true if the process was successfully killed, false otherwise
     */
    killByPid(pid: number, signal?: NodeJS.Signals | number): boolean;
    /**
     * Kills a tracked child process by its command name.
     * @param {string} cmdName - name of the command to kill
     * @param {NodeJS.Signals | number} [signal='SIGTERM'] - signal to send to the child process
     * @returns {boolean} - true if the process was successfully killed, false otherwise
     * @remarks Proc.spawnfile is undocumented; we check proc.spawnargs[0] instead.
     */
    killByCommand(cmdName: string, signal?: NodeJS.Signals | number): boolean;
    /**
     * Returns a list of PIDs of all tracked child processes that are currently running.
     * @returns {number[]} - list of PIDs of running child processes
     */
    listRunning(): number[];
}
export declare const cm: ChildManager;
export {};
//# sourceMappingURL=ChildManager.d.ts.map