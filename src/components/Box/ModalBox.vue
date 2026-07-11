<template>
  <div class="modal-box-container select-dropdown-shared">
    <Select
      v-if="useSelect"
      :value="inputText"
      v-bind="{
        ...defaultOption.inputProps,
        ...(props.inputProps as any),
        disabled: props.inputProps?.disabled || props.disabled,
      } as any"
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
  import { ref, onMounted, computed, nextTick } from 'vue';
  import { Input, Select, Form, Button, AutoComplete } from 'ant-design-vue';
  import type { VxeGridInstance, VxeGridProps } from 'vxe-table';
  import type { AutoCompleteProps, InputProps, ButtonProps } from 'ant-design-vue';
  import { DashOutlined } from '@ant-design/icons-vue';
  import { SelectCommonContext } from './common';
  import { modalBoxDefaultOption as defaultOption } from './config';
  import './comboBoxModalBox.less';

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
    autoCompleteProps?: AutoCompleteProps;
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
    remoteConfig?: { url: string; method: 'get' | 'post'; params?: Record<string, any> };
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
    modalProps?: Record<string, any>;
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
     * autoComplete name (用作 localStorage key 存储历史输入)
     */
    name?: string;
  }

  /** vxe-grid 实例引用 */
  const xTable = ref({} as VxeGridInstance);
  /** 自动补全选项列表（从 localStorage 读取的历史输入） */
  const options = ref<Array<{ value: string }>>([]);
  /** 定义组件事件：update:value（v-model）、change、input、blur */
  const emit = defineEmits(['update:value', 'change', 'input', 'blur']);
  const props = withDefaults(defineProps<Props>(), {
    manualRequest: false,
    inputProps: () => ({} as any),
    gridProps: () => ({}) as VxeGridProps,
    buttonProps: () => ({ size: 'small' }) as ButtonProps,
    mode: undefined,
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

  /**
   * 是否使用 Select 模式：多选模式或不允许输入时使用 Select，否则使用 AutoComplete
   */
  const useSelect = computed(() => {
    return props.mode === 'multiple' || !props.allowInput;
  });

  /**
   * 多选弹框点击确认按钮的处理：同步勾选值并关闭弹框
   */
  const doClickConfirm = () => {
    handleCheckboxChange();
    closeModal();
  };

  /** 自定义弹框（useModal 插槽）的显示状态 */
  const MultipleModalVisible = ref<boolean>(false);

  /** 内置 vxe-modal 的显示状态 */
  const modalVisible = ref<boolean>(false);

  /**
   * 打开弹框：执行 beforeModalOpen 回调校验，根据 useModal 切换到自定义或内置弹框，
   * 非手动请求模式下在 nextTick 中拉取数据
   */
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

  /**
   * 关闭弹框：根据 useModal 关闭对应模式的弹框，仅内置弹框执行清理逻辑
   */
  const closeModal = () => {
    if (props.useModal) {
      MultipleModalVisible.value = false;
    } else {
      modalVisible.value = false;
    }
    // 仅内置弹框模式（useModal=false）且不在打开流程中需要清理
    if (!props.useModal) {
      doAfterClose();
    }
  };

  /**
   * 内置弹框关闭后的清理逻辑：重置筛选条件、清除表格筛选、清空数据
   */
  const doAfterClose = () => {
    filter.value = {};
    if (xTable.value?.clearFilter) {
      xTable.value.clearFilter();
    }
    gridData.value = [];
  };

  /**
   * 通过插槽自定义弹框选中值后的回调：关闭弹框并根据模式设置值
   * @param data - 选中的行数据或行数据列表（多选）
   */
  const setValue0 = (data: any) => {
    closeModal();
    if (props.mode === 'multiple') {
      setValue1(data);
    } else {
      setValue(data);
    }
  };

  /** 表格工具栏插槽配置 */
  const toolBarConfig = {
    slots: {
      buttons: 'toolbar_buttons',
    },
  };

  /**
   * AutoComplete 输入变化后触发选中：将输入值包装为对象并执行 setValue
   */
  const inputValueChange = () => {
    const obj: Record<string, any> = {};
    const { value } = props.option;
    obj[value] = inputValue.value;
    setValue(obj);
  };

  /**
   * 单选模式下表格行双击选中：关闭弹框、设置输入框值和触发事件
   * @param params - vxe-table 行双击参数，包含 row
   */
  const handleCellClick = (params: any) => {
    const { row } = params;
    if (props.mode === 'multiple') return;
    closeModal();
    const { value } = props.option;
    inputValue.value = row[value];
    setValue(row);
  };

  /**
   * AutoComplete 搜索事件：从 localStorage 读取历史输入并过滤匹配项
   * @param searchText - 当前搜索文本
   */
  const onSearch = (searchText: string) => {
    if (!props.name) return;
    try {
      const key = props.name;
      const setting = localStorage.getItem(key);
      let arr: Array<{ value: string }> = [];
      if (setting) {
        arr = JSON.parse(setting);
      }
      options.value = !searchText ? arr : arr.filter((e) => e.value.indexOf(searchText) >= 0);
    } catch (e) {
      console.warn('ModalBox: 读取历史输入记录失败', e);
      options.value = [];
    }
  };

  /**
   * AutoComplete 失焦事件：触发 blur 事件并将当前输入值保存到 localStorage 历史记录（最多保存 5 条）
   */
  const blur = () => {
    emit('blur');
    if (!props.name || !inputValue.value) return;
    try {
      const key = props.name;
      const setting = localStorage.getItem(key);
      let arr: Array<{ value: string }> = [];
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
    } catch (e) {
      console.warn('ModalBox: 无法保存历史输入记录', e);
    }
  };

  /** 组件挂载时触发初始化逻辑 */
  onMounted(doOnMount);
</script>
<style lang="less">
  .modal-box-container {
    display: flex;
    align-items: center;
    width: 180px;
  }
</style>
