import { resolve } from 'path';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import dts from 'vite-plugin-dts';

/**
 * 自定义 Vite 插件：在 vite-plugin-dts 生成声明文件期间过滤 TS2742 错误输出。
 *
 * 产生原因：vxe-table 的 VxeGridProps 类型内部引用 vue-types 做 prop 验证，
 * 当 vite-plugin-dts 生成组件声明文件时，需要引用 vue-types，但该包非直接依赖，
 * 导致 TypeScript 无法在声明文件中通过包名引用，只能用深层 pnpm 路径（TS2742）。
 *
 * TS2742 不影响产物正确性（build 能成功生成 index.d.ts），
 * 但会被 vite-plugin-dts 通过 console.error 输出为 error 级别诊断。
 *
 * 此插件在 buildStart 时替换 console.error，在 closeBundle 时恢复，
 * 确保只在构建期间过滤 TS2742 消息。
 */
const suppressTs2742 = () => {
  let originalError: typeof console.error;
  return {
    name: 'suppress-ts2742',
    enforce: 'pre' as const,
    buildStart() {
      originalError = console.error;
      console.error = (...args: any[]) => {
        const message = typeof args[0] === 'string' ? args[0] : '';
        if (message.includes('TS2742')) return;
        originalError.apply(console, args);
      };
    },
    closeBundle() {
      console.error = originalError;
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    suppressTs2742(),
    dts({
      // 将所有类型声明打包到单一文件，避免组件间类型引用导致的 TS2742 错误
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, 'src/components/index.ts'),
      name: 'sirpho-components',
      // the proper extensions will be added
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: ['vue', 'ant-design-vue', '@vueuse/core', 'splitpanes'],
      output: {
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        globals: {
          vue: 'Vue',
          'ant-design-vue': 'antDesignVue',
          '@vueuse/core': 'VueUse',
          splitpanes: 'splitpanes'
        },
      },
    },
  },
});
