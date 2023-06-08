vuex状态管理模板化

# 依赖

- yarn add vuex
- yarn add vuex-class

# Example

用户状态管理定义

```ts
const moduleX = StoreTools.generate({
  /**
   * 生成同名 getter/mutation/action
   */
  info: Cast.anyO as entity.UserEntity,
  token: '',

  // _a 后缀表明该属性仅用于 actions 类型推导
  // 类似的 _m 后缀可用于表示仅用于 mutations 类型推导
  restoreFromSession_a: null,
}, true, 'user');

// 数据类型
type T = ReturnType<typeof moduleX.__state_type__>;

// 扩展属性
export const user = {
  ...moduleX,
  actions: {
    ...moduleX.actions,

    // 扩展属性具体实现
    restoreFromSession_a: async (ctx: vuex.ActionContext<T>) => {
      // do something
    }
  }
}
```

注册到vuex

```ts
import { user } from '@/store/mod/user';
import { createStore } from 'vuex';

const modules = [user].reduce((r, e) => {
  // @ts-ignore
  r[e.__name__] = e;
  return r;
}, {});

export default createStore({
  modules,
});
```

为方便调用，注册到模块

```ts
import { user } from '@/store/mod/user';
import { StoreTools } from '@hyong8023/tool-box';

export class mod {
  static readonly user = StoreTools.namespaceX(user);
}
```

组件中使用

```vue

<template></template>
<script lang="ts">
@Options({
  components: {},
  emits: [],
})
export default class OrderList extends Vue {
  @mod.user.Getter('info') currentUser!: entity.UserEntity;
  @mod.user.Action('info') setCurrentUser!: (user: entity.UserEntity) => Promise<any>;
}
</script>
```

~~~~
