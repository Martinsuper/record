<template>
  <view class="settings-page">
    <SyncSettingsPanel @showSyncDialog="openSyncDialog" />
    <SyncCodeDialog ref="syncDialog" />
    <CustomTabBar />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SyncSettingsPanel from '@/components/SyncSettingsPanel.vue'
import SyncCodeDialog from '@/components/SyncCodeDialog.vue'
import CustomTabBar from '@/components/CustomTabBar.vue'

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