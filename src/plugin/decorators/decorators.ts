import { createDecorator } from 'vue-class-component';
import { ComponentOptions } from 'vue';
import { types } from '@git8023/toolkit.type-define';
import { Validation } from '@git8023/toolkit.validation';
import { Functions } from '@git8023/toolkit.funcs';
import { Strings } from '@git8023/toolkit.string';
import { Jsons } from '@git8023/toolkit.json';

/**
 * 切面方法
 */
interface Functional {
  /**
   * @param thisArg 上下文, vm对象
   * @param method 原始方法
   * @param wc 配置对象
   * @param args 方法参数
   */
  (thisArg: any, method: any, wc: Configuration, ...args: any[]): any;
}

/** 配置 */
interface Configuration {
  /** vm选项配置 */
  options: ComponentOptions;

  /** 被代理属性名 */
  key: string;

  /**
   * 执行结果
   *
   * 仅: after中可用
   * @see after
   */
  result?: any;

  /**
   * 校验器
   * @param prop 目标属性
   */
  validator?: (prop: any) => types.FalsyLike;

  /**
   * 代理方法
   *
   * 代理方法会覆盖原始方法, 需要在方法体内部手动调用原始方法
   */
  proxy?: Functional;

  /** 前置切面 */
  before?: Functional;

  /**
   * 后置方法
   *
   * 原始方法或代理方法执行后, 结果返回前执行
   */
  after?: Functional;
}

const lifeCycleFns = ['beforeCreate', 'created', 'beforeMount', 'mounted', 'beforeUpdate', 'updated', 'beforeUnmount', 'unmounted'];
type LifeCycleFns = typeof lifeCycleFns;
type LifeCycleFn = LifeCycleFns[number];

/**
 * 把指定对象绑定到window上方便调试 &amp;
 *
 * @example
 * export default class extend Vue {
 *
 *   // 在控制台输入 window.Detail 即可获取该实例对象
 *   '@globalVar('Detail')
 *   mounted(){}
 * }
 *
 * @param [prop='__var_xxx'] window属性名, 最终值 `__${ prop }__`
 * @param [onlyDev=true] 仅开发期有效
 */
export function globalVar(prop?: string, onlyDev = true) {
  return genDecorator({
    validator: (method) => {
      if (!Validation.is(method, 'Function')) {
        throw Error('globalVar() 装饰器仅支持方法上使用');
      }
    },
    before(thisArg: any) {
      if (onlyDev && process.env.NODE_ENV !== 'development') {
        console.log('@globalVar() 仅开发期有效');
        return;
      }

      if (!onlyDev || (onlyDev && process.env.NODE_ENV === 'development')) {
        const key = prop || `__g_v_${Strings.guid()
          .replace(/-/g, '_')}__`;
        console.log('global var:', key);

        const win: any = window;
        win.__global__ = win.__global__ || {};
        win.__global__[key] = thisArg;
      }
    },
  });

}

/**
 * 监听按键事件('onKeydown'), 仅组件挂载期间有效
 *
 * @example
 * export default class extend Vue {
 *
 *   ,@scopedEventKeydown<ContextMenu>('onKeydownHandler')
 *   mounted(){}
 *
 *   // 按键事件处理
 *   onKeydownHandler(e:KeyboardEvent) {
 *     console.log('接受到按键事件', e);
 *   }
 *
 * }
 */
export function scopedEventKeydown<T>(handlerProp: keyof T) {
  return genDecorator({
    proxy: (thisArg, method, wc) => {

      const handler = (e: KeyboardEvent) => {
        const handlerFn = Jsons.get(wc.options.methods, handlerProp);
        return Functions.exec(handlerFn as any, thisArg, e);
      };

      switch (method.name as LifeCycleFn) {
        case 'mounted':
          document.addEventListener('keydown', handler);
          break;
        case 'unmounted':
          document.removeEventListener('keydown', handler);
          break;
      }

    },
  });
}

/**
 * 方法代理
 * @param cfg 代理配置
 */
function proxyMethod(cfg: Configuration) {
  const isLifeCycleFn = lifeCycleFns.includes(cfg.key);
  const method: Function = isLifeCycleFn ? cfg.options[cfg.key] : cfg.options.methods[cfg.key];

  // 不是函数
  if (Validation.isNot(method, 'Function')) return;

  // 验证器
  const vr = Functions.exec(cfg.validator, undefined, method);
  if (vr === false) return;

  const proxyFn = function (this: any, ...args: any[]) {

    // 前置切面
    const thisArg = this;
    const params = [thisArg, method, cfg, ...args];
    Functions.exec(cfg.before, thisArg, ...params);

    // 执行
    if (cfg.proxy instanceof Function) {
      cfg.result = Functions.exec(cfg.proxy, thisArg, thisArg, method, cfg, ...args);
    } else {
      cfg.result = Functions.exec(method as any, thisArg, ...args);
    }

    // 后置切面
    Functions.exec(cfg.after, thisArg, thisArg, method, ...params);

    // 返回执行结果
    return cfg.result;
  };

  if (isLifeCycleFn) {
    // 生命周期函数从options获取
    cfg.options[cfg.key] = proxyFn;
  } else {
    // 非生命周期函数从options.methods获取
    cfg.options.methods[cfg.key] = proxyFn;
  }
}

/**
 * createDecorator简化配置
 *
 * @example
 * function aopLog() {
 *   return genDecorator({
 *     proxy: (thisArg, method, wc, args) => {},
 *     before: (thisArg, method, wc, args) => {},
 *     after: (thisArg, method, wc, args) => {},
 *     validator: (prop) => {},
 *   });
 * }
 */
export function genDecorator(cfg: Pick<Configuration, 'validator' | 'before' | 'proxy' | 'after'>) {
  return createDecorator((options, key) => {
    proxyMethod({
      ...cfg,
      options,
      key,
    });
  });
}
