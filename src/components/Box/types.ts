import type { VxeGridInstance, VxePulldownInstance } from 'vxe-table';

/** HTTP 请求实例接口，需实现 get 和 post 方法 */
export interface HttpInstance {
  get: (config: { url: string; params?: Record<string, any> }) => Promise<any>;
  post: (config: { url: string; data?: Record<string, any> }) => Promise<any>;
}

/** ComboBox / ModalBox variant 映射表：key 为 variant 名称，value 为接口配置 */
export type VariantMap = Record<string, { url: string; method: 'get' | 'post' }>;

/** 筛选触发时机：挂载时 / 聚焦时 / 参数变化时 */
export type RequestTrigger = 'onMount' | 'onFocus' | 'onParamsChange';

/** 选择后值变化的行为类型：自动填充 / 清空 / 不变 */
export type ChangeAction = 'autoFill' | 'clear' | 'noChange';

/** SelectCommonContext 工厂函数的入参 */
export interface SelectCommonContextArgs {
  /** 组件 props */
  props: any;
  /** 组件 emit 函数 */
  emit: any;
  /** vxe-grid 实例引用 */
  xTable: { value: VxeGridInstance };
  /** vxe-pulldown 实例引用（ComboBox 使用） */
  pullDownRef?: { value: VxePulldownInstance };
  /** 是否为弹窗模式（ModalBox 传 true） */
  isModal?: boolean;
}
