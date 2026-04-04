// src/utils/sync/ErrorHandler.ts

import type { ErrorType } from './types'
import { RETRY_CONFIG } from './constants'

export interface SyncError {
  type: ErrorType
  message: string
  shouldRetry: boolean
  httpStatus?: number
  rawError?: any
}

/** 对错误进行分类并返回处理策略 */
export function classifyError(error: any): SyncError {
  // 网络断开
  if (error?.errMsg?.includes('request:fail') || error?.errMsg?.includes('abort')) {
    if (!navigator?.onLine) {
      return { type: 'NETWORK_OFFLINE', message: '网络已断开', shouldRetry: false, rawError: error }
    }
    return { type: 'NETWORK_ERROR', message: '网络请求失败', shouldRetry: true, rawError: error }
  }

  if (error?.errMsg?.includes('timeout')) {
    return { type: 'NETWORK_TIMEOUT', message: '请求超时', shouldRetry: true, rawError: error }
  }

  // HTTP 状态码分类
  const status = error?.statusCode || error?.status
  if (status) {
    if (status === 401 || status === 403) {
      return { type: 'AUTH_EXPIRED', message: '认证已失效，请重新加入空间', shouldRetry: false, httpStatus: status, rawError: error }
    }
    if (status === 429) {
      return { type: 'RATE_LIMITED', message: '请求过于频繁', shouldRetry: true, httpStatus: status, rawError: error }
    }
    if (status >= 500) {
      return { type: 'SERVER_UNAVAILABLE', message: '服务器暂时不可用', shouldRetry: true, httpStatus: status, rawError: error }
    }
    if (status >= 400) {
      return { type: 'DATA_INVALID', message: '请求数据无效', shouldRetry: false, httpStatus: status, rawError: error }
    }
  }

  // 服务端业务错误
  const code = error?.code || error?.data?.code
  if (code === 'CONFLICT') {
    return { type: 'DATA_CONFLICT', message: '数据冲突，将以服务端为准', shouldRetry: false, rawError: error }
  }
  if (code === 'DELETED') {
    return { type: 'DATA_DELETED', message: '数据已被删除', shouldRetry: false, rawError: error }
  }
  if (code === 'DEVICE_BLOCKED') {
    return { type: 'DEVICE_BLOCKED', message: '设备已被阻止', shouldRetry: false, rawError: error }
  }

  // 默认视为网络错误重试
  return { type: 'NETWORK_ERROR', message: error?.message || '未知错误', shouldRetry: true, rawError: error }
}

/** 计算重试延迟 (指数退避) */
export function getRetryDelay(attempt: number): number {
  const delay = RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt)
  return Math.min(delay, RETRY_CONFIG.maxDelay)
}

/** 判断是否应该重试 */
export function shouldRetry(error: SyncError, attempt: number): boolean {
  if (!error.shouldRetry) return false
  if (attempt >= RETRY_CONFIG.maxRetries) return false

  const strategy = RETRY_CONFIG.errorStrategy[error.type]
  return strategy ?? false
}
