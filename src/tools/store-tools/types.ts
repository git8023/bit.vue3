import { types } from '@git8023/toolkit.type-define';
import { VuexDecorator } from 'vuex-class/lib/bindings';

/**
 * Vuex类型依赖
 */
export namespace vuex {

  export type ActionContext<S, R = any> = {
    state: S;
    rootState: R;
    commit(
      type: string,
      ...args: any[]
    ): void;
  }

  export type MutationTree<T> = types.RecordS<(
    state: T,
    payload?: any,
  ) => any>

  export type ActionTree<T, R = any> = types.RecordS<(
    ctx: ActionContext<T, R>,
    payload?: any,
  ) => void>

  export type GetterTree<S, R = any> = types.RecordS<(
    state: S,
    getters: any,
    rootState: R,
    rootGetters: any,
  ) => any>;

  export interface ModuleTree<R> {
    [key: string]: Module<any, R>;
  }

  export interface Module<S, R> {
    namespaced?: boolean;
    state?: S | (() => S);
    getters?: GetterTree<S, R>;
    actions?: ActionTree<S, R>;
    mutations?: MutationTree<S>;
    modules?: ModuleTree<R>;
  }

  export interface ModuleX<S, R> extends Module<S, R> {

    /** 命名空间名字 */
    readonly __name__: string;

    /**
     * 重置状态
     */
    __reset__(): void;

    /**
     * 仅用于State类型获取, 返回值总是undefined
     */
    __state_type__(): S;

    /**
     仅用于State类型属性获取, 返回值总是undefined
     */
    __state_type_key__(): keyof S;
  }

  export type NamespaceT<T> = {
    State: (transfer: (prop: keyof T) => any) => VuexDecorator;
    Getter: (prop: keyof T) => VuexDecorator;
    Mutation: (prop: keyof T) => VuexDecorator;
    Action: (prop: keyof T) => VuexDecorator;
  }

  export type NamespaceX = <T extends object>(store: vuex.ModuleX<T, any>) => vuex.NamespaceT<T>;
}
