import { ref, computed, toRaw, watch } from 'vue';
import { globalConfig } from './config';
import { cloneDeep, isUndefined, isEmpty, isEqual } from 'lodash-es';
import { message, SelectProps } from 'ant-design-vue';
import { VxeColumnPropTypes } from 'vxe-table';
import to from 'await-to-js';

export const SelectCommonContext = (args: any) => {
  const {
    props,
    emit,
    xTable,
    pullDownRef = {} as any,
    isModal = false,
  } = args
  // 单选选中的行数据
  const rowData = ref<Record<string, any>>({});
  //多行选中的数据
  const rowDataList = ref<Record<string, any>[]>([]); //
  //选择框模式下inputText的行为
  const textChangeType = computed(() =>
    props.action ? props.action : props.autoFill ? 'autoFill' : 'clear',
  );
  //记录数据展示table的数据源
  const gridData = ref<Record<string, any>[]>([]); // 下拉表数据
  //记录过滤的数据，未来可能弃用
  const filter = ref<any>({});
  //记录列信息
  const columns = ref<any[]>([]);
  //记录是否初始化focus事件
  const initFocus = ref<boolean>(true);
  //记录输入模式下绑定的值
  const inputValue = ref();
  //记录grid加载数据是否loading
  const gridLoading = ref(false);
  //记录select模式下显示值的变化
  const inputText = computed(() => {
    return props.mode === 'multiple'
      ? (rowDataList.value.map((item) => handleTransformInputText(item)) as SelectProps['value'])
      : (handleTransformInputText(rowData.value) as SelectProps['value']);
  });
  //处理输入框的转化
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
      console.error('transformInputText方法返回值应为String/Number/Undefined');
      return e[label];
    }
    return text || e[label];
  };
  // const inputText = computed(() => {
  //   const { label } = props.option;
  //   return props.mode === 'multiple'
  //     ? rowDataList.value.map((item) => handleTransformInputText(item) || item[label])
  //     : handleTransformInputText(rowData.value) || rowData.value[label];
  // });
  // const handleTransformInputText = (e: object) => {
  //   const { transformInputText } = props;
  //   if (Object.prototype.toString.call(e) !== '[object Object]') return '';
  //   const text = transformInputText(e);
  //   const textType = Object.prototype.toString.call(text);
  //   if (textType !== '[object String]' && textType !== '[object Number]' && textType !== '[object Undefined]') {
  //     console.error('transformInputText方法返回值应为String/Number/Undefined');
  //     return '';
  //   }
  //   return text;
  // };
  //远程请求，会附带一些参数
  const getRequest = (requestParams = {}): Promise<any> => {
    if (isUndefined(props.remoteConfig) && isUndefined(props.variant)) {
      console.error('下拉表格表格可能无数据源，请检查');
      message.error('下拉表格可能无数据源，请检查');
      return Promise.reject(true);
    }
    if (isUndefined(props.remoteConfig) && isUndefined(globalConfig.variants[props.variant!])) {
      console.error('下拉表格数据源错误，请检查');
      message.error('下拉表格数据源错误，请检查');
      return Promise.reject(true);
    }
    const config = props.remoteConfig || globalConfig.variants[props.variant!];
    const { url, method } = config;
    if (method && method.toUpperCase() === 'GET') {
      return globalConfig.http.get({
        url: url,
        params: { ...props.params, ...requestParams },
      });
    }
    return globalConfig.http.post({
      url: url,
      data: { ...props.params, ...requestParams },
    });
  };
  //设置单选模式下的值
  const setValue = (_data?: any) => {
    const data = toRaw(_data);
    const { value: fieldValue } = props.option;
    const { value } = props;
    if (!value && !data[fieldValue]) {
      return;
    }
    if (value !== data[fieldValue]) {
      emit('update:value', data[fieldValue] || '');
      emit('change', data, data[fieldValue] || '');
    }
  };
  //设置多选模式下的值
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
  //grid下拉框筛选变化
  const handleInputChange = (field: string | number) => {
    const $table = xTable.value;
    const data = filter.value[field];
    const column = $table.getColumnByField(field);
    if (column) {
      const option = column.filters[0];
      option.data = data;
      option.checked = true;
      $table.updateData();
    }
  };
  //获取数据源
  const getList = async (isFirst = false, requestParams = {}) => {
    const { transformData, data, dataProvider } = props;
    if (dataProvider) {
      const [err, res] = await to(dataProvider(props.params));
      if (err) return;
      gridData.value = transformData(res);
    } else if (data) {
      // 自定义data
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
  //如果是autoFill模式，如何执行
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
  //执行清除方法
  const onClear = () => {
    if (props.mode === 'multiple') {
      rowDataList.value = [];
      setValue1();
    } else {
      setValue();
    }
  };
  //多选模式下的取消选择事件
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
  //处理聚焦事件
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
      xTable.value.setCheckboxRow(_needCheck, true);
    }
  };
  //处理下拉框数据选择
  const handleCellClick = (params: any) => {
    const { row } = params
    if (props.mode === 'multiple') return;
    setValue(row);
    pullDownRef.value.hidePanel();
  };
  //处理checkbox选择变化
  const handleCheckboxChange = () => {
    if (props.mode !== 'multiple') return;
    const data = xTable.value.getCheckboxRecords();
    setValue1(data);
  };

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

  const doOnMount = async () => {
    const { requestTrigger, mode, value, manualRequest } = props;

    if (mode === 'multiple' && !Array.isArray(value)) {
      console.error('多选value默认值应传入数组');
    }
    if (mode !== 'multiple' && Array.isArray(value)) {
      console.error('单选value类型应为String/Number');
    }
    if (requestTrigger === 'onMount' || (requestTrigger === 'onParamsChange' && manualRequest)) {
      const isFirst = mode === 'multiple' ? Array.isArray(value) && value.length > 0 : !!value;
      await getList(isFirst);
    }
    setInit();
  };

  const filterMethod: VxeColumnPropTypes.FilterMethod = (val) => {
    return String(val.cellValue).includes(String(val.option.data));
  };

  watch(
    () => props.value,
    () => {
      setInit();
    },
  );

  watch(
    () => props.data,
    () => {
      if (!props.data) return;
      getList();
    },
    { deep: true },
  );

  watch(
    () => props.params,
    (val, oldVal) => {
      try {
        const { params, requestTrigger, paramsChangeClear } = props;
        if (isEqual(val, oldVal)) return;
        if (!params) return;
        if (paramsChangeClear && requestTrigger !== 'onMount') {
          onClear();
        }
        if (requestTrigger === 'onParamsChange') {
          getList();
        }
      } catch (e) {
        console.log(e);
      }
    },
    { deep: true },
  );

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
