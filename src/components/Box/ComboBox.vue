<template>
  <vxe-pulldown ref="pullDownRef" transfer class="combo-box-container">
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
          ...props.inputProps,
          disabled: props.inputProps.disabled || props.disabled,
        }"
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
          <template v-for="item in props.gridProps.columns" :key="item.field" #[item.field]>
            <Form.ItemRest>
              <Input
                v-model:value="filter[item.field]"
                size="small"
                @change="() => handleInputChange(item.field)"
              />
            </Form.ItemRest>
          </template>
        </vxe-grid>
      </div>
    </template>
  </vxe-pulldown>
</template>
<script lang="ts" setup>
  import { ComputedRef, computed, onMounted, ref } from 'vue';
  import { Input, Select, Form } from 'ant-design-vue';
  import { VxeGridProps, VxeGridInstance, VxePulldownInstance } from 'vxe-table';
  import type { InputProps } from 'ant-design-vue';
  import { SelectCommonContext } from './common';

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
    gridProps?: VxeGridProps;
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
    data?: object[] | ComputedRef<any[]>;
    /**
     * @description 请求结束后 改变value 不适用onFocus
     * @params autoFill: 填入list第一项
     * @params clear: 清空
     * @params noChange: 不做改变
     * @params 默认值：action传入值，action不存在时props.autoFill为true时为'autoFill',为false时:'clear'
     */
    action?: 'autoFill' | 'clear' | 'noChange' | undefined;
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

  const checkMethod = ({ row }: { row: Record<string, any> }) =>
    row.checked || (props?.maxSelectNum ? rowDataList.value.length < props.maxSelectNum : true);

  const showHeader = computed(() =>
    props.allowCheckAllNum
      ? xTable?.value?.getTableData().visibleData.length <= props.allowCheckAllNum
      : false,
  );

  const defaultOption = {
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
  const xTable = ref({} as VxeGridInstance);
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
  const selectClick = async () => {
    if (props.inputProps?.disabled || props.disabled) return;
    if (!pullDownRef.value.isPanelVisible()) {
      handleFocus();
      // await pullDownRef.value.showPanel();
      // await xTable.value.clearFilter();
      return;
    }
    pullDownRef.value.hidePanel();
  };
  onMounted(doOnMount);

  defineExpose({
    xTable,
  });
</script>
<style lang="less">
  .combo-box-container {
    width: 160px;

    .my-dropdown {
      min-height: 300px;
      background-color: #fff;
      box-shadow: 0 0 6px 2px rgb(0 0 0 / 10%);
    }

    .vxe-table--render-default.size--mini .vxe-header--column:not(.col--ellipsis) {
      padding: 5px 0;
    }

    .ant-select-selection-overflow-item {
      max-width: 80px;
    }
  }

  .vxe-table .vxe-cell > .vxe-pulldown.combo-box-container {
    width: 100%;

    .ant-select-sm {
      height: 28px !important;
      border-radius: 4px;
      box-shadow: none !important;
      line-height: 28px !important;

      .ant-select-selector {
        height: 28px !important;
        border-radius: 4px;
        box-shadow: none !important;
        line-height: 28px !important;
      }

      //.ant-select-selection-item {
      //  line-height: 25px !important;
      //}
    }

    .ant-input-affix-wrapper-sm {
      height: 28px;
      border-radius: 4px;
      box-shadow: none !important;
      line-height: 28px;
    }

    .ant-btn-sm {
      height: 28px;
      border-radius: 0 4px 4px 0;
    }
  }

  .dropdown-table .vxe-table--header th .vxe-cell {
    display: flex !important;
    align-items: center;

    .vxe-cell--title {
      flex: 1;
    }
  }
</style>
