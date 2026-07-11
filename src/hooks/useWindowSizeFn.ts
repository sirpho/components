import { tryOnMounted, tryOnUnmounted, useDebounceFn } from '@vueuse/core';

interface WindowSizeOptions {
  once?: boolean;
  immediate?: boolean;
  listenerOptions?: AddEventListenerOptions | boolean;
}

/**
 * 监听 window resize 事件的钩子函数，支持防抖处理。
 * 组件挂载时自动开始监听，卸载时自动移除监听。
 * @param fn - resize 触发时执行的回调函数
 * @param wait - 防抖延迟时间（毫秒），默认 150ms
 * @param options - 可选配置项（once/immediate/listenerOptions）
 * @returns 包含 start 和 stop 方法的元组，用于手动控制监听的启停
 */
export function useWindowSizeFn<T>(
  fn: Fn<T>,
  wait = 150,
  options?: WindowSizeOptions,
) {
  let handler = () => {
    fn();
  };
  const debounceHandler = useDebounceFn(handler, wait);

  const start = () => {
    if (options && options.immediate) {
      debounceHandler().then();
    }
    window.addEventListener('resize', debounceHandler);
  };

  const stop = () => {
    window.removeEventListener('resize', debounceHandler);
  };

  tryOnMounted(() => {
    start();
  });

  tryOnUnmounted(() => {
    stop();
  });
  return [start, stop];
}
