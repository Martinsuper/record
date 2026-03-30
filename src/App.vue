<script>
import { useEventStore } from '@/store/event'
import { useEventTypeStore } from '@/store/eventType'

// FontAwesome CDN 字体 URL
const FA_FONT_URLS = {
  solid: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-solid-900.ttf',
  regular: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-regular-400.ttf',
  brands: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-brands-400.ttf'
}

export default {
  onLaunch() {
    console.log('App Launch')
    // 集中初始化 store 数据
    const eventStore = useEventStore()
    const eventTypeStore = useEventTypeStore()
    eventStore.loadFromStorage()
    eventTypeStore.loadFromStorage()

    // 小程序环境：使用 wx.loadFontFace 加载网络字体
    // #ifdef MP-WEIXIN
    wx.loadFontFace({
      family: 'Font Awesome 6 Free',
      source: `url("${FA_FONT_URLS.solid}")`,
      weight: '900',
      global: true,
      scopes: ['webview', 'native'],
      success: () => console.log('FontAwesome Solid 加载成功'),
      fail: (err) => console.error('FontAwesome Solid 加载失败', err)
    })
    wx.loadFontFace({
      family: 'Font Awesome 6 Free',
      source: `url("${FA_FONT_URLS.regular}")`,
      weight: '400',
      global: true,
      scopes: ['webview', 'native'],
      success: () => console.log('FontAwesome Regular 加载成功'),
      fail: (err) => console.error('FontAwesome Regular 加载失败', err)
    })
    wx.loadFontFace({
      family: 'Font Awesome 6 Brands',
      source: `url("${FA_FONT_URLS.brands}")`,
      global: true,
      scopes: ['webview', 'native'],
      success: () => console.log('FontAwesome Brands 加载成功'),
      fail: (err) => console.error('FontAwesome Brands 加载失败', err)
    })
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

/* Font Awesome icon styles */
.fa-solid,
.fa-regular,
.fa-brands {
  font-family: 'Font Awesome 6 Free' !important;
  font-weight: 900;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  display: inline-block;
}

.fa-regular {
  font-weight: 400;
}

.fa-brands {
  font-family: 'Font Awesome 6 Brands' !important;
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
view:focus,
text:focus,
button:focus {
  outline: none;
}

/* Reduced motion support */
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