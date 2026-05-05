import { defineStore } from 'pinia'
import { getMenuConfig, saveMenuConfig, type MenuItemConfig } from '@/utils/storage'

// 预设菜单项
const PRESET_MENU_ITEMS: MenuItemConfig[] = [
  // Tab 类型（底部导航栏）
  { id: 'tab_events', name: '事件', icon: '', path: '/pages/index/index', type: 'tab', enabled: true, sortOrder: 1, isPreset: true, version: 1 },
  { id: 'tab_anniversary', name: '纪念日', icon: '', path: '/pages/anniversary/anniversary', type: 'tab', enabled: true, sortOrder: 2, isPreset: true, version: 1 },
  { id: 'tab_settings', name: '设置', icon: '', path: '/pages/settings/settings', type: 'tab', enabled: true, sortOrder: 3, isPreset: true, version: 1 },
  // Page 类型（设置页入口）
  { id: 'page_data_manager', name: '数据管理', icon: '', path: '/pages/data-manager/data-manager', type: 'page', enabled: true, sortOrder: 1, isPreset: true, version: 1 },
  { id: 'page_menu_editor', name: '编辑菜单', icon: '', path: '/pages/menu-editor/menu-editor', type: 'page', enabled: true, sortOrder: 2, isPreset: true, version: 1 },
  { id: 'page_type_manager', name: '类型管理', icon: '', path: 'popup', type: 'page', enabled: true, sortOrder: 3, isPreset: true, version: 1 }
]

export const useMenuConfigStore = defineStore('menuConfig', {
  state: () => ({
    menuItems: [] as MenuItemConfig[],
    isLoaded: false
  }),

  getters: {
    /**
     * 启用的 Tab 类型菜单项
     */
    enabledTabItems: (state): MenuItemConfig[] => {
      return state.menuItems
        .filter(item => item.type === 'tab' && item.enabled)
        .sort((a, b) => a.sortOrder - b.sortOrder)
    },

    /**
     * 启用的 Page 类型菜单项
     */
    enabledPageItems: (state): MenuItemConfig[] => {
      return state.menuItems
        .filter(item => item.type === 'page' && item.enabled)
        .sort((a, b) => a.sortOrder - b.sortOrder)
    },

    /**
     * 全部 Tab 类型菜单项（用于编辑）
     */
    allTabItems: (state): MenuItemConfig[] => {
      return state.menuItems
        .filter(item => item.type === 'tab')
        .sort((a, b) => a.sortOrder - b.sortOrder)
    },

    /**
     * 全部 Page 类型菜单项（用于编辑）
     */
    allPageItems: (state): MenuItemConfig[] => {
      return state.menuItems
        .filter(item => item.type === 'page')
        .sort((a, b) => a.sortOrder - b.sortOrder)
    },

    /**
     * 启用的 Tab 数量
     */
    enabledTabCount: (state): number => {
      return state.menuItems.filter(item => item.type === 'tab' && item.enabled).length
    },

    /**
     * 第一个启用的 Tab 菜单项
     */
    firstEnabledTab(): MenuItemConfig | undefined {
      return this.enabledTabItems[0]
    },

    /**
     * 根据 ID 获取菜单项
     */
    getItemById: (state) => {
      return (id: string): MenuItemConfig | undefined => {
        return state.menuItems.find(item => item.id === id)
      }
    }
  },

  actions: {
    /**
     * 从存储加载菜单配置
     */
    loadFromStorage(): void {
      if (this.isLoaded) return

      const storedItems = getMenuConfig()

      if (!storedItems || storedItems.length === 0) {
        // 首次加载，初始化预设菜单
        this.menuItems = [...PRESET_MENU_ITEMS]
        this.saveToStorage()
      } else {
        // 合并预设和存储的配置，保留用户的 enabled 和 sortOrder
        const presetIds = new Set(PRESET_MENU_ITEMS.map(p => p.id))
        const customItems = storedItems.filter(item => !presetIds.has(item.id))

        const mergedPresetItems = PRESET_MENU_ITEMS.map(preset => {
          const stored = storedItems.find(s => s.id === preset.id)
          if (stored) {
            return { ...preset, enabled: stored.enabled, sortOrder: stored.sortOrder }
          }
          return preset
        })

        this.menuItems = [...mergedPresetItems, ...customItems]
      }

      this.isLoaded = true
    },

    /**
     * 保存菜单配置到存储
     */
    saveToStorage(): void {
      saveMenuConfig(this.menuItems)
    },

    /**
     * 切换菜单项启用状态
     */
    toggleEnabled(id: string): void {
      const item = this.menuItems.find(i => i.id === id)
      if (item) {
        item.enabled = !item.enabled
        this.saveToStorage()
      }
    },

    /**
     * 设置菜单项启用状态
     */
    setEnabled(id: string, enabled: boolean): void {
      const item = this.menuItems.find(i => i.id === id)
      if (item) {
        item.enabled = enabled
        this.saveToStorage()
      }
    },

    /**
     * 更新 Tab 类型菜单项排序
     */
    updateTabSortOrder(sortedIds: string[]): void {
      sortedIds.forEach((id, index) => {
        const item = this.menuItems.find(i => i.id === id && i.type === 'tab')
        if (item) {
          item.sortOrder = index + 1
        }
      })
      this.saveToStorage()
    },

    /**
     * 更新 Page 类型菜单项排序
     */
    updatePageSortOrder(sortedIds: string[]): void {
      sortedIds.forEach((id, index) => {
        const item = this.menuItems.find(i => i.id === id && i.type === 'page')
        if (item) {
          item.sortOrder = index + 1
        }
      })
      this.saveToStorage()
    },

    /**
     * 重置为默认配置
     */
    resetToDefault(): void {
      this.menuItems = [...PRESET_MENU_ITEMS]
      this.saveToStorage()
    }
  }
})