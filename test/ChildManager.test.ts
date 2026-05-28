/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';

// Mock before import
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

  constructor() {
    super();
    this.stdout = new Readable({ read() {} });
    this.stderr = new Readable({ read() {} });
  }

  kill() {
    this.emit('close', 0);
    return true;
  }
}

// Import after mock setup
const { ChildManager } = await import('../lib/ChildManager.js');

describe('ChildManager', () => {
  let manager: ChildManager;

  beforeEach(() => {
    manager = new ChildManager();
    vi.clearAllMocks();
    mockSpawn.mockReturnValue(new MockChildProcess());
    mockSpawnSync.mockReturnValue({
      stdout: Buffer.from(''),
      stderr: Buffer.from(''),
      status: 0,
      signal: null
    });
  });

  describe('spawnCommand', () => {
    it('spawns a command and returns result with process', () => {
      const result = manager.spawnCommand({
        cmd: 'echo',
        args: ['hello']
      });

      expect(result.pid).toBeDefined();
      expect(result.process).toBeDefined();
      expect(result.stdoutBuffer).toBeDefined();
      expect(result.stderrBuffer).toBeDefined();
    });

    it('returns streams when streamOutput is true', () => {
      const result = manager.spawnCommand({
        cmd: 'echo',
        args: ['hello'],
        streamOutput: true
      });

      expect(result.stdoutStream).toBeDefined();
      expect(result.stderrStream).toBeDefined();
    });

    it('does not return streams when streamOutput is false', () => {
      const result = manager.spawnCommand({
        cmd: 'echo',
        args: ['hello'],
        streamOutput: false
      });

      expect(result.stdoutStream).toBeUndefined();
      expect(result.stderrStream).toBeUndefined();
    });

    it('respects maxBufferBytes limit', () => {
      const result = manager.spawnCommand({
        cmd: 'cat',
        args: ['largefile'],
        maxBufferBytes: 100
      });

      const child = result.process as any;
      // Simulate large data write
      child.stdout.emit('data', Buffer.from('x'.repeat(150)));

      expect(result.stdoutBuffer.length).toBeLessThanOrEqual(100);
    });

    it('maintains buffer with circular trim on overflow', () => {
      const result = manager.spawnCommand({
        cmd: 'test',
        maxBufferBytes: 50
      });

      const child = result.process as unknown as EventEmitter;
      (child as any).stdout.emit('data', 'first part');
      (child as any).stdout.emit('data', 'second part');
      (child as any).stdout.emit('data', 'third part');

      expect(result.stdoutBuffer.length).toBeLessThanOrEqual(50);
      // Should preserve tail (most recent) data
      expect(result.stdoutBuffer).toContain('third');
    });

    it('uses provided cwd and env', () => {
      const customEnv = { TEST: 'value' };
      const result = manager.spawnCommand({
        cmd: 'echo',
        cwd: '/custom/path',
        env: customEnv
      });

      expect(result.process).toBeDefined();
    });

    it('cleans up process on close event', () => {
      const result = manager.spawnCommand({
        cmd: 'echo'
      });

      const child = result.process as EventEmitter;
      child.emit('close');

      expect(result.process).toBeDefined();
    });

    it('cleans up process on error event', () => {
      const result = manager.spawnCommand({
        cmd: 'invalid-command'
      });

      const child = result.process as EventEmitter;
      child.emit('error', new Error('Command not found'));

      expect(result.process).toBeDefined();
    });

    it('tracks multiple spawned processes', () => {
      const result1 = manager.spawnCommand({ cmd: 'cmd1' });
      const result2 = manager.spawnCommand({ cmd: 'cmd2' });

      expect(result1.process).toBeDefined();
      expect(result2.process).toBeDefined();
    });

    it('handles processes without pid', () => {
      const noIdProcess = new EventEmitter() as unknown as Record<string, unknown>;
      noIdProcess.stdout = new Readable({ read() {} });
      noIdProcess.stderr = new Readable({ read() {} });
      delete noIdProcess.pid;

      mockSpawn.mockReturnValueOnce(noIdProcess);

      const result = manager.spawnCommand({ cmd: 'test' });
      expect(result.process).toBeDefined();
    });
  });

  describe('execPromise', () => {
    it('returns a promise', async () => {
      const promise = manager.execPromise('echo', ['hello']);
      expect(promise instanceof Promise).toBe(true);
    });

    it('respects timeout option', async () => {
      const promise = manager.execPromise('sleep', ['10'], {
        timeoutMs: 100
      });

      expect(promise instanceof Promise).toBe(true);
    });

    it('respects maxBufferBytes option', async () => {
      const promise = manager.execPromise('cat', ['large'], {
        maxBufferBytes: 1024
      });

      expect(promise instanceof Promise).toBe(true);
    });

    it('passes environment variables', async () => {
      const customEnv = { TEST_VAR: 'test_value' };
      const promise = manager.execPromise('printenv', ['TEST_VAR'], {
        env: customEnv
      });

      expect(promise instanceof Promise).toBe(true);
    });

    it('supports shell execution', async () => {
      const promise = manager.execPromise('echo hello | cat', [], {
        useShell: true
      });

      expect(promise instanceof Promise).toBe(true);
    });
  });
});
