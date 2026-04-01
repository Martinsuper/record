<template>
  <view class="page-anniversary" :style="{ '--nav-bar-height': navBarHeight + 'px' }">
    <!-- Gradient header -->
    <view class="header">
      <view class="header-bg"></view>
      <view class="header-content glass-card">
        <text class="fa-solid">&#xf004;</text>
        <view class="header-text">
          <text class="header-title">纪念日</text>
          <text class="header-subtitle">记录重要时刻</text>
        </view>
      </view>
    </view>

    <!-- Anniversary list -->
    <view class="list-section">
      <view v-if="anniversaries.length === 0" class="empty-state">
        <text class="fa-solid">&#xf004;</text>
        <text class="empty-text">还没有纪念日</text>
        <text class="empty-hint">点击右下角按钮添加</text>
      </view>

      <view v-else class="anniversary-list">
        <AnniversaryCard
          v-for="item in anniversaries"
          :key="item.id"
          :id="item.id"
          :name="item.name"
          :date="item.date"
          :repeatType="item.repeatType"
          @click="onCardClick"
        />
      </view>
    </view>

    <!-- Floating add button -->
    <view class="add-btn pulse-glow" @click="showForm = true">
      <text class="fa-solid">&#xf067;</text>
    </view>

    <!-- Anniversary form popup -->
    <AnniversaryForm
      :visible="showForm"
      @close="showForm = false"
      @save="onFormSaved"
    />

    <!-- Edit form popup -->
    <AnniversaryForm
      :visible="showEditForm"
      :isEditMode="true"
      :editData="editingAnniversary"
      @close="showEditForm = false"
      @save="onFormSaved"
    />

    <!-- Custom TabBar -->
    <CustomTabBar />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAnniversaryStore } from '@/store/anniversary'
import AnniversaryCard from '@/components/AnniversaryCard.vue'
import AnniversaryForm from '@/components/AnniversaryForm.vue'
import CustomTabBar from '@/components/CustomTabBar.vue'

const anniversaryStore = useAnniversaryStore()

// 动态计算导航栏高度
const navBarHeight = computed(() => {
  const height = uni.getStorageSync('navBarHeight')
  return height || 88
})

// 纪念日列表
const anniversaries = computed(() => anniversaryStore.sortedAnniversaries)

// 表单状态
const showForm = ref(false)
const showEditForm = ref(false)
const editingAnniversary = ref<{ id: string; name: string; date: number; repeatType: 'none' | 'year' | 'month' | 'week' | 'day' } | null>(null)

// 加载数据
onMounted(() => {
  anniversaryStore.loadFromStorage()
})

function onCardClick(id: string) {
  const anniversary = anniversaryStore.getAnniversaryById(id)
  if (anniversary) {
    editingAnniversary.value = {
      id: anniversary.id,
      name: anniversary.name,
      date: anniversary.date,
      repeatType: anniversary.repeatType
    }
    showEditForm.value = true
  }
}

function onFormSaved() {
  showForm.value = false
  showEditForm.value = false
  editingAnniversary.value = null
}
</script>

<style lang="scss" scoped>
.page-anniversary {
  min-height: 100vh;
  padding-bottom: calc(100rpx + env(safe-area-inset-bottom) + $spacing-lg);

  .header {
    position: relative;
    padding: $spacing-xl $spacing-md;
    /* #ifdef MP */
    padding-top: calc(var(--nav-bar-height) + $spacing-xl);
    /* #endif */
    /* #ifdef H5 */
    padding-top: $spacing-xl;
    /* #endif */

    .header-bg {
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      height: calc(var(--nav-bar-height) + 200rpx);
      background: $gradient-warm;
      opacity: 0.15;
      border-radius: 0 0 $radius-xl $radius-xl;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: $spacing-md;
      padding: $spacing-lg;

      .fa-solid {
        font-size: 36rpx;
        color: $accent-rose;
      }

      .header-text {
        flex: 1;

        .header-title {
          font-size: 40rpx;
          font-weight: 700;
          color: $text-primary;
          display: block;
        }

        .header-subtitle {
          font-size: 24rpx;
          color: $text-secondary;
          margin-top: $spacing-xs;
          display: block;
        }
      }
    }
  }

  .list-section {
    padding: $spacing-md;

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 120rpx $spacing-xl;

      .fa-solid {
        font-size: 80rpx;
        color: $text-light;
        margin-bottom: $spacing-lg;
      }

      .empty-text {
        font-size: 32rpx;
        color: $text-secondary;
        margin-bottom: $spacing-sm;
      }

      .empty-hint {
        font-size: 26rpx;
        color: $text-muted;
      }
    }

    .anniversary-list {
      // List styles if needed
    }
  }

  .add-btn {
    position: fixed;
    right: $spacing-xl;
    bottom: calc(100rpx + env(safe-area-inset-bottom) + $spacing-xl);
    width: 120rpx;
    height: 120rpx;
    border-radius: $radius-full;
    background: $gradient-warm;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8rpx 32rpx rgba(249, 115, 22, 0.4);
    transition: all $transition-normal;
    z-index: 1000;

    .fa-solid {
      font-size: 44rpx;
      color: #ffffff;
    }

    &:active {
      transform: scale(0.92);
      box-shadow: 0 0 30rpx rgba(249, 115, 22, 0.5);
    }
  }
}
</style>
