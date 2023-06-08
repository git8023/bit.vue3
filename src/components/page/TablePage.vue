<template>
  <div :class="{'dc-full-height':fixedTableHeightInner}" class="table-page-root dc-flex-col">

    <!--表头-->
    <div class="table-page-header">
      <slot name="header"/>
    </div>

    <!--表格-->
    <div ref="tableBoxRef" class="dc-flex-1 height__zero z-index__10">
      <el-table v-if="showTable" ref="tableRef" :data="page.list" :height="tableHeight" border
                width="100%" @select="onSelectInner" @select-all="onSelectInner"
                :row-class-name="rowClassName" @expand-change="onExpandChangeInner"
                :highlight-current-row="highlightCurrentRow" @current-change="currentChange"
                @row-contextmenu="rowContextMenuHandler">
        <el-table-column type="index" width="50" label="#"/>
        <slot/>
      </el-table>
    </div>

    <!--分页条-->
    <Pagination v-if="showPagerInner" :page="page" :search="search"/>

    <!--数据行右键菜单-->
    <ContextMenu :menus="contextMenus" :data="contextData" :mouse-event="contextMouseEvent">
      <template #title>
        <slot name="context-menu-title"/>
      </template>
    </ContextMenu>
  </div>
</template>

<script lang="ts">
import Pagination from './Pagination.vue';
import { types, fns } from '@git8023/toolkit.type-define';

// import { Cast, fns, Functions } from '@hyong8023/tool-box';
import { Cast } from '@git8023/toolkit.cast';
import { Functions } from '@git8023/toolkit.funcs';

import { TableInstance } from 'element-plus';
import { Options, Vue } from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { vms } from '@/type/vms';
import ContextMenu from '@/components/context-menu/ContextMenu.vue';

export type SelectEvent = { rows: any[], row: any, tableRef: TableInstance };

@Options({
  components: { ContextMenu, Pagination },
  emits: ['update:selection', 'row-contextmenu'],
})
export default class TablePage<T> extends Vue {
  @Prop({ required: true }) page!: Pick<types.Page<T>, 'list'>;
  @Prop({ default: false }) showPager!: boolean;
  @Prop({ default: true }) fixedTableHeight!: boolean;
  @Prop() selection!: any[];
  @Prop({ default: true }) highlightCurrentRow!: boolean;
  @Prop() contextMenus!: vms.ContextMenus;
  @Prop() rowClassName!: string | ((row: any, rowIndex: any) => string);

  @Prop() currentChange!: (currentRow: any, oldCurrentRow: any) => void;
  @Prop() search!: fns.Caller;
  @Prop() expandChangeEvent!: (row: any, expandedRows: any[]) => void;
  @Prop() select!: fns.Consume<SelectEvent>;

  showPagerInner = false;
  fixedTableHeightInner = true;
  tableHeight: string | number = 'auto';
  showTable = false;
  selectionInner: any[] = [];
  contextMouseEvent: MouseEvent = null as any;
  contextData: any = Cast.anyO;

  get tableRef() {
    return this.$refs.tableRef as TableInstance;
  }

  // 表格外部盒子引用
  tableBoxRef() {
    return this.$refs.tableBoxRef as HTMLElement;
  }

  @Watch('showPager', { immediate: true })
  watch$showPager() {
    this.showPagerInner = this.showPager || `${ this.showPager }`.length === 0;
  }

  @Watch('fixedTableHeight', { immediate: true })
  watch$fixedTableHeight() {
    this.fixedTableHeightInner = this.fixedTableHeight || `${ this.fixedTableHeight }`.length === 0;
  }

  @Watch('selection', { immediate: true })
  watch$selection() {
    this.selectionInner = this.selection || [];
  }

  @Watch('selectionInner', { deep: true })
  watch$selectionInner() {
    this.$emit('update:selection', this.selectionInner);
  }

  // 组件挂载
  mounted() {
    this.showTable = !this.fixedTableHeightInner;
    if (this.fixedTableHeightInner) {
      const elRect = this.tableBoxRef().getBoundingClientRect();
      this.tableHeight = elRect.height;
      this.showTable = true;
    }

    Functions.timer(() => {
      this.tableRef.clearSelection();
      this.selectionInner.forEach((e) => this.tableRef.toggleRowSelection(e, true));
    });
  }

  // 表格展开事件
  onExpandChangeInner(row: any, rows: any) {
    Functions.call(this.expandChangeEvent as fns.Function, row, rows);
  }

  // 选中事件
  onSelectInner(selection: any[], row?: []) {
    this.selectionInner = selection;
    Functions.call(this.select, {
      rows: selection,
      row,
      tableRef: this.tableRef,
    } as vms.TableRowSelected);
  }

  // 数据行右键菜单事件
  rowContextMenuHandler(row: T, column: any, ev: MouseEvent) {
    if (this.contextMenus && this.contextMenus.length) {
      this.contextData = row;
      this.contextMouseEvent = ev;

      this.tableRef.setCurrentRow(row);
    }
  }
}
</script>

<style lang="scss" scoped>
.table-page-header{transform:translateY(1px);}
</style>
