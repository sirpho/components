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
  /** 超出多少行显示省略号，默认 1 行 */
  overflowLine?: number;
  /** Tooltip 显示的标题文本 */
  title?: string;
}
const props = withDefaults(defineProps<Props>(), {
  overflowLine: 1,
  title: undefined,
});

/**
 * Tooltip 显示状态控制：undefined 表示由组件自动管理（有溢出时显示），false 强制隐藏
 */
const visible = ref<boolean | undefined>(false);

/**
 * 合并后的 Tooltip 属性：将组件 props 透传，同时用 visible 控制 display 状态
 */
const bindProps = computed(() => ({
  ...props,
  // visible将作废
  open: visible.value,
  visible: visible.value,
}));

/**
 * 鼠标移入单元格事件：通过 Range 测量文本实际渲染尺寸与容器尺寸对比，
 * 判断是否存在文本溢出（横向或纵向），自动决定是否显示 Tooltip
 * @param event - 鼠标移入事件对象
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

/**
 * 生成多行文本溢出省略的 CSS 样式对象
 */
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
