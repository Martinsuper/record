/**
 * 本地存储封装工具
 * 基于 uni.storage API
 */

export const STORAGE_KEYS = {
  EVENTS: 'events',
  EVENT_TYPES: 'eventTypes',
  ANNIVERSARIES: 'anniversaries',
  ANNIVERSARY_CATEGORIES: 'anniversaryCategories',
  MENU_CONFIG: 'menuConfig',
  FIRST_LAUNCH: 'firstLaunch'
} as const

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS]

/**
 * 获取存储数据
 * @param key 存储键名
 * @returns 存储的数据，不存在返回 null
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
 * @param key 存储键名
 * @param value 要存储的数据
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
 * @param key 存储键名
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

// 事件类型定义
export interface TimelineEvent {
  id: string
  name: string
  description?: string
  time: string
  typeId?: string
  createdAt: string
  updatedAt: string
  version: number
  deleted: boolean
}

export interface EventType {
  id: string
  name: string
  color: string
  icon?: string
  createdAt?: number
  version: number
  deleted: boolean
}

/**
 * 获取事件列表
 * @returns 事件数组
 */
export function getEvents(): TimelineEvent[] {
  return getStorage<TimelineEvent[]>(STORAGE_KEYS.EVENTS) || []
}

/**
 * 保存事件列表
 * @param events 事件数组
 */
export function saveEvents(events: TimelineEvent[]): void {
  setStorage(STORAGE_KEYS.EVENTS, events)
}

/**
 * 获取事件类型列表
 * @returns 类型数组
 */
export function getEventTypes(): EventType[] {
  return getStorage<EventType[]>(STORAGE_KEYS.EVENT_TYPES) || []
}

/**
 * 保存事件类型列表
 * @param types 类型数组
 */
export function saveEventTypes(types: EventType[]): void {
  setStorage(STORAGE_KEYS.EVENT_TYPES, types)
}

// 纪念日类型定义
export interface AnniversaryData {
  id: string
  name: string
  date: number
  repeatType: 'none' | 'year' | 'month' | 'week' | 'day'
  mode: 'countdown' | 'elapsed'  // 倒计时 | 正计时
  categoryId: string
  sortOrder: number
  createdAt: number
  updatedAt: number
  version: number
  deleted: boolean
}

// 纪念日分类类型定义
export interface AnniversaryCategory {
  id: string
  name: string
  icon: string         // Font Awesome 图标编码
  isPreset: boolean    // 是否为预设分类
  sortOrder: number    // 排序权重
  version: number
  deleted: boolean
}

/**
 * 获取纪念日列表
 * @returns 纪念日数组
 */
export function getAnniversaries(): AnniversaryData[] {
  return getStorage<AnniversaryData[]>(STORAGE_KEYS.ANNIVERSARIES) || []
}

/**
 * 保存纪念日列表
 * @param anniversaries 纪念日数组
 */
export function saveAnniversaries(anniversaries: AnniversaryData[]): void {
  setStorage(STORAGE_KEYS.ANNIVERSARIES, anniversaries)
}

/**
 * 获取纪念日分类列表
 * @returns 分类数组
 */
export function getAnniversaryCategories(): AnniversaryCategory[] {
  return getStorage<AnniversaryCategory[]>(STORAGE_KEYS.ANNIVERSARY_CATEGORIES) || []
}

/**
 * 保存纪念日分类列表
 * @param categories 分类数组
 */
export function saveAnniversaryCategories(categories: AnniversaryCategory[]): void {
  setStorage(STORAGE_KEYS.ANNIVERSARY_CATEGORIES, categories)
}

// 菜单配置类型定义
export interface MenuItemConfig {
  id: string                  // 唯一标识
  name: string                // 显示名称
  icon: string                // Font Awesome 图标 Unicode
  path: string                // 跳转路径
  type: 'tab' | 'page'        // tab-底部导航 | page-设置页入口
  enabled: boolean            // 是否显示
  sortOrder: number           // 排序权重
  isPreset: boolean           // 是否预设项（不可删除）
  version: number             // 数据版本
}

/**
 * 获取菜单配置
 * @returns 菜单配置数组
 */
export function getMenuConfig(): MenuItemConfig[] {
  return getStorage<MenuItemConfig[]>(STORAGE_KEYS.MENU_CONFIG) || []
}

/**
 * 保存菜单配置
 * @param config 菜单配置数组
 */
export function saveMenuConfig(config: MenuItemConfig[]): void {
  setStorage(STORAGE_KEYS.MENU_CONFIG, config)
}