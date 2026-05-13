<script>
import { useEventStore } from '@/store/event'
import { useEventTypeStore } from '@/store/eventType'
import { useAnniversaryStore } from '@/store/anniversary'
import { useAnniversaryCategoryStore } from '@/store/anniversaryCategory'
import { useMenuConfigStore } from '@/store/menuConfig'

export default {
  onLaunch() {
    console.log('App Launch')
    // 集中初始化所有 store 数据
    const eventStore = useEventStore()
    const eventTypeStore = useEventTypeStore()
    const anniversaryStore = useAnniversaryStore()
    const anniversaryCategoryStore = useAnniversaryCategoryStore()
    const menuConfigStore = useMenuConfigStore()

    eventStore.loadFromStorage()
    eventTypeStore.loadFromStorage()
    anniversaryStore.loadFromStorage()
    anniversaryCategoryStore.loadFromStorage()
    menuConfigStore.loadFromStorage()

    // 默认页面跳转：确保每次启动都进入用户配置的第一个 Tab
    const firstTab = menuConfigStore.firstEnabledTab
    const defaultPath = firstTab?.path || '/pages/index/index'
    const savedDefault = uni.getStorageSync('defaultTabPath') || ''

    if (savedDefault !== defaultPath) {
      // 菜单配置发生变化，更新默认路径并跳转
      uni.setStorageSync('defaultTabPath', defaultPath)
      uni.reLaunch({ url: defaultPath })
    }

    // 小程序环境：计算导航栏高度
    // #ifdef MP-WEIXIN
    // 计算导航栏高度（胶囊按钮底部 + 胶囊按钮距状态栏的间距）
    const menuButton = uni.getMenuButtonBoundingClientRect()
    const statusBarHeight = uni.getSystemInfoSync().statusBarHeight
    const mpNavBarHeight = menuButton.bottom + (menuButton.top - statusBarHeight)
    console.log('导航栏高度:', mpNavBarHeight)
    uni.setStorageSync('navBarHeight', mpNavBarHeight)

    // 动态加载网络字体（Font Awesome）
    // 注意：需要将字体文件上传到可访问的 CDN 或服务器
    // 临时方案：使用 GitHub raw 文件（可能有访问限制）
    uni.loadFontFace({
      family: 'Font Awesome 6 Free',
      source: 'url("https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/webfonts/fa-solid-900.ttf")',
      success: () => {
        console.log('Font Awesome 加载成功')
      },
      fail: (err) => {
        console.error('Font Awesome 加载失败:', err)
        // 备用方案：使用本地 CSS Unicode 映射（已在全局样式定义）
      }
    })
    // #endif

    // #ifdef H5
    // H5 端使用安全区域高度作为导航栏高度的近似值
    const sysInfo = uni.getSystemInfoSync()
    const safeAreaTop = sysInfo.safeAreaInsets?.top || 0
    const h5NavBarHeight = safeAreaTop + 44
    uni.setStorageSync('navBarHeight', h5NavBarHeight)
    // #endif
  },
  onShow() {
    console.log('App Show')
  },
  onHide() {
    console.log('App Hide')
  }
}
</script>

<style lang="scss">
/* ========================================
   Event Record App - Global Styles
   Design System: Soft Glassmorphism + Vibrant Gradient
   ======================================== */

/* Import design system variables */
@import '@/uni.scss';

/* Base page styles - Gradient background */
page {
  --nav-bar-height: 88px; // 默认值，页面会动态覆盖
  background: linear-gradient(180deg, $bg-primary 0%, $bg-secondary 50%, #F0F9FF 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
}

/* Global text styles */
text {
  color: $text-primary;
  line-height: 1.6;
}

/* Font Awesome icon styles - 使用本地字体 (仅 H5 端) */
/* 小程序端使用 wx.loadFontFace + Unicode 映射，不支持 @font-face */
/* #ifdef H5 */
@font-face {
  font-family: 'Font Awesome 6 Free';
  src: url('/static/fonts/fa-solid-900.ttf') format('truetype');
  font-weight: 900;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Font Awesome 6 Free';
  src: url('/static/fonts/fa-regular-400.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Font Awesome 6 Brands';
  src: url('/static/fonts/fa-brands-400.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
/* #endif */

.fa-solid,
.fa-regular,
.fa-brands {
  font-family: 'Font Awesome 6 Free', sans-serif !important;
  font-weight: 900;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  display: inline-block;
}

.fa-regular {
  font-weight: 400;
}

.fa-brands {
  font-family: 'Font Awesome 6 Brands', sans-serif !important;
  font-weight: 400;
}

/* FontAwesome 图标 Unicode 映射（小程序必需） */
.fa-plus::before { content: '\f067'; }
.fa-list-check::before { content: '\f0ae'; }
.fa-chart-pie::before { content: '\f200'; }
.fa-inbox::before { content: '\f01c'; }
.fa-star::before { content: '\f005'; }
.fa-clock::before { content: '\f017'; }
.fa-layer-group::before { content: '\f5fd'; }
.fa-calendar-check::before { content: '\f274'; }
.fa-tags::before { content: '\f02c'; }
.fa-chart-line::before { content: '\f201'; }
.fa-chevron-down::before { content: '\f078'; }
.fa-chevron-right::before { content: '\f054'; }
.fa-times::before { content: '\f00d'; }
.fa-check::before { content: '\f00c'; }
.fa-pen::before { content: '\f304'; }
.fa-calendar::before { content: '\f133'; }
.fa-sparkles::before { content: '\f896'; }

/* 补充的图标映射 */
.fa-search::before { content: '\f002'; }
.fa-heart::before { content: '\f004'; }
.fa-cog::before { content: '\f013'; }
.fa-arrow-right::before { content: '\f061'; }
.fa-arrow-left::before { content: '\f060'; }
.fa-envelope::before { content: '\f0e0'; }
.fa-edit::before { content: '\f044'; }
.fa-trash::before { content: '\f2ed'; }
.fa-trash-alt::before { content: '\f2ed'; }
.fa-calendar-plus::before { content: '\f271'; }
.fa-download::before { content: '\f019'; }
.fa-upload::before { content: '\f093'; }
.fa-bars::before { content: '\f0c9'; }
.fa-sort::before { content: '\f0dc'; }
.fa-undo::before { content: '\f0e2'; }
.fa-magic::before { content: '\f0d0'; }
.fa-database::before { content: '\f1c0'; }
.fa-trash-restore::before { content: '\f829'; }
.fa-archive::before { content: '\f187'; }
.fa-box::before { content: '\f466'; }
.fa-save::before { content: '\f0c7'; }
.fa-file-export::before { content: '\f56e'; }
.fa-file-import::before { content: '\f56f'; }
.fa-ellipsis-v::before { content: '\f142'; }
.fa-eye::before { content: '\f06e'; }
.fa-eye-slash::before { content: '\f070'; }
.fa-sync::before { content: '\f021'; }
.fa-sync-alt::before { content: '\f2f1'; }
.fa-plus-circle::before { content: '\f055'; }
.fa-minus-circle::before { content: '\f056'; }
.fa-times-circle::before { content: '\f057'; }
.fa-check-circle::before { content: '\f058'; }
.fa-question-circle::before { content: '\f059'; }
.fa-info-circle::before { content: '\f05a'; }
.fa-exclamation-circle::before { content: '\f06a'; }
.fa-folder::before { content: '\f07b'; }
.fa-folder-open::before { content: '\f07c'; }
.fa-tag::before { content: '\f02b'; }
.fa-copy::before { content: '\f0c5'; }
.fa-paste::before { content: '\f0ea'; }
.fa-clipboard::before { content: '\f328'; }
.fa-filter::before { content: '\f0b0'; }
.fa-columns::before { content: '\f0db'; }
.fa-th-list::before { content: '\f00b'; }
.fa-th-large::before { content: '\f009'; }
.fa-th::before { content: '\f00a'; }
.fa-expand::before { content: '\f065'; }
.fa-compress::before { content: '\f066'; }
.fa-expand-arrows-alt::before { content: '\f31e'; }
.fa-compress-arrows-alt::before { content: '\f78c'; }
.fa-angle-down::before { content: '\f107'; }
.fa-angle-up::before { content: '\f106'; }
.fa-angle-left::before { content: '\f104'; }
.fa-angle-right::before { content: '\f105'; }
.fa-caret-down::before { content: '\f0d7'; }
.fa-caret-up::before { content: '\f0d8'; }
.fa-caret-left::before { content: '\f0d9'; }
.fa-caret-right::before { content: '\f0da'; }
.fa-grip-vertical::before { content: '\f58e'; }
.fa-bookmark::before { content: '\f02e'; }

/* Glass card component */
.glass-card {
  background: $glass-bg;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid $glass-border;
  border-radius: $radius-lg;
  box-shadow: $shadow-medium;
}

/* Gradient text effect */
.gradient-text {
  background: $gradient-primary;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Button base styles */
button {
  border-radius: $radius-full;
  font-weight: 600;
  transition: all $transition-normal;
}

/* Primary gradient button */
.btn-gradient {
  background: $gradient-primary;
  color: $text-on-gradient;
  border: none;
  box-shadow: $shadow-glow;

  &:active {
    transform: scale(0.96);
    opacity: 0.9;
  }
}

/* Soft white button */
.btn-soft {
  background: $glass-bg;
  backdrop-filter: blur(10px);
  border: 1px solid $glass-border;
  color: $text-primary;

  &:active {
    background: $glass-bg-dark;
  }
}

/* Smooth transitions for interactive elements */
.clickable {
  transition: transform $transition-fast, opacity $transition-fast;

  &:active {
    transform: scale(0.97);
    opacity: 0.85;
  }
}

/* Floating animation */
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8rpx);
  }
}

.float-animation {
  animation: float 3s ease-in-out infinite;
}

/* Fade in animation */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in-up {
  animation: fadeInUp $transition-slow forwards;
}

/* Pulse glow animation */
@keyframes pulseGlow {
  0%, 100% {
    box-shadow: $shadow-glow;
  }
  50% {
    box-shadow: 0 0 60rpx rgba(255, 107, 107, 0.5);
  }
}

.pulse-glow {
  animation: pulseGlow 2s ease-in-out infinite;
}

/* Accessibility - Focus states */
view:focus:not(:focus-visible),
text:focus:not(:focus-visible),
button:focus:not(:focus-visible) {
  outline: none;
}

view:focus-visible,
text:focus-visible,
button:focus-visible {
  outline: 2px solid $primary-color;
  outline-offset: 2px;
}

/* Reduced motion support - 小程序不支持 * 通配符，使用具体元素 */
@media (prefers-reduced-motion: reduce) {
  view,
  text,
  button {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Safe area padding helper */
.safe-area-bottom {
  padding-bottom: calc($spacing-lg + env(safe-area-inset-bottom));
}
</style>