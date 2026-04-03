import { getStorage, setStorage, removeStorage, STORAGE_KEYS } from './storage'
import { getWsUrl, getApiUrl, SYNC_CONFIG } from './config'
import { getOrCreateDeviceId } from './deviceId'
import {
  addToOfflineQueue,
  getOfflineQueue,
  removeFromOfflineQueue,
  isOfflineQueueEmpty,
  clearOfflineQueue
} from './offlineQueue'

// 连接状态
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

// 内部状态
let ws: UniApp.SocketTask | null = null
let currentStatus: ConnectionStatus = 'disconnected'
let currentShareCode: string | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let heartbeatTimer: ReturnType<typeof setInterval> | null = null
let reconnectAttempts = 0

// 状态回调
const statusListeners: Set<(status: ConnectionStatus) => void> = new Set()
const messageListeners: Set<(type: string, data: any) => void> = new Set()

// 获取连接状态
export function getConnectionStatus(): ConnectionStatus {
  return currentStatus
}

// 获取当前 Share Code
export function getCurrentShareCode(): string | null {
  return currentShareCode
}

// 监听连接状态变化
export function onConnectionStatusChange(callback: (status: ConnectionStatus) => void): () => void {
  statusListeners.add(callback)
  return () => statusListeners.delete(callback)
}

// 监听同步消息
export function onSyncMessage(callback: (type: string, data: any) => void): () => void {
  messageListeners.add(callback)
  return () => messageListeners.delete(callback)
}

// 更新连接状态
function setConnectionStatus(status: ConnectionStatus): void {
  currentStatus = status
  statusListeners.forEach(cb => cb(status))
}

// 发送 WebSocket 消息
function sendWsMessage(data: any): boolean {
  if (!ws || currentStatus !== 'connected') {
    return false
  }
  try {
    ws.send({
      data: JSON.stringify(data),
      fail: (err) => {
        console.error('WebSocket send error:', err)
        handleDisconnected()
      }
    })
    return true
  } catch (e) {
    console.error('WebSocket send exception:', e)
    return false
  }
}

// 处理断开连接
function handleDisconnected(): void {
  if (currentStatus === 'disconnected') return

  setConnectionStatus('disconnected')
  stopHeartbeat()

  // 尝试重连
  if (currentShareCode) {
    scheduleReconnect()
  }
}

// 调度重连（指数退避）
function scheduleReconnect(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
  }

  setConnectionStatus('reconnecting')

  // 指数退避: 1s → 2s → 4s → 8s → max 30s
  const delay = Math.min(
    SYNC_CONFIG.HEARTBEAT_INTERVAL * Math.pow(2, reconnectAttempts),
    SYNC_CONFIG.MAX_RECONNECT_INTERVAL
  )

  reconnectAttempts++

  reconnectTimer = setTimeout(() => {
    if (currentShareCode) {
      connectWebSocket(currentShareCode)
    }
  }, delay)
}

// 启动心跳
function startHeartbeat(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
  }

  heartbeatTimer = setInterval(() => {
    if (currentStatus === 'connected') {
      sendWsMessage({ type: 'ping', timestamp: Date.now() })
    }
  }, SYNC_CONFIG.HEARTBEAT_INTERVAL)
}

// 停止心跳
function stopHeartbeat(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}

// 处理接收到的消息
function handleMessage(data: any): void {
  try {
    const msg = typeof data === 'string' ? JSON.parse(data) : data

    if (msg.type === 'pong') {
      return // 心跳响应
    }

    // 触发消息监听器
    messageListeners.forEach(cb => cb(msg.type, msg.data))

    // 更新最后同步时间
    setStorage(STORAGE_KEYS.SYNC_LAST_SYNC_TIME, Date.now())
  } catch (e) {
    console.error('Failed to parse sync message:', e)
  }
}

// 处理离线队列
function processOfflineQueue(): void {
  if (currentStatus !== 'connected') return

  const queue = getOfflineQueue()
  queue.forEach(msg => {
    const success = sendWsMessage({ type: msg.type, data: msg.data, timestamp: msg.timestamp })
    if (success) {
      removeFromOfflineQueue(msg.timestamp)
    }
  })
}

// 建立 WebSocket 连接
export function connectWebSocket(shareCode: string): Promise<boolean> {
  return new Promise((resolve) => {
    // 如果已连接，先断开
    if (ws) {
      disconnectWebSocket()
    }

    setConnectionStatus('connecting')
    currentShareCode = shareCode
    reconnectAttempts = 0

    const url = getWsUrl()
    const deviceId = getOrCreateDeviceId()

    ws = uni.connectSocket({
      url: `${url}?shareCode=${shareCode}&deviceId=${deviceId}`,
      success: () => {
        console.log('WebSocket connecting...')
      },
      fail: (err) => {
        console.error('WebSocket connection failed:', err)
        setConnectionStatus('disconnected')
        resolve(false)
      }
    })

    if (!ws) {
      setConnectionStatus('disconnected')
      resolve(false)
      return
    }

    // 监听打开
    ws.onOpen(() => {
      console.log('WebSocket connected')
      setConnectionStatus('connected')
      reconnectAttempts = 0

      // 保存 share code
      setStorage(STORAGE_KEYS.SYNC_SHARE_CODE, shareCode)

      // 启动心跳
      startHeartbeat()

      // 处理离线队列
      processOfflineQueue()

      resolve(true)
    })

    // 监听消息
    ws.onMessage((res) => {
      handleMessage(res.data)
    })

    // 监听关闭
    ws.onClose(() => {
      console.log('WebSocket closed')
      handleDisconnected()
    })

    // 监听错误
    ws.onError((err) => {
      console.error('WebSocket error:', err)
      handleDisconnected()
    })
  })
}

// 断开 WebSocket 连接
export function disconnectWebSocket(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  stopHeartbeat()

  if (ws) {
    ws.close()
    ws = null
  }

  currentShareCode = null
  setConnectionStatus('disconnected')
}

// 发送同步消息
export function sendMessage(type: string, data: any): boolean {
  const message = { type, data, timestamp: Date.now() }

  if (currentStatus === 'connected') {
    const success = sendWsMessage(message)
    if (!success) {
      // 发送失败，加入离线队列
      addToOfflineQueue(type, data)
    }
    return success
  } else {
    // 离线状态，加入离线队列
    addToOfflineQueue(type, data)
    return false
  }
}

// 创建新空间
export function createSpace(): Promise<{ shareCode: string; spaceId: string } | null> {
  return new Promise((resolve) => {
    const apiUrl = getApiUrl()
    const deviceId = getOrCreateDeviceId()

    uni.request({
      url: `${apiUrl}/space/create`,
      method: 'POST',
      data: { deviceId },
      success: (res: any) => {
        if (res.statusCode === 200 && res.data) {
          const { shareCode, spaceId } = res.data
          setStorage(STORAGE_KEYS.SYNC_SHARE_CODE, shareCode)
          setStorage(STORAGE_KEYS.SYNC_SPACE_ID, spaceId)
          resolve({ shareCode, spaceId })
        } else {
          console.error('Create space failed:', res)
          resolve(null)
        }
      },
      fail: (err) => {
        console.error('Create space error:', err)
        resolve(null)
      }
    })
  })
}

// 验证分享码
export function verifyShareCode(code: string): Promise<{ valid: boolean; spaceId?: string }> {
  return new Promise((resolve) => {
    const apiUrl = getApiUrl()

    uni.request({
      url: `${apiUrl}/space/verify`,
      method: 'POST',
      data: { shareCode: code },
      success: (res: any) => {
        if (res.statusCode === 200 && res.data) {
          resolve({ valid: res.data.valid, spaceId: res.data.spaceId })
        } else {
          resolve({ valid: false })
        }
      },
      fail: () => {
        resolve({ valid: false })
      }
    })
  })
}

// 初始化同步管理器
export function initSyncManager(): void {
  // 从本地存储读取 share code
  const savedShareCode = getStorage<string>(STORAGE_KEYS.SYNC_SHARE_CODE)

  if (savedShareCode) {
    currentShareCode = savedShareCode
    // 自动连接
    connectWebSocket(savedShareCode)
  }
}

// 清除同步数据
export function clearSyncData(): void {
  disconnectWebSocket()
  removeStorage(STORAGE_KEYS.SYNC_SHARE_CODE)
  removeStorage(STORAGE_KEYS.SYNC_SPACE_ID)
  clearOfflineQueue()
  currentShareCode = null
}