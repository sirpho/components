<script lang="ts" setup>
import { nextTick, ref, watch } from "vue";

import { Modal, type ModalProps, Skeleton } from "ant-design-vue";
import { type VxeGridPropTypes } from "vxe-table";

interface Props extends ModalProps {
  /** 数据接口请求函数，返回操作记录列表 */
  request: (param: any) => Promise<any>;
  /** 接口请求参数 */
  params?: any;
  /** vxe-grid 表格列配置 */
  columns?: VxeGridPropTypes.Columns;
  /** 弹框标题 */
  title?: string;
  /** 弹框是否显示（v-model:visible） */
  visible: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  params: () => ({}),
  columns: () => [
    {
      field: "opContent",
      title: "操作内容",
      cellType: "string",
      sortable: true,
    },
    {
      field: "reason",
      title: "操作理由",
      cellType: "string",
      sortable: true,
    },
    {
      field: "opUser",
      title: "操作人",
      cellType: "string",
      sortable: true,
    },
    {
      field: "opTime",
      title: "操作时间",
      cellType: "string",
      sortable: true,
      width: 180,
    },
  ],
  title: "操作记录",
});
const emit = defineEmits(["update:visible"]);

/**
 * 骨架屏加载状态：请求开始时置为 true，结束后置为 false
 */
const skeletonLoading = ref<boolean>(false);

/** 弹框内部显示状态 */
const visibleState = ref<boolean>(false);

/** 操作记录表格数据列表 */
const tableList = ref<any[]>([]);

/**
 * 发起数据请求：显示骨架屏加载状态，请求完成后设置表格数据
 */
const query = async () => {
  const params = {
    ...(props.params as any),
  };
  skeletonLoading.value = true;
  const res = await props.request(params).finally(() => {
    skeletonLoading.value = false;
  });
  tableList.value = res.data || [];
};

/**
 * 打开弹框：设置显示状态并触发数据查询
 */
const open = () => {
  visibleState.value = true;
  query();
};

/** 监听外部 visible 属性变化，变为 true 时自动打开弹框 */
watch(
  () => props.visible,
  () => {
    props.visible && open();
  }
);

/**
 * 重置弹框状态：清空表格数据、关闭显示、停止骨架屏加载
 */
const resetModalState = () => {
  visibleState.value = false;
  skeletonLoading.value = false;
  tableList.value = [];
};

/**
 * 关闭弹框事件：通知父组件更新 visible，并在下一帧重置内部状态
 */
const handleCancel = () => {
  emit("update:visible", false);
  nextTick(() => {
    resetModalState();
  });
};
</script>

<template>
  <Modal
    :footer="false"
    :title="title"
    :open="visible"
    width="800px"
    @cancel="handleCancel"
  >
    <Skeleton :loading="skeletonLoading" :paragraph="{ rows: 6 }" active>
      <vxe-grid
        :columns="columns!"
        :data="tableList"
        auto-resize
        height="400"
      />
    </Skeleton>
  </Modal>
</template>
