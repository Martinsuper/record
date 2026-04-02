<template>
  <u-popup :show="visible" mode="bottom" round="24" @close="onClose">
    <view class="category-picker glass-card">
      <!-- Header -->
      <view class="picker-header">
        <text class="picker-title">选择分类</text>
        <view class="close-btn" @click="onClose">
          <text class="fa-solid">&#xf00d;</text>
        </view>
      </view>

      <!-- Preset categories -->
      <view class="category-section">
        <text class="section-label">预设分类</text>
        <view class="category-grid">
          <view
            v-for="category in presetCategories"
            :key="category.id"
            class="category-item"
            :class="{ active: selectedId === category.id }"
            @click="onSelect(category.id)"
          >
            <text class="fa-solid">{{ category.icon }}</text>
            <text class="category-name">{{ category.name }}</text>
          </view>
        </view>
      </view>

      <!-- Custom categories -->
      <view class="category-section">
        <text class="section-label">自定义分类</text>
        <view v-if="customCategories.length === 0" class="empty-tip">
          <text>无自定义分类</text>
        </view>
        <view v-else class="category-grid">
          <view
            v-for="category in customCategories"
            :key="category.id"
            class="category-item"
            :class="{ active: selectedId === category.id }"
            @click="onSelect(category.id)"
          >
            <text class="fa-solid">{{ category.icon }}</text>
            <text class="category-name">{{ category.name }}</text>
          </view>
        </view>
      </view>

      <!-- Add button -->
      <view class="add-btn" @click="showCategoryForm = true">
        <text class="fa-solid">&#xf067;</text>
        <text>新建分类</text>
      </view>
    </view>

    <!-- Category form popup -->
    <AnniversaryCategoryForm
      :visible="showCategoryForm"
      @close="showCategoryForm = false"
      @save="onCategoryAdded"
    />
  </u-popup>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAnniversaryCategoryStore } from '@/store/anniversaryCategory'
import AnniversaryCategoryForm from './AnniversaryCategoryForm.vue'

const props = defineProps<{
  visible: boolean
  selectedId: string
}>()

const emit = defineEmits<{
  close: []
  select: [id: string]
}>()

const categoryStore = useAnniversaryCategoryStore()
const showCategoryForm = ref(false)

const presetCategories = computed(() => categoryStore.presetCategories)
const customCategories = computed(() => categoryStore.customCategories)

watch(() => props.visible, (val) => {
  if (!val) {
    showCategoryForm.value = false
  }
})

function onClose() {
  emit('close')
}

function onSelect(id: string) {
  emit('select', id)
  emit('close')
}

function onCategoryAdded(id: string) {
  showCategoryForm.value = false
  // 自动选中新创建的分类
  emit('select', id)
  emit('close')
}
</script>

<style lang="scss" scoped>
.category-picker {
  border-radius: $radius-xl $radius-xl 0 0;
  padding: $spacing-lg;
  padding-bottom: calc($spacing-lg + env(safe-area-inset-bottom));

  .picker-header {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: $spacing-lg;
    position: relative;

    .picker-title {
      font-size: 32rpx;
      font-weight: 600;
      color: $text-primary;
    }

    .close-btn {
      position: absolute;
      right: 0;
      width: 48rpx;
      height: 48rpx;
      border-radius: $radius-full;
      background: rgba(99, 102, 241, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;

      .fa-solid {
        font-size: 16rpx;
        color: $text-secondary;
      }
    }
  }

  .category-section {
    margin-bottom: $spacing-lg;

    .section-label {
      font-size: 24rpx;
      color: $text-muted;
      margin-bottom: $spacing-sm;
      display: block;
    }

    .empty-tip {
      padding: $spacing-md;
      text-align: center;

      text {
        font-size: 26rpx;
        color: $text-light;
      }
    }

    .category-grid {
      display: flex;
      flex-wrap: wrap;
      gap: $spacing-sm;

      .category-item {
        width: calc(25% - 12rpx);
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: $spacing-md 0;
        border-radius: $radius-lg;
        background: rgba(99, 102, 241, 0.05);
        border: 1px solid rgba(99, 102, 241, 0.1);
        transition: all $transition-fast;

        .fa-solid {
          font-size: 32rpx;
          color: $accent-indigo;
          margin-bottom: $spacing-xs;
        }

        .category-name {
          font-size: 24rpx;
          color: $text-secondary;
        }

        &.active {
          background: $gradient-cool;
          border-color: transparent;

          .fa-solid,
          .category-name {
            color: #ffffff;
          }
        }

        &:active {
          transform: scale(0.96);
        }
      }
    }
  }

  .add-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-sm;
    padding: $spacing-md;
    border-radius: $radius-lg;
    border: 1px dashed rgba(99, 102, 241, 0.3);

    .fa-solid {
      font-size: 24rpx;
      color: $accent-indigo;
    }

    text {
      font-size: 28rpx;
      color: $accent-indigo;
    }

    &:active {
      background: rgba(99, 102, 241, 0.05);
    }
  }
}
</style>