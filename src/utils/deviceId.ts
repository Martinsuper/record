import { getStorage, setStorage, STORAGE_KEYS } from './storage'

function generateDeviceId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `device_${timestamp}_${random}`
}

export function getOrCreateDeviceId(): string {
  let deviceId = getStorage<string>(STORAGE_KEYS.SYNC_DEVICE_ID)
  if (!deviceId) {
    deviceId = generateDeviceId()
    setStorage(STORAGE_KEYS.SYNC_DEVICE_ID, deviceId)
  }
  return deviceId
}