<template>
  <div class="my-filter-excel">
    <Tabs v-model:activeKey="state.option.data.tab" size="small">
      <TabPane key="1" tab="按选项">
        <div class="my-fe-search">
          <div class="my-fe-search-top">
            <vxe-input v-model="state.option.data.sVal" placeholder="搜索" />
            <i class="vxe-icon-search my-fe-search-icon" />
          </div>
          <div class="my-fe-search-list">
            <div class="my-fe-search-item" @click="sAllEvent">
              <span
                v-if="state.option.data.vals.length === 0"
                class="vxe-icon-checkbox-unchecked my-fe-search-item-icon"
              />
              <span
                v-else-if="state.option.data.vals.length !== searchList.length"
                class="vxe-icon-checkbox-indeterminate my-fe-search-item-icon icon-color"
              />
              <span
                v-else
                class="vxe-icon-checkbox-checked my-fe-search-item-icon icon-color"
              />
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
                  />
                  <OverflowTooltip :title="val">
                    <span style="padding-left: 10px"> {{ val }}</span>
                  </OverflowTooltip>
                </div>
              </template>
            </vxe-list>
          </div>
        </div>
      </TabPane>
      <TabPane key="2" tab="按条件" force-render>
        <div class="container">
          <vxe-select v-model="state.option.data.cdt" transfer @change="handlecdtChange">
            <vxe-option
              v-for="item in cdtList"
              :key="item.value"
              :value="item.value"
              :label="item.label"
            />
          </vxe-select>
          <vxe-select
            style="margin-top: 10px"
            v-model="state.option.data.cdt2"
            transfer
            v-show="state.option.data.cdt !== 'null' && state.option.data.cdt"
          >
            <vxe-option
              v-for="item in CdtListComputed"
              :key="item.value"
              :value="item.value"
              :label="item.label"
            />
          </vxe-select>
          <vxe-input
            style="margin-top: 10px"
            :type="state.option.data.cdt"
            v-model="state.option.data.cdt3"
            v-show="
              state.option.data.cdt2 && !empty.find((item) => item === state.option.data.cdt2)
            "
            transfer
          />
          <div
            v-show="state.option.data.cdt2 && more.find((item) => item === state.option.data.cdt2)">与</div>
          <vxe-input
            transfer
            v-model="state.option.data.cdt4"
            :type="state.option.data.cdt"
            v-show="state.option.data.cdt2 && more.find((item) => item === state.option.data.cdt2)"
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

<script lang="ts" setup>
import { PropType, reactive, computed, watch } from 'vue';
import { VxeGlobalRendererHandles } from 'vxe-table';
import { Tabs, TabPane, message } from 'ant-design-vue';
import OverflowTooltip from '../OverflowTooltip/index.vue';

/** 组件属性：接收 vxe-table 筛选渲染参数 */
const props = defineProps({
  /** vxe-table 筛选渲染上下文参数 */
  params: Object as PropType<VxeGlobalRendererHandles.RenderFilterParams>,
  /** 筛选器 ID，用于监听变化触发重新加载 */
  id: Number,
  /** 是否对筛选值列表进行排序 */
  sort: Boolean || undefined,
});

/** 组件内部响应式状态 */
const state = reactive({
  option: {
    data: {},
  } as any,
  /** 当前列所有不重复的值列表 */
  colValList: [] as string[],
});

/** 筛选条件的默认数据结构 */
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
/** 需要显示"与"分隔符和第二个输入框的条件类型（范围选择） */
const more = ['number-between', 'number-no-between', 'date-between', 'date-no-between'];
/** 不需要输入框的条件类型（空值判断） */
const empty = ['text-empty', 'text-no-empty'];

/** 筛选条件分类映射表：按类型（数值/文本/日期）分类的具体条件选项 */
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

/**
 * 根据当前选中的条件大类（数值/文本/日期/无），返回对应的具体条件选项列表
 */
const CdtListComputed = computed(() => {
  const cdt = state.option.data.cdt;
  if (cdt === 'number' || cdt === 'text' || cdt === 'null' || cdt === 'date') {
    const key: 'null' | 'number' | 'text' | 'date' = cdt;
    return cdtObj[key];
  }
  return [];
});

/**
 * 搜索过滤后的列表（纯计算，无副作用）
 */
const searchList = computed(() => {
  const { colValList } = state;
  const sVal = state.option?.data?.sVal;
  const result = sVal
    ? colValList.filter((val) => String(val).indexOf(String(sVal)) > -1)
    : colValList;
  // sort 返回新数组，避免修改原引用
  return props.sort ? [...result].sort() : result;
});

/**
 * 同步 vals 与搜索条件变化（副作用从 computed 移出）
 */
const syncValsStop = watch(
  () => state.option?.data?.sVal,
  (sVal) => {
    if (!state.option) return;
    if (sVal) {
      state.option.data.vals = state.colValList.filter(
        (val) => String(val).indexOf(String(sVal)) > -1,
      );
    } else {
      state.option.data.vals = state.option.data.dVals?.length > 0
        ? [...state.option.data.dVals]
        : [...state.colValList];
    }
  },
  { immediate: true },
);

/**
 * 加载筛选器数据：从表格获取当前列的所有不重复值作为候选项，
 * 并初始化筛选条件数据结构
 */
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

/**
 * 全选/取消全选事件：切换 vals 为空数组或全部列值列表
 */
const sAllEvent = () => {
  const { option, colValList } = state;
  if (option) {
    const { data } = option;
    data.vals = data.vals.length > 0 ? [] : [...colValList];
  }
};

/**
 * 单个选项的勾选/取消勾选事件：在 vals 中添加或移除指定值
 * @param val - 当前操作的显示值
 */
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

/**
 * 确认筛选事件：根据当前 tab 类型（按选项/按条件）执行不同的筛选应用逻辑。
 * 按选项模式直接提交勾选的 vals；按条件模式根据条件类型调用对应的数值/文本/日期处理函数。
 */
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

/**
 * 文本条件筛选：根据选中的文本条件类型（包含/不包含/等于/空/开头/结尾）过滤表格数据，
 * 将匹配的值去重后设置为 vals 并提交筛选
 */
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

/**
 * 日期条件筛选：根据选中的日期条件类型（等于/早于/晚于/介于/不介于）过滤表格数据。
 * 预计算 cdt3/cdt4 的时间戳避免循环内重复创建 Date 对象。
 * 将匹配的值去重后设置为 vals 并提交筛选
 */
const handleDateChecked = () => {
  if (!props.params || !state.option) return;
  const { $table, column, $panel } = props.params;
  const { data } = state.option;
  const { cdt2, cdt3, cdt4 } = data;
  const fullData = $table.getTableData().fullData;
  // 预计算不变的 Date 时间戳，避免在循环中重复创建
  const cdt3Time = new Date(cdt3).getTime();
  const cdt4Time = new Date(cdt4).getTime();
  const filterData = fullData
    .filter((item) => {
      const itemTime = new Date(item[column.field]).getTime();
      switch (cdt2) {
        case 'date-equal':
          return !isNaN(itemTime) && cdt3Time === itemTime;
        case 'date-before':
          return !isNaN(itemTime) && cdt3Time > itemTime;
        case 'date-after':
          return !isNaN(itemTime) && cdt3Time < itemTime;
        case 'date-between':
          return !isNaN(itemTime) && cdt3Time < itemTime && cdt4Time > itemTime;
        case 'date-no-between':
          return !isNaN(itemTime) && cdt3Time > itemTime && cdt4Time < itemTime;
        default:
          return false;
      }
    })
    .map((item) => item[column.field]);
  data.vals = Array.from(new Set(filterData));
  $panel.changeOption(null, true, state.option);
  $panel.confirmFilter();
};

/**
 * 数值条件筛选：根据选中的数值条件类型（大于/小于/介于/等于等）过滤表格数据，
 * 将匹配的值去重后设置为 vals 并提交筛选
 */
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

/**
 * 重置筛选事件：调用 vxe-table 面板的重置方法清除所有筛选条件
 */
const resetFilterEvent = () => {
  const { params } = props;
  if (params) {
    const { $panel } = params;
    $panel.resetFilter();
  }
};

/**
 * 筛选大类切换事件：清空已选择的子条件（cdt2）和输入值（cdt3/cdt4）
 */
const handlecdtChange = () => {
  state.option.data.cdt2 = '';
  state.option.data.cdt3 = '';
  state.option.data.cdt4 = '';
};

/** 监听外部传入的 id 变化，触发筛选器数据重新加载 */
watch(
  () => props.id,
  () => {
    load();
  },
  { immediate: true },
);
</script>

<script lang="ts">
export default {
  name: 'FilterExtend',
};
</script>
<style lang="less" scoped>
.my-filter-excel {
  min-width: 230px;
  padding: 10px 16px;
  user-select: none;
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
  height: 22px;
  border: 1px solid #ababab;
  line-height: 22px;
}

.my-filter-excel .my-fe-search .my-fe-search-top > .my-fe-search-icon {
  position: absolute;
  top: 7px;
  right: 5px;
}

.my-filter-excel .my-fe-search .my-fe-search-list {
  height: 200px;
  margin: 0;
  padding: 6px;
  border: 1px solid #e2e4e7;
  border-radius: 4px;
}

.my-filter-excel .my-fe-search .my-fe-search-list .scroll {
  height: 165px;
  overflow: auto;
}

.my-filter-excel .my-fe-search .my-fe-search-list .my-fe-search-item {
  display: flex;
  width: 186px;
  cursor: pointer;
}

.my-filter-excel .my-fe-search .my-fe-search-list .my-fe-search-item .my-fe-search-item-icon {
  width: 16px;
}

.my-filter-excel .my-fe-footer {
  padding-top: 10px;
  text-align: right;
}

.icon-color {
  color: #1e6fff;
}

.container {
  height: 234px;
  padding: 10px;
  border: 1px solid #e2e4e7;
  border-radius: 4px;
}
</style>
