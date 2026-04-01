import { defineStore } from 'pinia'
import { getAnniversaries, saveAnniversaries } from '@/utils/storage'
import type { AnniversaryData } from '@/utils/storage'
import { calculateAnniversary } from '@/utils/anniversary'

/**
 * 生成唯一的纪念日 ID
 */
function generateAnniversaryId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `anniversary_${timestamp}_${random}`
}

export const useAnniversaryStore = defineStore('anniversary', {
  state: () => ({
    anniversaries: [] as AnniversaryData[],
    isLoaded: false
  }),

  getters: {
    /**
     * 纪念日总数
     */
    totalCount: (state): number => {
      return state.anniversaries.length
    },

    /**
     * 排序后的纪念日列表
     * 规则：最近要发生的排前面
     */
    sortedAnniversaries: (state): AnniversaryData[] => {
      return [...state.anniversaries].sort((a, b) => {
        const calcA = calculateAnniversary(a.date, a.repeatType)
        const calcB = calculateAnniversary(b.date, b.repeatType)
        return calcA.days - calcB.days
      })
    }
  },

  actions: {
    /**
     * 从存储加载纪念日
     */
    loadFromStorage(): void {
      if (this.isLoaded) return

      const storedAnniversaries = getAnniversaries()
      this.anniversaries = storedAnniversaries.map((item) => ({
        id: item.id,
        name: item.name || '',
        date: item.date || Date.now(),
        repeatType: item.repeatType || 'year',
        categoryId: item.categoryId || '',
        sortOrder: item.sortOrder || 0,
        createdAt: item.createdAt || Date.now(),
        updatedAt: item.updatedAt || Date.now()
      }))
      this.isLoaded = true
    },

    /**
     * 保存纪念日到存储
     */
    saveToStorage(): void {
      saveAnniversaries(this.anniversaries)
    },

    /**
     * 添加新纪念日
     * @param data 纪念日数据
     */
    addAnniversary(data: Omit<AnniversaryData, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'>): void {
      const newAnniversary: AnniversaryData = {
        ...data,
        id: generateAnniversaryId(),
        sortOrder: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      this.anniversaries.push(newAnniversary)
      this.saveToStorage()
    },

    /**
     * 删除纪念日
     * @param id 纪念日 ID
     */
    deleteAnniversary(id: string): void {
      const index = this.anniversaries.findIndex(a => a.id === id)
      if (index !== -1) {
        this.anniversaries.splice(index, 1)
        this.saveToStorage()
      }
    },

    /**
     * 更新纪念日
     * @param id 纪念日 ID
     * @param data 更新的数据
     */
    updateAnniversary(id: string, data: Partial<Omit<AnniversaryData, 'id' | 'createdAt'>>): void {
      const target = this.anniversaries.find(a => a.id === id)
      if (target) {
        Object.assign(target, data, { updatedAt: Date.now() })
        this.saveToStorage()
      }
    },

    /**
     * 根据 ID 获取纪念日
     * @param id 纪念日 ID
     */
    getAnniversaryById(id: string): AnniversaryData | undefined {
      return this.anniversaries.find(a => a.id === id)
    }
  }
})
