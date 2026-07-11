import type { HttpInstance, VariantMap } from './types';

/**
 * 全局配置接口
 */
export interface GlobalConfig {
  http: HttpInstance | null;
  variants: VariantMap | null;
  methods: ((params: Record<string, any>) => object) | null;
  env: Record<string, unknown>;
  /** 设置全局配置 */
  setConfig(config: {
    http?: HttpInstance;
    variants?: VariantMap;
    env?: Record<string, unknown>;
    methods?: (params: Record<string, any>) => object;
  }): void;
}

/**
 * 全局配置对象，用于存储 HTTP 实例、环境变量和全局方法。
 * 需在使用 ComboBox 前通过 `registerVariant` 或 `globalConfig.setConfig` 初始化。
 */
export const globalConfig: GlobalConfig = {
  http: null,
  variants: null,
  methods: null, // 存储xTable中的公共方法
  env: {},
  /**
   * 设置全局配置，仅在首次调用时生效
   * @param config - 配置对象，包含 http、variants、env、methods
   */
  setConfig(
    config: {
      http?: HttpInstance;
      variants?: VariantMap;
      env?: Record<string, unknown>;
      methods?: (params: Record<string, any>) => object;
    } = {},
  ) {
    const { http, variants = {}, methods, env } = config;
    this.http = http!;
    this.variants = variants as VariantMap;
    this.methods = methods!;
    this.env = env!;
  },
};

/**
 * Select 组件默认配置接口
 */
export interface SelectDefaultOption {
  inputProps: {
    size: 'small';
    style: { width: string };
  };
  gridProps: {
    autoResize: boolean;
    height: string;
    columns: any[];
  };
}

/** ComboBox 使用的默认配置（input 宽度 100%） */
export const comboBoxDefaultOption: SelectDefaultOption = {
  inputProps: {
    size: 'small',
    style: { width: '100%' },
  },
  gridProps: {
    autoResize: true,
    height: '300',
    columns: [],
  },
};

/** ModalBox 使用的默认配置（input 宽度 160px） */
export const modalBoxDefaultOption: SelectDefaultOption = {
  inputProps: {
    size: 'small',
    style: { width: '160px' },
  },
  gridProps: {
    autoResize: true,
    height: '300',
    columns: [],
  },
};

/**
 * vxe-table 全局默认配置，定义表格的默认行为和样式
 */
export const vxeTableDefaultConfig = {
  size: 'mini',
  table: {
    border: 'full',
    round: false,
    showHeader: true,
    keepSource: false,
    showOverflow: true,
    showHeaderOverflow: 'tooltip',
    showFooterOverflow: true,
    rowConfig: {
      isCurrent: true,
      isHover: true,
    },
    columnConfig: {
      resizable: true,
      minWidth: 110,
      useKey: true,
    },
    resizableConfig: {
      minWidth: 20,
    },
    autoResize: true,
    stripe: true,
    areaConfig: {
      extendByCopy: false,
      extendByCalc: false,
    },
    checkboxConfig: {
      isShiftKey: true,
    },
    scrollX: {
      enabled: true,
    },
    scrollY: {
      enabled: true,
    },
    keyboardConfig: {
      isClip: true,
      isMerge: false,
      isFNR: false,
      isEdit: true,
      isTab: true,
      isArrow: true,
      isEnter: true,
      isDel: true,
      isChecked: true,
      enterToTab: false,
    },
    mouseConfig: {
      selected: false,
      area: false,
    },
    editConfig: {
      // 双击编辑
      trigger: 'dblclick',
      // 编辑粒度 单元格
      mode: 'cell',
      // 展示新增标记
      showStatus: true,
    },
  },
} as const;

/**
 * 注册全局 HTTP 实例和变体配置，为 ComboBox/ModalBox 提供数据源
 * @param defHttp - HTTP 请求实例，需实现 get 和 post 方法
 * @param variants - 变体映射表，key 为 variant 名称，value 包含 url 和 method
 */
export const registerVariant = (defHttp: HttpInstance, variants: VariantMap) => {
  globalConfig.setConfig({ http: defHttp, variants });
};
