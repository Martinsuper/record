import { defineStore } from 'pinia'
import { getAnniversaryCategories, saveAnniversaryCategories } from '@/utils/storage'
import type { AnniversaryCategory } from '@/utils/storage'

export type AnniversaryCategoryItem = AnniversaryCategory

const PRESET_CATEGORIES: AnniversaryCategoryItem[] = [
  { id: 'birthday', name: '生日', icon: '', isPreset: true, sortOrder: 1, version: 1 },
  { id: 'love', name: '恋爱', icon: '', isPreset: true, sortOrder: 2, version: 1 },
  { id: 'wedding', name: '结婚', icon: '', isPreset: true, sortOrder: 3, version: 1 },
  { id: 'festival', name: '节日', icon: '', isPreset: true, sortOrder: 4, version: 1 },
  { id: 'work', name: '工作', icon: '', isPreset: true, sortOrder: 5, version: 1 },
  { id: 'onboard', name: '入职', icon: '', isPreset: true, sortOrder: 6, version: 1 },
  { id: 'memorial', name: '纪念日', icon: '', isPreset: true, sortOrder: 7, version: 1 },
  { id: 'other', name: '其他', icon: '', isPreset: true, sortOrder: 8, version: 1 }
]

export const useAnniversaryCategoryStore = defineStore('anniversaryCategory', {
  state: () => ({
    categories: [] as AnniversaryCategoryItem[],
    isLoaded: false
  }),

  getters: {
    presetCategories: (state): AnniversaryCategoryItem[] => {
      return state.categories.filter(c => c.isPreset).sort((a, b) => a.sortOrder - b.sortOrder)
    },

    customCategories: (state): AnniversaryCategoryItem[] => {
      return state.categories.filter(c => !c.isPreset).sort((a, b) => a.sortOrder - b.sortOrder)
    },

    allCategories(): AnniversaryCategoryItem[] {
      return [...this.presetCategories, ...this.customCategories]
    }
  },

  actions: {
    loadFromStorage(): void {
      if (this.isLoaded) return

      const storedCategories = getAnniversaryCategories()

      if (storedCategories.length === 0) {
        this.categories = [...PRESET_CATEGORIES]
        this.saveToStorage()
      } else {
        const presetIds = new Set(PRESET_CATEGORIES.map(p => p.id))
        const customCategories = storedCategories.filter(c => !presetIds.has(c.id))
        this.categories = [...PRESET_CATEGORIES, ...customCategories]
      }

      this.isLoaded = true
    },

    saveToStorage(): void {
      saveAnniversaryCategories(this.categories)
    },

    addCategory(data: { name: string; icon: string }): AnniversaryCategoryItem {
      const maxSortOrder = Math.max(0, ...this.customCategories.map(c => c.sortOrder))
      const newCategory: AnniversaryCategoryItem = {
        ...data,
        id: `custom_${Date.now()}`,
        isPreset: false,
        sortOrder: maxSortOrder + 1,
        version: 1
      }
      this.categories.push(newCategory)
      this.saveToStorage()
      return newCategory
    },

    updateCategory(id: string, data: Partial<Omit<AnniversaryCategoryItem, 'id' | 'isPreset'>>): void {
      const target = this.categories.find(c => c.id === id)
      if (target && !target.isPreset) {
        Object.assign(target, data)
        this.saveToStorage()
      }
    },

    deleteCategory(id: string): boolean {
      const index = this.categories.findIndex(c => c.id === id)
      if (index !== -1 && !this.categories[index].isPreset) {
        this.categories.splice(index, 1)
        this.saveToStorage()
        return true
      }
      return false
    },

    getCategoryById(id: string): AnniversaryCategoryItem | undefined {
      return this.categories.find(c => c.id === id)
    },

    mergeCategories(imported: AnniversaryCategoryItem[]): { added: number; skipped: number } {
      let added = 0
      let skipped = 0

      for (const item of imported) {
        const existing = this.categories.find(c => c.id === item.id)
        if (existing) {
          skipped++
        } else if (!item.isPreset) {
          this.categories.push(item)
          added++
        }
      }

      this.saveToStorage()
      return { added, skipped }
    }
  }
})