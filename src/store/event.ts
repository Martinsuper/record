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
    isLoaded: false,
    // 分页加载相关
    pageSize: 10, // 每页加载数量
    loadedCount: 0 // 已加载数量
  }),

  getters: {
    /**
     * 过滤后的事件列表（按时间倒序，支持分页）
     */
    filteredEvents: (state): EventData[] => {
      // 生成缓存 key：包含过滤条件和数据变化标识
      const totalEventTime = state.events.reduce((sum, e) => sum + e.time, 0)
      const cacheKey = `${state.filterType}|${state.filterTimeRange}|${state.events.length}|${totalEventTime}|${state.loadedCount}`

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

      // 分页：只返回已加载数量的事件
      const loadedCount = state.loadedCount || result.length
      const paginatedResult = result.slice(0, loadedCount)

      // 更新缓存
      state._filteredEventsCache = paginatedResult
      state._cacheKey = cacheKey

      return paginatedResult
    },

    /**
     * 是否还有更多事件可加载
     */
    hasMoreEvents: (state): boolean => {
      let result = [...state.events]
      if (state.filterType) {
        result = result.filter(event => event.typeId === state.filterType)
      }
      result = filterByTimeRange(result, state.filterTimeRange)
      return state.loadedCount < result.length
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
      this.events = storedEvents.map((event) => {
        // 处理 time：可能是数字或字符串（存储格式）
        let time: number
        if (typeof event.time === 'number') {
          time = event.time
        } else if (typeof event.time === 'string') {
          // 尝试解析为数字时间戳
          const parsed = parseInt(event.time, 10)
          time = isNaN(parsed) ? new Date(event.time).getTime() : parsed
        } else {
          time = Date.now()
        }

        // 处理 createdAt：可能是数字或字符串（存储格式）
        let createdAt: number
        if (typeof event.createdAt === 'number') {
          createdAt = event.createdAt
        } else if (typeof event.createdAt === 'string') {
          const parsed = parseInt(event.createdAt, 10)
          createdAt = isNaN(parsed) ? Date.now() : parsed
        } else {
          createdAt = Date.now()
        }

        return {
          id: event.id,
          name: event.name || '',
          typeId: event.typeId || '',
          time,
          createdAt
        }
      })
      this.isLoaded = true
      // 初始化时加载第一页
      this.loadedCount = this.pageSize
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
     * 更新事件
     * @param id 事件 ID
     * @param event 更新的事件数据
     */
    updateEvent(id: string, event: Partial<Omit<EventData, 'id' | 'createdAt'>>): void {
      const target = this.events.find(e => e.id === id)
      if (target) {
        Object.assign(target, event)
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
    },

    /**
     * 重置分页状态（用于筛选条件变化时）
     */
    resetPagination(): void {
      this.loadedCount = 0
      // 清空缓存以触发重新计算
      this._filteredEventsCache = null
    },

    /**
     * 加载更多事件
     * @returns 加载后的事件列表
     */
    loadMore(): EventData[] {
      // 获取当前过滤后的完整列表（临时计算，不更新缓存）
      let result = [...this.events]
      if (this.filterType) {
        result = result.filter(event => event.typeId === this.filterType)
      }
      result = filterByTimeRange(result, this.filterTimeRange)
      result.sort((a, b) => b.time - a.time)

      const oldLoadedCount = this.loadedCount || result.length
      const newLoadedCount = Math.min(oldLoadedCount + this.pageSize, result.length)
      this.loadedCount = newLoadedCount

      // 返回新的已加载列表
      this._filteredEventsCache = result.slice(0, newLoadedCount)
      return this._filteredEventsCache
    },

    /**
     * 刷新事件列表
     */
    refresh(): EventData[] {
      // 获取当前过滤后的完整列表
      let result = [...this.events]
      if (this.filterType) {
        result = result.filter(event => event.typeId === this.filterType)
      }
      result = filterByTimeRange(result, this.filterTimeRange)
      result.sort((a, b) => b.time - a.time)

      this.loadedCount = result.length
      this._filteredEventsCache = result
      return result
    }
  }
})