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
/* 全局样式 */
@import '@/uni.scss';

/* 页面基础样式 */
page {
  background-color: $bg-color;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 全局文本样式 */
text {
  color: $text-main;
}

/* 全局按钮样式 */
button {
  border-radius: $radius-btn;
}
</style>
