<template>
  <div class="context-menu-root" :style="styles">
    <div class="context-menu-mask" @click.prevent="hide()" @contextmenu.prevent="hide()"/>
    <div class="menus" ref="menusRef">
      <div :class="{title:hasTitleSlot}" ref="titleRef">
        <slot name="title"/>
      </div>
      <ul>
        <template v-for="item in menus" :key="item.text">
          <li v-if="!item.hidden || !item.hidden(data, item)" class="item flex-row-center"
              @click="onItemClick(item)" :class="{disabled:item._disabled, [item.customClass]:true}"
              @contextmenu.prevent="onItemClick(item)">
            <el-icon class="icon">
              <Component :is="item.icon" v-if="item.icon"/>
            </el-icon>
            <div class="dc-flex-1">{{ item.text }}</div>
            <div class="shortcut">
              <span v-if="item.keyboard">({{ item.keyboard }})</span>
            </div>
          </li>
        </template>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { Arrays } from '@git8023/toolkit.array';
import { Builders } from '@git8023/toolkit.build';
import { Functions } from '@git8023/toolkit.funcs';
import { Promises } from '@git8023/toolkit.promise';
import { Validation } from '@git8023/toolkit.validation';
import { scopedEventKeydown } from '@git8023/vue3.decorators';
import * as vms from './types';

@Options({
  components: {},
  emits: [],
})
export default class ContextMenu extends Vue {
  /** 鼠标事件 */
  @Prop({ required: true }) mouseEvent!: MouseEvent;

  /** 菜单列表 */
  @Prop({ required: true }) menus!: vms.IContextMenus;

  /** 附加数据 */
  @Prop() data!: any;

  styles: Partial<CSSStyleDeclaration> = { display: 'none' };
  hasTitleSlot = false;
  isShow = false;

  // 菜单显示容器引用
  get menusRef() {
    return this.$refs.menusRef as HTMLDivElement;
  }

  // 按键映射
  get menuKeyBroadMapper() {
    const menus = this.menus.filter((e) => e.keyboard).map((e) => {
      e.keyboard = e.keyboard!.toUpperCase() as any;
      return e;
    });
    return Arrays.toMap(menus, 'keyboard');
  }

  @Watch('mouseEvent', { immediate: true })
  watch$mouseEvent() {
    if (this.mouseEvent) {
      this.mouseEvent.preventDefault();
      this.showContextMenuBox(this.mouseEvent);
      return;
    }
    this.hide();
  }

  // 组件挂载
  @scopedEventKeydown<ContextMenu>('onKeydownHandler')
  mounted() {
  }

  // 按键处理
  onKeydownHandler(e: KeyboardEvent) {
    if (!this.isShow) return;

    const keyName = e.key.toUpperCase();
    Functions.exec(this.onItemClick, this, this.menuKeyBroadMapper[keyName]);
  }

  // 显示
  showContextMenuBox(e: MouseEvent) {
    this.isShow = true;
    this.styles.display = 'block';
    this.styles.left = `${ e.clientX }px`;
    this.styles.top = `${ e.clientY }px`;

    this.checkMenusState();
    this.repairPosition();
  }

  // 校验菜单状态
  checkMenusState() {
    this.menus.forEach((item) => {
      item.disabled = item.disabled || Builders.getterSelf(false);
      item._disabled = (item.disabled!(this.data, item) !== false);
    });
  }

  // 隐藏
  hide() {
    this.styles.display = 'none';
    this.isShow = false;
  }

  // 点击菜单项
  onItemClick(menu: vms.IContextMenu) {
    if (menu._disabled) return;

    const isFunc = Validation.isFunction(menu.click) || Validation.is(menu.click, 'AsyncFunction');
    if (!isFunc) return;

    const result = menu.click(this.data, menu);
    Promises.of(result).then((closable) => (closable !== false) && this.hide());
  }

  // 修正位置
  repairPosition() {
    Functions.timer(() => {
      const rect = this.menusRef.getBoundingClientRect();
      const dh = rect.height + rect.top - window.innerHeight;
      this.styles.top = dh > 0 ? `${ this.mouseEvent.clientY - dh }px` : this.styles.top;

      const dw = rect.width + rect.left - window.innerWidth;
      this.styles.left = dw > 0 ? (`${ this.mouseEvent.clientX - dw }px`) : this.styles.left;

      this.checkTitleSlot();
    });
  }

  // 是否存在slot:name
  checkTitleSlot() {
    const titleRef = this.$refs.titleRef as HTMLDivElement;
    this.hasTitleSlot = titleRef ? (titleRef.children.length > 0) : false;
  }

}
</script>

<style scoped lang="scss">
.context-menu-root{z-index:5000;
  --default-color:#6cb1ff;
  //--default-color:#333;
  --danger-color:#f56c6c;
  --warning-color:#e6a23c;
  &, .context-menu-mask{position:fixed; top:0; left:0; width:100%; height:100%; background:transparent;}
  .title{border-bottom:1px solid #eee; margin:.5rem;}
  .menus{ position:absolute; top:0; left:0; background:#fff; border:1px solid var(--default-color); min-width:200px; padding-top:5px; padding-bottom:5px;
    border-radius:5px; box-shadow:3px 3px 3px rgba(0, 0, 0, .2); user-select:none;
    .item{padding:.5rem; transition:all .3s; cursor:pointer; color:var(--default-color);
      &:before{background-color:var(--default-color); opacity:.1;}
      &.danger{color:var(--danger-color);
        &:hover{background-color:var(--danger-color);}
      }
      &.warning{color:var(--warning-color);
        &:hover{background-color:var(--warning-color);}
      }
      &:hover{background:var(--default-color); color:#fff;}
      &.disabled{color:#aaa; cursor:not-allowed;
        &:hover{background:transparent;}
      }
      .icon{width:2rem; display:inline-block; text-align:center;}
      .shortcut{width:20px; font-size:1rem;}
    }
    .item + .item{ position:relative; z-index:1;
      &:before{content:' '; position:absolute; top:0; left:50%; transform:translateX(-50%); width:90%; height:1px; z-index:0;}
    }
  }
}
</style>
