# 表格数据

对`el-pagination`/`el-table`二次封装

# 依赖

```json
{
  "element-plus": "^2.3.6",
  "vue": "^3.2.13",
  "vue-class-component": "^8.0.0-0",
  "vue-property-decorator": "^9.1.2"
}
```

1. 配置[element-plus](https://element-plus.org/zh-CN/guide/design.html)

```ts
// main.ts
const app = createApp(App);

// 注册组件
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import zhCn from 'element-plus/es/locale/lang/zh-cn';

app.use(ElementPlus, { locale: zhCn });

// icon需要单独注册
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}
```

2. `main.ts`引入样式

```ts
import '@git8023/toolkit._style/dc-base.scss';
```

# 示例

```vue
<template>
  <div style="padding:1rem;">
    <TablePage :page="page" :search="onSearch" show-pager :context-menus="contextMenus" :fixed-table-height="false">
      <el-table-column label="订单编号" prop="code"/>
      <el-table-column label="简称" prop="title"/>
      <el-table-column label="管理者" prop="$managerUser.username"/>
      <el-table-column label="描述" prop="description"/>
      <el-table-column label="操作" width="260">
        <template #default="{row}">
          <el-button link type="primary">编辑</el-button>
          <el-button link type="primary">查看附件</el-button>
          <el-button link type="primary">管理项</el-button>
        </template>
      </el-table-column>
    </TablePage>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';

import { IContextMenu, IContextMenus } from '@/@bit/vue3/context-menu/types';
import TablePage from '@/@bit/vue3/page/TablePage.vue';
import { types } from '@/@bit/vue3/page/table-page.import';

@Options({
  components: {
    TablePage
  },
  emits: []
})
export default class TablePageTest extends Vue {

  page: types.Page = {
    current: 1,
    size: 10,
    total: 0,
    list: []
  };

  get pageParam() {
    return {
      current: this.page.current,
      size: this.page.size
    } as types.Page;
  }

  get contextMenus() {
    return [
      {
        text: '选项A',
        icon: 'Edit',
        click: this.onContextMenuClick
      },
      {
        text: '选项A',
        icon: 'Edit',
        disabled: () => true,
        click: this.onContextMenuClick
      },
    ] as IContextMenus;
  }

  mounted() {
    this.onSearch();
  }

  onSearch() {
    console.log('onSearch');

    this.page = {
      current: this.page.current,
      size: this.page.size,
      total: 50,
      list: new Array(this.page.size)
          .fill({
            code: 'Odr-A_' + this.page.size + '_' + this.page.current,
            title: 'Title_' + this.page.size + '_' + this.page.current,
            $managerUser: { username: 'Admin_' + this.page.size + '_' + this.page.current, },
            description: 'description_' + this.page.size + '_' + this.page.current,
          })
          .map((e) => ({ ...e }))
    };
  }

  onContextMenuClick(data: any, menu: IContextMenu) {
    console.log('onContextMenuClick', data, menu);
  }
}
</script>

<style scoped lang="scss">
</style>

```
