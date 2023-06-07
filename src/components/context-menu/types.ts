import { types } from '@git8023/toolkit.type-define';

export type IContextMenu<T = any> = {
  /** 图标 */
  icon: string;
  /**
   * 选项
   */
  text: string;
  /**
   * 菜单项点击事件
   * @param rowData 行数据
   * @param menu 菜单项
   *
   * @example
   * // 如果要在click中调用Vue实例相关API, 需要在getter中返回数据
   * get contextMenus() {
   *   return [
   *     { text: '编辑', click: (data: any) => this.onEdit(data) },
   *   ];
   * }
   */
  click: (rowData: T, menu: IContextMenu) => types.FalsyLike;
  /**
   * 检测是否禁用
   */
  disabled?: (rowData: T, menu: IContextMenu) => types.FalsyLike;
  /** 是否已经被禁用 */
  _disabled?: boolean;
  /** 自定义样式 */
  customClass?: 'danger' | 'warning' | & string;
  /** 是否隐藏菜单项 */
  hidden?: (rowData: T, menu: IContextMenu) => types.FalsyLike;
  /** 快捷按键 */
  keyboard?: KeyBroadLetter;
}

/** 键盘字母 */
export type KeyBroadLetter =
  'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L'
  | 'M'
  | 'N'
  | 'O'
  | 'P'
  | 'Q'
  | 'R'
  | 'S'
  | 'T'
  | 'U'
  | 'V'
  | 'W'
  | 'X'
  | 'Y'
  | 'Z';

/** 表格行右键菜单 */
export type IContextMenus<T = any> = IContextMenu<T>[];
