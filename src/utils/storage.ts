/**
 * 本地存储封装工具
 * 基于 uni.storage API
 */

export const STORAGE_KEYS = {
  EVENTS: 'events',
  EVENT_TYPES: 'eventTypes',
  ANNIVERSARIES: 'anniversaries',
  ANNIVERSARY_CATEGORIES: 'anniversaryCategories'
} as const

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS]

/**
 * 获取存储数据
 */
export function getStorage<T = unknown>(key: string): T | null {
  try {
    const value = uni.getStorageSync(key)
    return (value as T) || null
  } catch (e) {
    console.error('getStorage error:', e)
    return null
  }
}

/**
 * 设置存储数据
 */
export function setStorage<T = unknown>(key: string, value: T): void {
  try {
    uni.setStorageSync(key, value)
  } catch (e) {
    console.error('setStorage error:', e)
  }
}

/**
 * 删除存储数据
 */
export function removeStorage(key: string): void {
  try {
    uni.removeStorageSync(key)
  } catch (e) {
    console.error('removeStorage error:', e)
  }
}

/**
 * 清除所有存储数据
 */
export function clearAllStorage(): void {
  try {
    uni.clearStorageSync()
  } catch (e) {
    console.error('clearAllStorage error:', e)
  }
}

// ========== 事件相关类型 ==========

export interface TimelineEvent {
  id: string
  name: string
  typeId: string
  time: number
  createdAt: number
  updatedAt: number
  version: number
}

export interface EventType {
  id: string
  name: string
  color: string
  createdAt: number
  version: number
}

export function getEvents(): TimelineEvent[] {
  return getStorage<TimelineEvent[]>(STORAGE_KEYS.EVENTS) || []
}

export function saveEvents(events: TimelineEvent[]): void {
  setStorage(STORAGE_KEYS.EVENTS, events)
}

export function getEventTypes(): EventType[] {
  return getStorage<EventType[]>(STORAGE_KEYS.EVENT_TYPES) || []
}

export function saveEventTypes(types: EventType[]): void {
  setStorage(STORAGE_KEYS.EVENT_TYPES, types)
}

// ========== 纪念日相关类型 ==========

export interface AnniversaryData {
  id: string
  name: string
  date: number
  repeatType: 'none' | 'year' | 'month' | 'week' | 'day'
  mode: 'countdown' | 'elapsed'
  categoryId: string
  sortOrder: number
  createdAt: number
  updatedAt: number
  version: number
}

export interface AnniversaryCategory {
  id: string
  name: string
  icon: string
  isPreset: boolean
  sortOrder: number
  version: number
}

export function getAnniversaries(): AnniversaryData[] {
  return getStorage<AnniversaryData[]>(STORAGE_KEYS.ANNIVERSARIES) || []
}

export function saveAnniversaries(anniversaries: AnniversaryData[]): void {
  setStorage(STORAGE_KEYS.ANNIVERSARIES, anniversaries)
}

export function getAnniversaryCategories(): AnniversaryCategory[] {
  return getStorage<AnniversaryCategory[]>(STORAGE_KEYS.ANNIVERSARY_CATEGORIES) || []
}

export function saveAnniversaryCategories(categories: AnniversaryCategory[]): void {
  setStorage(STORAGE_KEYS.ANNIVERSARY_CATEGORIES, categories)
}