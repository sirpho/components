<script lang="tsx">
import { defineComponent, useSlots, toRefs, nextTick } from 'vue';
import { filterEmpty } from 'ant-design-vue/es/_util/props-util';
import { Splitpanes, Pane } from 'splitpanes';
import useCalcHeight from '../../hooks/useCalcHeight';
import 'splitpanes/dist/splitpanes.css';

/**
 * VxeContainer：基于 splitpanes 的栅格布局容器组件。
 * 支持水平或垂直分割面板，子元素按比例分配空间，高度自动根据视口计算。
 * 提供 reCalcHeight 方法供外部在布局变化时手动触发高度重算。
 */
export default defineComponent({
  name: 'VxeContainer',
  props: {
    /** 在计算结果基础上额外减少的高度（px），用于预留底部工具栏等空间 */
    extraHeight: { type: Number, default: 0 },
    /** 分割方向：horizontal（水平分割）或 vertical（垂直分割） */
    direction: { type: String, default: 'horizontal' },
    /** 子面板的初始大小百分比列表 */
    size: { type: Array, default: () => [] },
    /** 容器唯一标识，拼接在 DOM id 上 */
    id: { type: String, default: '1' },
  },

  setup(props, { expose }) {
    const slots = useSlots();

    /** DOM id 前缀 */
    const prefixId = '@sirpho-vxe-container';

    /** 动态计算容器可用高度（视口高度 - 顶部偏移 - 8px 余量） */
    const { height, calcHeight } = useCalcHeight(`${prefixId}-${props.id}`);

    /**
     * 手动触发高度重算（在外部布局变化后调用）
     */
    const reCalcHeight = () => {
      nextTick(() => {
        calcHeight();
      });
    };

    expose({ reCalcHeight });

    return () => {
      const { extraHeight, direction, size } = toRefs(props);
      // 是否是水平布局
      const isHorizontal: boolean = direction.value === 'horizontal';
      // 防止小数在 window 平台出现滚动条
      const gridContainerHeight = height.value - (extraHeight.value as number);
      const items = filterEmpty(slots.default?.());
      const len = items.length;
      const polyfillHeight = Math.floor(gridContainerHeight - 0.5);

      if (len === 0) {
        return (
          <div
            id={`${prefixId}-${props.id}`}
            class="vxe-container"
            data-calc-height={gridContainerHeight}
            style={{ height: polyfillHeight + 'px' }}
          ></div>
        );
      }

      return (
        <Splitpanes
          id={`${prefixId}-${props.id}`}
          class="vxe-container default-theme"
          horizontal={isHorizontal}
          data-calc-height={gridContainerHeight}
          style={{ height: polyfillHeight + 'px' }}
        >
          {items.map((child, index) => {
            return (
              <Pane size={size.value[index]} min-size="20" max-size="100">
                {child}
              </Pane>
            );
          })}
        </Splitpanes>
      );
    };
  },
});
</script>
<style>
.vxe-container {
  background-color: #fff;
}

.splitpanes.default-theme .splitpanes__pane {
  background: #fff;
}

.default-theme.splitpanes--horizontal > .splitpanes__splitter,
.default-theme .splitpanes--horizontal > .splitpanes__splitter {
  height: 0.5rem;
  border-top: unset;
  margin-top: -1px;
}

.default-theme.splitpanes--vertical > .splitpanes__splitter,
.default-theme .splitpanes--vertical > .splitpanes__splitter {
  width: 0.5rem;
  border: none;
  margin: 0;
}

.splitpanes.default-theme .splitpanes__splitter {
  box-sizing: border-box;
  position: relative;
  flex-shrink: 0;
  background: #f0f2f5;
}
</style>
