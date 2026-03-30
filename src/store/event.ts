import { defineStore } from 'pinia'
import { getEvents, saveEvents } from '@/utils/storage'
import { filterByTimeRange, getMonthStart, getRecentDays } from '@/utils/time'

export interface EventData {
  id: string
  name: string
  typeId: string
  time: number
  createdAt: number
}

export type TimeRangeFilter = 'all' | 'today' | 'week' | 'month'

/**
 * 生成唯一的事件ID
 */
function generateEventId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `event_${timestamp}_${random}`
}

export const useEventStore = defineStore('event', {
  state: () => ({
    events: [] as EventData[],
    filterType: null as string | null,
    filterTimeRange: 'all' as TimeRangeFilter,
    // 新增：缓存状态
    _filteredEventsCache: null as EventData[] | null,
    _cacheKey: '',
    isLoaded: false
  }),

  getters: {
    /**
     * 过滤后的事件列表（按时间倒序）
     */
    filteredEvents: (state): EventData[] => {
      // 生成缓存 key：包含过滤条件和数据变化标识
      // 使用所有事件时间戳的总和作为数据变化标识，确保任何事件的增删改都能触发缓存失效
      const totalEventTime = state.events.reduce((sum, e) => sum + e.time, 0)
      const cacheKey = `${state.filterType}|${state.filterTimeRange}|${state.events.length}|${totalEventTime}`

      // 缓存命中时直接返回
      if (state._cacheKey === cacheKey && state._filteredEventsCache) {
        return state._filteredEventsCache
      }

      // 计算过滤结果
      let result = [...state.events]

      // 按类型过滤
      if (state.filterType) {
        result = result.filter(event => event.typeId === state.filterType)
      }

      // 按时间范围过滤
      result = filterByTimeRange(result, state.filterTimeRange)

      // 按时间倒序排序
      result.sort((a, b) => b.time - a.time)

      // 更新缓存
      state._filteredEventsCache = result
      state._cacheKey = cacheKey

      return result
    },

    /**
     * 事件总数
     */
    totalCount: (state): number => {
      return state.events.length
    },

    /**
     * 本月事件数量
     */
    monthCount: (state): number => {
      const monthStart = getMonthStart()
      return state.events.filter(event => event.time >= monthStart).length
    },

    /**
     * 按类型分组的事件统计
     */
    statsByType: (state): Record<string, number> => {
      const stats: Record<string, number> = {}
      state.events.forEach(event => {
        const typeId = event.typeId || 'unclassified'
        stats[typeId] = (stats[typeId] || 0) + 1
      })
      return stats
    },

    /**
     * 近7天事件统计
     */
    recentDaysStats: (state): { date: string; count: number; timestamp: number }[] => {
      const recentDays = getRecentDays(7)
      const counts = new Map<number, number>()

      // 单次遍历所有事件，统计每个天数的事件数
      state.events.forEach(event => {
        for (const day of recentDays) {
          const dayEnd = day.timestamp + 24 * 60 * 60 * 1000
          if (event.time >= day.timestamp && event.time < dayEnd) {
            counts.set(day.timestamp, (counts.get(day.timestamp) || 0) + 1)
            break // 找到匹配的天数后跳出
          }
        }
      })

      // 构建返回结果
      return recentDays.map(day => ({
        date: day.label,
        count: counts.get(day.timestamp) || 0,
        timestamp: day.timestamp
      }))
    }
  },

  actions: {
    /**
     * 从存储加载事件
     */
    loadFromStorage(): void {
      // 防止重复加载
      if (this.isLoaded) return

      const storedEvents = getEvents()
      this.events = storedEvents.map((event) => ({
        id: event.id,
        name: event.name || '',
        typeId: event.typeId || '',
        time: typeof event.time === 'number' ? event.time : new Date(event.time).getTime(),
        createdAt: event.createdAt || Date.now()
      }))
      this.isLoaded = true
    },

    /**
     * 保存事件到存储
     */
    saveToStorage(): void {
      // 转换为存储格式
      const storageData = this.events.map(event => ({
        id: event.id,
        name: event.name,
        typeId: event.typeId,
        time: String(event.time),
        createdAt: String(event.createdAt),
        updatedAt: String(Date.now())
      }))
      saveEvents(storageData)
    },

    /**
     * 添加新事件
     * @param event 事件数据（除id和createdAt外）
     */
    addEvent(event: Omit<EventData, 'id' | 'createdAt'>): void {
      const newEvent: EventData = {
        ...event,
        id: generateEventId(),
        createdAt: Date.now()
      }
      this.events.push(newEvent)
      this.saveToStorage()
    },

    /**
     * 删除事件
     * @param id 事件ID
     */
    deleteEvent(id: string): void {
      const index = this.events.findIndex(event => event.id === id)
      if (index !== -1) {
        this.events.splice(index, 1)
        this.saveToStorage()
      }
    },

    /**
     * 设置类型过滤
     * @param typeId 类型ID（null 表示不过滤）
     */
    setFilterType(typeId: string | null): void {
      this.filterType = typeId
    },

    /**
     * 设置时间范围过滤
     * @param range 时间范围
     */
    setFilterTimeRange(range: TimeRangeFilter): void {
      this.filterTimeRange = range
    },

    /**
     * 清除所有过滤条件
     */
    clearFilters(): void {
      this.filterType = null
      this.filterTimeRange = 'all'
    }
  }
})