<template>
  <view class="page-index" :style="{ '--nav-bar-height': navBarHeight + 'px' }">
    <!-- Glassmorphism Header -->
    <view class="header glass-card">
      <view class="header-content">
        <view class="header-icon-wrap">
          <FaIcon name="sparkles" size="36rpx" />
        </view>
        <view class="header-text">
          <text class="header-title gradient-text">记录时光</text>
          <text class="header-subtitle">捕捉每一个精彩瞬间</text>
        </view>
      </view>
      <view class="header-decoration">
        <view class="deco-circle c1"></view>
        <view class="deco-circle c2"></view>
        <view class="deco-circle c3"></view>
      </view>
      <!-- Type management entry -->
      <view class="type-manage-btn" @click="showTypeManager = true">
        <view class="btn-icon-bg">
          <FaIcon name="tag" size="38rpx" />
        </view>
        <text class="btn-text">管理类型</text>
      </view>
    </view>

    <!-- Anniversary Reminder -->
    <AnniversaryReminder
      :visible="showReminder"
      :upcomingList="upcomingAnniversaries"
      @close="onReminderClose"
      @navigate="onReminderNavigate"
    />

    <!-- Filter bar -->
    <view class="filter-section">
      <FilterBar />
    </view>

    <!-- Event list -->
    <view class="list-section">
      <EventList ref="eventListRef" @edit="onEditEvent" @loadMore="onLoadMore" />
    </view>

    <!-- Floating gradient add button -->
    <view class="add-btn pulse-glow" @click="showEventForm = true">
      <FaIcon name="plus" size="44rpx" />
    </view>

    <!-- Event form popup -->
    <EventForm
      :visible="showEventForm"
      @close="showEventForm = false"
      @save="onEventSaved"
    />

    <!-- Edit event form popup -->
    <EventForm
      :visible="showEditForm"
      :isEditMode="true"
      :editData="editingEvent"
      @close="showEditForm = false"
      @save="onEventSaved"
    />

    <!-- Custom TabBar -->
    <CustomTabBar />

    <!-- Type Manager Popup -->
    <u-popup :show="showTypeManager" mode="bottom" round="24" @close="showTypeManager = false">
      <TypeManager @close="showTypeManager = false" />
    </u-popup>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { useEventStore } from '@/store/event'
import { useEventTypeStore } from '@/store/eventType'
import { useAnniversaryStore } from '@/store/anniversary'
import { useMenuConfigStore } from '@/store/menuConfig'
import { getUpcomingAnniversaries } from '@/utils/anniversary'
import { useNavBarHeight } from '@/utils/useNavBarHeight'
import FilterBar from '@/components/FilterBar.vue'
import EventList from '@/components/EventList.vue'
import EventForm from '@/components/EventForm.vue'
import CustomTabBar from '@/components/CustomTabBar.vue'
import TypeManager from '@/components/TypeManager.vue'
import AnniversaryReminder from '@/components/AnniversaryReminder.vue'
import FaIcon from '@/components/FaIcon.vue'

const eventStore = useEventStore()
const eventTypeStore = useEventTypeStore()
const anniversaryStore = useAnniversaryStore()
const menuConfigStore = useMenuConfigStore()

// 首次启动检测：跳转到第一个启用的 Tab 菜单
onMounted(() => {
  let isFirstLaunch: boolean | string = ''
  try {
    isFirstLaunch = uni.getStorageSync('firstLaunch')
  } catch (e) {
    console.error('getStorageSync error:', e)
  }

  if (isFirstLaunch === '' || isFirstLaunch === true || isFirstLaunch === 'true') {
    try {
      uni.setStorageSync('firstLaunch', false)
    } catch (e) {
      console.error('setStorageSync error:', e)
    }

    const firstTab = menuConfigStore.firstEnabledTab
    const currentPath = '/pages/index/index'

    if (firstTab && firstTab.path && firstTab.path !== currentPath) {
      uni.reLaunch({ url: firstTab.path })
    }
  }
})

// 即将到来的纪念日列表
const upcomingAnniversaries = computed(() => {
  return getUpcomingAnniversaries(anniversaryStore.anniversaries, 3)
})

const showReminder = ref(true)

// 导航栏高度
const { navBarHeight } = useNavBarHeight()

const eventListRef = ref<InstanceType<typeof EventList> | null>(null)

const showEventForm = ref(false)
const showEditForm = ref(false)
const showTypeManager = ref(false)
const editingEvent = ref<{ id: string; name: string; typeId: string; time: number } | null>(null)

// 页面下拉刷新
onPullDownRefresh(() => {
  eventStore.resetPagination()
  eventStore.refresh()
  setTimeout(() => {
    uni.stopPullDownRefresh()
  }, 300)
})

// 页面上拉加载更多
onReachBottom(() => {
  if (eventStore.hasMoreEvents) {
    eventStore.loadMore()
  }
})

function onEventSaved() {
  showEventForm.value = false
  showEditForm.value = false
  editingEvent.value = null
}

function onEditEvent(event: { id: string; name: string; typeId: string; time: number }) {
  editingEvent.value = event
  showEditForm.value = true
}

function onReminderClose() {
  showReminder.value = false
}

function onReminderNavigate(_id: string) {
  showReminder.value = false
  uni.switchTab({ url: '/pages/anniversary/anniversary' })
}

function onLoadMore() {
  eventStore.loadMore()
}
</script>

<style lang="scss" scoped>
.page-index {
  min-height: 100vh;
  padding-bottom: calc(140rpx + env(safe-area-inset-bottom) + $spacing-xl);

  .header {
    margin: $spacing-lg $spacing-md;
    /* #ifdef MP */
    margin-top: calc(var(--nav-bar-height) + $spacing-lg);
    /* #endif */
    /* #ifdef H5 */
    margin-top: $spacing-lg;
    /* #endif */
    padding: $spacing-xl $spacing-lg;
    position: relative;
    overflow: hidden;

    .type-manage-btn {
      position: absolute;
      right: $spacing-md;
      top: $spacing-lg;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6rpx;
      padding: $spacing-sm;
      z-index: 10;

      .btn-icon-bg {
        width: 88rpx;
        height: 88rpx;
        border-radius: $radius-lg;
        background: $gradient-primary;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8rpx 24rpx rgba(99, 102, 241, 0.35);
      }

      .btn-text {
        font-size: 24rpx;
        color: $text-primary;
        font-weight: 600;
        white-space: nowrap;
      }

      &:active {
        .btn-icon-bg {
          transform: scale(0.92);
        }
      }
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: $spacing-md;

      .header-icon-wrap {
        width: 80rpx;
        height: 80rpx;
        border-radius: $radius-lg;
        background: $gradient-warm;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8rpx 24rpx rgba(249, 115, 22, 0.3);
      }

      .header-text {
        flex: 1;

        .header-title {
          font-size: 44rpx;
          font-weight: 700;
          letter-spacing: 2rpx;
          display: block;
        }

        .header-subtitle {
          font-size: 24rpx;
          color: $text-secondary;
          margin-top: $spacing-xs;
        }
      }
    }

    .header-decoration {
      position: absolute;
      right: -40rpx;
      top: -40rpx;

      .deco-circle {
        position: absolute;
        border-radius: 50%;
        opacity: 0.4;

        &.c1 {
          width: 120rpx;
          height: 120rpx;
          background: $gradient-sunset;
          right: 40rpx;
          top: 40rpx;
        }

        &.c2 {
          width: 80rpx;
          height: 80rpx;
          background: $gradient-cool;
          right: 100rpx;
          top: 80rpx;
        }

        &.c3 {
          width: 60rpx;
          height: 60rpx;
          background: $gradient-aurora;
          right: 60rpx;
          top: 120rpx;
        }
      }
    }
  }

  .filter-section {
    padding: $spacing-sm $spacing-md;
  }

  .list-section {
    padding: $spacing-md;
  }

  .add-btn {
    position: fixed;
    right: $spacing-xl;
    bottom: calc(140rpx + env(safe-area-inset-bottom) + $spacing-xl);
    width: 120rpx;
    height: 120rpx;
    border-radius: $radius-full;
    background: $gradient-primary;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: $shadow-glow;
    transition: all $transition-normal;
    z-index: 1000;

    &:active {
      transform: scale(0.92);
      box-shadow: 0 0 30rpx rgba(255, 107, 107, 0.4);
    }
  }
}
</style>