import { Arrays, Cast, Jsons, Strings, types, Validation } from '@git8023/toolkit.all-export';
import { AxiosResponse } from 'axios';
import { R } from './result-type';
import { service } from './axios-serve';

/**
 * 接口请求基类
 *
 * @example
 * class API extends BaseApi<entity.ProductEntity> {
 *   protected modelUrl(): string {
 *     return '/product';
 *   }
 * }
 *
 * export const ProductApi = new API();
 */
export abstract class RestApi<T extends types.BaseEntity> {

  /** 模块基础地址 */
  protected readonly _modelUrl: string = '';

  constructor() {
    this._modelUrl = this.modelUrl();
  }

  /**
   * 模块路径
   *
   * - e.g.: /user, /product
   */
  protected abstract modelUrl(): string;

  /**
   * 构建相对于ModelUrl请求路径
   * @param uri 相对路径
   * @protected
   */
  protected _url(uri: string): string {
    uri = Strings.trimToEmpty(uri);
    uri = uri.startsWith('/') ? uri.substring(1) : uri;
    return `${ this._modelUrl }/${ uri }`;
  }

  /**
   * 指定id获取数据
   * @param id 数据id
   * @param [vm] 对象实例
   * @param [prop] 将返回的数据设置到该属性上
   */
  getById<VM extends Record<P, any>, P extends keyof VM>(id: string, vm?: VM, prop?: P): Promise<T> {
    return this.get<T>(`${ this._modelUrl }/${ id }`).then((data) => {
      if (vm && prop) {
        console.log('查询结果回填到vm', vm, prop);
        Jsons.set(vm, prop, data);
      }
      return data;
    });
  }

  /**
   * 指定id列表查询数据列表
   * @param ids id列表
   * @see getByIdsWithFill
   */
  getByIds(ids: string[]): Promise<T[]> {
    return this.post(`${ this._modelUrl }/getByIds`, undefined, { ids });
  }

  /**
   * 引用回填
   * @param list 原始数据列表
   * @param refIdProp 引用外键id
   * @param refObjProp 引用外键回填对象
   */
  async getByIdsWithFill<E extends types.BaseEntity>(list: E[], refIdProp: keyof E, refObjProp: keyof E) {
    const tempList = list.filter((e) => Jsons.get(e, refIdProp));
    const idGroup = Arrays.group(tempList, refIdProp);
    const ids = Object.keys(idGroup).filter((e) => !!e);
    if (Validation.isEmpty(ids)) return;

    await this.getByIds(ids).then((beans) => {
      (beans || []).forEach((o) => {
        (idGroup[o.id] || []).forEach((e) => {
          Jsons.set(e, refObjProp, o);
        });
      });
    });
  }

  /**
   * 列表分页查询
   * @param params 请求参数
   */
  list(params: types.Page<T> & Partial<T>): Promise<types.Page<T>> {
    return this.get(this._modelUrl, undefined, params);
  }

  /**
   * 查询列表(不分页)
   * @param params 请求参数
   */
  listAll(params: types.Page<T> = Cast.anyO): Promise<T[]> {
    params = params || Cast.anyO;
    params.current = -1;
    return this.get<types.Page>(this._modelUrl, undefined, params).then((data) => data.list!);
  }

  /**
   * 查询列表(不分页)
   * @param vm 请求参数
   * @param prop Vue实例
   * @param params 请求参数
   */
  listAllWith<VM extends Record<P, any>, P extends keyof VM>(vm?: VM, prop?: keyof VM, params: any = Cast.anyO): Promise<T[]> {
    params = params || Cast.anyO;
    params.current = -1;
    return this.listAll(params)
      .then((data) => {
        if (vm && prop) {
          Jsons.set(vm, prop, data);
        }
        return data;
      });
  }

  /**
   * 添加新数据
   * @param data 数据
   */
  add(data: Partial<T>): Promise<any> {
    return this.post(this._modelUrl, undefined, data);
  }

  /**
   * 指定id更新数据
   * @param id 数据id
   * @param data 数据
   */
  update(id: string, data: Partial<T>): Promise<any> {
    return this.put(`${ this._modelUrl }/{id}`, { id }, data);
  }

  /**
   * 指定id删除数据
   * @param id 数据id
   */
  delById(id: string): Promise<void> {
    return this.delete(`${ this._modelUrl }/{id}`, { id });
  }

  /**
   * 提取目标数据
   * @param resp 响应数据
   * @private
   */
  protected extraData(resp: AxiosResponse<R>): any {
    return Jsons.get(resp, 'data.data');
  }

  /** Method:GET */
  protected get<T = void>(uri: string, pathVariable?: Record<string, string | number>, params?: any): Promise<T> {
    uri = this.replacePathVariables(uri, pathVariable);
    return service.get(uri, { params }).then(this.extraData);
  }

  /** Method:POST */
  protected post<T = void>(uri: string, pathVariable?: Record<string, string | number>, data?: any): Promise<T> {
    uri = this.replacePathVariables(uri, pathVariable);
    return service.post(uri, data).then(this.extraData);
  }

  /** Method:PUT */
  protected put<T = void>(uri: string, pathVariable?: Record<string, string | number>, data?: any): Promise<T> {
    uri = this.replacePathVariables(uri, pathVariable);
    return service.put(uri, data).then(this.extraData);
  }

  /** Method:DELETE */
  protected delete<T = void>(uri: string, pathVariable?: Record<string, string | number>, params?: any): Promise<T> {
    uri = this.replacePathVariables(uri, pathVariable);
    return service.delete(uri, { params }).then(this.extraData);
  }

  /** 替换路径变量 */
  private replacePathVariables(uri: string, pathVariable?: Record<string, string | number>) {
    if (!pathVariable) return uri;

    const mapper = Object.keys(pathVariable).reduce((r, k) => {
      r[`{${ k }}`] = Strings.trimToEmpty(pathVariable[k] as any);
      return r;
    }, {} as Record<string, string>);

    return Strings.replaceAll(uri, mapper);
  }
}
