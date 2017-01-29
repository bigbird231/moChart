/**
 * Created by yuhk on 2016/10/20.
 */

/*
 * note:mobileChart，简称moChart，是一个小型的图表绘制库，设计初衷是为了解决Echarts在移动端损耗性能。
 *
 * 从Echarts库的大小，以及其大量针对鼠标的事件处理可以看出，Echarts本身的设计思路就是PC端，要在性能相
 * 对较弱的移动端使用Echarts往往会带来很多问题。
 *
 * 目前mobileChart（以下简称moChart）只支持折线图、圆图（2016/10/24前将支持三角形图），并且考虑到移
 * 动端种种限制，moChart不支持任何事件处理，也不支持任何图例组件（通常图例都可以脱离于图标存在）。
 */

/*
 * 如何使用moChart
 *
 * moChart的使用和配置非常接近于Echarts的使用和配置，鉴于其小巧性，其配置也非常简单。在需要使用moChart
 * 的页面中导入最新版本的moChart.js，moChart会在全局环境下配置一个moChart对象，后续开发所做的任何配置
 * 和操作都始于这个对象。
 */
//示例：
//<script src="js/moChart.js"></script>
console.log(window.moChart);

/*
 * moChart对象有一个getPainter(container,requestClass)方法，第一个参数是放置canvas画布的dom节点对
 * 象，一般就是一个div引用，有一点要求就是这个div必须是明确确定高度和宽度样式属性，如果宽、高动态，则可
 * 能导致最终绘图错乱；requestClass是一个字符串数组，例如["line","circle"]就表示向moChart请求折线绘
 * 图类和圆绘图类，moChart会动态为你构建相应组件。getPainter方法返回一个Painter实例，通过对Painter进
 * 行配置，可以绘制出不同的图标来。
 * 此处注意：一个页面只有一个moChart，而一个moChart可以实例化多个Painter
 * ，每个container(通常就是div)可以对应一个或多个container。
 */
//示例：
var painter1=moChart.getPainter(document.getElementById("main1"),["line"]);
var painter2=moChart.getPainter(document.getElementById("main2"),["circle"]);
console.log(painter1,painter2);

/*
 * 获取了Painter实例之后，就可以来做相应的配置。Painter实例将会根据getPainter(container,requestClass)
 * 方法的第二个参数而动态的拥有不同的属性，例如上例中的painter1就拥有：painter1.lineControl属性，painter2
 * 就拥有：painter2.circleControl属性。每一格图表控制器有一个setOption(option)方法（option的详细说明详
 * 见后文），可以对图表进行配置，配置完成之后将会向moChart中部署一个绘图队列。整个页面的绘图队列部署完成之后
 * 可以调用moChart的draw()方法，来启动所有绘图。
 * 此处注意，一个页面周期内，moChart的draw()方法只能调用一次（异步定时器的复杂度导致，后期将进行优化升级），
 * 也就是说，在draw()方法之后配置的任何绘图队列将不会呈现出来，因此在调用draw()方法前请确认所有异步数据已经
 * 读取完成，并通过setOption成功配置。
 */
//示例：
var option={};
painter1.lineControl.setOption(option);
painter2.circleControl.setOption(option);
moChart.draw();



/*
 * 配置项说明文档
 * 没有特殊说明下，moChart的配置项都是可选的，以下示例在说明配置属性的同时也展示了默认配置项。
 * 必填项通常没有默认值。
 */

/*
 * lineControl配置项说明
 */
var option={
    /*
     * 布局定位，可选。
     * Number，小数，最终效果为container(通常就是一个div)的百分比。
     * a上间距，b右间距，c下间距,d左间距。
     */
    layout:{a:0,b:0,c:0,d:0},
    /*
     * 动画，可选。
     * String
     * "none"表示没有动画；"flow"表示流式动画；
     */
    animate:"none",
    /*
     * x轴，可选。
     * 目前x轴只能在左边和右边绘制轴值
     */
    xLabel:{
        /*
         * 字体颜色，可选。
         * String
         * 和css的颜色一样，支持"#000","#000000","rgb(0,0,0)","rgba(0,0,0,0)"形式
         */
        fontColor:"#888",
        /*
         * 字体大小，可选。
         * Number
         */
        fontSize:24,
        /*
         * 左端轴值，可选。
         * String
         */
        start:"",
        /*
         * 右端轴值，可选。
         * String
         */
        end:""
    },
    /*
     * y轴，可选。
     */
    yLabel:{
        fontColor:"#888",
        fontSize:24,
        /*
         * y轴值布局定位，可选。
         * String
         * "left"为左y轴；"right"为右y轴
         */
        float:"left",
        /*
         * y轴最大值取值方式，可选。
         * Function，传入一个数组，返回一个最大值
         */
        calcMax:Math.max,
        /*
         * y轴最小值取值方式，可选。
         * Function,传入一个数组,返回一个最小值
         */
        calcMin:Math.min,
        /*
         * y轴值补充标记，可选。
         * String
         * 例如可以设置为"%"来让y轴值显示百分数
         */
        mark:"",
        /*
         * y轴分段，可选。
         * Number
         * 数值可以是任意值，moChart将根据数据来调整
         */
        split:3,
        /*
         * y轴值是否自适应，可选。
         * Boolean
         * 如果需要显示K线这样的折线图，y轴值不经过任何取舍，就需要设置为false
         */
        fitValue:true
    },
    /*
     * 网格，可选。
     * String，y轴主轴线不受该配置影响，始终未实心线。
     * "dotted"为点状虚线；"solid"为实心虚线。
     */
    grid:"dotted",
    /*
     * 折线图配置项，必填。
     * Array
     * 该项为数组，如果要在折线图内绘制多条折线，则分别配置成数组的不同项即可。
     */
    items:[
     {
         /*
          * 线条数据，必填。
          * Array，存放Number类型
          */
         value:[],
         /*
          * 线条颜色，可选。
          * String,同css颜色类型
          */
         color:"#000",
         /*
          * 线条粗细，可选。
          * Number
          */
         lineWidth:2,
         /*
          * 阴影
          * 如果有，必填；没有的话，不填。
          */
         gradient:{
             /*
              * 阴影起始下标，必填。
              * Number
              */
             start:0,
             /*
              * 阴影结尾后一个点的下标，必填。
              * Number
              */
             end:0,
             /*
              * 渐变色，必填。
              * 中间可以定义任意数量的过渡点。
              */
             colorStop:{0:"#fa5d5d",0.2:"rgb(0,2,4)",0.5:"#fcc",1:"#fee"},
             /*
              * 渐变区域透明度，必填。
              * Number
              */
             alpha:0.8
        }
     },
     /*
      * 第二条折线...
      */
     {value:[],color:"#4a90e2",lineWidth:2}
     ],
    /*
     * 动画时长，可选。
     * Number,以毫秒为单位
     */
    totalTime:1000,
};

/*
 * circleControl配置项说明
 */
var option={
    //布局，可选
    layout:{a:0,b:0,c:0,d:0},
    /*
     * 动画，可选
     * "none"：没有动画；"flow":流式动画。
     */
    animate:"none",
    /*
     * 数据项
     * [[]],二维数组
     * 外层数组的不同项将在布局区域内均匀显示，内层数组的不同项将在同一个圆心上显示。
     * 所有圆都显示在垂直居中一排上，不会进行换行处理。
     */
    items:[
      [
          {
              /*
               * 圆心文字
               * Array
               * 如果数组内只有一项，则该文字在圆心显示；若有两项，则两项文字上下分部显示。
               * 一个同心圆组应该只配置一次文字，否则后面配置的文字会重叠在前面的文字上。
               */
              showText:[{
                          /*
                           * 文字值，可选
                           * String
                           */
                            value:"",
                          /*
                           * 文字颜色，可选
                           * String
                           * 同css颜色
                           */
                            fontColor:"#888",
                          /*
                           * 字体大小，可选
                           * Number
                           */
                            fontSize:24},
                      /*
                       * 下一组文字配置
                       */
                        {}],
              /*
               * 圆类型，可选
               * String
               * "stroke"：绘制圆环；"fill":绘制实心圆。
               */
              type:"stroke",
              /*
               * 圆颜色，可选
               * String
               * 同css颜色
               */
              color:"#000",
              /*
               * 圆环粗细，可选
               * Number
               * 只有type为"stroke"时有效。其他情况下会无视该参数。
               */
              lineWidth:10,
              /*
               * 半径，必填
               * Number，小数，最终计算为整个布局区域的相对宽度
               */
              r:0.25,
              /*
               * 起始角度，必填
               * Number
               * 0度为时钟3点钟方向，以此类推,单位为角度。
               */
              startAngle:0,
              /*
               * 终止角度，必填
               * Number
               */
              endAngle:360,
              /*
               * 旋转朝向，可选。
               * Boolean
               * false为顺时针,true为逆时针。
               * 该参数影响startAngle和endAngle的绘制方向。
               */
              orientation:false
          },
          /*
           *下一组同心圆...
           */
          {}
      ],
      /*
       *下一组圆...
       */
      []
    ],
    //动画时长，可选
    totalTime:1000
};

/*
 * 更多
 * customFn属性
 * Painter.getContext()
 * Painter.reSize()
 * moChart.addTimerFn()
 * moChart.wrapEvent()
 */