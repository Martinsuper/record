import { defineStore } from 'pinia'
import { getEvents, saveEvents } from '@/utils/storage'
import { filterByTimeRange, getMonthStart, getRecentDays } from '@/utils/time'

export interface EventData {
  id: string
  name: string
  typeId: string
  time: number
  createdAt: number
  version: number
}

export type TimeRangeFilter = 'all' | 'today' | 'week' | 'month'

/**
 * 生成唯一的事件ID
 */
function generateEventId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 10)
  const random2 = Math.random().toString(36).substring(2, 10)
  return `event_${timestamp}_${random}${random2}`
}

/**
 * 计算过滤后的事件列表（纯函数）
 */
function computeFilteredEvents(
  events: EventData[],
  filterType: string | null,
  filterTimeRange: TimeRangeFilter,
  loadedCount: number
): EventData[] {
  let result = [...events]

  // 按类型过滤
  if (filterType) {
    result = result.filter(event => event.typeId === filterType)
  }

  // 按时间范围过滤
  result = filterByTimeRange(result, filterTimeRange)

  // 按时间倒序排序
  result.sort((a, b) => b.time - a.time)

  // 分页：只返回已加载数量的事件
  const count = loadedCount || result.length
  return result.slice(0, count)
}

export const useEventStore = defineStore('event', {
  state: () => ({
    events: [] as EventData[],
    filterType: null as string | null,
    filterTimeRange: 'all' as TimeRangeFilter,
    isLoaded: false,
    // 分页加载相关
    pageSize: 10,
    loadedCount: 0
  }),

  getters: {
    /**
     * 事件总数
     */
    totalCount: (state): number => {
      return state.events.length
    },

    /**
     * 过滤后的事件列表（按时间倒序，支持分页）
     * 纯 getter，不修改 state
     */
    filteredEvents: (state): EventData[] => {
      return computeFilteredEvents(
        state.events,
        state.filterType,
        state.filterTimeRange,
        state.loadedCount
      )
    },

    /**
     * 过滤后的完整列表（不分页）
     */
    filteredEventsFull: (state): EventData[] => {
      let result = [...state.events]
      if (state.filterType) {
        result = result.filter(event => event.typeId === state.filterType)
      }
      result = filterByTimeRange(result, state.filterTimeRange)
      result.sort((a, b) => b.time - a.time)
      return result
    },

    /**
     * 是否还有更多事件可加载
     */
    hasMoreEvents: (state): boolean => {
      const fullList = state.events.filter(event =>
        state.filterType ? event.typeId === state.filterType : true
      )
      const filtered = filterByTimeRange(fullList, state.filterTimeRange)
      return state.loadedCount < filtered.length
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
    recentDaysStats: (state): { date: string; label: string; count: number; timestamp: number }[] => {
      const recentDays = getRecentDays(7)
      const counts = new Map<number, number>()

      state.events.forEach(event => {
        for (const day of recentDays) {
          const dayEnd = day.timestamp + 24 * 60 * 60 * 1000
          if (event.time >= day.timestamp && event.time < dayEnd) {
            counts.set(day.timestamp, (counts.get(day.timestamp) || 0) + 1)
            break
          }
        }
      })

      return recentDays.map(day => ({
        date: day.date,
        label: day.label,
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
      if (this.isLoaded) return

      const storedEvents = getEvents()
      this.events = storedEvents.map((event) => ({
        id: event.id,
        name: event.name || '',
        typeId: event.typeId || '',
        time: event.time,
        createdAt: event.createdAt,
        version: event.version || 1
      }))
      this.isLoaded = true
      this.loadedCount = this.pageSize
    },

    /**
     * 保存事件到存储
     */
    saveToStorage(): void {
      const storageData = this.events.map(event => ({
        id: event.id,
        name: event.name,
        typeId: event.typeId,
        time: event.time,
        createdAt: event.createdAt,
        updatedAt: Date.now(),
        version: event.version ?? 1
      }))
      saveEvents(storageData)
    },

    /**
     * 添加新事件
     */
    addEvent(event: {
      name: string
      typeId: string
      time: number
    }): void {
      const newEvent: EventData = {
        ...event,
        id: generateEventId(),
        createdAt: Date.now(),
        version: 1
      }
      this.events.push(newEvent)
      this.saveToStorage()
    },

    /**
     * 删除事件
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
     */
    setFilterType(typeId: string | null): void {
      this.filterType = typeId
    },

    /**
     * 设置时间范围过滤
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
     * 重置分页状态
     */
    resetPagination(): void {
      this.loadedCount = 0
    },

    /**
     * 加载更多事件
     */
    loadMore(): void {
      const fullFiltered = this.filteredEventsFull
      const oldLoadedCount = this.loadedCount || fullFiltered.length
      const newLoadedCount = Math.min(oldLoadedCount + this.pageSize, fullFiltered.length)
      this.loadedCount = newLoadedCount
    },

    /**
     * 刷新事件列表（加载全部）
     */
    refresh(): void {
      this.loadedCount = this.filteredEventsFull.length
    },

    /**
     * 合并导入的事件数据
     */
    mergeEvents(importedEvents: EventData[]): { added: number; updated: number } {
      let added = 0
      let updated = 0

      importedEvents.forEach((imported) => {
        const existing = this.events.find((e) => e.id === imported.id)

        if (existing) {
          existing.name = imported.name || existing.name
          existing.typeId = imported.typeId || existing.typeId
          existing.time = imported.time || existing.time
          updated++
        } else {
          this.events.push({
            id: imported.id,
            name: imported.name || '',
            typeId: imported.typeId || '',
            time: imported.time || Date.now(),
            createdAt: imported.createdAt || Date.now(),
            version: imported.version || 1
          })
          added++
        }
      })

      if (added > 0 || updated > 0) {
        this.saveToStorage()
      }

      return { added, updated }
    }
  }
})