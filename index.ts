/**
 * Copyright (c) 2026-present Pixelrunner (https://pixelrunner.dev)
 * Distributed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0
 * International license (CC BY-NC-ND 4.0). To view a copy of this license, visit
 * https://creativecommons.org/licenses/by-nc-nd/4.0/.
 *
 * @copyright Pixelrunner (https://pixelrunner.dev)
 * @license CC-BY-NC-ND-4.0
 */

// Re-export classes and utilities
export { ChildManager, cm } from './lib/ChildManager.js';
export { logger } from './lib/Logger.js';

// Re-export utility functions
export {
  getDir,
  getFilePath,
  getFileNameFromFilePath,
  getProjectRoot
} from './lib/utils/PathUtils.js';
export { slugify } from './lib/utils/StringUtils.js';

// Re-export types from interfaces
export type {
  IApplet,
  IAppletRecord,
  IAppletConfigurations,
  IAppletSchema,
  IAppletSchemaObject,
  IAppletViews,
  IFullApplet,
  IFullAppletRecord,
  IInstalledApplet,
  IInstalledAppletRecord,
  IInstallationDetails,
  IInstallationDetailsRecord,
  AppletSchemaTypes
} from './lib/interfaces/IApplet.js';
export type { IAppletDetails } from './lib/interfaces/IAppletDetails.js';
export type { IAppletImage } from './lib/interfaces/IAppletImage.js';
export type { ICategory } from './lib/interfaces/ICategory.js';
export type { IIconImage } from './lib/interfaces/IIconImage.js';
export type { IPlaylist } from './lib/interfaces/IPlaylist.js';
export type { ISettingsRecord } from './lib/interfaces/ISettings.js';
export type { IJsonRpcParams, IJsonRpcRequest, IJsonRpcResponse, IJsonRpcError, IJsonRpcNotification, IJsonRpcMessage } from './lib/interfaces/standard/JsonRpc.js';
export type {
  IWebSocketConfig,
  IRequestOptions,
  IConnectionState,
  IWebSocketEventType,
  IConnectedEvent,
  IDisconnectedEvent,
  IReconnectingEvent,
  IErrorEvent,
  INotificationEvent,
  IEventHandler,
  IEventData,
  IPendingRequest,
  IWebSocketClient,
  BaseResponse,
  ErrorResponse,
  SuccessResponse,
  Response
} from './lib/interfaces/standard/WebSocket.js';
export type { IMethodHandler, MethodParams, MethodResult, MethodRequest } from './lib/interfaces/ws-api/IMethodHandler.js';

// Re-export type utilities
export { UUID } from './lib/types.js';
