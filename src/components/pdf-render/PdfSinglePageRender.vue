<template>
  <div class="root root-box__flex_col dc-pos-relative">

    <div class="dc-flex-1 border height__zero canvas-box flex-row-center" @mouseup.stop="stopMove($event)" @mousemove.stop="handleMove($event)" @mousedown.stop="startMove($event)" @mousewheel.stop="onMouseZoom($event)">
      <div class="dc-flex-1 width__zero dc-pos-relative" ref="canvasBox">
        <canvas ref="renderCvs" class="main-render"/>
      </div>
    </div>

    <div class="dc-text-center options">
      <div class="flex-row-center gap-bottom-1rem">
        <div class="dc-flex-1 title">{{ title }}</div>
        <div>
          <span class="dc-flex-1">缩放: {{ (this.realScale * 100).toFixed(0) }}%</span>
          <el-divider direction="vertical"/>
          <span class="dc-flex-1">页码: {{ this.currPage }} / {{ this.maxPages }}</span>
        </div>
      </div>

      <div class="bnts">
        <el-button type="primary" @click="zoomIn()" :disabled="this.scale >= scaleBounds.max">放大</el-button>
        <el-button type="primary" @click="zoomReset()" :disabled="disableZoomReset">还原</el-button>
        <el-button type="primary" @click="zoomOut()" :disabled="this.scale <= scaleBounds.min">缩小</el-button>
        <el-button type="primary" @click="prevPage()" :disabled="this.currPage<=1">上一页</el-button>
        <el-button type="primary" @click="nextPage()" :disabled="this.maxPages <= this.currPage">下一页</el-button>

        <div class="custom-btn dc-inline-block">
          <slot name="custom-btn"/>
        </div>
      </div>
    </div>

  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import * as PDFJS from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist';
import _ from 'lodash';
import { Prop, Watch } from 'vue-property-decorator';

// pdfjs-dist/build/pdf.worker.js 拷贝到 /public 目录下
PDFJS.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

@Options({
  components: {},
  emits: [],
})
export default class PdfSinglePageRender extends Vue {
  @Prop() buffer!: ArrayBuffer;
  @Prop({ default: 'PDF预览标题' }) title!: string;

  readonly scaleRatio = 0.05;
  readonly scaleBounds = {
    min: -0.2,
    max: 3,
  };
  readonly canvasSize = {
    width: 0,
    height: 0,
  };

  pdf!: PDFDocumentProxy;
  currPage = 1;
  maxPages: number = 0;
  scale = 0;
  waterMarkCanvas!: HTMLCanvasElement;
  realScale = 0;
  canvas: HTMLCanvasElement = null as any;
  wmText = '大宏立审核用图';

  moving = {
    active: false,
    beginPoint: {
      x: 0,
      y: 0,
    },
    transform: {
      x: 0,
      y: 0,
    },
    transformTmp: {
      x: 0,
      y: 0,
    },
  };

  // 画布容器
  get canvasBox() {
    return this.$refs.canvasBox as HTMLDivElement;
  }

  @Watch('buffer')
  async watch$buffer() {
    if (!this.buffer) {
      console.error('buffer传递错误');
      return;
    }

    const loadingTask = PDFJS.getDocument(this.buffer);

    this.pdf = await loadingTask.promise
      .then((pdf: PDFDocumentProxy) => {
        console.log('获取成功');
        return pdf;
      })
      .catch((e: any) => {
        console.error('PDF获取失败,', e);
        return Promise.reject(e);
      });
    this.maxPages = this.pdf.numPages;
    this.currPage = 1;

    await this.tryRenderPage(0);
  }

  // 组件挂载
  async mounted() {
    setTimeout(() => {
      const canvas = this.$refs.renderCvs as HTMLCanvasElement;
      this.canvasSize.width = this.canvasBox.clientWidth;
      this.canvasSize.height = this.canvasBox.clientHeight;
      canvas.remove();
    });
  }

  // 禁用还原
  // - 无缩放
  // - 无位移
  get disableZoomReset() {
    return !this.scale && !this.moving.transform.x && !this.moving.transform.y;
  }

  // 水印canvas
  get waterMarker() {
    if (this.waterMarkCanvas) return this.waterMarkCanvas;

    const rotateAngle = -15 * Math.PI / 180;
    const tmpCvs = document.createElement('canvas');
    this.waterMarkCanvas = tmpCvs;

    tmpCvs.width = 200;
    tmpCvs.height = 100;
    const tmpCtx = tmpCvs.getContext('2d')!;
    tmpCtx.rotate(rotateAngle);
    tmpCtx.font = '15px serif';
    tmpCtx.fillStyle = 'rgba(0,0,0,.2)';
    tmpCtx.fillText(this.wmText, 10, tmpCvs.height / 2);

    return this.waterMarkCanvas;
  }

  // 渲染指定页
  async renderPage(num: number) {
    this.currPage += num;
    const page = await this.pdf.getPage(this.currPage);

    // 计算缩放率
    const originViewport = page.getViewport({ scale: 1 });
    const heightScale = this.canvasSize.height / originViewport.height;
    const widthScale = this.canvasSize.width / originViewport.width;
    const scale = Math.min(heightScale, widthScale) + this.scale;
    this.realScale = scale;

    const viewport = page.getViewport({ scale: scale });

    // Support HiDPI-screens.
    const outputScale = window.devicePixelRatio || 1;

    // const canvas = this.canvas;
    const setSize = (canvas: HTMLCanvasElement) => {
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${ Math.floor(viewport.width) }px`;
      canvas.style.height = `${ Math.floor(viewport.height) }px`;
      return canvas;
    };

    if (this.canvas) {
      this.canvas.remove();
    }

    const cvs = document.createElement('canvas');
    this.canvas = cvs;
    this.setTransform();
    cvs.classList.add('main-render');
    this.canvasBox.appendChild(cvs);
    setSize(cvs);
    const context = cvs.getContext('2d') as CanvasRenderingContext2D;

    const transform = outputScale !== 1
      ? [outputScale, 0, 0, outputScale, 0, 0]
      : null;

    const options = {
      canvasContext: context,
      transform: transform,
      viewport: viewport,
    };
    await page.render(options as any).promise;
    this.setWaterMarker(context);
  }

  // 兜底
  tryRenderPage(num: number, retry = true): Promise<void> {
    return this.renderPage(num)
      .catch((e) => {
        if (!retry) {
          console.error('渲染失败', e);
          return;
        }

        console.info('渲染失败, 200ms后重试');
        return new Promise((resolve) => {
          setTimeout(async () => {
            await this.tryRenderPage(num, false);
            resolve();
          }, 200);
        });
      });
  }

  // 下一页
  nextPage() {
    if (this.currPage >= this.maxPages) {
      console.debug('当前已经是最后一页');
      return;
    }
    this.tryRenderPage(1);
  }

  // 上一页
  prevPage() {
    if (this.currPage <= 1) {
      console.debug('当前已经是第一页');
      return;
    }
    this.tryRenderPage(-1);
  }

  // 放大
  zoomIn() {
    this.debounceZoom(this.scaleRatio);
  }

  // 还原
  zoomReset() {
    this.canvas.width = this.canvasSize.width;
    this.canvas.height = this.canvasSize.height;
    this.canvas.style.width = `${ this.canvas.width }px`;
    this.canvas.style.height = `${ this.canvas.height }px`;
    this.canvas.style.transform = 'translate(0,0)';

    this.moving = {
      active: false,
      beginPoint: {
        x: 0,
        y: 0,
      },
      transform: {
        x: 0,
        y: 0,
      },
      transformTmp: {
        x: 0,
        y: 0,
      },
    };

    this.debounceZoom(-this.scale);
  }

  // 缩小
  zoomOut() {
    this.debounceZoom(-this.scaleRatio);
  }

  // 缩放
  zoom(incrScale: number) {
    if (incrScale < 0 && this.scale <= this.scaleBounds.min) {
      console.log('已经缩放到最小');
      return;
    }

    if (incrScale > 0 && this.scale >= this.scaleBounds.max) {
      console.log('已经缩放到最大');
      return;
    }

    this.scale += incrScale;
    this.tryRenderPage(0);
  }

  debounceZoom = _.debounce(this.zoom, 50);

  // 开始移动
  startMove(e: MouseEvent) {
    this.moving.active = true;
    this.moving.beginPoint = {
      x: e.x,
      y: e.y,
    };
  }

  // 处理拖动
  handleMove(e: MouseEvent) {
    if (!this.moving.active) return;

    const x = e.x - this.moving.beginPoint.x + this.moving.transform.x;
    const y = e.y - this.moving.beginPoint.y + this.moving.transform.y;
    this.moving.transformTmp = {
      x: x,
      y: y,
    };

    this.setTransform();
  }

  // 设置位移转换
  setTransform() {
    this.canvas.style.transform = `translate(${ this.moving.transformTmp.x }px, ${ this.moving.transformTmp.y }px)`;
  }

  // 停止移动
  stopMove(e: MouseEvent) {
    this.moving.active = false;
    this.moving.transform = { ...this.moving.transformTmp };
  }

  // 鼠标缩放
  onMouseZoom(e: WheelEvent) {
    if (e.deltaY < 0) this.zoomIn();
    else this.zoomOut();
  }

  // 设置水印
  setWaterMarker(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = ctx.createPattern(this.waterMarker, 'repeat')!;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
</script>

<style scoped lang="scss">
.root{background:transparent;
  .options{
    .title{font-size:1.5rem; text-align:left;}
  }
  .canvas-box{background:#0A1531; border:1px solid #0A1531; position:relative; text-align:center; overflow:hidden; min-height:0; cursor:grab;
    &:active{
      &, *{cursor:grabbing;}
    }
    .main-render{transition:all .3s; /*position:absolute;*/
      width:100%; height:100%; /* display:inline-block; left:50%; transform:translateX(-50%);*/
    }
  }
}
</style>
