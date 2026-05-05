import { defineStore } from 'pinia'
import { getEventTypes, saveEventTypes } from '@/utils/storage'
import type { EventType } from '@/utils/storage'
import { useEventStore } from './event'

export type EventTypeData = EventType

/**
 * 生成唯一的事件类型ID
 */
function generateTypeId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 10)
  const random2 = Math.random().toString(36).substring(2, 10)
  return `type_${timestamp}_${random}${random2}`
}

export const useEventTypeStore = defineStore('eventType', {
  state: () => ({
    types: [] as EventTypeData[],
    isLoaded: false
  }),

  getters: {
    typeCount: (state): number => state.types.length,

    getTypeById: (state) => (id: string): EventTypeData | undefined => {
      return state.types.find(type => type.id === id)
    },

    getTypeName: (state) => (id: string): string => {
      const type = state.types.find(t => t.id === id)
      return type?.name || '未分类'
    },

    getTypeColor: (state) => (id: string): string => {
      const type = state.types.find(t => t.id === id)
      return type?.color || '#999999'
    },

    typeOptions: (state): { value: string; label: string; color: string }[] => {
      return state.types.map(type => ({
        value: type.id,
        label: type.name,
        color: type.color
      }))
    }
  },

  actions: {
    loadFromStorage(): void {
      if (this.isLoaded) return

      const storedTypes = getEventTypes()
      this.types = storedTypes.map(type => ({
        id: type.id,
        name: type.name,
        color: type.color,
        createdAt: type.createdAt || Date.now(),
        version: type.version || 1
      }))
      this.isLoaded = true
    },

    saveToStorage(): void {
      saveEventTypes(this.types.map(type => ({
        ...type,
        updatedAt: Date.now()
      })))
    },

    addType(type: { name: string; color: string }): void {
      const newType: EventTypeData = {
        ...type,
        id: generateTypeId(),
        createdAt: Date.now(),
        version: 1
      }
      this.types.push(newType)
      this.saveToStorage()
    },

    deleteType(id: string): void {
      const index = this.types.findIndex(type => type.id === id)
      if (index !== -1) {
        this.types.splice(index, 1)
        this.saveToStorage()

        // 更新关联事件的 typeId 为空字符串
        const eventStore = useEventStore()
        eventStore.events.forEach(event => {
          if (event.typeId === id) {
            event.typeId = ''
          }
        })
        eventStore.saveToStorage()
      }
    },

    updateType(id: string, data: Partial<Omit<EventTypeData, 'id' | 'createdAt'>>): void {
      const type = this.types.find(t => t.id === id)
      if (type) {
        Object.assign(type, data)
        this.saveToStorage()
      }
    },

    mergeTypes(importedTypes: EventTypeData[]): { added: number; updated: number } {
      let added = 0
      let updated = 0

      importedTypes.forEach(imported => {
        const existing = this.types.find(t => t.id === imported.id)

        if (existing) {
          existing.name = imported.name || existing.name
          existing.color = imported.color || existing.color
          updated++
        } else {
          this.types.push({
            id: imported.id,
            name: imported.name || '',
            color: imported.color || '#999999',
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