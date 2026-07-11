import type { DefineComponent } from 'vue';
import { vxeTableDefaultConfig, registerVariant } from "./Box/config";
import FilterExtend from './FilterExtend/index.vue';
import vxeContainer from './VxeContainer/index.vue';
import statusPop from './StatusPop/index.vue';
import comboBox from './Box/ComboBox.vue';
import modalBox from './Box/ModalBox.vue';
import pageContainer from './PageContainer/index.vue';
import queryFilterContainer from './QueryFilterContainer/index.vue';
import overflowTooltip from './OverflowTooltip/index.vue';

import { withInstall } from '../utils'

export {
  FilterExtend,
  vxeTableDefaultConfig,
  registerVariant
};

/**
 * 以下组件通过 withInstall 包装导出。
 * 由于 VxeGridProps / VxeGridPropTypes 等类型内部引用了 vue-types（通过 vxe-table 链），
 * TypeScript 在生成声明文件时会产生 TS2742 不可移植的深层 pnpm 路径引用。
 * 统一使用 `as unknown as DefineComponent` 切断泛型推断链，避免泄漏内部依赖类型。
 */
export const VxeContainer = withInstall(vxeContainer as unknown as DefineComponent);
export const StatusPop = withInstall(statusPop as unknown as DefineComponent);
export const ComboBox = withInstall(comboBox as unknown as DefineComponent);
export const ModalBox = withInstall(modalBox as unknown as DefineComponent);
export const PageContainer = withInstall(pageContainer as unknown as DefineComponent);
export const QueryFilterContainer = withInstall(queryFilterContainer as unknown as DefineComponent);
export const OverflowTooltip = withInstall(overflowTooltip as unknown as DefineComponent);

