<template>
  <div data-component-name="sirpho-page-container" class="sirpho-page-container">
    <slot></slot>
  </div>
</template>
<script lang="ts">
/**
 * PageContainer：通用页面容器组件，为子内容提供统一的页面内边距样式。
 * 用于包裹页面主体区域，确保各页面保持一致的间距风格。
 */
export default {
  name: 'PageContainer',
};
</script>
<style lang="less">
  .sirpho-page-container {
    padding: 0.5rem;
  }
</style>
