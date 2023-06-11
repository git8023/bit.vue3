# 依赖
`element-plus` / `qs`

# RestApi
`RestApi`使用示例
```ts
import { RestApi } from "@git8023/axios-config";

class Api extends RestApi {

  /**
   * 提供基础访问路径
   */
  modelUrl() {
    return '/user'
  }

  /**
   * 扩展接口
   * @param id 用户id
   */
  roles(id:string) {
    this.get(`${this._modelUrl}/roles/{id}`, {id});
  }
}

export const UserApi = new Api();
```
接口返回结果
```ts
interface R<T = any> {
  code?: number;
  data?: T;
  message?: string;
}
```
