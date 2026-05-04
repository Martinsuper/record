import { defineStore } from 'pinia'
import { getAnniversaries, saveAnniversaries } from '@/utils/storage'
import type { AnniversaryData } from '@/utils/storage'
import { calculateAnniversary } from '@/utils/anniversary'

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
    anniversaries: [] as AnniversaryData[],
    isLoaded: false,
    selectedCategoryId: null as string | null,
    searchKeyword: ''  // 新增：搜索关键词
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
        const calcA = calculateAnniversary(a.date, a.mode, a.repeatType)
        const calcB = calculateAnniversary(b.date, b.mode, b.repeatType)
        return calcA.days - calcB.days
      })
    },

    /**
     * 筛选后的纪念日列表
     * 同时考虑分类筛选和搜索关键词，并应用排序
     */
    filteredAnniversaries: (state): AnniversaryData[] => {
      let result = state.anniversaries

      // 分类筛选
      if (state.selectedCategoryId) {
        result = result.filter(a => a.categoryId === state.selectedCategoryId)
      }

      // 名称搜索（实时搜索）
      if (state.searchKeyword.trim()) {
        const keyword = state.searchKeyword.trim().toLowerCase()
        result = result.filter(a => a.name.toLowerCase().includes(keyword))
      }

      // 应用排序：最近要发生的排前面
      return result.sort((a, b) => {
        const calcA = calculateAnniversary(a.date, a.mode, a.repeatType)
        const calcB = calculateAnniversary(b.date, b.mode, b.repeatType)
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
        mode: item.mode || 'countdown',
        categoryId: item.categoryId || '',
        sortOrder: item.sortOrder || 0,
        createdAt: item.createdAt || Date.now(),
        updatedAt: item.updatedAt || Date.now(),
        version: item.version || 1,
        deleted: item.deleted ?? false
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
    addAnniversary(data: {
      name: string
      date: number
      repeatType: 'none' | 'year' | 'month' | 'week' | 'day'
      mode: 'countdown' | 'elapsed'
      categoryId: string
    }): void {
      const newAnniversary: AnniversaryData = {
        ...data,
        id: generateAnniversaryId(),
        sortOrder: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
        deleted: false
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
    },

    /**
     * 设置分类筛选
     * @param categoryId 分类 ID，null 表示显示全部
     */
    setCategoryFilter(categoryId: string | null): void {
      this.selectedCategoryId = categoryId
    },

    /**
     * 设置搜索关键词
     * @param keyword 搜索关键词
     */
    setSearchKeyword(keyword: string): void {
      this.searchKeyword = keyword
    },

    /**
     * 清空搜索
     */
    clearSearch(): void {
      this.searchKeyword = ''
    },

    /**
     * 合并导入的纪念日数据
     * @param imported 导入的纪念日列表
     * @returns 新增和更新的数量
     */
    mergeAnniversaries(imported: AnniversaryData[]): { added: number, updated: number } {
      let added = 0
      let updated = 0

      for (const item of imported) {
        const existing = this.anniversaries.find(a => a.id === item.id)
        if (existing) {
          // 更新现有数据（保留较新的 updatedAt）
          if (item.updatedAt > existing.updatedAt) {
            Object.assign(existing, item)
            updated++
          }
        } else {
          // 新增数据
          this.anniversaries.push(item)
          added++
        }
      }

      this.saveToStorage()
      return { added, updated }
    }
  }
})
