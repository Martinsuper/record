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
   Design System: Minimal Flat Design
   ======================================== */

/* Import design system variables */
@import '@/uni.scss';

/* Page base styles */
page {
  background-color: $bg-color;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Global text styles */
text {
  color: $text-main;
}

/* Global button styles */
button {
  border-radius: $radius-btn;
  transition: all 0.2s ease;
}

/* Smooth transitions for interactive elements */
.button, .clickable {
  transition: transform 0.15s ease, opacity 0.15s ease;

  &:active {
    transform: scale(0.98);
    opacity: 0.9;
  }
}

/* Card styles */
.card {
  background: $bg-white;
  border-radius: $radius-card;
  box-shadow: $shadow-sm;
}

/* Typography */
.title {
  font-weight: 700;
  color: $text-main;
}

.subtitle {
  font-weight: 500;
  color: $text-secondary;
}

.caption {
  font-size: 24rpx;
  color: $text-muted;
}

/* Accessibility - Focus states */
*:focus {
  outline: 2rpx solid $primary-color;
  outline-offset: 2rpx;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>