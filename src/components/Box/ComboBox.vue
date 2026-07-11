<template>
  <vxe-pulldown ref="pullDownRef" transfer class="combo-box-container select-dropdown-shared">
    <template #default>
      <Select
        class="combo-box-container"
        :class="{ selectClass: selectClass }"
        :style="{ width: width }"
        :value="inputText"
        :mode="props.mode"
        :allowClear="allowClear"
        :open="false"
        :max-tag-count="props.maxTagCount"
        @clear="onClear"
        @focus="selectClick"
        @deselect="deselect"
        v-bind="{
          ...defaultOption.inputProps,
          ...(props.inputProps as any),
          disabled: props.inputProps.disabled || props.disabled,
        } as any"
      >
        <template #maxTagPlaceholder="omittedValues">
          <span style="color: red">+ {{ omittedValues.length }}</span>
        </template>
      </Select>
    </template>
    <template #dropdown>
      <div class="my-dropdown" :class="{ popClass: popClass }" :style="{ width: popWidth }">
        <vxe-grid
          class="dropdown-table"
          v-bind="{ ...defaultOption.gridProps, ...props.gridProps, columns }"
          keep-source
          :data="gridData"
          ref="xTable"
          :loading="gridLoading"
          :filter-config="{ showIcon: false, ...props.gridProps?.filterConfig }"
          :row-config="{ isHover: true, isCurrent: true, ...props.gridProps.rowConfig }"
          @cell-click="handleCellClick"
          @checkbox-change="handleCheckboxChange"
          @checkbox-all="handleCheckboxChange"
          :checkboxConfig="{
            checkField: 'checked',
            trigger: 'row',
            ...props.gridProps?.checkboxConfig,
            checkMethod,
            showHeader,
          }"
        >
          <template v-for="item in props.gridProps.columns" :key="item.field" #[item.field!]>
            <Form.ItemRest>
              <Input
                v-model:value="filter[item.field!]"
                size="small"
                @change="() => handleInputChange(item.field!)"
              />
            </Form.ItemRest>
          </template>
        </vxe-grid>
      </div>
    </template>
  </vxe-pulldown>
</template>
<script lang="ts" setup>
  import { computed, onMounted, ref } from 'vue';
  import { Input, Select, Form } from 'ant-design-vue';
  import type { VxeGridInstance, VxePulldownInstance } from 'vxe-table';
  import type { InputProps } from 'ant-design-vue';
  import { SelectCommonContext } from './common';
  import { comboBoxDefaultOption as defaultOption } from './config';
  import './comboBoxModalBox.less';

  type SelectTableRemoteConfig = {
    url: string;
    method: 'get' | 'post';
    params?: object;
  };

  interface Props {
    variant?: string;
    /**
     * @description Vxe Grid的属性
     * @link https://vxetable.cn/#/grid/api
     */
    gridProps?: Record<string, any>;
    /**
     * @description Input属性
     * @link https://www.antdv.com/components/input-cn#API
     */
    inputProps?: InputProps;
    /**
     * @description Input Value
     */
    value?: string | number | null | (string | number)[];
    /**
     * @description setValue & input show label
     */
    option: { label: string; value: string };
    /**
     * @description 下拉表格数据来源
     */
    remoteConfig?: SelectTableRemoteConfig;
    /**
     * @description 是否在组件的第一次加载时是否需要手动发起请求 // 适用requestTrigger==='onParamsChange'
     * 或者通过修改params来发起请求
     */
    manualRequest?: boolean;
    /**
     * @description 传入 request 的请求参数
     * 当params参数发生变化时 会自动发起请求 ）
     */
    params?: Record<string, any>;
    /**
     * @description 获取数据源的时机
     */
    requestTrigger?: 'onMount' | 'onFocus' | 'onParamsChange';
    /**
     * @description 请求结束后 是否自动填充列表第一项 //对 requestTrigger=onFocus不适用
     */
    autoFill?: boolean;
    /**
     * @description 请求结束后 数据处理
     */
    transformData?: (raw: unknown) => Record<string, unknown>[];
    /**
     * @description inputText 文字显示处理
     */
    transformInputText?: (raw: object) => string | number | undefined;
    /**
     * @description input输入框有值时是否允许删除
     */
    allowClear?: boolean;
    /**
     * @description 多选传multiple 单选不传
     */
    mode?: 'multiple' | 'tags';
    /**
     * @description params改变是否清空值 requestTrigger=onFocus, onParamsChange时使用
     */
    paramsChangeClear?: boolean;
    /**
     * 基础数据
     */
    data?: object[] | (() => any[]);
    /**
     * @description 请求结束后 改变value 不适用onFocus
     * @params autoFill: 填入list第一项
     * @params clear: 清空
     * @params noChange: 不做改变
     * @params 默认值：action传入值，action不存在时props.autoFill为true时为'autoFill',为false时:'clear'
     */
    action?: 'autoFill' | 'clear' | 'noChange';
    /**
     * 下拉宽度
     */
    popWidth?: string;
    /**
     * 宽度
     */
    width?: string;
    /**
     * 选择框的类
     */
    selectClass?: string;
    /**
     * 弹出框的类
     */
    popClass?: string;
    /**
     * 数据提取promise
     */
    dataProvider?: (params: any) => Promise<any>;
    /**
     * 是否允许输入
     */
    allowInput?: boolean;
    /**
     * 是否禁用
     */
    disabled?: boolean;
    /**
     * 最多显示几个标签
     * 默认1个
     */
    maxTagCount?: number;
    /**
     * @description 筛选条件后数据小于 allowCheckAllNum 显示全选
     */
    allowCheckAllNum?: number;
    /**
     * @description 多选最大可选择数
     */
    maxSelectNum?: number;
  }

  /** 定义组件事件：update:value（v-model）、change、input */
  const emit = defineEmits(['update:value', 'change', 'input']);
  const props = withDefaults(defineProps<Props>(), {
    value: undefined,
    remoteConfig: undefined,
    manualRequest: false,
    action: undefined,
    data: undefined,
    option: () => ({}) as any,
    params: () => ({}),
    inputProps: () => ({}),
    gridProps: () => ({}),
    requestTrigger: 'onMount',
    mode: undefined,
    autoFill: true,
    allowClear: true,
    transformData: (e: any) => e,
    transformInputText: () => undefined,
    paramsChangeClear: true,
    popWidth: '500px',
    allowInput: false,
    maxTagCount: 1,
    allowCheckAllNum: 999,
    maxSelectNum: undefined,
  });

  /**
   * 复选框可用性的判断方法：未勾选的行根据 maxSelectNum 限制是否允许勾选
   * @param row - 当前行数据
   * @returns 该行复选框是否可用
   */
  const checkMethod = ({ row }: { row: Record<string, any> }) =>
    row.checked || (props?.maxSelectNum ? rowDataList.value.length < props.maxSelectNum : true);

  /**
   * 是否显示全选复选框：当过滤后数据量小于等于 allowCheckAllNum 时显示
   */
  const showHeader = computed(() =>
    props.allowCheckAllNum
      ? xTable?.value?.getTableData?.().visibleData.length <= props.allowCheckAllNum
      : false,
  );

  /** vxe-grid 实例引用 */
  const xTable = ref({} as VxeGridInstance);
  /** vxe-pulldown 实例引用 */
  const pullDownRef = ref({} as VxePulldownInstance);
  const {
    rowDataList,
    inputText,
    handleFocus,
    onClear,
    deselect,
    columns,
    gridData,
    gridLoading,
    handleCellClick,
    handleCheckboxChange,
    handleInputChange,
    filter,
    doOnMount,
  } = SelectCommonContext({ props, emit, xTable, pullDownRef });

  /**
   * 选择框点击事件：已禁用时忽略；面板未展开则展开并聚焦，否则收起面板
   */
  const selectClick = async () => {
    if (props.inputProps?.disabled || props.disabled) return;
    if (!pullDownRef.value.isPanelVisible()) {
      await handleFocus();
      return;
    }
    await pullDownRef.value.hidePanel();
  };
  /** 组件挂载时触发初始化逻辑 */
  onMounted(doOnMount);

  /** 对外暴露 xTable 实例供外部调用 */
  defineExpose({
    xTable,
  });
</script>
<style lang="less">
  .combo-box-container {
    width: 160px;
  }
</style>
