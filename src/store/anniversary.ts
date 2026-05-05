import { defineStore } from 'pinia'
import { getAnniversaries, saveAnniversaries } from '@/utils/storage'
import type { AnniversaryData } from '@/utils/storage'
import { calculateAnniversary } from '@/utils/anniversary'

export type AnniversaryDataItem = AnniversaryData

/**
 * 生成唯一的纪念日 ID
 */
function generateAnniversaryId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 10)
  const random2 = Math.random().toString(36).substring(2, 10)
  return `anniversary_${timestamp}_${random}${random2}`
}

export const useAnniversaryStore = defineStore('anniversary', {
  state: () => ({
    anniversaries: [] as AnniversaryDataItem[],
    isLoaded: false,
    selectedCategoryId: null as string | null,
    searchKeyword: ''
  }),

  getters: {
    totalCount: (state): number => state.anniversaries.length,

    sortedAnniversaries: (state): AnniversaryDataItem[] => {
      return [...state.anniversaries].sort((a, b) => {
        const calcA = calculateAnniversary(a.date, a.mode, a.repeatType)
        const calcB = calculateAnniversary(b.date, b.mode, b.repeatType)
        return calcA.days - calcB.days
      })
    },

    filteredAnniversaries: (state): AnniversaryDataItem[] => {
      let result = state.anniversaries

      if (state.selectedCategoryId) {
        result = result.filter(a => a.categoryId === state.selectedCategoryId)
      }

      if (state.searchKeyword.trim()) {
        const keyword = state.searchKeyword.trim().toLowerCase()
        result = result.filter(a => a.name.toLowerCase().includes(keyword))
      }

      return result.sort((a, b) => {
        const calcA = calculateAnniversary(a.date, a.mode, a.repeatType)
        const calcB = calculateAnniversary(b.date, b.mode, b.repeatType)
        return calcA.days - calcB.days
      })
    }
  },

  actions: {
    loadFromStorage(): void {
      if (this.isLoaded) return

      const storedAnniversaries = getAnniversaries()
      this.anniversaries = storedAnniversaries.map(item => ({
        id: item.id,
        name: item.name || '',
        date: item.date || Date.now(),
        repeatType: item.repeatType || 'year',
        mode: item.mode || 'countdown',
        categoryId: item.categoryId || '',
        sortOrder: item.sortOrder || 0,
        createdAt: item.createdAt || Date.now(),
        updatedAt: item.updatedAt || Date.now(),
        version: item.version || 1
      }))
      this.isLoaded = true
    },

    saveToStorage(): void {
      saveAnniversaries(this.anniversaries)
    },

    addAnniversary(data: {
      name: string
      date: number
      repeatType: 'none' | 'year' | 'month' | 'week' | 'day'
      mode: 'countdown' | 'elapsed'
      categoryId: string
    }): void {
      const now = Date.now()
      const newAnniversary: AnniversaryDataItem = {
        ...data,
        id: generateAnniversaryId(),
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
        version: 1
      }
      this.anniversaries.push(newAnniversary)
      this.saveToStorage()
    },

    deleteAnniversary(id: string): void {
      const index = this.anniversaries.findIndex(a => a.id === id)
      if (index !== -1) {
        this.anniversaries.splice(index, 1)
        this.saveToStorage()
      }
    },

    updateAnniversary(id: string, data: Partial<Omit<AnniversaryDataItem, 'id' | 'createdAt'>>): void {
      const target = this.anniversaries.find(a => a.id === id)
      if (target) {
        Object.assign(target, data, { updatedAt: Date.now() })
        this.saveToStorage()
      }
    },

    getAnniversaryById(id: string): AnniversaryDataItem | undefined {
      return this.anniversaries.find(a => a.id === id)
    },

    setCategoryFilter(categoryId: string | null): void {
      this.selectedCategoryId = categoryId
    },

    setSearchKeyword(keyword: string): void {
      this.searchKeyword = keyword
    },

    clearSearch(): void {
      this.searchKeyword = ''
    },

    mergeAnniversaries(imported: AnniversaryDataItem[]): { added: number; updated: number } {
      let added = 0
      let updated = 0

      for (const item of imported) {
        const existing = this.anniversaries.find(a => a.id === item.id)
        if (existing) {
          if (item.updatedAt > existing.updatedAt) {
            Object.assign(existing, item)
            updated++
          }
        } else {
          this.anniversaries.push(item)
          added++
        }
      }

      this.saveToStorage()
      return { added, updated }
    }
  }
})