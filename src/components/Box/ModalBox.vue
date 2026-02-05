<template>
  <div class="modal-box-container">
    <Select
      v-if="useSelect"
      :value="inputText"
      v-bind="{
        ...defaultOption.inputProps,
        ...props.inputProps,
        disabled: props.inputProps?.disabled || props.disabled,
      }"
      :mode="props.mode"
      :allow-clear="allowClear"
      :open="false"
      :max-tag-count="1"
      @deselect="deselect"
      :class="{ selectClass: selectClass }"
      @clear="onClear"
    >
      <template #maxTagPlaceholder="omittedValues">
        <span style="color: red">+ {{ omittedValues.length }}</span>
      </template>
      <template #suffixIcon> </template>
    </Select>
    <AutoComplete
      size="small"
      v-if="!useSelect"
      v-model:value="inputValue"
      v-bind="{ ...props.autoCompleteProps, disabled: props.autoCompleteProps?.disabled || props.disabled }"
      :allow-clear="allowClear"
      :options="options"
      @search="onSearch"
      @blur="blur"
      @change="(_: any) => inputValueChange()"
    />
    <Button v-bind="{ ...props.buttonProps }" @click="openModal" :disabled="props.disabled">
      <dash-outlined/>
    </Button>
    <slot
      v-if="useModal"
      name="modal"
      :setValue="setValue0"
      :modalVisible="MultipleModalVisible"
      :params="props.params"
    ></slot>
    <vxe-modal
      v-model="modalVisible"
      esc-closable
      lock-view
      :show-footer="mode == 'multiple' ? true : false"
      resize
      draggable
      dblclickZoom
      :maskClosable="false"
      @close="doAfterClose"
      @confirm="doClickConfirm"
      v-bind="{ ...props.modalProps }"
    >
      <template #title v-if="title != undefined">
        <span>{{ title }}</span>
      </template>
      <template #default>
        <vxe-grid
          class="dropdown-table"
          v-bind="{ ...defaultOption.gridProps, ...props.gridProps, columns }"
          keep-source
          :data="gridData"
          ref="xTable"
          :loading="gridLoading"
          :filter-config="{ showIcon: false }"
          :row-config="{ isHover: true, isCurrent: true }"
          @cell-dblclick="handleCellClick"
          :toolbar-config="toolBarConfig"
          :checkbox-config="{ checkField: 'checked', trigger: 'row' }"
        >
          <template #toolbar_buttons>
            <slot name="toolbar_buttons" :loadData="loadData"></slot>
          </template>
          <template v-for="item in props.gridProps?.columns" :key="item.field" #[item.field!]>
            <Form.ItemRest>
              <Input
                v-model:value="filter[item.field!]"
                size="small"
                @change="() => handleInputChange(item.field!)"
              />
            </Form.ItemRest>
          </template>
        </vxe-grid>
      </template>
    </vxe-modal>
  </div>
</template>
<script lang="ts" setup>
  import { ref, onMounted, computed, reactive, nextTick } from 'vue';
  import { Input, Select, Form, Button, AutoComplete } from 'ant-design-vue';
  import { VxeGridInstance, VxeGridProps } from 'vxe-table';
  import type { AutoCompleteProps, InputProps, ButtonProps } from 'ant-design-vue';
  import { DashOutlined } from '@ant-design/icons-vue';
  import { SelectCommonContext } from './common';

  interface Props {
    /**
     * @description Vxe Grid的属性
     * @link https://vxetable.cn/#/grid/api
     */
    gridProps?: VxeGridProps;
    /**
     * @description Input属性 ant-design-vue
     * @link https://www.antdv.com/components/input-cn#API
     */
    inputProps?: InputProps;
    /**
     * @description AutoComplete属性 ant-design-vue
     */
    autoCompleteProps?: | AutoCompleteProps;
    /**
     * 按钮的属性 ant-design-vue
     */
    buttonProps?: ButtonProps;
    /**
     * @description Input Value
     */
    value?: string | number | null | (string | number)[];
    /**
     * @description setValue & input show label
     */
    option: { label: string; value: string };
    /**
     * @description Select Table各种场景变化
     * 内置对的场景请参见 ./consts.ts
     */
    variant?: string;
    /**
     * @description 下拉表格数据来源
     */
    remoteConfig?: object;
    /**
     * @description 是否在组件的第一次加载时是否需要手动发起请求
     * 或者通过修改params来发起请求
     */
    manualRequest?: boolean;
    /**
     * @description 传入 request 的请求参数
     * 当params参数发生变化时 会自动发起请求 ）
     */
    params?: Record<string, any>;
    /**
     * @description 请求结束后 数据处理
     * 评估阶段，不推荐使用
     */
    transformData?: (raw: unknown) => Record<string, unknown>[];
    /**
     * @description inputText 文字显示处理
     * 评估阶段，不推荐使用
     */
    transformInputText?: (raw: object) => string | number | undefined;
    /**
     * @description input输入框有值时是否允许删除
     */
    allowClear?: boolean;
    /**
     * @description 多选传multiple 单选不传
     */
    mode?: any;
    /**
     * @description params改变是否清空值 requestTrigger=onFocus, onParamsChange时使用
     */
    paramsChangeClear?: boolean;
    /**
     * 基础数据
     */
    data?: object[];
    /**
     * 弹框的title
     */
    title?: string;
    /**
     * 是否使用自定义弹框
     */
    useModal?: boolean;
    /**
     * 是否禁用
     */
    disabled?: boolean;
    /**
     * 模态框的属性vxe-table
     */
    modalProps?: any;
    /**
     * 选择框的类
     */
    selectClass?: string;
    /**
     * 弹出框的类
     */
    popClass?: string;
    /**
     * 是否允许输入
     */
    allowInput?: boolean;
    /**
     * 数据提取promise
     */
    dataProvider?: (params: any) => Promise<any>;
    /**
     * 弹框打开之前的回调
     */
    beforeModalOpen?: () => boolean;
    /**
     * autoComplete name
     */
    name?: string;
  }

  const xTable = ref({} as VxeGridInstance);
  const options = ref([]);
  const emit = defineEmits(['update:value', 'change', 'input', 'blur']);
  const props = withDefaults(defineProps<Props>(), {
    manualRequest: false,
    inputProps: () => ({} as any),
    gridProps: () => ({} as any),
    buttonProps: () => ({
      size: 'small',
    } as any),
    mode: '',
    allowClear: true,
    transformData: (e: any) => e,
    transformInputText: () => undefined,
    paramsChangeClear: true,
    useModal: false,
    disabled: false,
    modalProps: () => ({ width: '50%' }),
    allowInput: true,
    name: '',
  });

  const {
    inputText,
    onClear,
    deselect,
    columns,
    gridData,
    getList,
    gridLoading,
    handleCheckboxChange,
    handleInputChange,
    filter,
    doOnMount,
    setValue,
    setValue1,
    inputValue,
    loadData,
  } = SelectCommonContext({ props, emit, xTable, isModal: true });

  const useSelect = computed(() => {
    return props.mode == 'multiple' || !props.allowInput;
  });

  const doClickConfirm = () => {
    handleCheckboxChange();
    closeModal();
  };

  const MultipleModalVisible = ref<boolean>(false);

  const modalVisible = ref<boolean>(false);

  const openModal = () => {
    if (props.beforeModalOpen && !props.beforeModalOpen()) {
      return;
    }
    if (props.useModal) {
      MultipleModalVisible.value = true;
    } else {
      modalVisible.value = true;
    }

    nextTick(() => {
      if (!props.manualRequest && !props.useModal) {
        getList();
      }
    });
  };

  const closeModal = () => {
    if (props.useModal) {
      MultipleModalVisible.value = false;
    } else {
      modalVisible.value = false;
    }
    doAfterClose();
  };

  const doAfterClose = () => {
    filter.value = {};
    xTable.value.clearFilter();
    gridData.value = [];
  };

  const setValue0 = (data: any) => {
    closeModal();
    if (props.mode === 'multiple') {
      setValue1(data);
    } else {
      setValue(data);
    }
  };

  const toolBarConfig = {
    slots: {
      buttons: 'toolbar_buttons',
    },
  };

  const defaultOption: any = {
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

  const inputValueChange = () => {
    const obj: any = {};
    const { value } = props.option;
    obj[value] = inputValue.value;
    setValue(obj);
  };

  const handleCellClick = (params: any) => {
    const { row } = params
    if (props.mode === 'multiple') return;
    closeModal();
    const { value } = props.option;
    inputValue.value = row[value];
    setValue(row);
  };

  const onSearch = (searchText: string) => {
    if (!props.name) return;
    let key = props.name;
    let setting = localStorage.getItem(key);
    let arr = reactive<any>([]);
    if (setting) {
      arr = JSON.parse(setting);
    }
    options.value = !searchText ? arr : arr.filter((e: any) => e['value'].indexOf(searchText) >= 0);
  };

  const blur = () => {
    emit('blur');
    if (!props.name || !inputValue.value) return;
    let key = props.name;
    let setting = localStorage.getItem(key);
    let arr = [];
    if (setting) {
      arr = JSON.parse(setting);
      if (arr.length > 4) {
        arr = arr.slice(arr.length - 4, arr.length + 1);
      }
      if (setting.indexOf(inputValue.value) < 0) {
        arr.push({ value: inputValue.value });
      }
    } else {
      arr.push({ value: inputValue.value });
    }
    localStorage.setItem(key, JSON.stringify(arr));
  };

  onMounted(doOnMount);
</script>
<style lang="less">
  .modal-box-container {
    display: flex;
    align-items: center;
    width: 180px;

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

  .vxe-table .vxe-cell > .modal-box-container {
    width: 100%;

    .ant-select-sm {
      flex: 1;
      height: 28px;
      border-radius: 4px 0 0 4px;
      box-shadow: none !important;
      line-height: 28px;

      .ant-select-selector {
        height: 28px !important;
        border-radius: 4px 0 0 4px;
        box-shadow: none !important;
        line-height: 28px !important;
      }
    }

    .ant-input-affix-wrapper-sm {
      height: 28px;
      border-radius: 4px 0 0 4px;
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
