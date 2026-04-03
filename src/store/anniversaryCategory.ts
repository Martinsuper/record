import { defineStore } from 'pinia'
import { getAnniversaryCategories, saveAnniversaryCategories } from '@/utils/storage'
import type { AnniversaryCategory } from '@/utils/storage'
import { sendMessage } from '@/utils/syncManager'

// 预设分类
const PRESET_CATEGORIES: AnniversaryCategory[] = [
  { id: 'birthday', name: '生日', icon: '\uf1fd', isPreset: true, sortOrder: 1 },
  { id: 'love', name: '恋爱', icon: '\uf004', isPreset: true, sortOrder: 2 },
  { id: 'wedding', name: '结婚', icon: '\uf802', isPreset: true, sortOrder: 3 },
  { id: 'festival', name: '节日', icon: '\uf56b', isPreset: true, sortOrder: 4 },
  { id: 'work', name: '工作', icon: '\uf0b1', isPreset: true, sortOrder: 5 },
  { id: 'onboard', name: '入职', icon: '\uf073', isPreset: true, sortOrder: 6 },
  { id: 'memorial', name: '纪念日', icon: '\uf4e3', isPreset: true, sortOrder: 7 },
  { id: 'other', name: '其他', icon: '\uf02d', isPreset: true, sortOrder: 8 }
]

export const useAnniversaryCategoryStore = defineStore('anniversaryCategory', {
  state: () => ({
    categories: [] as AnniversaryCategory[],
    isLoaded: false
  }),

  getters: {
    /**
     * 预设分类列表
     */
    presetCategories: (state): AnniversaryCategory[] => {
      return state.categories.filter(c => c.isPreset).sort((a, b) => a.sortOrder - b.sortOrder)
    },

    /**
     * 自定义分类列表
     */
    customCategories: (state): AnniversaryCategory[] => {
      return state.categories.filter(c => !c.isPreset).sort((a, b) => a.sortOrder - b.sortOrder)
    },

    /**
     * 全部分类（预设在前，自定义在后）
     */
    allCategories(): AnniversaryCategory[] {
      return [...this.presetCategories, ...this.customCategories]
    }
  },

  actions: {
    /**
     * 从存储加载分类
     */
    loadFromStorage(): void {
      if (this.isLoaded) return

      const storedCategories = getAnniversaryCategories()

      if (storedCategories.length === 0) {
        // 首次加载，初始化预设分类
        this.categories = [...PRESET_CATEGORIES]
        this.saveToStorage()
      } else {
        // 确保预设分类存在（处理版本升级情况）
        const presetIds = new Set(PRESET_CATEGORIES.map(p => p.id))
        const customCategories = storedCategories.filter(c => !presetIds.has(c.id))
        this.categories = [...PRESET_CATEGORIES, ...customCategories]
      }

      this.isLoaded = true
    },

    /**
     * 保存分类到存储
     */
    saveToStorage(): void {
      saveAnniversaryCategories(this.categories)
    },

    /**
     * 添加自定义分类
     */
    addCategory(data: Omit<AnniversaryCategory, 'id' | 'isPreset' | 'sortOrder'>): AnniversaryCategory {
      const maxSortOrder = Math.max(0, ...this.customCategories.map(c => c.sortOrder))
      const newCategory: AnniversaryCategory = {
        ...data,
        id: `custom_${Date.now()}`,
        isPreset: false,
        sortOrder: maxSortOrder + 1
      }
      this.categories.push(newCategory)
      this.saveToStorage()
      sendMessage('category_add', newCategory)
      return newCategory
    },

    /**
     * 更新分类
     */
    updateCategory(id: string, data: Partial<Omit<AnniversaryCategory, 'id' | 'isPreset'>>): void {
      const target = this.categories.find(c => c.id === id)
      if (target && !target.isPreset) {
        Object.assign(target, data)
        this.saveToStorage()
        sendMessage('category_update', target)
      }
    },

    /**
     * 删除分类（仅自定义可删）
     */
    deleteCategory(id: string): boolean {
      const index = this.categories.findIndex(c => c.id === id)
      if (index !== -1 && !this.categories[index].isPreset) {
        this.categories.splice(index, 1)
        this.saveToStorage()
        sendMessage('category_delete', { id })
        return true
      }
      return false
    },

    /**
     * 根据 ID 获取分类
     */
    getCategoryById(id: string): AnniversaryCategory | undefined {
      return this.categories.find(c => c.id === id)
    },

    /**
     * 合并导入的分类数据
     * @param imported 导入的分类列表
     * @returns 新增和跳过的数量
     */
    mergeCategories(imported: AnniversaryCategory[]): { added: number, skipped: number } {
      let added = 0
      let skipped = 0

      for (const item of imported) {
        const existing = this.categories.find(c => c.id === item.id)
        if (existing) {
          // 已存在的分类跳过（预设分类不可修改，自定义分类保留本地）
          skipped++
        } else if (!item.isPreset) {
          // 仅新增自定义分类
          this.categories.push(item)
          added++
        }
      }

      this.saveToStorage()
      return { added, skipped }
    }
  }
})