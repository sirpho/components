<template>
  <div class="sirpho-overflow-tooltip" @mouseenter="handleMouseEnter">
    <Tooltip v-bind="bindProps">
      <div class="sirpho-overflow-tooltip__cell" :style="ellipsisStyle">
        <slot></slot>
      </div>
    </Tooltip>
  </div>
</template>
<script lang="ts" setup>
import { computed, CSSProperties, ref, ComputedRef } from 'vue';
import { Tooltip } from 'ant-design-vue';
import type { TooltipProps } from 'ant-design-vue';
import { getPadding } from '../../utils';

interface Props extends TooltipProps {
  overflowLine?: number;
  title?: string;
}
const props = withDefaults(defineProps<Props>(), {
  overflowLine: 1,
  title: undefined,
});

/**
 * 打开
 */
const visible = ref<boolean | undefined>(false);

const bindProps = computed(() => ({
  ...props,
  // visible将作废
  open: visible.value,
  visible: visible.value,
}));

/**
 * 鼠标移入单元格
 * @param event
 */
const handleMouseEnter = (event: MouseEvent) => {
  // 判断是否text-overflow, 如果是就显示tooltip
  const cellChild = (event.target as HTMLElement).querySelector(
    '.sirpho-overflow-tooltip__cell',
  ) as HTMLElement;
  if (!cellChild.childNodes.length) {
    visible.value = false;
    return;
  }
  const range = document.createRange();
  range.setStart(cellChild, 0);
  range.setEnd(cellChild, cellChild.childNodes.length);
  const rangeWidth = Math.round(range.getBoundingClientRect().width);
  const rangeHeight = Math.round(range.getBoundingClientRect().height);
  const { top, left, right, bottom } = getPadding(cellChild);
  const horizontalPadding = left + right;
  const verticalPadding = top + bottom;
  visible.value =
    rangeWidth + horizontalPadding > cellChild.offsetWidth ||
    rangeHeight + verticalPadding > cellChild.offsetHeight ||
    cellChild.scrollWidth > cellChild.offsetWidth
      ? undefined
      : false;
};

const ellipsisStyle: ComputedRef<CSSProperties> = computed(() => ({
  wordBreak: 'break-all',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  '-webkit-box-orient': 'vertical',
  '-webkit-line-clamp': props.overflowLine /* 这里是超出几行省略 */,
  overflow: 'hidden',
  width: '100%',
}));
</script>
<style scoped>
.sirpho-overflow-tooltip {
  width: 100%;
}
</style>
