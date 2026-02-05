import { tryOnMounted, tryOnUnmounted, useDebounceFn } from '@vueuse/core';

interface WindowSizeOptions {
  once?: boolean;
  immediate?: boolean;
  listenerOptions?: AddEventListenerOptions | boolean;
}

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
