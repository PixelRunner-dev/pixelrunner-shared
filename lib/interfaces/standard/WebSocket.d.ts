import type { Ref, ComputedRef } from 'vue';

import type { IJsonRpcParams } from '../index.ts';

export interface IWebSocketConfig {
  url?: string;
  reconnect?: boolean;
  reconnectInterval?: number;
  reconnectMaxInterval?: number;
  reconnectDecay?: number;
  maxReconnectAttempts?: number;
  timeout?: number;
  heartbeatInterval?: number;
  debug?: boolean;
}

export interface IRequestOptions {
  timeout?: number;
  signal?: AbortSignal;
}

export type IConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export type IWebSocketEventType =
  // Connection events
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'reconnected'
  | 'error'
  // Message events (method-specific)
  | `message:${string}`
  // Notification events
  | 'notification';

export interface IConnectedEvent {
  timestamp: number;
  reconnectAttempt: number;
}

export interface IDisconnectedEvent {
  code: number;
  reason: string;
  wasClean: boolean;
}

export interface IReconnectingEvent {
  attempt: number;
  maxAttempts: number;
  nextDelay: number;
}

export interface IErrorEvent {
  error: Error;
  fatal: boolean;
}

export interface INotificationEvent {
  method: string;
  params?: IJsonRpcParams;
}

export type IEventHandler<K extends IWebSocketEventType> = K extends 'connected'
  ? (event: IConnectedEvent) => void
  : K extends 'disconnected'
    ? (event: IDisconnectedEvent) => void
    : K extends 'reconnecting'
      ? (event: IReconnectingEvent) => void
      : K extends 'reconnected'
        ? (event: IConnectedEvent) => void
        : K extends 'error'
          ? (event: IErrorEvent) => void
          : K extends 'notification'
            ? (event: INotificationEvent) => void
            : K extends `message:${string}`
              ? (params: unknown) => void
              : never;

export type IEventData<K extends IWebSocketEventType> = Parameters<
  IEventHandler<K>
>[0];

export interface IPendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
  method: string;
  timestamp: number;
}

export interface IWebSocketClient {
  // Connection management
  connect(): Promise<void>;
  disconnect(): void;
  reconnect(): Promise<void>;

  // Request/response API
  request<T = unknown>(
    method: string,
    params?: IJsonRpcParams,
    options?: IRequestOptions,
  ): Promise<T>;

  // Event system
  on<K extends IWebSocketEventType>(
    event: K,
    handler: IEventHandler<K>,
  ): () => void;
  off<K extends IWebSocketEventType>(event: K, handler: IEventHandler<K>): void;
  once<K extends IWebSocketEventType>(
    event: K,
    handler: IEventHandler<K>,
  ): void;

  // Reactive properties
  readonly state: Ref<IConnectionState>;
  readonly isConnected: ComputedRef<boolean>;
  readonly isConnecting: ComputedRef<boolean>;
  readonly lastError: Ref<Error | null>;
}

export interface BaseResponse {
  id: number;
  ok: boolean;
}

export interface ErrorResponse extends BaseResponse {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

export interface SuccessResponse<T = unknown> extends BaseResponse {
  ok: true;
  result: T;
}

export type Response<T = unknown> = ErrorResponse | SuccessResponse<T>;
