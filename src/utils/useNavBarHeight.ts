import { computed } from 'vue'

/**
 * 导航栏高度 hook
 * 统一获取动态导航栏高度（已由 App.vue 在启动时计算并存储）
 */
export function useNavBarHeight() {
  const navBarHeight = computed(() => {
    const height = uni.getStorageSync('navBarHeight')
    return height || 88
  })

  return {
    navBarHeight,
    navBarHeightPx: computed(() => `${navBarHeight.value}px`)
  }
}