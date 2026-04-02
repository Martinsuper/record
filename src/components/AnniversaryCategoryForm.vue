<template>
  <u-popup :show="visible" mode="bottom" round="24" @close="onClose">
    <view class="category-form glass-card">
      <!-- Header -->
      <view class="form-header">
        <text class="form-title">新建分类</text>
        <view class="close-btn" @click="onClose">
          <text class="fa-solid">&#xf00d;</text>
        </view>
      </view>

      <!-- Form body -->
      <view class="form-body">
        <!-- Name -->
        <view class="form-item">
          <view class="form-label">
            <text>分类名称</text>
          </view>
          <view class="input-wrapper">
            <u-input
              v-model="categoryName"
              placeholder="请输入分类名称"
              border="none"
              :customStyle="{ fontSize: '32rpx', color: '#1E1B4B' }"
              :placeholderStyle="{ color: '#9CA3AF' }"
            />
          </view>
        </view>

        <!-- Icon -->
        <view class="form-item">
          <view class="form-label">
            <text>选择图标</text>
          </view>
          <view class="icon-grid">
            <view
              v-for="icon in availableIcons"
              :key="icon.code"
              class="icon-item"
              :class="{ active: selectedIcon === icon.code }"
              @click="selectedIcon = icon.code"
            >
              <text class="fa-solid">{{ icon.code }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- Footer -->
      <view class="form-footer">
        <view class="btn-cancel" @click="onClose">
          <text>取消</text>
        </view>
        <view class="btn-save" @click="onSave">
          <text>保存</text>
        </view>
      </view>
    </view>
  </u-popup>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAnniversaryCategoryStore } from '@/store/anniversaryCategory'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [id: string]
}>()

const categoryStore = useAnniversaryCategoryStore()

const categoryName = ref('')
const selectedIcon = ref('\uf02d') // 默认书签图标

// 可选图标列表
const availableIcons = [
  { code: '\uf1fd', name: '生日蛋糕' },
  { code: '\uf004', name: '心形' },
  { code: '\uf802', name: '戒指' },
  { code: '\uf56b', name: '庆祝' },
  { code: '\uf0b1', name: '公文包' },
  { code: '\uf073', name: '日历' },
  { code: '\uf4e3', name: '心形确认' },
  { code: '\uf02d', name: '书签' },
  { code: '\uf005', name: '星星' },
  { code: '\uf0f3', name: '铃铛' },
  { code: '\uf06b', name: '礼物' },
  { code: '\uf015', name: '房子' }
]

// Reset form when visible changes
watch(() => props.visible, (val) => {
  if (val) {
    categoryName.value = ''
    selectedIcon.value = '\uf02d'
  }
})

function onClose() {
  emit('close')
}

function onSave() {
  if (!categoryName.value.trim()) {
    uni.showToast({ title: '请输入分类名称', icon: 'none' })
    return
  }

  const existingCategory = categoryStore.customCategories.find(
    c => c.name === categoryName.value.trim()
  )
  if (existingCategory) {
    uni.showToast({ title: '分类名称已存在', icon: 'none' })
    return
  }

  const newCategory = categoryStore.addCategory({
    name: categoryName.value.trim(),
    icon: selectedIcon.value
  })

  uni.showToast({ title: '分类已创建', icon: 'success' })
  emit('save', newCategory.id)
  emit('close')
}
</script>

<style lang="scss" scoped>
.category-form {
  border-radius: $radius-xl $radius-xl 0 0;
  padding: $spacing-lg;
  padding-bottom: calc($spacing-lg + env(safe-area-inset-bottom));

  .form-header {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: $spacing-xl;
    position: relative;

    .form-title {
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

  .form-body {
    .form-item {
      margin-bottom: $spacing-xl;

      .form-label {
        font-size: 28rpx;
        font-weight: 600;
        color: $text-primary;
        margin-bottom: $spacing-md;
      }

      .input-wrapper {
        background: rgba(99, 102, 241, 0.05);
        border-radius: $radius-lg;
        padding: $spacing-md;
        border: 1px solid rgba(99, 102, 241, 0.1);
      }

      .icon-grid {
        display: flex;
        flex-wrap: wrap;
        gap: $spacing-sm;

        .icon-item {
          width: 72rpx;
          height: 72rpx;
          border-radius: $radius-lg;
          background: rgba(99, 102, 241, 0.05);
          border: 1px solid rgba(99, 102, 241, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all $transition-fast;

          .fa-solid {
            font-size: 28rpx;
            color: $text-secondary;
          }

          &.active {
            background: $gradient-cool;
            border-color: transparent;

            .fa-solid {
              color: #ffffff;
            }
          }

          &:active {
            transform: scale(0.92);
          }
        }
      }
    }
  }

  .form-footer {
    display: flex;
    gap: $spacing-md;

    .btn-cancel {
      flex: 1;
      height: 88rpx;
      border-radius: $radius-lg;
      background: rgba(99, 102, 241, 0.05);
      display: flex;
      align-items: center;
      justify-content: center;

      text {
        font-size: 32rpx;
        font-weight: 600;
        color: $text-secondary;
      }
    }

    .btn-save {
      flex: 1;
      height: 88rpx;
      border-radius: $radius-lg;
      background: $gradient-warm;
      display: flex;
      align-items: center;
      justify-content: center;

      text {
        font-size: 32rpx;
        font-weight: 600;
        color: #ffffff;
      }
    }
  }
}
</style>