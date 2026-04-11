export type IJsonRpcParams = Record<string, unknown> | unknown[];

export interface IJsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: IJsonRpcParams;
}

export interface IJsonRpcResponse<T = unknown> {
  jsonrpc: '2.0';
  id: number;
  result?: T;
  error?: IJsonRpcError;
}

export interface IJsonRpcError {
  code: string;
  message: string;
  data?: unknown;
}

export interface IJsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: IJsonRpcParams;
}

export type IJsonRpcMessage = JsonRpcResponse | IJsonRpcNotification;
