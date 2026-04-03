<template>
  <view class="settings-page">
    <SyncSettingsPanel @showSyncDialog="openSyncDialog" />
    <SyncCodeDialog ref="syncDialog" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SyncSettingsPanel from '@/components/SyncSettingsPanel.vue'
import SyncCodeDialog from '@/components/SyncCodeDialog.vue'

const syncDialog = ref()

function openSyncDialog() {
  syncDialog.value?.open()
}
</script>

<style scoped lang="scss">
.settings-page {
  padding: 20rpx;
}
</style>