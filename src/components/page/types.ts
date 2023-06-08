/** 选中的表格行 */
export interface TableRowSelected<T = any> {
  /** 选中的行 */
  rows: T[];
  /** 触发事件的行 */
  row: T;
}
