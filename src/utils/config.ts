/**
 * 同步服务配置
 */

export const SYNC_CONFIG = {
  // 开发环境连接服务器测试
  DEV_API_URL: 'https://brecord.younote.top/api',
  // 生产环境（GitHub Pages）
  PROD_API_URL: 'https://brecord.younote.top/api',
  MAX_RETRY_COUNT: 3
}

function isDev(): boolean {
  // H5 环境：检查 hostname
  // @ts-ignore
  if (typeof window !== 'undefined' && typeof location !== 'undefined') {
    const hostname = location.hostname
    // localhost 或 127.0.0.1 视为开发环境
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
      return true
    }
  }
  // 非浏览器环境默认开发
  // @ts-ignore
  if (typeof window === 'undefined') {
    return true
  }
  return false
}

export function getApiUrl(): string {
  if (isDev()) {
    return SYNC_CONFIG.DEV_API_URL
  }
  return SYNC_CONFIG.PROD_API_URL
}