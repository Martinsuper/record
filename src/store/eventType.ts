import { defineStore } from 'pinia'
import { getEventTypes, saveEventTypes } from '@/utils/storage'

export interface EventTypeData {
  id: string
  name: string
  color: string
  createdAt: number
}

/**
 * 生成唯一的事件类型ID
 */
function generateTypeId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `type_${timestamp}_${random}`
}

export const useEventTypeStore = defineStore('eventType', {
  state: () => ({
    types: [] as EventTypeData[]
  }),

  getters: {
    /**
     * 事件类型数量
     */
    typeCount: (state): number => {
      return state.types.length
    },

    /**
     * 根据ID获取事件类型
     */
    getTypeById: (state) => {
      return (id: string): EventTypeData | undefined => {
        return state.types.find((type) => type.id === id)
      }
    },

    /**
     * 根据ID获取事件类型名称
     * @returns 如果未找到返回 '未分类'
     */
    getTypeName: (state) => {
      return (id: string): string => {
        const type = state.types.find((t) => t.id === id)
        return type?.name || '未分类'
      }
    },

    /**
     * 根据ID获取事件类型颜色
     * @returns 如果未找到返回 '#999999'
     */
    getTypeColor: (state) => {
      return (id: string): string => {
        const type = state.types.find((t) => t.id === id)
        return type?.color || '#999999'
      }
    },

    /**
     * 获取用于选择器的事件类型选项
     */
    typeOptions: (state): { value: string; label: string; color: string }[] => {
      return state.types.map((type) => ({
        value: type.id,
        label: type.name,
        color: type.color
      }))
    }
  },

  actions: {
    /**
     * 从存储加载事件类型
     */
    loadFromStorage(): void {
      const storedTypes = getEventTypes()
      // 转换为 EventTypeData 格式（添加 createdAt 字段）
      this.types = storedTypes.map((type) => ({
        id: type.id,
        name: type.name,
        color: type.color,
        createdAt: type.createdAt || Date.now()
      }))
    },

    /**
     * 保存事件类型到存储
     */
    saveToStorage(): void {
      saveEventTypes(this.types)
    },

    /**
     * 添加新的事件类型
     * @param type 事件类型数据（除id和createdAt外）
     */
    addType(type: Omit<EventTypeData, 'id' | 'createdAt'>): void {
      const newType: EventTypeData = {
        ...type,
        id: generateTypeId(),
        createdAt: Date.now()
      }
      this.types.push(newType)
      this.saveToStorage()
    },

    /**
     * 删除事件类型
     * @param id 事件类型ID
     */
    deleteType(id: string): void {
      const index = this.types.findIndex((type) => type.id === id)
      if (index !== -1) {
        this.types.splice(index, 1)
        this.saveToStorage()
      }
    },

    /**
     * 更新事件类型
     * @param id 事件类型ID
     * @param data 要更新的数据
     */
    updateType(id: string, data: Partial<Omit<EventTypeData, 'id' | 'createdAt'>>): void {
      const type = this.types.find((t) => t.id === id)
      if (type) {
        Object.assign(type, data)
        this.saveToStorage()
      }
    }
  }
})