;(function(){
	if(window.moChart && window.moChart.getPainter){
		return;
	}
	window.moChart={};
	(function(mc){
		/*
		 * currying
		 * 设置模板，传入一个对象,调用时所有参数会被补足为模板值
		 */
		Function.prototype.__setModel=function(){
			var fn=this;
			var defaultValue=arguments[0];
			return function(){
				for(var i in arguments){
					custom=arguments[i];
					checkProperty(custom,defaultValue);
					/*for(var j in defaultValue){
					 if(custom[j]==undefined){
					 custom[j]=defaultValue[j];
					 }
					 }*/
				}
				return fn.apply(this,arguments);
			};
		};
		function checkProperty(cus,def){
			for(var i in def){
				if(cus[i]==undefined){
					cus[i]=def[i];
				}else if(def[i] instanceof Object){
					if(cus[i] instanceof Array){
						checkArrayProperty(cus[i],def[i]);
					}else{
						checkProperty(cus[i],def[i]);
					}
				}
			}
		}
		function checkArrayProperty(cusArr,def){
			if(cusArr instanceof Array){
				for(var i in cusArr){
					checkArrayProperty(cusArr[i],def);
				}
			}else{
				checkProperty(cusArr,def);
			}
		}

		/*
		 * currying
		 * 设置默认值，当调用没传时，使用默认值
		 * 特别注意此处对arguments的修改无效
		 */
		Function.prototype.__setDefault=function(){
			var fn=this;
			var args=Array.prototype.slice.apply(arguments);
			return function(){
				var arg=0;
				for(var i=0;i<args.length && arg<arguments.length;i++){
					if(arguments[i]!=undefined){
						args[i]=arguments[i];
					}
				}
				return fn.apply(this,args);
			};
		};

		var accMath={
			accAdd:function(arg1,arg2){
				var r1=0;
				var r2=0;
				try{
					r1=arg1.toString().split('.')[1].length;
				}catch(e){

				}
				try{
					r2=arg2.toString().split('.')[1].length;
				}catch(e){

				}
				var m=Math.pow(10, Math.max(r1,r2));
				return (Math.round(arg1*m)+Math.round(arg2*m))/m;
			},
			accSub:function(arg1,arg2){
				return accAdd(arg1,-arg2);
			},
			accMul:function(arg1,arg2){
				var s1=arg1.toString();
				var s2=arg2.toString();
				var m=0;
				try{
					m+=s1.split('.')[1].length;
				}catch(e) {

				}
				try{
					m+=s2.split('.')[1].length;
				}catch(e) {

				}
				return (s1.replace('.','')-0)*(s2.replace('.','')-0)/Math.pow(10,m);
			},
			accDiv:function(arg1,arg2){
				var s1=arg1.toString();
				var s2=arg2.toString();
				var m=0;
				try{
					m=s2.split('.')[1].length;
				}catch(e) {

				}
				try{
					m-=s1.split('.')[1].length;
				}catch(e) {

				}
				return (s1.replace('.','')-0)/(s2.replace('.','')-0)*Math.pow(10,m);
			}
		};

		/*
		 * 中央定时器
		 */
		var centerTimer={
			tickTime:25,
			timerID:0,
			timerFn:[],
			isAnimate:false,

			add:function(aFn,cFn){
				aFn.cancelFn=cFn;
				this.timerFn.push(aFn);
			},
			start:function(){
				if(this.timerID) return;
				this.isAnimate=true;
				//var start=new Date().getTime();
				(function runNext(){
					if(centerTimer.timerFn.length>0){
						for(var i=0;i<centerTimer.timerFn.length;i++){
							//作为数组的一部分调用方法时this指向方法本身
							if(centerTimer.timerFn[i](centerTimer.tickTime)===false){
								centerTimer.timerFn.splice(i,1);
								i--;
								//console.log(new Date().getTime()-start);
							}
						}
						centerTimer.timerID=setTimeout(runNext,centerTimer.tickTime);
					}else{
						centerTimer.timerID=0;
					}
				})();
			},
			stop:function(){
				this.isAnimate=false;
				clearTimeout(this.timerID);
				this.timerID=0;
				for(var i in this.timerFn){
					if(this.timerFn[i].cancelFn){
						this.timerFn[i].cancelFn();
					}
				}
				this.timerFn=[];
			}
		};

		/*
		 * AOP
		 * 封装事件，保护动画不受阻塞事件影响
		 */
		var AOP={
			before:function(){
				if(centerTimer.isAnimate){
					centerTimer.stop();
				}
			},
			after:function(){

			}
		};

		function Painter(container,requestClass){
			var canvas=container.canvas||document.createElement("canvas"),
				context,painter=this;
			var __fontSize=24,__defaultColor="#888",__totalTime=1000;
			function initCanvas(){
				//canvas.style.position="relative";
				//canvas.style.top="0px";
				//canvas.style.left="0px";
				canvas.width=container.clientWidth*2;
				canvas.height=container.clientHeight*2;
				canvas.style.width=container.clientWidth+"px";
				canvas.style.height=container.clientHeight+"px";
				context=canvas.getContext("2d");
			}
			initCanvas();
			if(!container.canvas){
				container.canvas=canvas;
				container.appendChild(canvas);
			}else{
				//兼容三星bug机
				container.removeChild(canvas);
				container.appendChild(canvas);
			}

			function reset(isResize){
				if(isResize){
					clearTimeout(reset.id);
					reset.id=setTimeout(function(){
						initCanvas();
						for(var i in requestClass){
							var tempClass=requestClass[i]+"Control";
							eval("painter."+tempClass+".reDraw();");
						}
					},50);
				}else{
					context.clearRect(0,0,canvas.width,canvas.height);
					for(var i in requestClass){
						var tempClass=requestClass[i]+"Control";
						eval("painter."+tempClass+".reDraw();");
					}
				}
			}

			/*
			 * 运行时求值
			 * 根据运行时请求动态构建Painter
			 */
			try{
				for(var i in requestClass){
					var tempClass=requestClass[i]+"Control";
					eval("this."+tempClass+"=new "+tempClass+";");
				}
			}catch(error){
				console.log(error);
				throw new Error("mobileChart:Request class not exists:"+requestClass[i]);
			}

			this.getContext=function(){
				return context;
			};

			this.reSize=reset.__setDefault(true);

			var Grid=(function(ctx){
				var layout,width,height,yl,ma,mi,grid;
				var leftX,rightX,bottomY,range,amount,axis,stepY,axisY;

				function drawYLabel(){
					var x,stepValue,flag= 0,fullLength;
					ctx.beginPath();
					ctx.fillStyle=yl.fontColor;
					ctx.font=yl.fontSize+"px Arial";
					ctx.textBaseline="middle";
					switch(yl.float){
						case "left":
							x=leftX-ctx.measureText(" ").width;
							fullLength=width*layout.d;
							ctx.textAlign="right";
							break;
						case "right":
							x=rightX+ctx.measureText(" ").width;
							fullLength=width*layout.b;
							ctx.textAlign="left";
							break;
					}
					/*
					 * 轴线分类，最复杂部分
					 * flag为4全正，flag为5全负
					 * flag为1则正数部大，flag为2则负数部大，flag为3则均分(类linux用户权限rwx计法)
					 */
					if(mi>=0){
						flag=4;
					}else if(ma<=0){
						flag=5;
					}else{
						stepValue=Math.max(ma,-mi)/2;
						if(ma>stepValue){
							flag+=1;
						}
						if(-1*mi>stepValue){
							flag+=2;
						}
					}
					amount=yl.split+1;
					switch(flag){
						case 1:
							amount=4;
							axis=1;
							break;
						case 2:
							amount=4;
							axis=2;
							break;
						case 3:
							if(amount%2!=1){
								amount++;
							}
							axis=Math.floor(amount/2);
							break;
						case 4:
							axis=0;
							break;
						case 5:
							axis=amount-1;
							break;
						default:
							break;
					}

					stepValue=calcYValue(yl,flag);
					stepY=height/(amount-1);
					axisY=bottomY-axis*stepY;
					drawGrid();
					for(var i=0;i<amount;i++){
						ctx.fillText(accMath.accAdd(mi,accMath.accMul(i,stepValue))+yl.mark,x,bottomY-i*stepY,fullLength);
					}
				}

				function calcYValue(yl,flag){
					var step,temp;
					if(!yl.fitValue){
						ma=(Math.ceil(ma*100)/100).toFixed(2);
						mi=(Math.floor(mi*100)/100).toFixed(2);
						return ((ma-mi)/yl.split).toFixed(2);
					}
					switch(flag){
						case 1:
							//ma=(Math.ceil(ma*100)/100).toFixed(2);
							temp=calcYHelper(ma,2);
							ma=temp[0],step=temp[1];
							mi=-1*step;
							break;
						case 2:
							//mi=-1*(Math.floor(mi*100)/100).toFixed(2);
							temp=calcYHelper(-1*mi,2);
							mi=-1*temp[0];
							step=temp[1];
							ma=step;
							break;
						case 3:
							temp=Math.max(ma,-1*mi);
							//借用step来保存半个轴部的步数
							step=Math.floor(amount/2);
							temp=calcYHelper(temp,step);
							ma=temp[0],step=temp[1];
							mi=-1*ma;
							break;
						case 4:
							temp=calcYHelper(ma,yl.split);
							ma=temp[0],step=temp[1];
							mi=0;
							break;
						case 5:
							temp=calcYHelper(-1*mi,yl.split);
							ma=0;
							mi=-1*temp[0],step=temp[1];
							break;
						default:
							break;
					}
					range=ma-mi;
					return step;
				}

				/*function calcYHelper(tmp,spl){
					if(tmp>=10){
						tmp=Math.ceil(tmp/10)*10;
						while(tmp%spl!=0||tmp%10==0){
							tmp++;
						}
						return [tmp,tmp/spl];
					}else if(tmp==0){
						tmp=1;
						var result=calcYHelper(tmp*10,spl);
						return [divTen(result[0]),divTen(result[1])];
					}else{
						var result=calcYHelper(tmp*10,spl);
						return [divTen(result[0]),divTen(result[1])];
					}
				}

				function divTen(number){
					var length=0;
					try{
						length=number.toString().split(".")[1].length;
					}catch(e){

					}
					var result=number/10;
					result=result.toFixed(length+1);
					return result;
				}*/

				function calcYHelper(tmp,spl){
					var mul=1;
					if(tmp==0){
						tmp=1;
					}
					while(Math.floor(tmp*mul)/mul==0){
						mul*=10;
					}
					tmp=Math.ceil(tmp*mul);
					while(tmp%spl!=0){
						tmp++;
					}
					var step=tmp/spl;
					return [tmp/mul,step/mul];
				}

				function drawGrid(){
					var gap=2,length=6,gridX,gridY;
					ctx.beginPath();
					ctx.strokeStyle="#ccc";
					ctx.lineWidth=1;
					switch(grid){
						case "dotted":
							for(var i=0;i<amount;i++){
								if(i==axis){
									continue;
								}
								gridX=leftX;
								gridY=Math.round(bottomY-i*stepY);
								gridY=gridY%2==0 ? gridY:gridY+1;
								for(;gridX+length<rightX;gridX+=length+gap){
									ctx.moveTo(gridX,gridY);
									ctx.lineTo(gridX+length,gridY);
								}
								ctx.moveTo(gridX,gridY);
								ctx.lineTo(rightX,gridY);
							}
							break;
						case "solid":
							for(var i=0;i<amount;i++){
								if(i==axis){
									continue;
								}
								gridY=Math.round(bottomY-i*stepY);
								gridY=gridY%2==0 ? gridY:gridY+1;
								ctx.moveTo(leftX,gridY);
								ctx.lineTo(rightX,gridY);
							}
							break;
						default:
							throw new Error("moChart:no such grid type supported:"+grid);
							break;
					}
					ctx.stroke();
					ctx.beginPath();
					ctx.strokeStyle="#444";
					gridY=Math.round(bottomY-axis*stepY);
					gridY=gridY%2==0 ? gridY:gridY+1;
					ctx.moveTo(leftX,gridY);
					ctx.lineTo(rightX,gridY);
					ctx.stroke();
				}

				return {
					draw:function(la,wi,he,le,ri,bo,gr,yLabel,max,min){
						layout=la;
						width=wi;
						height=he;
						leftX=le;
						rightX=ri;
						bottomY=bo;
						grid=gr;
						yl=yLabel;
						ma=max;
						mi=min;
						drawYLabel();
						return [ma,mi,range,axisY];
					}
				};
			})(context);

			function lineControl(){
				//初始传入数据
				var layout,animate,xLabel,yLabel,grid,items,customFn;
				//轴线计算相关
				var max,min,range;
				//静态计算相关
				var	width,height,topY,bottomY,leftX,rightX,axisY,amount;
				//动画辅助相关
				var x,y,stepX,totalTime,animateTimes,positionStep,position,previousX;

				function init(option){
					layout=option.layout;
					animate=option.animate;
					xLabel=option.xLabel;
					yLabel=option.yLabel;
					grid=option.grid;
					items=option.items;
					totalTime=option.totalTime;
					customFn=option.customFn;
					initValue();
				}

				function initValue(){
					width=canvas.width*(1-layout.b-layout.d);
					height=canvas.height*(1-layout.a-layout.c);
					topY=canvas.height*layout.a;
					bottomY=canvas.height*(1-layout.c);
					leftX=canvas.width*layout.d;
					rightX=canvas.width*(1-layout.b);
					max=min=items[0].value[0];
					var maxLength=1,tempMax,tempMin;
					for(var i in items){
						tempMax=yLabel.calcMax.apply(this,items[i].value);
						tempMin=yLabel.calcMin.apply(this,items[i].value);
						tempMax>max ? max=tempMax:"";
						tempMin<min ? min=tempMin:"";
						items[i].value.length>maxLength ? maxLength=items[i].value.length:"";
					}
					range=max-min;
					stepX=width/(maxLength-1);
					amount=maxLength;
					animateTimes=totalTime/centerTimer.tickTime;
					/*for(i in items){
						items[i].position=1;
					}*/
					positionStep=Math.round(maxLength/animateTimes);
					positionStep=positionStep==0 ? 1:positionStep;
					//positionStep=Math.round(maxLength/animateTimes)==0 ? 1:Math.round(maxLength/animateTimes);
					position=0;
					drawReady();
				}

				function drawReady(){
					switch(animate){
						case "none":
							centerTimer.add(staticDraw);
							break;
						case "flow":
							centerTimer.add(animateFlowDraw,resetDraw);
							/*for(var i in items)(function(a){
								centerTimer.add(function(){
									var result=animateFlowDraw((items[a]));
									return result;
								},resetDraw);
							})(i);*/
							break;
						default:
							throw new Error("mobileChart:No such animate support:"+animate);
					}
				}

				function drawXLabel(ctx,xl){
					ctx.beginPath();
					ctx.fillStyle=xl.fontColor;
					ctx.font=xl.fontSize+"px Arial";
					ctx.textBaseline="top";
					ctx.textAlign="left";
					ctx.fillText(xl.start,leftX,bottomY+height/15);
					ctx.textAlign="right";
					ctx.fillText(xl.end,rightX,bottomY+height/15);
				}

				function staticDraw(){
					drawXLabel(context,xLabel);
					var newValue=Grid.draw(layout,width,height,leftX,rightX,bottomY,grid,yLabel,max,min);
					max=newValue[0];
					min=newValue[1];
					range=newValue[2];
					axisY=newValue[3];
					/*
					 * 用户自定义函数
					 * !!!!!!!!!!未来将废弃这个方法!!!!!!!!!!
					 */
					//eval("("+customFn+")(context);");
					for(var i in items) (function(item){
						context.beginPath();
						var data=item.value;
						context.strokeStyle=item.color;
						context.lineWidth=item.lineWidth || __lineWidth;
						x=leftX;
						y=(max-data[0])/range*height+topY;
						context.moveTo(x,y);
						for(var i=1;i<data.length;i++){
							x+=stepX;
							y=(max-data[i])/range*height+topY;
							context.lineTo(x,y);
							//context.stroke();
							context.moveTo(x,y);
						}
						context.stroke();
						/*
						 * 渐变到轴线
						 * !!!!!!!!!!缺陷，渐变不支持负数!!!!!!!!!!
						 */
						/*if(item.gradient)(function(gra){
						 context.beginPath();
						 context.globalAlpha=gra.alpha;
						 var tempMax=Math.max.apply(this,data.slice(gra.start,gra.end));
						 var gradient=context.createLinearGradient(leftX,(max-tempMax)/range*height+topY,leftX,axisY);
						 for(var i in gra.colorStop){
						 gradient.addColorStop(i,gra.colorStop[i]);
						 }
						 context.fillStyle=gradient;
						 x=leftX+gra.start*stepX;
						 y=axisY-2;
						 context.moveTo(x,y);
						 for(i=gra.start;i<gra.end;i++){
						 y=(max-data[i])/range*height+topY;
						 context.lineTo(x,y);
						 x+=stepX;
						 }
						 context.lineTo(x-stepX,axisY-2);
						 context.closePath();
						 context.fill();
						 })(item.gradient);*/

						/*
						 * 渐变到底线
						 */
						if(item.gradient)(function(gra){
							context.beginPath();
							context.globalAlpha=gra.alpha;
							var tempMax=Math.max.apply(this,data.slice(gra.start,gra.end));
							var gradient=context.createLinearGradient(leftX,(max-tempMax)/range*height+topY,leftX,bottomY);
							for(var i in gra.colorStop){
								gradient.addColorStop(i,gra.colorStop[i]);
							}
							context.fillStyle=gradient;
							x=leftX+gra.start*stepX;
							y=bottomY;
							context.moveTo(x,y);
							for(i=gra.start;i<gra.end;i++){
								y=(max-data[i])/range*height+topY;
								context.lineTo(x,y);
								x+=stepX;
							}
							context.lineTo(x-stepX,bottomY);
							context.closePath();
							context.fill();
						})(item.gradient);
					})(items[i]);
					return false;
				}

				function animateFlowDraw(){
					if(position==0){
						positionStep=1;
						drawXLabel(context,xLabel);
						var newValue=Grid.draw(layout,width,height,leftX,rightX,bottomY,grid,yLabel,max,min);
						max=newValue[0];
						min=newValue[1];
						range=newValue[2];
						axisY=newValue[3];
						previousX=leftX;
						position++;
						/*
						 * 用户自定义函数
						 * !!!!!!!!!!未来打算废弃该方法!!!!!!!!!!
						 */
						//eval("("+customFn+")(context);");
					}
					if(position<amount+1){
						for(var j in items)(function(item,tempPosition){
							if(tempPosition<item.value.length)(function(data){
								x=leftX+tempPosition*stepX;
								y=(max-data[tempPosition-1])/range*height+topY;
								x=Math.round(x);
								/*
								 * 渐变到轴线
								 * !!!!!!!!!!缺陷，渐变不支持负数!!!!!!!!!!
								 */
								/*if(item.gradient && tempPosition>item.gradient.start &&
								 tempPosition<item.gradient.end && data[tempPosition]>0)(function(gra){
								 context.beginPath();
								 context.globalAlpha=gra.alpha;
								 var tempMax=Math.max.apply(this,data.slice(gra.start,gra.end));
								 var gradient=context.createLinearGradient(leftX,(max-tempMax)/range*height+topY,leftX,axisY);
								 for(var i in gra.colorStop){
								 gradient.addColorStop(i,gra.colorStop[i]);
								 }
								 context.fillStyle=gradient;
								 context.moveTo(previousX,axisY-context.lineWidth);
								 context.lineTo(previousX,y);
								 if((tempPosition+positionStep)<gra.end){
								 for(var i=0;i<positionStep;i++){
								 context.lineTo(x,(max-data[tempPosition++])/range*height+topY);
								 x+=stepX;
								 }
								 x-=stepX;
								 context.lineTo(x,y);
								 tempPosition-=positionStep;
								 }else{
								 var left=gra.end-tempPosition;
								 for(var i=0;i<left;i++){
								 context.lineTo(x,(max-data[tempPosition++])/range*height+topY);
								 x+=stepX;
								 }
								 x-=stepX;
								 tempPosition-=left;
								 }
								 context.lineTo(x,axisY-context.lineWidth);
								 context.closePath();
								 context.fill();
								 })(item.gradient);*/

								/*
								 * 渐变到底线
								 */
								if(item.gradient && tempPosition>item.gradient.start && tempPosition<item.gradient.end)(function(gra){
									context.beginPath();
									context.globalAlpha=gra.alpha;
									var tempMax=Math.max.apply(this,data.slice(gra.start,gra.end));
									var gradient=context.createLinearGradient(leftX,(max-tempMax)/range*height+topY,leftX,bottomY);
									for(var i in gra.colorStop){
										gradient.addColorStop(i,gra.colorStop[i]);
									}
									context.fillStyle=gradient;
									context.moveTo(previousX,bottomY);
									context.lineTo(previousX,y);
									if((tempPosition+positionStep)<gra.end){
										for(var i=0;i<positionStep;i++){
											context.lineTo(x,(max-data[tempPosition++])/range*height+topY);
											x+=stepX;
										}
										x-=stepX;
										context.lineTo(x,y);
										tempPosition-=positionStep;
									}else{
										var left=gra.end-tempPosition;
										for(var i=0;i<left;i++){
											context.lineTo(x,(max-data[tempPosition++])/range*height+topY);
											x+=stepX;
										}
										x-=stepX;
										tempPosition-=left;
									}
									context.lineTo(x,bottomY);
									context.closePath();
									context.fill();
								})(item.gradient);

								//折线图
								context.beginPath();
								context.globalAlpha=1;
								context.strokeStyle=item.color;
								context.lineWidth=item.lineWidth || __lineWidth;
								context.moveTo(previousX,y);
								if((tempPosition+positionStep)<=data.length){
									for(var i=0;i<positionStep;i++){
										y=(max-data[tempPosition++])/range*height+topY;
										context.lineTo(x,y);
										x+=stepX;
									}
									x-=stepX;
								}else{
									for(var i=tempPosition;i<data.length;i++){
										y=(max-data[tempPosition++])/range*height+topY;
										context.lineTo(x,y);
										x+=stepX;
									}
								}
								context.stroke();
								//return true;
							})(item.value);
						})(items[j],position);
						position+=positionStep;
						previousX=x;
						return true;
					}else{
						return false;
					}
				}

				function resetDraw(){
					initValue();
					staticDraw();
				}

				var defaultOption={
					layout:{a:0,b:0,c:0,d:0},
					animate:"none",
					xLabel:{
						fontColor:__defaultColor,
						fontSize:__fontSize,
						start:"",
						end:""
					},
					yLabel:{
						fontColor:__defaultColor,
						fontSize:__fontSize,
						float:"left",
						calcMax:Math.max,
						calcMin:Math.min,
						mark:"",
						split:3,
						fitValue:true,
					},
					grid:"dotted",
					items:{
						color:__defaultColor,
						lineWidth:2
					},
					/*items:[
					 {value:[],color:"#fa5d5d",lineWidth:2,gradient:{
					 start:0,
					 end:0,
					 colorStop:{0:"#fa5d5d",0.5:"#fcc",1:"#fee"},
					 alpha:0.8
					 }},
					 {value:[],color:"#4a90e2",lineWidth:2}
					 ],*/
					totalTime:__totalTime,
					customFn:"function(){}"
				};

				return {
					setOption:init.__setModel(defaultOption),
					reDraw:resetDraw
				};
			};

			function circleControl(){
				var layout,animate,items,totalTime;
				var width,height,leftX,rightX,topY,bottomY;
				var maxR=[],centerY,gap,centerX=[];
				var animateTimes,position;

				function init(option){
					layout=option.layout;
					animate=option.animate;
					items=option.items;
					totalTime=option.totalTime;
					initValue();
				}

				function initValue(){
					width=canvas.width*(1-layout.b-layout.d);
					height=canvas.height*(1-layout.a-layout.c);
					topY=canvas.height*layout.a;
					bottomY=canvas.height*(1-layout.c);
					leftX=canvas.width*layout.d;
					rightX=canvas.width*(1-layout.b);
					centerY=(topY+bottomY)/2;
					animateTimes=totalTime/centerTimer.tickTime;
					for(var i in items){
						items[i][0].radius=items[i][0].r*width;
						maxR[i]=items[i][0].radius;
						items[i][0].stepAngle=(items[i][0].endAngle-items[i][0].startAngle)/animateTimes;
						for(var j=1;j<items[i].length;j++){
							items[i][j].radius=items[i][j].r*width;
							if(maxR[i]<items[i][j].radius){
								maxR[i]=items[i][j].radius;
							}
							items[i][j].stepAngle=(items[i][j].endAngle-items[i][j].startAngle)/animateTimes;
						}
					}
					gap=width;
					for(i=0;i<maxR.length;i++){
						gap-=maxR[i]*2;
					}
					gap/=i+1;
					var tempDistance=0;
					for(i=0;i<maxR.length;i++){
						centerX[i]=leftX+(i+1)*gap+maxR[i]+tempDistance;
						tempDistance+=2*maxR[i];
					}
					position=0;
					drawReady();
				}

				function drawReady(){
					switch(animate){
						case "none":
							centerTimer.add(staticDraw);
							break;
						case "flow":
							centerTimer.add(animateFlowDraw,resetDraw);
							break;
						default:
							throw new Error("mobileChart:No such animate support:"+animate);
					}
				}

				function drawText(){
					context.beginPath();
					context.textAlign="center";
					for(var i in items){
						if(items[i][0].showText.length==1){
							(function(ctx,st){
								ctx.fillStyle=st.fontColor;
								ctx.font=st.fontSize+"px Arial";
								ctx.textBaseline="middle";
								ctx.fillText(st.value,centerX[i],centerY,2*maxR[i]);
							})(context,items[i][0].showText[0]);
						}else{
							(function(ctx,st){
								ctx.fillStyle=st.fontColor;
								ctx.font=st.fontSize+"px Arial";
								ctx.textBaseline="bottom";
								ctx.fillText(st.value,centerX[i],centerY-10,2*maxR[i]);
							})(context,items[i][0].showText[0]);
							(function(ctx,st){
								ctx.fillStyle=st.fontColor;
								ctx.font=st.fontSize+"px Arial";
								ctx.textBaseline="top";
								ctx.fillText(st.value,centerX[i],centerY+10,2*maxR[i]);
							})(context,items[i][0].showText[1]);
						}
					}
				}

				function unitStroke(ctx,item,i,end){
					ctx.beginPath();
					ctx.strokeStyle=item.color;
					ctx.lineWidth=item.lineWidth;
					ctx.arc(centerX[i],centerY,item.radius,Math.PI*item.startAngle/180,end*Math.PI/180,item.orientation);
					ctx.stroke();
				}

				function unitFill(ctx,item,i,end){
					ctx.beginPath();
					ctx.fillStyle=item.color;
					ctx.lineWidth=item.lineWidth;
					ctx.moveTo(centerX[i],centerY);
					ctx.arc(centerX[i],centerY,item.radius,Math.PI*item.startAngle/180,end*Math.PI/180,item.orientation);
					ctx.closePath();
					ctx.fill();
				}

				function staticDraw(){
					for(var i in items){
						for(var j in items[i]){
							switch(items[i][j].type){
								case "stroke":
									unitStroke(context,items[i][j],i,items[i][j].endAngle);
									break;
								case "fill":
									unitFill(context,items[i][j],i,items[i][j].endAngle);
									break;
								default:
									throw new Error("moChart:no such type of circle supported:"+items[i][j].type);
							}
						}
					}
					drawText();
					return false;
				}

				function animateFlowDraw(){
					if(position<(animateTimes-1)){
						for(var i in items){
							for(var j in items[i]){
								switch(items[i][j].type){
									case "stroke":
										unitStroke(context,items[i][j],i,position*items[i][j].stepAngle+items[i][j].startAngle);
										break;
									case "fill":
										unitFill(context,items[i][j],i,position*items[i][j].stepAngle+items[i][j].startAngle);
										break;
									default:
										throw new Error("moChart:no such type of circle supported:"+items[i][j].type);
								}
							}
						}
						position++;
						return true;
					}else{
						for(var i in items){
							for(var j in items[i]){
								switch(items[i][j].type){
									case "stroke":
										unitStroke(context,items[i][j],i,items[i][j].endAngle);
										break;
									case "fill":
										unitFill(context,items[i][j],i,items[i][j].endAngle);
										break;
									default:
										throw new Error("moChart:no such type of circle supported:"+items[i][j].type);
								}
							}
						}
						drawText();
						return false;
					}
				}

				function resetDraw(){
					initValue();
					staticDraw();
				}

				var defaultOption={
					layout:{a:0,b:0,c:0,d:0},
					animate:"none",
					items:{
						showText:{value:"",fontColor:__fontSize,fontSize:__fontSize},
						type:"stroke",
						color:__defaultColor,
						lineWidth:10,
						orientation:false
					},
					/*items:[
					 [{
					 showText:[{value:"786",fontColor:"",fontSize:""},
					 {value:"abcd",fontColor:"",fontSize:""}],
					 type:"stroke",
					 color:"",
					 lineWidth:2,
					 r:0.25,
					 startAngle:0,
					 endAngle:360
					 },{
					 type:"fill",
					 color:"",
					 r:0.2,
					 startAngle:0,
					 endAngle:360
					 }],[{
					 showText:[{value:"87%",fontColor:"",fontSize:""}],
					 type:"stroke",
					 color:"",
					 lineWidth:2,
					 r:0.25,
					 startAngle:0,
					 endAngle:360
					 },{
					 type:"fill",
					 color:"",
					 r:0.2,
					 startAngle:0,
					 endAngle:360
					 }]
					 ],*/
					totalTime:__totalTime,
				};

				return {
					setOption:init.__setModel(defaultOption),
					reDraw:resetDraw
				};
			}

			function barControl(){
				var layout,animate,xLabel,yLabel,grid,chartOccupy,itemOccupy,items,totalTime,showValue;
				var max,min,range,groupWidth,groupGap,groupAmount,itemWidth,itemGap,itemAmount;
				var	width,height,topY,bottomY,leftX,rightX,axisY;
				var x,y,animateTimes,position;

				function init(option){
					layout=option.layout;
					animate=option.animate;
					xLabel=option.xLabel;
					yLabel=option.yLabel;
					grid=option.grid;
					chartOccupy=option.chartOccupy;
					itemOccupy=option.itemOccupy;
					items=option.items;
					totalTime=option.totalTime;
					showValue=option.showValue;
					initValue();
				}

				function initValue(){
					width=canvas.width*(1-layout.b-layout.d);
					height=canvas.height*(1-layout.a-layout.c);
					topY=canvas.height*layout.a;
					bottomY=canvas.height*(1-layout.c);
					leftX=canvas.width*layout.d;
					rightX=canvas.width*(1-layout.b);
					animateTimes=totalTime/centerTimer.tickTime;
					itemAmount=items.length;
					max=min=items[0].value[0];
					groupAmount=1;
					var tempMax,tempMin;
					for(var i in items){
						tempMax=yLabel.calcMax.apply(this,items[i].value);
						tempMin=yLabel.calcMin.apply(this,items[i].value);
						tempMax>max ? max=tempMax:"";
						tempMin<min ? min=tempMin:"";
						groupAmount<items[i].value.length ? groupAmount=items[i].value.length:"";
					}
					range=max-min;
					groupWidth=width*chartOccupy;
					groupGap=(width-groupWidth)/(groupAmount+1);
					groupWidth/=groupAmount;
					itemWidth=groupWidth*itemOccupy;
					itemGap=(groupWidth-itemWidth)/(itemAmount+1);
					itemWidth/=itemAmount;
					position=0;
					drawReady();
				}

				function drawReady(){
					switch(animate){
						case "none":
							centerTimer.add(staticDraw);
							break;
						case "flow":
							centerTimer.add(animateFlowDraw,resetDraw);
							break;
						default:
							throw new Error("mobileChart:No such animate support:"+animate);
					}
				}

				function drawXLabel(ctx,xl){
					ctx.beginPath();
					ctx.fillStyle=xl.fontColor;
					ctx.font=xl.fontSize+"px Arial";
					ctx.textBaseline="top";
					ctx.textAlign="center";
					x=leftX+groupGap+groupWidth/2;
					y=bottomY+height/15;
					for(var i in xl.value){
						ctx.fillText(xl.value[i],x,y,groupWidth);
						x+=groupWidth+groupGap;
					}
				}

				function unitTriangle(ctx,x,y,a,h){
					ctx.beginPath();
					ctx.moveTo(x,y);
					ctx.lineTo(x+a,y);
					ctx.lineTo(x+a/2,h);
					ctx.closePath();
					ctx.fill();
				}

				function unitRect(ctx,x,y,a,h){
					ctx.beginPath();
					if(h<0){
						ctx.fillRect(x,y,a,-1*h);
					}else{
						ctx.fillRect(x,y-h,a,h);
					}
				}

				function staticDraw(){
					drawXLabel(context,xLabel);
					var newValue=Grid.draw(layout,width,height,leftX,rightX,bottomY,grid,yLabel,max,min);
					max=newValue[0];
					min=newValue[1];
					range=newValue[2];
					axisY=newValue[3];
					for(var i=0;i<items.length;i++)(function(item){
						context.beginPath();
						switch(item.type){
							case "triangle":
								x=leftX+groupGap+i*itemWidth+(i+1)*itemGap;
								for(var j in item.value){
									context.fillStyle=item.colorList[j%item.colorList.length];
									unitTriangle(context,x,axisY,itemWidth,axisY-height*item.value[j]/range);
									x+=groupWidth+groupGap;
								}
								break;
							case "rect":
								x=leftX+groupGap+i*itemWidth+(i+1)*itemGap;
								for(var j in item.value){
									context.beginPath();
									context.fillStyle=item.colorList[j%item.colorList.length];
									unitRect(context,x,axisY,itemWidth,height*item.value[j]/range);
									x+=groupWidth+groupGap;
								}
								break;
							default:
								throw new Error("moChart:no such type of bar supported:"+item.type);
						}
						if(item.showValue.show){
							context.fillStyle=item.showValue.fontColor;
							context.font=item.showValue.fontSize+"px Arial";
							context.textAlign="center";
							x=leftX+groupGap+i*itemWidth+(i+1)*itemGap+itemWidth/2;
							for(var j in item.value){
								y=height*item.value[j]/range;
								if(y<0){
									context.textBaseline="top";
								}else{
									context.textBaseline="bottom";
								}
								context.fillText(item.value[j]+yLabel.mark,x,axisY-y,itemWidth);
								x+=groupWidth+groupGap;
							}
						}
					})(items[i]);
					return false;
				}

				function animateFlowDraw(){
					if(position==0){
						drawXLabel(context,xLabel);
						var newValue=Grid.draw(layout,width,height,leftX,rightX,bottomY,grid,yLabel,max,min);
						max=newValue[0];
						min=newValue[1];
						range=newValue[2];
						axisY=newValue[3];
						position++;
						return true;
					}
					if(position<animateTimes){
						for(var i=0;i<items.length;i++)(function(item){
							context.beginPath();
							switch(item.type){
								case "triangle":
									x=leftX+groupGap+i*itemWidth+(i+1)*itemGap;
									for(var j in item.value){
										context.fillStyle=item.colorList[j%item.colorList.length];
										unitTriangle(context,x,axisY,itemWidth,axisY-(height*item.value[j]/range)*position/animateTimes);
										x+=groupWidth+groupGap;
									}
									break;
								case "rect":
									x=leftX+groupGap+i*itemWidth+(i+1)*itemGap;
									for(var j in item.value){
										context.beginPath();
										context.fillStyle=item.colorList[j%item.colorList.length];
										unitRect(context,x,axisY,itemWidth,(height*item.value[j]/range)*position/animateTimes);
										x+=groupWidth+groupGap;
									}
									break;
								default:
									throw new Error("moChart:no such type of bar supported:"+item.type);
							}
						})(items[i]);
						position++;
						return true;
					}else{
						for(var i=0;i<items.length;i++)(function(item){
							context.beginPath();
							context.fillStyle=item.color;
							switch(item.type){
								case "triangle":
									x=leftX+groupGap+i*itemWidth+(i+1)*itemGap;
									for(var j in item.value){
										context.fillStyle=item.colorList[j%item.colorList.length];
										unitTriangle(context,x,axisY,itemWidth,axisY-height*item.value[j]/range);
										x+=groupWidth+groupGap;
									}
									break;
								case "rect":
									x=leftX+groupGap+i*itemWidth+(i+1)*itemGap;
									for(var j in item.value){
										context.beginPath();
										context.fillStyle=item.colorList[j%item.colorList.length];
										unitRect(context,x,axisY,itemWidth,height*item.value[j]/range);
										x+=groupWidth+groupGap;
									}
									break;
								default:
									throw new Error("moChart:no such type of bar supported:"+item.type);
							}
							if(item.showValue.show){
								context.fillStyle=item.showValue.fontColor;
								context.font=item.showValue.fontSize+"px Arial";
								context.textAlign="center";
								x=leftX+groupGap+i*itemWidth+(i+1)*itemGap+itemWidth/2;
								for(var j in item.value){
									y=height*item.value[j]/range;
									if(y<0){
										context.textBaseline="top";
									}else{
										context.textBaseline="bottom";
									}
									context.fillText(item.value[j]+yLabel.mark,x,axisY-y,itemWidth);
									x+=groupWidth+groupGap;
								}
							}
						})(items[i]);
						return false;
					}
				}

				function resetDraw(){
					initValue();
					staticDraw();
				}

				var defaultOption={
					layout:{a:0,b:0,c:0,d:0},
					animate:"none",
					xLabel:{
						fontColor:__defaultColor,
						fontSize:__fontSize,
						//value:[]
					},
					yLabel:{
						fontColor:__defaultColor,
						fontSize:__fontSize,
						float:"left",
						calcMax:Math.max,
						calcMin:Math.min,
						mark:"",
						split:3,
						fitValue:true
					},
					grid:"dotted",
					chartOccupy:1,
					itemOccupy:0.8,
					showValue:false,
					items:{
						showValue:{
							fontColor:__defaultColor,
							fontSize:__fontSize,
							show:false
						},
						type:"triangle",
						colorList:[__defaultColor]
					},
					/*items:[
					 {
					 showValue:{
					 fontColor:__defaultColor,
					 fontSize:__fontSize,
					 show:false
					 },
					 type:"triangle",
					 color:"#abc",
					 value:[]
					 },
					 {
					 type:"rect",
					 color:"#def",
					 value:[]
					 }
					 ],*/
					totalTime:__totalTime
				};

				return {
					setOption:init.__setModel(defaultOption),
					reDraw:resetDraw
				};
			}

		}

		mc.getPainter=function(container,requestClass){
			return new Painter(container,requestClass);
		};

		mc.draw=function(){
			centerTimer.start();
		};

		mc.addTimerFn=function(animateFn,cancelFn){
			centerTimer.add(animateFn,cancelFn);
		};

		mc.wrapEvent=function(fn){
			var bound=function(){
				AOP.before.apply(this);
				fn.apply(this,arguments);
			};
			return bound;
		};

	})(window.moChart);
})();