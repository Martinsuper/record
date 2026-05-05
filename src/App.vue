<script>
import { useEventStore } from '@/store/event'
import { useEventTypeStore } from '@/store/eventType'
import { useMenuConfigStore } from '@/store/menuConfig'

export default {
  onLaunch() {
    console.log('App Launch')
    // 集中初始化 store 数据
    const eventStore = useEventStore()
    const eventTypeStore = useEventTypeStore()
    const menuConfigStore = useMenuConfigStore()
    eventStore.loadFromStorage()
    eventTypeStore.loadFromStorage()
    menuConfigStore.loadFromStorage()

    // 小程序环境：计算导航栏高度
    // #ifdef MP-WEIXIN
    // 计算导航栏高度（胶囊按钮底部 + 胶囊按钮距状态栏的间距）
    const menuButton = uni.getMenuButtonBoundingClientRect()
    const statusBarHeight = uni.getSystemInfoSync().statusBarHeight
    const mpNavBarHeight = menuButton.bottom + (menuButton.top - statusBarHeight)
    console.log('导航栏高度:', mpNavBarHeight)
    uni.setStorageSync('navBarHeight', mpNavBarHeight)
    // 注意：小程序不支持本地字体文件加载，使用 CSS unicode 方式显示图标（已在全局样式定义）
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