<template>
  <view class="event-list">
    <!-- Empty state -->
    <u-empty v-if="filteredEvents.length === 0" text="暂无事件记录" mode="list" />

    <!-- Event cards with swipe action -->
    <u-swipe-action
      v-for="event in filteredEvents"
      :key="event.id"
      :options="swipeOptions"
      @click="handleSwipeClick($event, event.id)"
    >
      <view class="event-card">
        <view class="event-header">
          <view class="type-tag" :style="{ backgroundColor: getTypeColor(event.typeId) }">
            {{ getTypeName(event.typeId) }}
          </view>
          <text class="event-name">{{ event.name }}</text>
        </view>
        <view class="event-time">{{ formatTime(event.time) }}</view>
      </view>
    </u-swipe-action>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { useEventStore } from '@/store/event'
import { useEventTypeStore } from '@/store/eventType'
import { formatTime } from '@/utils/time'

const eventStore = useEventStore()
const eventTypeStore = useEventTypeStore()

const filteredEvents = computed(() => eventStore.filteredEvents)

// Get type name and color from store
const getTypeName = (typeId: string) => eventTypeStore.getTypeName(typeId)
const getTypeColor = (typeId: string) => eventTypeStore.getTypeColor(typeId)

// Swipe action options
const swipeOptions = [
  {
    text: '删除',
    style: {
      backgroundColor: '#f56c6c'
    }
  }
]

// Handle swipe delete with confirmation
const handleSwipeClick = (index: number, eventId: string) => {
  if (index === 0) {
    uni.showModal({
      title: '确认删除',
      content: '确定要删除这个事件吗？',
      success: (res) => {
        if (res.confirm) {
          eventStore.deleteEvent(eventId)
        }
      }
    })
  }
}
</script>

<style lang="scss" scoped>
.event-list {
  padding: 16px;
}

.event-card {
  background-color: #f8f8f8;
  border-radius: 8px;
  padding: 12px 16px;
}

.event-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.type-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  color: #ffffff;
  margin-right: 8px;
}

.event-name {
  font-size: 16px;
  font-weight: 500;
  color: #333333;
}

.event-time {
  font-size: 14px;
  color: #999999;
}
</style>