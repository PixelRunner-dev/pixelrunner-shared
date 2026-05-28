import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import { vi } from 'vitest';

class MockChildProcess extends EventEmitter {
  public pid = 12345;
  public stdout: Readable;
  public stderr: Readable;
  public stdin: Record<string, unknown>;

  constructor() {
    super();
    this.stdout = new Readable({ read() {} });
    this.stderr = new Readable({ read() {} });
    this.stdin = { write: vi.fn() };
  }

  kill() {
    this.emit('close', 0);
    return true;
  }
}

export const mockChildProcess = {
  spawn: vi.fn(() => new MockChildProcess()),
  spawnSync: vi.fn(() => ({
    stdout: Buffer.from(''),
    stderr: Buffer.from(''),
    status: 0,
    signal: null
  })),
};
