<script>
export default {
  onLaunch() {
    console.log('App Launch')
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