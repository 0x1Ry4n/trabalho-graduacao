export interface RedisConnectionState {
    isConnected: boolean;
    hasConnectedOnce: boolean;
    reconnectAttempts: number;
}