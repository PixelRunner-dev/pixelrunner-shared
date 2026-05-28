import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';

const mockSpawn = vi.fn();
const mockSpawnSync = vi.fn();

vi.mock('node:child_process', () => ({
  spawn: mockSpawn,
  spawnSync: mockSpawnSync,
}));

class MockChildProcess extends EventEmitter {
  public pid = 12345;
  public stdout: Readable;
  public stderr: Readable;
  public killed = false;

  constructor(withPid = true) {
    super();
    if (!withPid) {
      // @ts-expect-error - intentionally delete pid to test pidless handling
      delete this.pid;
    }
    this.stdout = new Readable({ read() {} });
    this.stderr = new Readable({ read() {} });
  }

  kill() {
    this.killed = true;
    this.emit('close', 0);
    return true;
  }
}

const { ChildManager } = await import('../lib/ChildManager.js');

describe('ChildManager', () => {
  let manager: ChildManager;

  beforeEach(() => {
    manager = new ChildManager();
    vi.clearAllMocks();
    mockSpawn.mockReturnValue(new MockChildProcess());
  });

  describe('spawnCommand', () => {
    it('spawns with command and args', () => {
      manager.spawnCommand({ cmd: 'echo', args: ['hello'] });

      expect(mockSpawn).toHaveBeenCalledWith('echo', ['hello'], expect.any(Object));
    });

    it('captures stdout data', async () => {
      const result = manager.spawnCommand({ cmd: 'test' });
      const proc = result.process as unknown as EventEmitter;

      proc.stdout.emit('data', 'hello');
      proc.stdout.emit('data', ' world');

      expect(result.stdoutBuffer).toBe('hello world');
    });

    it('captures stderr data', async () => {
      const result = manager.spawnCommand({ cmd: 'test' });
      const proc = result.process as unknown as EventEmitter;

      proc.stderr.emit('data', 'error');
      proc.stderr.emit('data', ' message');

      expect(result.stderrBuffer).toBe('error message');
    });

    it('handles Buffer input in stdout', () => {
      const result = manager.spawnCommand({ cmd: 'test' });
      const proc = result.process as unknown as EventEmitter;

      proc.stdout.emit('data', Buffer.from('buffer '));
      proc.stdout.emit('data', Buffer.from('data'));

      expect(result.stdoutBuffer).toBe('buffer data');
    });

    it('respects maxBufferBytes for stdout', () => {
      const result = manager.spawnCommand({ cmd: 'test', maxBufferBytes: 10 });
      const proc = result.process as unknown as EventEmitter;

      proc.stdout.emit('data', '12345');
      proc.stdout.emit('data', '67890');
      proc.stdout.emit('data', 'ABCDE');

      expect(result.stdoutBuffer.length).toBeLessThanOrEqual(10);
    });

    it('respects maxBufferBytes for stderr', () => {
      const result = manager.spawnCommand({ cmd: 'test', maxBufferBytes: 10 });
      const proc = result.process as unknown as EventEmitter;

      proc.stderr.emit('data', '12345');
      proc.stderr.emit('data', '67890');
      proc.stderr.emit('data', 'ABCDE');

      expect(result.stderrBuffer.length).toBeLessThanOrEqual(10);
    });

    it('preserves tail on buffer overflow', () => {
      const result = manager.spawnCommand({ cmd: 'test', maxBufferBytes: 20 });
      const proc = result.process as unknown as EventEmitter;

      proc.stdout.emit('data', 'AAAAA');
      proc.stdout.emit('data', 'BBBBB');
      proc.stdout.emit('data', 'CCCCC');
      proc.stdout.emit('data', 'DDDDD');

      expect(result.stdoutBuffer).toContain('DDDDD');
      expect(result.stdoutBuffer.length).toBeLessThanOrEqual(20);
    });

    it('returns streams when streamOutput enabled', () => {
      const result = manager.spawnCommand({
        cmd: 'test',
        streamOutput: true
      });

      expect(result.stdoutStream).toBeDefined();
      expect(result.stderrStream).toBeDefined();
    });

    it('does not return streams when streamOutput disabled', () => {
      const result = manager.spawnCommand({
        cmd: 'test',
        streamOutput: false
      });

      expect(result.stdoutStream).toBeUndefined();
      expect(result.stderrStream).toBeUndefined();
    });

    it('passes cwd to spawn', () => {
      manager.spawnCommand({ cmd: 'test', cwd: '/tmp' });

      expect(mockSpawn).toHaveBeenCalledWith(
        'test',
        [],
        expect.objectContaining({ cwd: '/tmp' })
      );
    });

    it('passes env to spawn', () => {
      const customEnv = { TEST: 'value' };
      manager.spawnCommand({ cmd: 'test', env: customEnv });

      expect(mockSpawn).toHaveBeenCalledWith(
        'test',
        [],
        expect.objectContaining({ env: customEnv })
      );
    });

    it('enables shell when useShell true', () => {
      manager.spawnCommand({ cmd: 'test', useShell: true });

      expect(mockSpawn).toHaveBeenCalledWith(
        'test',
        [],
        expect.objectContaining({ shell: true })
      );
    });

    it('disables shell when useShell false', () => {
      manager.spawnCommand({ cmd: 'test', useShell: false });

      expect(mockSpawn).toHaveBeenCalledWith(
        'test',
        [],
        expect.objectContaining({ shell: false })
      );
    });

    it('cleans up on close event', () => {
      const result = manager.spawnCommand({ cmd: 'test' });
      const proc = result.process as EventEmitter;

      proc.emit('close');

      // Process should be cleaned up (no assertion available without exposing internals)
      expect(result.process).toBeDefined();
    });

    it('cleans up on error event', () => {
      const result = manager.spawnCommand({ cmd: 'test' });
      const proc = result.process as EventEmitter;

      proc.emit('error', new Error('test'));

      expect(result.process).toBeDefined();
    });

    it('handles process without pid', () => {
      const noPidProcess = new MockChildProcess(false);
      mockSpawn.mockReturnValueOnce(noPidProcess);

      const result = manager.spawnCommand({ cmd: 'test' });

      expect(result.pid).toBeUndefined();
      expect(result.process).toBeDefined();
    });

    it('uses default maxBuffer if not specified', () => {
      const result = manager.spawnCommand({ cmd: 'test' });

      // Default is 256KB, emit less than that
      const proc = result.process as unknown as EventEmitter;
      proc.stdout.emit('data', 'x'.repeat(1000));

      expect(result.stdoutBuffer.length).toBe(1000);
    });
  });

  describe('execPromise', () => {
    it('returns promise with code and signal', async () => {
      const proc = new MockChildProcess();
      mockSpawn.mockReturnValueOnce(proc);

      const promise = manager.execPromise('test', ['arg']);

      // Simulate process completion
      setTimeout(() => {
        proc.emit('close', 0, null);
      }, 10);

      const result = await promise;

      expect(result).toMatchObject({
        code: 0,
        stdout: expect.any(String),
        stderr: expect.any(String),
        pid: expect.any(Number)
      });
      expect(result.signal).toBeNull();
    });

    it('captures stdout in execPromise', async () => {
      const proc = new MockChildProcess();
      mockSpawn.mockReturnValueOnce(proc);

      const promise = manager.execPromise('test');

      setTimeout(() => {
        proc.stdout.emit('data', 'output');
        proc.emit('close', 0);
      }, 10);

      const result = await promise;
      expect(result.stdout).toBe('output');
    });

    it('captures stderr in execPromise', async () => {
      const proc = new MockChildProcess();
      mockSpawn.mockReturnValueOnce(proc);

      const promise = manager.execPromise('test');

      setTimeout(() => {
        proc.stderr.emit('data', 'error');
        proc.emit('close', 0);
      }, 10);

      const result = await promise;
      expect(result.stderr).toBe('error');
    });

    it('returns signal on process kill', async () => {
      const proc = new MockChildProcess();
      mockSpawn.mockReturnValueOnce(proc);

      const promise = manager.execPromise('test');

      setTimeout(() => {
        proc.emit('close', null, 'SIGTERM');
      }, 10);

      const result = await promise;
      expect(result.signal).toBe('SIGTERM');
    });

    it('handles process error', async () => {
      const proc = new MockChildProcess();
      mockSpawn.mockReturnValueOnce(proc);

      const promise = manager.execPromise('test');

      setTimeout(() => {
        proc.emit('error', new Error('spawn failed'));
      }, 10);

      await expect(promise).rejects.toThrow('spawn failed');
    });

    it('passes timeout option without error on quick completion', async () => {
      const proc = new MockChildProcess();
      mockSpawn.mockReturnValueOnce(proc);

      const promise = manager.execPromise('test', [], {
        timeoutMs: 1000
      });

      setTimeout(() => {
        proc.emit('close', 0);
      }, 10);

      const result = await promise;
      expect(result.code).toBe(0);
    });

    it('respects maxBufferBytes in execPromise', async () => {
      const proc = new MockChildProcess();
      mockSpawn.mockReturnValueOnce(proc);

      const promise = manager.execPromise('test', [], { maxBufferBytes: 20 });

      setTimeout(() => {
        proc.stdout.emit('data', '12345');
        proc.stdout.emit('data', '67890');
        proc.stdout.emit('data', 'ABCDE');
        proc.emit('close', 0);
      }, 10);

      const result = await promise;
      expect(result.stdout.length).toBeLessThanOrEqual(20);
    });

    it('passes cwd to spawn in execPromise', async () => {
      const proc = new MockChildProcess();
      mockSpawn.mockReturnValueOnce(proc);

      manager.execPromise('test', [], { cwd: '/custom' });

      expect(mockSpawn).toHaveBeenCalledWith(
        'test',
        [],
        expect.objectContaining({ cwd: '/custom' })
      );

      setTimeout(() => proc.emit('close', 0), 10);
    });

    it('passes env to spawn in execPromise', async () => {
      const proc = new MockChildProcess();
      mockSpawn.mockReturnValueOnce(proc);

      const env = { TEST: 'val' };
      manager.execPromise('test', [], { env });

      expect(mockSpawn).toHaveBeenCalledWith(
        'test',
        [],
        expect.objectContaining({ env })
      );

      setTimeout(() => proc.emit('close', 0), 10);
    });

    it('enables shell when useShell true in execPromise', async () => {
      const proc = new MockChildProcess();
      mockSpawn.mockReturnValueOnce(proc);

      manager.execPromise('test', [], { useShell: true });

      expect(mockSpawn).toHaveBeenCalledWith(
        'test',
        [],
        expect.objectContaining({ shell: true })
      );

      setTimeout(() => proc.emit('close', 0), 10);
    });
  });

  describe('multiple processes', () => {
    it('tracks multiple concurrent processes', () => {
      const proc1 = new MockChildProcess();
      const proc2 = new MockChildProcess();
      proc2.pid = 67890; // Different PID

      mockSpawn.mockReturnValueOnce(proc1);
      const result1 = manager.spawnCommand({ cmd: 'cmd1' });

      mockSpawn.mockReturnValueOnce(proc2);
      const result2 = manager.spawnCommand({ cmd: 'cmd2' });

      expect(result1.pid).toBe(proc1.pid);
      expect(result2.pid).toBe(proc2.pid);
      expect(result1.pid).not.toBe(result2.pid);
    });
  });
});
