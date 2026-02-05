<script lang="ts" setup>
import { nextTick, ref, watch } from "vue";

import { Modal, type ModalProps, Skeleton } from "ant-design-vue";
import { type VxeGridPropTypes } from "vxe-table";

interface Props extends ModalProps {
  /** 数据接口 */
  request: (param: any) => Promise<any>;
  /** 接口参数 */
  params?: any;
  /** 表格列 */
  columns?: VxeGridPropTypes.Columns;
  /** 标题 */
  title?: string;
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
 * 骨架屏加载
 */
const skeletonLoading = ref<boolean>(false);

const visibleState = ref<boolean>(false);

/** 表格数据 */
const tableList = ref<any[]>([]);

/**
 * 查询数据
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
 * 打开弹框
 */
const open = () => {
  visibleState.value = true;
  query();
};

watch(
  () => props.visible,
  () => {
    props.visible && open();
  }
);

/**
 * 重置
 */
const resetModalState = () => {
  visibleState.value = false;
  skeletonLoading.value = false;
  tableList.value = [];
};

/**
 * 关闭弹窗
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
