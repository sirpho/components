<template>
  <div data-component-name="sirpho-query-filter-container" class="sirpho-query-filter-container">
    <slot></slot>
  </div>
</template>
<script lang="ts">
/**
 * QueryFilterContainer：查询条件容器组件，为搜索/筛选表单区域提供统一的底部间距和背景样式。
 * 通常包含多个表单项（Form.Item），组件自动调整内部表单的间距和标签高度。
 */
export default {
  name: 'QueryFilterContainer',
};
</script>
<style lang="less" scoped>
  .sirpho-query-filter-container {
    margin-bottom: 0.5rem;
    padding: 0.5rem 0.5rem 0;
    background-color: #fff;
  }

  .sirpho-query-filter-container ::v-deep(.ant-form-inline .ant-form-item) {
    margin-bottom: 8px;
  }

  .sirpho-query-filter-container ::v-deep(.ant-form-item-label > label) {
    height: 24px;
  }

  .sirpho-query-filter-container ::v-deep(.ant-form-item-control-input) {
    min-height: unset;
  }
</style>
