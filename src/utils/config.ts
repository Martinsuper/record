/**
 * 同步服务配置
 */

export const SYNC_CONFIG = {
  DEV_WS_URL: 'ws://localhost:8080/ws/sync',
  DEV_API_URL: 'http://localhost:8080/api',
  PROD_WS_URL: 'ws://your-server.com/ws/sync',
  PROD_API_URL: 'https://your-server.com/api',
  HEARTBEAT_INTERVAL: 30000,
  MAX_RECONNECT_INTERVAL: 30000,
  MAX_RETRY_COUNT: 3
}

export function getWsUrl(): string {
  // #ifdef H5
  if (process.env.NODE_ENV === 'development') {
    return SYNC_CONFIG.DEV_WS_URL
  }
  // #endif
  return SYNC_CONFIG.PROD_WS_URL
}

export function getApiUrl(): string {
  // #ifdef H5
  if (process.env.NODE_ENV === 'development') {
    return SYNC_CONFIG.DEV_API_URL
  }
  // #endif
  return SYNC_CONFIG.PROD_API_URL
}
