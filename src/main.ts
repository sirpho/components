import { createApp, App } from 'vue';
import _App from './App.vue';
import VXETable from 'vxe-table';
import 'ant-design-vue/dist/antd.css';
import 'vxe-table/lib/style.css';

function useTable(app: App) {
  app.use(VXETable);
}

createApp(_App).use(useTable).mount('#app');
