<template>
  <div data-component-name="sirpho-page-container" class="sirpho-page-container">
    <slot></slot>
  </div>
</template>
<script lang="ts">
  export default {
    name: 'PageContainer',
  };
</script>
<style lang="less">
  .sirpho-page-container {
    padding: 0.5rem;
  }
</style>
