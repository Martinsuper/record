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
    filterTimeRange: 'all' as TimeRangeFilter
  }),

  getters: {
    /**
     * 过滤后的事件列表（按时间倒序）
     */
    filteredEvents: (state): EventData[] => {
      let result = [...state.events]

      // 按类型过滤
      if (state.filterType) {
        result = result.filter(event => event.typeId === state.filterType)
      }

      // 按时间范围过滤
      result = filterByTimeRange(result, state.filterTimeRange)

      // 按时间倒序排序
      result.sort((a, b) => b.time - a.time)

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
      return recentDays.map(day => {
        const dayEnd = day.timestamp + 24 * 60 * 60 * 1000
        const count = state.events.filter(
          event => event.time >= day.timestamp && event.time < dayEnd
        ).length
        return {
          date: day.label,
          count,
          timestamp: day.timestamp
        }
      })
    }
  },

  actions: {
    /**
     * 从存储加载事件
     */
    loadFromStorage(): void {
      const storedEvents = getEvents()
      this.events = storedEvents.map((event) => ({
        id: event.id,
        name: event.title || event.name || '',
        typeId: event.typeId || '',
        time: typeof event.time === 'number' ? event.time : new Date(event.time).getTime(),
        createdAt: event.createdAt || Date.now()
      }))
    },

    /**
     * 保存事件到存储
     */
    saveToStorage(): void {
      // 转换为存储格式
      const storageData = this.events.map(event => ({
        id: event.id,
        title: event.name,
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