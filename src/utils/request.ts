import axios from 'axios';
import { message } from 'ant-design-vue';

const instance = axios.create({
  timeout: 1000,
});

instance.interceptors.request.use(
  function (config) {
    return config;
  },
  function (error) {
    return Promise.reject(error);
  },
);

instance.interceptors.response.use(
  function (response) {
    const { status, data } = response;
    if (status > 200) {
      message.error(`服务发生错误，Http Code: ${status}`);
      return Promise.reject(response);
    }
    const { success, message: msg } = data;
    if (!success) {
      message.error(msg);
      return Promise.reject(response);
    }
    return data;
  },
  function (error) {
    return Promise.reject(error);
  },
);

const request = instance;

export { request };
