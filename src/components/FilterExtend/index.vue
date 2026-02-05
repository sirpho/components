<template>
  <div class="my-filter-excel">
    <Tabs v-model:activeKey="state.option.data.tab" size="small">
      <TabPane key="1" tab="按选项">
        <div class="my-fe-search">
          <div class="my-fe-search-top">
            <vxe-input v-model="state.option.data.sVal" placeholder="搜索" />
            <i class="vxe-icon-search my-fe-search-icon"></i>
          </div>
          <div class="my-fe-search-list">
            <div class="my-fe-search-item" @click="sAllEvent">
              <span
                class="vxe-icon-checkbox-unchecked my-fe-search-item-icon"
                v-if="state.option.data.vals.length === 0"
              ></span>
              <span
                class="vxe-icon-checkbox-indeterminate my-fe-search-item-icon icon-color"
                v-else-if="state.option.data.vals.length !== searchList.length"
              ></span>
              <span class="vxe-icon-checkbox-checked my-fe-search-item-icon icon-color" v-else></span>
              <span style="padding-left: 10px"> (全选)</span>
            </div>
            <vxe-list height="165" :scroll-y="{ enabled: true }" :data="searchList">
              <template #default="{ items }">
                <div
                  style="height: 20px"
                  class="my-fe-search-item"
                  v-for="(val, sIndex) in items"
                  :key="sIndex"
                  @click="sItemEvent(val)"
                >
                  <span
                    :class="[
                      state.option.data.vals.indexOf(val) === -1
                        ? 'vxe-icon-checkbox-unchecked my-fe-search-item-icon'
                        : 'vxe-icon-checkbox-checked icon-color my-fe-search-item-icon',
                    ]"
                  ></span>
                  <Tooltip>
                    <template #title>{{ val }}</template>
                    <span style="padding-left: 10px"> {{ val }}</span>
                  </Tooltip>
                </div>
              </template>
            </vxe-list>
          </div>
        </div>
      </TabPane>
      <TabPane key="2" tab="按条件" force-render>
        <div class="container">
          <vxe-select v-model="state.option.data.cdt" transfer @change="handleChangeCdt">
            <vxe-option v-for="item in cdtList" :key="item.value" :value="item.value" :label="item.label" />
          </vxe-select>
          <vxe-select
            style="margin-top: 10px"
            v-model="state.option.data.cdt2"
            transfer
            v-show="state.option.data.cdt !== 'null' && state.option.data.cdt"
          >
            <vxe-option v-for="item in CdtListComputed" :key="item.value" :value="item.value" :label="item.label" />
          </vxe-select>
          <vxe-input
            style="margin-top: 10px"
            :type="state.option.data.cdt"
            v-model="state.option.data.cdt3"
            v-show="state.option.data.cdt2 && !empty.find((ite: any) => ite === state.option.data.cdt2)"
            transfer
          />
          <div v-show="state.option.data.cdt2 && more.find((ite: any) => ite === state.option.data.cdt2)">与</div>
          <vxe-input
            transfer
            v-model="state.option.data.cdt4"
            :type="state.option.data.cdt"
            v-show="state.option.data.cdt2 && more.find((ite: any) => ite === state.option.data.cdt2)"
          />
        </div>
      </TabPane>
    </Tabs>
    <div class="my-fe-footer">
      <vxe-button status="primary" @click="confirmFilterEvent">确认</vxe-button>
      <vxe-button @click="resetFilterEvent">重置</vxe-button>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'FilterExtend',
};
</script>
<script lang="ts" setup>
import { PropType, reactive, computed, watch, defineProps, ref } from 'vue';
import { VxeGlobalRendererHandles } from 'vxe-table';
import { Tabs, TabPane, message, Tooltip } from 'ant-design-vue';

const props = defineProps({
  params: Object as PropType<VxeGlobalRendererHandles.RenderFilterParams>,
  id: Number,
  sort: Boolean || undefined,
});

const state = reactive({
  option: {
    data: {},
  } as any,
  colValList: [] as string[],
});
const defaultObj = {
  vals: [], // 按选项：
  dVals: [], // 按选项：暂存默认值
  sVal: '', // 按选项：
  tab: '1', // 当前tab(1:按选项,2:按条件)
  cdt: '',
  cdt2: '',
  cdt3: '',
  cdt4: '',
};

const cdtList = [
  { label: '无', value: 'null' },
  { label: '数值类', value: 'number' },
  { label: '文本类', value: 'text' },
  { label: '日期类', value: 'date' },
];
const more = ['number-between', 'number-no-between', 'date-between', 'date-no-between'];
const empty = ['text-empty', 'text-no-empty'];
const cdtObj = {
  null: [],
  number: [
    { label: '大于', value: 'number-bigger' },
    { label: '小于', value: 'number-smaller' },
    { label: '介于', value: 'number-between' },
    { label: '不介于', value: 'number-no-between' },
    { label: '等于', value: 'number-equal' },
    { label: '不等于', value: 'number-no-equal' },
    { label: '大于或等于', value: 'number-bigger-or-equal' },
    { label: '小于或等于', value: 'number-smaller-or-equal' },
  ],
  text: [
    { label: '文本包含', value: 'text-include' },
    { label: '文本不包含', value: 'text-no-include' },
    { label: '文本等于', value: 'text-equal' },
    { label: '单元格为空', value: 'text-empty' },
    { label: '单元格有内容', value: 'text-no-empty' },
    { label: '文本开头为', value: 'text-begin' },
    { label: '文本结尾为', value: 'text-end' },
  ],
  date: [
    { label: '日期为', value: 'date-equal' },
    { label: '日期早于', value: 'date-before' },
    { label: '日期晚于', value: 'date-after' },
    { label: '日期介于', value: 'date-between' },
    { label: '日期不介于', value: 'date-no-between' },
  ],
};

const CdtListComputed = computed(() => {
  const cdt = state.option.data.cdt;
  if (cdt === 'number' || cdt === 'text' || cdt === 'null' || cdt === 'date') {
    const key: 'null' | 'number' | 'text' | 'date' = cdt;
    return cdtObj[key];
  }
  return [];
});

const searchList = computed(() => {
  const { option, colValList } = state;
  if (option) {
    if (option.data.sVal) {
      const searchResult = colValList.filter((val) => String(val).indexOf(String(option.data.sVal)) > -1);
      option.data.vals = [...searchResult];
      return props.sort ? searchResult.sort() : searchResult;
    }
    option.data.vals = option.data.dVals?.length > 0 ? [...option.data.dVals] : [...colValList];
    return props.sort ? colValList.sort() : colValList;
  }
  return [];
});

const load = () => {
  const { params } = props;
  if (params) {
    const { $table, column } = params;
    const { fullData } = $table.getTableData();
    column.filters[0].data = {
      ...defaultObj,
      ...column.filters[0].data,
    };
    state.option = column.filters[0];
    state.colValList = Array.from(new Set(fullData.map((item) => item[column.field])));
  }
  if (state.option) {
    const { data } = state.option;
    if (data.vals.length === 0) {
      data.vals = [...state.colValList];
    }
  }
};

const sAllEvent = () => {
  const { option, colValList } = state;
  if (option) {
    const { data } = option;
    data.vals = data.vals.length > 0 ? [] : [...colValList];
  }
};

const sItemEvent = (val: string) => {
  const { option } = state;
  if (option) {
    const { data } = option;
    const vIndex = data.vals.indexOf(val);
    if (vIndex === -1) {
      data.vals.push(val);
    } else {
      data.vals.splice(vIndex, 1);
    }
  }
};

const confirmFilterEvent = () => {
  const { params } = props;
  const { option } = state;
  if (!params || !option) return;
  const { $panel } = params;
  if (option.data.tab === '1') {
    const { data } = option;
    if (data.vals.length === 0) {
      resetFilterEvent();
      return;
    }
    data.dVals = [...data.vals];
    $panel.changeOption(null, true, option);
    $panel.confirmFilter();
  } else if (option.data.tab === '2') {
    const { cdt, cdt2 } = option.data;
    if (!cdt2) {
      message.warning('请选择条件');
      return;
    }
    switch (cdt) {
      case 'number':
        handleNumberChecked();
        return;
      case 'text':
        handleTextChecked();
        return;
      case 'date':
        handleDateChecked();
        return;
      default:
        return;
    }
  }
};

const handleTextChecked = () => {
  if (!props.params || !state.option) return;
  const { $table, column, $panel } = props.params;
  const { data } = state.option;
  const { cdt2, cdt3 } = data;
  const fullData = $table.getTableData().fullData;
  const filterData = fullData
    .filter((item) => {
      switch (cdt2) {
        case 'text-include':
          return String(item[column.field]).indexOf(String(cdt3)) !== -1;
        case 'text-no-include':
          return String(item[column.field]).indexOf(String(cdt3)) === -1;
        case 'text-equal':
          return String(item[column.field]) === String(cdt3);
        case 'text-empty':
          return !item[column.field];
        case 'text-no-empty':
          return !!item[column.field];
        case 'text-begin':
          return String(item[column.field]).startsWith(String(cdt3));
        case 'text-end':
          return String(item[column.field]).endsWith(String(cdt3));
        default:
          return false;
      }
    })
    .map((item) => item[column.field]);
  data.vals = Array.from(new Set(filterData));
  $panel.changeOption(null, true, state.option);
  $panel.confirmFilter();
};

const handleDateChecked = () => {
  if (!props.params || !state.option) return;
  const { $table, column, $panel } = props.params;
  const { data } = state.option;
  const { cdt2, cdt3, cdt4 } = data;
  const fullData = $table.getTableData().fullData;
  const filterData = fullData
    .filter((item) => {
      switch (cdt2) {
        case 'date-equal':
          if (isNaN(new Date(item[column.field]).getTime())) return false;
          return new Date(cdt3).getTime() === new Date(item[column.field]).getTime();
        case 'date-before':
          if (isNaN(new Date(item[column.field]).getTime())) return false;
          return new Date(cdt3).getTime() > new Date(item[column.field]).getTime();
        case 'date-after':
          if (isNaN(new Date(item[column.field]).getTime())) return false;
          return new Date(cdt3).getTime() < new Date(item[column.field]).getTime();
        case 'date-between':
          if (isNaN(new Date(item[column.field]).getTime())) return false;
          return (
            new Date(cdt3).getTime() < new Date(item[column.field]).getTime() &&
            new Date(cdt4).getTime() > new Date(item[column.field]).getTime()
          );
        case 'date-no-between':
          if (isNaN(new Date(item[column.field]).getTime())) return false;
          return (
            new Date(cdt3).getTime() > new Date(item[column.field]).getTime() &&
            new Date(cdt4).getTime() < new Date(item[column.field]).getTime()
          );
        default:
          return false;
      }
    })
    .map((item) => item[column.field]);
  data.vals = Array.from(new Set(filterData));
  $panel.changeOption(null, true, state.option);
  $panel.confirmFilter();
};

const handleNumberChecked = () => {
  if (!props.params || !state.option) return;
  const { $table, column, $panel } = props.params;
  const { data } = state.option;
  const { cdt2, cdt3, cdt4 } = data;
  const fullData = $table.getTableData().fullData;
  const filterData = fullData
    .filter((item) => {
      switch (cdt2) {
        case 'number-bigger':
          return +item[column.field] > +cdt3;
        case 'number-smaller':
          return +item[column.field] < +cdt3;
        case 'number-between':
          return +item[column.field] >= +cdt3 && +item[column.field] <= +cdt4;
        case 'number-no-between':
          return +item[column.field] < +cdt3 || +item[column.field] > +cdt4;
        case 'number-equal':
          return +item[column.field] === +cdt3;
        case 'number-no-equal':
          return +item[column.field] !== +cdt3;
        case 'number-bigger-or-equal':
          return +item[column.field] >= +cdt3;
        case 'number-smaller-or-equal':
          return +item[column.field] <= +cdt3;
        default:
          return false;
      }
    })
    .map((item) => item[column.field]);
  data.vals = Array.from(new Set(filterData));
  $panel.changeOption(null, true, state.option);
  $panel.confirmFilter();
};

const resetFilterEvent = () => {
  const { params } = props;
  if (params) {
    const { $panel } = params;
    $panel.resetFilter();
  }
};

const handleChangeCdt = () => {
  state.option.data.cdt2 = '';
  state.option.data.cdt3 = '';
  state.option.data.cdt4 = '';
};

watch(
  () => props.id,
  () => {
    load();
  },
  { immediate: true },
);
</script>

<style lang="less" scoped>
.my-filter-excel {
  user-select: none;
  padding: 10px 16px;
  min-width: 230px;
}

.my-filter-excel .my-fe-search {
  padding: 0;
}

.ant-tabs-top > .ant-tabs-nav {
  margin-bottom: 6px;
}

.ant-tabs-tab {
  padding: 6px 0;
}

.ant-tabs-tab + .ant-tabs-tab {
  margin-left: 20px;
}

.ant-tabs-tab-btn {
  font-size: 14px;
}

.my-filter-excel .my-fe-search .my-fe-search-top {
  position: relative;
  width: 100%;
  padding-bottom: 6px;
}

.my-filter-excel .my-fe-search .my-fe-search-top > input {
  border: 1px solid #ababab;
  height: 22px;
  line-height: 22px;
}

.my-filter-excel .my-fe-search .my-fe-search-top > .my-fe-search-icon {
  position: absolute;
  right: 5px;
  top: 7px;
}

.my-filter-excel .my-fe-search .my-fe-search-list {
  margin: 0;
  border: 1px solid #e2e4e7;
  height: 200px;
  padding: 6px;
  border-radius: 4px;
}

.my-filter-excel .my-fe-search .my-fe-search-list .scroll {
  overflow: auto;
  height: 165px;
}

.my-filter-excel .my-fe-search .my-fe-search-list .my-fe-search-item {
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 186px;
}

.my-filter-excel .my-fe-search .my-fe-search-list .my-fe-search-item .my-fe-search-item-icon {
  width: 16px;
}

.my-filter-excel .my-fe-footer {
  text-align: right;
  padding-top: 10px;
}

.icon-color {
  color: #1e6fff;
}

.container {
  border-radius: 4px;
  border: 1px solid #e2e4e7;
  height: 234px;
  padding: 10px;
}
</style>
