import { ref, Ref } from 'vue';
import { debounce } from 'lodash-es';
import { useWindowSizeFn } from './useWindowSizeFn';
import { onMountedOrActivated } from './onMountedOrActivated';

interface IUseCalcHeight {
  height: Ref;
  calcHeight: Function;
}

/**
 * 根据目标元素到页面顶部的距离，动态计算可用高度（视口高度 - 元素顶部距离 - 8px 余量）。
 * 同时监听 window resize 事件，窗口大小变化时自动重新计算。
 * @param elementId - 目标 DOM 元素的 ID
 * @param minHeight - 最小高度限制，计算结果小于此值时取该值，默认 100
 * @returns 包含响应式高度 ref 和手动触发计算的方法
 */
export default function useCalcHeight(elementId: string, minHeight = 100): IUseCalcHeight {
  const height = ref<number>(300);

  const calcHeight = () => {
    const content = document.getElementById(elementId) as HTMLElement;
    const clientHeight = document.body.clientHeight;
    // The distance from the table content to the top
    let contentTop = 0;
    if (!content) {
      console.warn('vxe ext core useCalcHeight DOM is null');
      return;
    }
    contentTop = content.getBoundingClientRect().top;
    const h = clientHeight - contentTop - 8;
    height.value = h < minHeight ? minHeight : h;
  };

  useWindowSizeFn(debounce(calcHeight, 300) as any);

  onMountedOrActivated(() => {
    calcHeight();
  });
  return { height, calcHeight };
}
