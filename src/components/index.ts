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

export const VxeContainer = withInstall(vxeContainer);
export const StatusPop = withInstall(statusPop);
export const ComboBox = withInstall(comboBox);
export const ModalBox = withInstall(modalBox);
export const PageContainer = withInstall(pageContainer);
export const QueryFilterContainer = withInstall(queryFilterContainer);
export const OverflowTooltip = withInstall(overflowTooltip);

