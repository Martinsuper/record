<template>
  <view class="page-index">
    <!-- Filter bar -->
    <FilterBar />

    <!-- Event list -->
    <EventList />

    <!-- Floating add button -->
    <view class="add-btn" @click="showEventForm = true">
      <u-icon name="plus" color="#ffffff" size="24" />
    </view>

    <!-- Event form popup -->
    <EventForm
      :visible="showEventForm"
      @close="showEventForm = false"
      @save="onEventSaved"
    />
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useEventStore } from '@/store/event'
import { useEventTypeStore } from '@/store/eventType'
import FilterBar from '@/components/FilterBar.vue'
import EventList from '@/components/EventList.vue'
import EventForm from '@/components/EventForm.vue'

const eventStore = useEventStore()
const eventTypeStore = useEventTypeStore()

const showEventForm = ref(false)

// Load data on mount
onMounted(() => {
  eventStore.loadFromStorage()
  eventTypeStore.loadFromStorage()
})

function onEventSaved() {
  showEventForm.value = false
}
</script>

<style lang="scss" scoped>
.page-index {
  min-height: 100vh;
  background-color: $bg-color;

  .add-btn {
    position: fixed;
    right: 24px;
    bottom: calc(var(--window-bottom) + 24px);
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background-color: $primary-color;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(41, 121, 255, 0.4);
  }
}
</style>