import { nextTick, onMounted, onActivated } from 'vue';

/**
 * 在 onMounted 和 onActivated 时执行的钩子函数。
 * 首次挂载时立即执行，keep-alive 重新激活时仅在已挂载后才执行，避免重复触发。
 * @param hook - 要执行的回调函数
 */
export function onMountedOrActivated(hook: Fn) {
  let mounted: boolean;

  onMounted(() => {
    hook();
    nextTick(() => {
      mounted = true;
    });
  });

  onActivated(() => {
    if (mounted) {
      hook();
    }
  });
}
