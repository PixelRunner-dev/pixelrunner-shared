export declare const DEFAULT_PUBLIC_IP_ENDPOINT = "https://api64.ipify.org?format=json";
export declare const DEFAULT_PUBLIC_IP_TIMEOUT_MS = 3000;
type FetchLike = typeof fetch;
export interface TrysteroRoomIdentityConfig {
    appId: string;
    password: string;
    roomPrefix: string;
}
export interface ResolveTrysteroRoomIdOptions extends Partial<TrysteroRoomIdentityConfig> {
    fetcher?: FetchLike;
    endpoint?: string;
    timeoutMs?: number;
    fallbackRoomId?: string;
    onLookupError?: (error: unknown) => void;
}
export declare function normalizeIp(ip: string): string;
export declare function isPublicIp(ip: string): boolean;
export declare function createTrysteroRoomIdFromPublicIp(publicIp: string, identity: TrysteroRoomIdentityConfig): Promise<string>;
export declare function fetchPublicIp(options?: ResolveTrysteroRoomIdOptions): Promise<string>;
export declare function resolveTrysteroRoomId(configuredRoomId?: string, options?: ResolveTrysteroRoomIdOptions): Promise<string>;
export {};
//# sourceMappingURL=TrysteroRoomId.d.ts.map