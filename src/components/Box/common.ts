import { ref, computed, toRaw, watch } from 'vue';
import { globalConfig } from './config';
import { cloneDeep, isUndefined, isEmpty, isEqual } from 'lodash-es';
import { SelectProps, message } from 'ant-design-vue';
import type { VxeColumnPropTypes } from 'vxe-table';
import type { SelectCommonContextArgs, ChangeAction } from './types';
import to from 'await-to-js';

/**
 * Select 组件公共上下文工厂函数，为 ComboBox 和 ModalBox 提供共享的状态管理和业务逻辑。
 * 包含数据拉取、筛选、值同步、单元格点击/复选框交互等核心逻辑。
 * @param args - 上下文参数，包含 props、emit、xTable ref、pullDownRef 等
 * @returns 响应式状态、计算属性及事件处理函数集合
 */
export const SelectCommonContext = (args: SelectCommonContextArgs) => {
  const {
    props,
    emit,
    xTable,
    pullDownRef = {} as any,
    isModal = false,
  } = args;
  /** 单选模式下当前选中的行数据 */
  const rowData = ref<Record<string, any>>({});
  /** 多选模式下当前选中的行数据列表 */
  const rowDataList = ref<Record<string, any>[]>([]);
  /** 根据 action / autoFill 推导出的选择后行为 */
  const textChangeType = computed<ChangeAction>(() =>
    props.action ? props.action : props.autoFill ? 'autoFill' : 'clear',
  );
  /** 当前下拉表格的数据源 */
  const gridData = ref<Record<string, any>[]>([]);
  /** 当前过滤条件（各列筛选项的值） */
  const filter = ref<Record<string, any>>({});
  /** 当前显示的列配置 */
  const columns = ref<any[]>([]);
  /** 是否已初始化 focus 事件（用于首次 focus 恢复勾选状态） */
  const initFocus = ref<boolean>(true);
  /** 输入模式下的输入框值 */
  const inputValue = ref();
  /** 表格数据加载状态 */
  const gridLoading = ref(false);
  /** 选择框显示的文本 */
  const inputText = computed(() => {
    return props.mode === 'multiple'
      ? (rowDataList.value.map((item) => handleTransformInputText(item)) as SelectProps['value'])
      : (handleTransformInputText(rowData.value) as SelectProps['value']);
  });

  /**
   * 处理输入框显示文本的自定义转换逻辑。
   * 返回值仅限 String / Number / Undefined，否则会打印警告并降级为 label 字段值。
   * @param e - 当前行数据
   * @returns 转换后的显示文本
   */
  const handleTransformInputText = (e: Record<string, any>) => {
    const { label } = props.option;
    const { transformInputText } = props;
    const text = transformInputText(e);
    const textType = Object.prototype.toString.call(text);
    if (
      textType !== '[object String]' &&
      textType !== '[object Number]' &&
      textType !== '[object Undefined]'
    ) {
      console.warn('transformInputText方法返回值应为String/Number/Undefined');
      return e[label];
    }
    return text || e[label];
  };

  /**
   * 根据配置向远程接口发起请求获取下拉数据。
   * 优先使用 props.remoteConfig，否则从全局 variants 中查找。
   * @param requestParams - 额外合并到请求参数中的筛选条件
   * @returns 远程请求的 Promise
   */
  const getRequest = (requestParams = {}): Promise<any> => {
    if (isUndefined(props.remoteConfig) && isUndefined(props.variant)) {
      console.warn('下拉表格可能无数据源，请检查');
      message.error('下拉表格可能无数据源，请检查');
      return Promise.reject(true);
    }
    if (isUndefined(props.remoteConfig) && isUndefined(globalConfig.variants?.[props.variant!])) {
      console.warn('下拉表格数据源错误，请检查');
      message.error('下拉表格数据源错误，请检查');
      return Promise.reject(true);
    }
    const config = props.remoteConfig || globalConfig.variants![props.variant!];
    const { url, method } = config;
    if (method && method.toUpperCase() === 'GET') {
      return globalConfig.http!.get({
        url: url,
        params: { ...props.params, ...requestParams },
      });
    }
    return globalConfig.http!.post({
      url: url,
      data: { ...props.params, ...requestParams },
    });
  };

  /**
   * 设置单选模式下的选中值，触发 v-model 和 change 事件
   * @param _data - 当前选中的行数据（可为空）
   */
  const setValue = (_data?: any) => {
    const data = toRaw(_data);
    const { value: fieldValue } = props.option;
    const { value } = props;
    if (!value && !data?.[fieldValue]) {
      return;
    }
    if (value !== data?.[fieldValue]) {
      emit('update:value', data?.[fieldValue] || '');
      emit('change', data, data?.[fieldValue] || '');
    }
  };

  /**
   * 设置多选模式下的选中值，触发 v-model 和 change 事件
   * @param _data - 当前选中的行数据列表，默认空数组
   */
  const setValue1 = (_data: any[] = []) => {
    const data = toRaw(_data);
    const { value: fieldValue } = props.option;
    const { value } = props;
    const newValue = data.map((item) => item[fieldValue]);
    if (isEmpty(value) && isEmpty(newValue)) {
      return;
    }
    emit('update:value', newValue);
    emit('change', data, newValue);
  };

  /**
   * 处理下拉表格列筛选输入框值变化，更新对应列的筛选条件并刷新表格
   * @field - 发生变化的列字段名
   */
  const handleInputChange = (field?: string | number) => {
    if (!field) {
      return;
    }
    const fieldKey = String(field);
    const $table = xTable.value;
    const data = filter.value[fieldKey];
    const column = $table.getColumnByField(fieldKey);
    if (column) {
      const option = column.filters[0];
      option.data = data;
      option.checked = true;
      $table.updateData();
    }
  };

  /**
   * 获取下拉表格数据源，支持三种模式：自定义 data、dataProvider 回调、远程接口请求。
   * 非 Modal 模式下拉取数据后还会触发自动填充逻辑。
   * @param isFirst - 是否首次加载（首次不触发自动填充）
   * @param requestParams - 额外的请求参数
   */
  const getList = async (isFirst = false, requestParams = {}) => {
    const { transformData, data, dataProvider } = props;
    if (dataProvider) {
      const [err, res] = await to(dataProvider(props.params));
      if (err) return;
      gridData.value = transformData(res);
    } else if (data) {
      // 自定义 data
      gridData.value = cloneDeep(toRaw(data));
      initFocus.value = true;
    } else {
      // 接口获取数据
      gridLoading.value = true;
      const [err, res] = await to(getRequest(requestParams));
      gridLoading.value = false;
      if (err) return;
      const { data: _list, code } = res;
      // 这里逻辑可以根据项目进行修改
      if (code !== 200) return;
      gridData.value = transformData(_list);
    }
    if (!isModal) {
      !isFirst && handleAutoFill();
    }
  };

  /**
   * 执行自动填充逻辑：根据 textChangeType 自动填入列表第一项或清空值。
   * onFocus 请求模式不触发此逻辑。
   */
  const handleAutoFill = () => {
    const { mode, requestTrigger } = props;
    if (requestTrigger === 'onFocus') return;
    if (textChangeType.value === 'noChange') return;
    if (textChangeType.value === 'autoFill') {
      if (mode !== 'multiple' && gridData.value.length > 0) {
        setValue({ ...gridData.value[0] });
      }
      if (mode === 'multiple' && gridData.value.length > 0) {
        setValue1([{ ...gridData.value[0] }]);
      }
    }
    if (textChangeType.value === 'clear') {
      onClear();
    }
  };

  /**
   * 清除选中值：单选模式清空 rowData，多选模式清空 rowDataList，并触发事件
   */
  const onClear = () => {
    if (props.mode === 'multiple') {
      rowDataList.value = [];
      setValue1();
    } else {
      setValue();
    }
  };

  /**
   * 多选模式下处理取消选择某个标签的事件
   * @param value - 被取消的显示标签值
   */
  const deselect = (value: any) => {
    if (!Array.isArray(inputText.value)) {
      setValue();
      return;
    }
    const record = gridData.value.find((itm) => itm[props.option.label] === value);
    if (record && xTable.value?.setCheckboxRow) xTable.value.setCheckboxRow(record, false);
    if (rowDataList.value.length > 0) {
      setValue1(rowDataList.value.filter((item) => item[props.option.label] !== value));
    }
  };

  /**
   * 处理下拉框获取焦点事件：显示面板、加载数据（onFocus 模式）、恢复勾选项
   */
  const handleFocus = async () => {
    const { value } = props;
    await pullDownRef.value.showPanel();
    if (props.requestTrigger === 'onFocus') await getList();
    filter.value = {};
    await xTable.value.clearFilter();
    if (initFocus.value && props.mode === 'multiple' && Array.isArray(value) && value.length > 0) {
      initFocus.value = false;
      const _needCheck: object[] = [];
      value.forEach((item) => {
        const record = gridData.value.find((itm) => itm[props.option.value] === item);
        if (record) _needCheck.push(record);
      });
      await xTable.value.setCheckboxRow(_needCheck, true);
    }
  };

  /**
   * 处理单选模式下表格行点击事件：选中并关闭下拉面板
   * @param params - vxe-table 行点击参数，包含 row
   */
  const handleCellClick = (params: any) => {
    const { row } = params;
    if (props.mode === 'multiple') return;
    setValue(row);
    pullDownRef.value.hidePanel();
  };

  /**
   * 处理复选框选择变化事件：多选模式下获取所有勾选行并同步值
   * 注意：当表格处于过滤状态时，getCheckboxRecords 只返回可见的勾选行，
   * 先前选中但被过滤掉的行会丢失。此处合并两者以确保选中状态不丢失。
   */
  const handleCheckboxChange = () => {
    if (props.mode !== 'multiple') return;
    const checkedRecords = xTable.value.getCheckboxRecords();
    const { value: fieldValue } = props.option;
    // 收集当前已勾选行的 value 集合
    const checkedValues = new Set(checkedRecords.map((item) => item[fieldValue]));
    // 保留 rowDataList 中已被勾选但被过滤掉的行（不在 checkedRecords 中）
    const hiddenSelected = rowDataList.value.filter(
      (item) => !checkedValues.has(item[fieldValue]),
    );
    // 合并：过滤后仍选中的行 + 之前选中但被过滤掉的行
    const data = [...checkedRecords, ...hiddenSelected];
    rowDataList.value = data;
    setValue1(data);
  };

  /**
   * 初始化或回显值：根据当前 value 在 gridData 中查找匹配行并设置 rowData/rowDataList。
   * 当表格尚未加载数据时，使用 value 本身创建占位行。
   */
  const setInit = () => {
    const { mode, value } = props;
    const { label: oLabel, value: oValue } = props.option;
    // 设置初始值
    if (mode === 'multiple' && Array.isArray(value)) {
      const _rowDataList = (Array.isArray(value) ? value : []).map(
        (item) =>
          gridData.value.find((itm) => itm[oValue] === item) || {
            [`${oLabel}`]: item,
            [`${oValue}`]: item,
          },
      );
      rowDataList.value = _rowDataList;
    }
    if (mode !== 'multiple') {
      inputValue.value = value;
      const record = gridData.value.find((item) => item[oValue] == value) || {
        [`${oLabel}`]: value,
        [`${oValue}`]: value,
      };
      rowData.value = { ...record };
    }
  };

  /**
   * 组件挂载时的初始化逻辑：校验数据格式、拉取初始数据、回显值。
   * 多选模式下仅支持数组 value，单选模式下不支持数组 value。
   */
  const doOnMount = async () => {
    const { requestTrigger, mode, value, manualRequest } = props;

    if (mode === 'multiple' && !Array.isArray(value)) {
      console.warn('多选value默认值应传入数组');
    }
    if (mode !== 'multiple' && Array.isArray(value)) {
      console.warn('单选value类型应为String/Number');
    }
    if (requestTrigger === 'onMount' || (requestTrigger === 'onParamsChange' && manualRequest)) {
      const isFirst = mode === 'multiple' ? Array.isArray(value) && value.length > 0 : !!value;
      await getList(isFirst);
    }
    setInit();
  };

  /**
   * 列筛选方法：判断单元格值是否包含筛选条件值（字符串包含匹配）
   */
  const filterMethod: VxeColumnPropTypes.FilterMethod = (val) => {
    return String(val.cellValue).includes(String(val.option.data));
  };

  /** 监听 value 变化，重新回显选中值 */
  watch(
    () => props.value,
    () => {
      setInit();
    },
  );

  /**
   * 监听 custom data 变化，重新加载数据。
   * 使用 deep 监听以捕捉数组内部变化。
   */
  watch(
    () => props.data,
    () => {
      if (!props.data) return;
      getList();
    },
    { deep: true },
  );

  /**
   * 监听 params 变化：清空旧值（paramsChangeClear）并触发按参数请求（onParamsChange 模式）。
   * 使用 isEqual 守卫避免引用变化但内容相同时重复请求。
   */
  watch(
    () => props.params,
    (val, oldVal) => {
      const { params, requestTrigger, paramsChangeClear } = props;
      if (isEqual(val, oldVal)) return;
      if (!params) return;
      if (paramsChangeClear && requestTrigger !== 'onMount') {
        onClear();
      }
      if (requestTrigger === 'onParamsChange') {
        getList();
      }
    },
    { deep: true },
  );

  /**
   * 监听 gridProps 变化：重新构建列配置和过滤条件。
   * 立即执行一次以确保初始化时列正确渲染。
   */
  watch(
    () => props.gridProps,
    () => {
      const { columns: _columns } = props.gridProps;
      if (_columns) {
        const newColumns = _columns.map((item: any) => ({
          title: item.title,
          children: [
            {
              sortable: true,
              ...item,
              slots: { header: item.field },
              filters: [{ data: '' }],
              filterMethod: (val: any) => filterMethod(val),
            },
          ],
        }));
        columns.value =
          props.mode === 'multiple'
            ? [{ type: 'checkbox', width: 60, fixed: 'left' }, ...newColumns]
            : newColumns;
        _columns.forEach((item: any) => {
          if (item.field) {
            filter.value = { ...filter.value, [item.field]: null };
          }
        });
      }
    },
    { deep: true, immediate: true },
  );

  /**
   * 手动加载数据（供外部调用）
   * @param params - 筛选参数
   */
  const loadData = async (params: any) => {
    await to(getList(false, params));
  };

  return {
    rowData,
    rowDataList,
    inputText,
    getRequest,
    handleFocus,
    onClear,
    deselect,
    getList,
    columns,
    gridData,
    gridLoading,
    handleCellClick,
    handleCheckboxChange,
    handleInputChange,
    setInit,
    filter,
    doOnMount,
    loadData,
    setValue,
    setValue1,
    inputValue,
  };
};
