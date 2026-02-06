/**
 * 多列下拉全局配置
 */
export const globalConfig: any = {
  http: null,
  variants: null,
  methods: null, //存储xTable中的公共方法
  env: {},
  setConfig(
    config: {
      http?: any;
      variants?: any;
      env?: any;
      methods?: (params: { [key: string]: any }) => object;
    } = {},
  ) {
    const { http, variants = {}, methods, env } = config;
    this.http = http;
    this.variants = variants;
    this.methods = methods;
    this.env = env;
  },
};

/**
 * vxeTable默认配置
 */
export const vxeTableDefaultConfig: any = {
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
};

/**
 * Combox注册axios和默认接口链接
 * @param defHttp
 * @param variants
 */
export const registerVariant = (defHttp: any, variants: any) => {
  globalConfig.setConfig({ http: defHttp, variants });
}
