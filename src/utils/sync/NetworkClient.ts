// src/utils/sync/NetworkClient.ts

import type { SyncError } from './ErrorHandler'
import { classifyError, getRetryDelay, shouldRetry } from './ErrorHandler'
import { RETRY_CONFIG } from './constants'

export interface HttpOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  skipAuth?: boolean
}

/** Get API base URL */
export function getApiBase(): string {
  return 'https://brecord.younote.top/api'
}

/** Share code is set at initialization time */
let _shareCode: string | null = null
export function setShareCode(code: string | null): void { _shareCode = code }
export function getShareCode(): string | null { return _shareCode }

/** HTTP request wrapper with auto retry */
export async function httpRequest<T = any>(options: HttpOptions): Promise<T | null> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const shareCode = _shareCode
  if (!options.skipAuth && shareCode) {
    headers['X-Share-Code'] = shareCode
  }

  let lastError: SyncError | null = null

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    if (attempt > 0) {
      await sleep(getRetryDelay(attempt - 1))
    }

    try {
      const result = await doRequest<T>({ ...options, headers })
      if (result !== null) return result
      break
    } catch (err: any) {
      lastError = classifyError(err)
      if (!shouldRetry(lastError, attempt)) {
        console.warn(`[Sync] ${lastError.type}: ${lastError.message}`)
        return null
      }
    }
  }

  return null
}

async function doRequest<T>(options: HttpOptions & { headers: Record<string, string> }): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject({ errMsg: 'request:fail timeout', statusCode: 0 })
    }, RETRY_CONFIG.timeout)

    uni.request({
      url: options.url,
      method: options.method || 'GET',
      data: options.data,
      header: options.headers,
      success: (res: any) => {
        clearTimeout(timeoutId)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data?.success ? res.data.data : res.data)
        } else {
          reject({ statusCode: res.statusCode, data: res.data })
        }
      },
      fail: (err) => {
        clearTimeout(timeoutId)
        reject(err)
      }
    })
  })
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ===== Convenience methods =====

export async function getApi<T = any>(path: string, params?: Record<string, any>): Promise<T | null> {
  const query = params ? '?' + new URLSearchParams(params).toString() : ''
  return httpRequest<T>({ url: `${getApiBase()}${path}${query}`, method: 'GET' })
}

export async function postApi<T = any>(path: string, data?: any): Promise<T | null> {
  return httpRequest<T>({ url: `${getApiBase()}${path}`, method: 'POST', data })
}
