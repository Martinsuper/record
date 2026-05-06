<template>
  <image
    v-if="iconSrc"
    :src="iconSrc"
    :style="{ width: size, height: size }"
    class="icon-image"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  name: string
  size?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: '32rpx'
})

// 图标映射：使用 SVG 图片
const iconMap: Record<string, string> = {
  'times': '/static/icons/times.svg',
  'plus': '/static/icons/plus.svg',
  'check': '/static/icons/check.svg',
  'star': '/static/icons/star.svg',
  'inbox': '/static/icons/inbox.svg',
  'edit': '/static/icons/edit.svg',
  'trash': '/static/icons/trash.svg',
  'ellipsis-v': '/static/icons/ellipsis-v.svg',
  'tag': '/static/icons/tag.svg',
  'tags': '/static/icons/tags.svg',
  'database': '/static/icons/database.svg',
  'upload': '/static/icons/upload.svg',
  'download': '/static/icons/upload.svg',
  'sparkles': '/static/icons/sparkles.svg',
  'layer-group': '/static/icons/layer-group.svg',
  'calendar': '/static/icons/calendar.svg',
  'clock': '/static/icons/clock.svg',
  'heart': '/static/icons/heart.svg',
  'chevron-down': '/static/icons/chevron-down.svg',
  'chevron-up': '/static/icons/chevron-up.svg',
  'chevron-right': '/static/icons/chevron-right.svg',
  'angle-down': '/static/icons/angle-down.svg',
  'eye': '/static/icons/eye.svg',
  'file-export': '/static/icons/file-export.svg',
  'file-import': '/static/icons/file-import.svg',
  'search': '/static/icons/search.svg',
  'cog': '/static/icons/cog.svg',
  'arrow-left': '/static/icons/chevron-right.svg',
  'arrow-right': '/static/icons/chevron-right.svg',
  'magic': '/static/icons/sparkles.svg',
  'undo': '/static/icons/undo.svg',
  'info-circle': '/static/icons/info-circle.svg',
  'grip-vertical': '/static/icons/grip-vertical.svg',
  'trash-restore': '/static/icons/trash.svg',
  'list-check': '/static/icons/list-check.svg',
  'bars': '/static/icons/bars.svg'
}

const iconSrc = computed(() => {
  return iconMap[props.name] || ''
})
</script>

<style lang="scss" scoped>
.icon-image {
  display: inline-block;
  vertical-align: middle;
}
</style>