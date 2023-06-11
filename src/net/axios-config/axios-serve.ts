import { broadcast, Cast, Functions, Jsons, fns } from '@git8023/toolkit.all-export';
import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { ElLoading, ElMessage } from 'element-plus';
import qs from 'qs';
import { R, RCode } from './result-type';

// 判断哪些接口不启用pending loading
const whitelist = ['/valid'];

// 跳过loading计数器
const checkSkipCounter = (req: AxiosRequestConfig) => (whitelist.includes(req.url!));

const counterCfg = {
  doneWaitTimes: 500,
};

const counter = {
  count: 0,
  loading: Cast.null as any,
  pending: Cast.null as fns.Consume<InternalAxiosRequestConfig>,
  done: Cast.null as fns.Consume<InternalAxiosRequestConfig>,
};

Object.defineProperty(counter, 'pending', {
  value(req: AxiosRequestConfig) {
    if (checkSkipCounter(req)) {
      return;
    }

    counter.count += 1;
    counter.loading = counter.loading ?? ElLoading.service();
  },
});
Object.defineProperty(counter, 'done', {
  value(req: AxiosRequestConfig) {
    if (checkSkipCounter(req)) {
      return;
    }

    counter.count -= 1;
    // console.debug('[Request] Done ', counter.count);
    if (counter.count === 0) {
      Functions.timer(() => {
        if (counter.loading) {
          counter.loading.close();
        }
        counter.loading = Cast.nil;
      }, false, counterCfg.doneWaitTimes);
    }
  },
});

// 创建服务对象
const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API,
  timeout: 60000,
});

// 请求拦截
service.interceptors.request.use(
  (req) => {
    counter.pending(req);
    req.params = Jsons.compact(req.params);
    const httpMethod = req.method?.toUpperCase();
    console.info('[>>]', httpMethod, req.url, req.params, req.data);

    // 添加请求头
    // const token = Jsons.get(user.state, 'token');
    // if (token) {
    //   req.headers!.authorization = token;
    // }

    if (httpMethod === 'GET') {
      req.paramsSerializer = {
        serialize: (params) => qs.stringify(params, { arrayFormat: 'repeat' }),
      };
    }

    return req;

  },
  (err: AxiosError) => {
    counter.done(err.config!);
    console.error('Request Error', err);
  },
);

// 响应拦截
service.interceptors.response.use(
  (resp: AxiosResponse<R>) => {
    counter.done(resp.config);

    console.info('[<<]', resp.config.method!.toUpperCase(), resp.config.url, resp.data);
    const { data } = resp;
    if (data.code === RCode.OK) {
      return resp;
    }

    // 登录已过期或未登录
    switch (data.code as RCode) {
      // 登录跳转错误
      case RCode.LOGIN_EXPIRED:
      // case RCode.LOGIN_INVALID:
      case RCode.NON_LOGIN: {
        const msg = data.message || '用户未登录或状态已过期';
        console.warn(msg, data);

        // 登录状态过期直接跳转, 不做提示
        broadcast.emit('REDO_LOGIN');
        break;
      }

      // 提示性错误
      default:
        // 其他错误
        ElMessage({
          type: 'error',
          message: data.message || '服务器忙, 请稍候再试',
        });
    }

    console.error('[Failed]', data.code, resp);
    return Promise.reject(Error(`数据状态不是 RCode.OK[${ RCode.OK }]`));
  },
  (err: AxiosError) => {
    counter.done(err.config!);
    // 超时
    const isTimeout = err.message.includes('timeout');
    if (isTimeout) {
      const message = '服务器响应超时';
      console.error(message);
      ElMessage.error({
        message,
        grouping: true,
      });
      return Promise.reject();
    }

    // 404
    const status = err.response && err.response.status;
    if (status === 404) {
      console.error('404: 请求接口不存在', err);
      ElMessage.error({
        message: `请求接口不存在: ${ err.config!.url }`,
        grouping: true,
      });
      return Promise.reject(`[404] 请求接口不存在: ${ err.config!.url }`);
    }

    ElMessage.error({
      message: '服务器忙, 请稍候再试',
      grouping: true,
    });
    console.error('Response Error:', err.message, err);
    return Promise.reject();
  },
);

export { service };
