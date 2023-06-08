<template>
  <div class="box dc-text-center padding-1rem">
    <div class="dc-inline-block">
      <el-pagination :total="page.total" :page-size="page.size" :page-sizes="[10,20,50,100]"
                     :current-page="page.current" background :layout="layout"
                     @size-change="onSizeChange" @current-change="onCurrentChange"/>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { Functions, types, fns } from './pagination.import';

type LayoutItem = 'total' | 'sizes' | 'prev' | 'pager' | 'next' | 'jumper'

@Options({
  components: {},
  emits: [],
})
export default class Pagination extends Vue {

  @Prop({ required: true }) page!: types.Page;
  @Prop({ default: ['total', 'sizes', 'prev', 'pager', 'next', 'jumper'] }) layouts!: LayoutItem[];
  // 会阻止发送 onSizeChange/onCurrentChange 事件
  @Prop() search!: fns.Caller;

  get layout() {
    return this.layouts.join(',');
  }

  // 页大小变化
  onSizeChange(size: number) {
    this.page.size = size;
    Functions.call(this.search);
  }

  // 页码变化
  onCurrentChange(current: number) {
    this.page.current = current;
    Functions.call(this.search);
  }
}
</script>

<style scoped lang="scss">
.padding-1rem{padding:1rem;}
</style>
