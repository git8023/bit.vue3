<template>
  <div>

    <div @contextmenu.stop="onShowContextMenu($event)" style="background:pink; width:300px; height:300px;">
      点击右键
    </div>

    <ContextMenu :menus="menus" :mouse-event="mouseEvent"/>
  </div>
</template>

<script lang="ts">

import { Options, Vue } from 'vue-class-component';
import ContextMenu from './ContextMenu.vue';
import { IContextMenu, IContextMenus } from './types';

@Options({
  components: { ContextMenu },
})
export default class Main extends Vue {
  private mouseEvent: MouseEvent = null as any;

  get menus() {
    return [
      {
        icon: '',
        text: '选项A',
        click: this.onClick,
      },
      {
        icon: '',
        text: '选项 B',
        click: this.onClick,
        disabled: (data, menu) => true,
      },
      {
        icon: '',
        text: '选项C',
        click: this.onClick,
        customClass: 'danger',
      },
      {
        icon: '',
        text: '选项C',
        click: this.onClick,
        customClass: 'warning',
      },
    ] as IContextMenus;
  }

  onShowContextMenu(e: MouseEvent) {
    this.mouseEvent = e;
  }

  onClick(data: any, menu: IContextMenu) {
    console.log('触发选项', data, menu);
  }
}
</script>
