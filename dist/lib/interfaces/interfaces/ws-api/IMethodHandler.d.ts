import type WebSocket from 'ws';

export interface MethodParams {
  [key: string]: unknown;
}

export interface MethodResult {
  ok: boolean;
  [key: string]: unknown;
}

export interface MethodRequest {
  id: string | number | null;
  method: string;
  params?: MethodParams;
}

export interface IMethodHandler {
  readonly methodName: string;
  execute(ws: WebSocket, id: string | number | null, params?: MethodParams): Promise<void>;
}
