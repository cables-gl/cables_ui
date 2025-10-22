
/**
 * @typedef CellMateOptions
 * @property  {UndoManager} [undo] undo manager
 * @property  {HTMLElement} container element,cellmate will inject itself into this element
 */

let countInst=0


class CellMate
{
	#rowHeight=22
	#cellWidth=100;
	#width=-1;
	#height=30;
	#data=[0];
	#dataWidth=1;
	#dataHeight=1;

	cursorScreenX=0;
	cursorScreenY=0;

	#elTable=null;;
	#elActiveInput=null;

	#selectionStartX=-1
	#selectionStartY=-1
	#selectionEndX=-1
	#selectionEndY=-1
	#colTitles=["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"];
	#scrollY=0;
	#scrollX=0;
	#elContainer=null;
	#options={};
	countInst=0;
	#elScrollVert;
	#elScrollVertInner;
	#elScrollHor;
	#elScrollHorInner;
	#pauseScrolling=false
	#scrollTimeOut=null;
	#redrawTimeout=null;

	constructor(container,options)
	{
		this.countInst= ++countInst;
		this.#data.length=this.#dataWidth*this.#dataHeight;
		this.#options=options

		// for(let i=0;i<this.#dataWidth*this.#dataHeight;i++)
		// 	this.#data[i]=Math.random();

		console.log("containe",container)

		this.#elContainer=container;
		this.html();
		this.resize();
		this.setCursor(this.cursorScreenX,this.cursorScreenY);

		// this.download("bla.csv",this.toCsv(true))
		// console.log(this.toCsv())
	}
	get absX()
	{
		return this.cursorScreenX+this.#scrollX
	}
	get absY()
	{
		return this.cursorScreenY+this.#scrollY
	}

	cellId(x,y)
	{
		return "cell"+this.countInst+"_"+(x-this.#scrollX)+"_"+(y-this.#scrollY);	
	}
	cellRowHeadId(y)
	{
		return "rowHead"+this.countInst+"_"+(y-this.#scrollY);	
	}
	cellColHeadId(x)
	{
		return "colHead"+this.countInst+"_"+(x-this.#scrollX);	
	}

	clampCursor()
	{
		this.cursorScreenX=Math.max(0,this.cursorScreenX)
		this.cursorScreenY=Math.max(0,this.cursorScreenY)

		this.cursorScreenX=Math.min(this.#width-1,this.cursorScreenX)
		this.cursorScreenY=Math.min(this.#height-1,this.cursorScreenY)
	}

	notify(t)
	{
		clearTimeout(this.clearTimeout);
		this.elNotify.innerHTML=t;
		this.clearNotify=setTimeout(()=>
		{
			this.elNotify.innerHTML="";
		},3000);
	}

	focusCell(x,y)
	{
		this.setCursor(x,y);
		this.getCursorEl()?.removeAttribute("readonly")

		this.#elActiveInput=this.getCursorEl()

		this.getCursorEl()?.focus();
		this.getCursorEl()?.select();
	}

	unFocusInput()
	{
		if(!this.#elActiveInput)return;
		this.#elActiveInput.blur();
		this.getCursorEl().setAttribute("readonly",true)
		this.#elActiveInput=null;
	}

	setCursor(x,y,e)
	{
		this.setCursorAbs(x+this.#scrollX,y+this.#scrollY,e)
	}

	setCursorAbs(x,y,e)
	{
		if(e&&e.shiftKey&&this.#selectionStartX==-1) this.startSelection(this.absX,this.absY);

		document.getElementsByClassName(this.cellRowHeadId(this.cursorScreenY))[0]?.classList.remove("selected");
		document.getElementsByClassName(this.cellColHeadId(this.cursorScreenX))[0]?.classList.remove("selected");

		if(e&&!e.shiftKey&&this.#selectionEndX!=-1)this.unselectAll();

		// -----------------

		x-=this.#scrollX;
		y-=this.#scrollY;

		let cursorEl=this.getCursorEl();
		if(cursorEl)
		{
			cursorEl.classList.remove("cursor");
			if(this.#elActiveInput) this.unFocusInput();
		}

		this.cursorScreenX=x;
		this.cursorScreenY=y;
		this.clampCursor();

		cursorEl=this.getCursorEl()
		if(cursorEl)
		{
			cursorEl.classList.add("cursor");
			cursorEl.setAttribute("readonly",true)
		}
		this.#elTable.focus()

		if(e&&e.shiftKey)this.setEndSelection(this.cursorScreenX+this.#scrollX,this.cursorScreenY+this.#scrollY );
		else
		{
			document.getElementsByClassName(this.cellRowHeadId(this.cursorScreenY))[0]?.classList.add("selected");
			document.getElementsByClassName(this.cellColHeadId(this.cursorScreenX))[0]?.classList.add("selected");
		}
		this.updateStatus();
    // cursorEl?.scrollIntoView();
	}

	startSelection(x,y)
	{
		this.#selectionStartX=x
		this.#selectionStartY=y
	}

	setEndSelection(x,y)
	{
		this.#selectionEndX=x
		this.#selectionEndY=y
		this.updateSelection();
	}

	selectRow(r,e)
	{
		if(e && e.shiftKey)
		{
			this.setEndSelection(this.#dataWidth,Math.max(r,this.#selectionStartY));
			this.startSelection(0,Math.min(r,this.#selectionStartY))
	
		}else
		{
			this.startSelection(0,r)
			this.setEndSelection(this.#dataWidth,r)
		}
		this.updateSelection()
	}

	selectCol(col,e)
	{
		if(e && e.shiftKey)
		{
			this.setEndSelection(Math.max(col,this.#selectionStartX),this.#dataHeight);
			this.startSelection(Math.min(col,this.#selectionStartX),0)
	
		}else
		{
			this.startSelection(col,0)
			this.setEndSelection(col,this.#dataHeight);
		}
		this.updateSelection()
	}

	unselectAll()
	{
		let eles=this.#elTable.getElementsByClassName("selected")
		while(eles.length)
		{
			for(let i=0;i<eles.length;i++)eles[i].classList.remove("selected")
			eles=this.#elTable.getElementsByClassName("selected")
		}

		this.#selectionStartX=this.#selectionStartY=this.#selectionEndX=this.#selectionEndY=-1;
	}
	getValue(x,y)
	{
		let v=this.#data[x+y*this.#dataWidth];
		if(v==undefined)v="";
		return v;
	}

	forEachSelected(cb)
	{
		const sx=Math.min(this.#selectionStartX,this.#selectionEndX)
		const sy=Math.min(this.#selectionStartY,this.#selectionEndY)
		const ex=Math.max(this.#selectionStartX,this.#selectionEndX)
		const ey=Math.max(this.#selectionStartY,this.#selectionEndY)
		console.log("selected",sx,sy,ex,ey)

		let count=0;
		if(sx!=-1&&sy!=-1&&ex!=-1&&ey!=-1)
			for(let y=sy;y<=ey;y++)
				for(let x=sx;x<=ex;x++)
				{
					count++;
					cb(x,y,this.getValue(x,y),x-sx,y+sy);
				}
		else console.log("nono")

		if(count==0){
			cb(this.absX,this.absY,this.getValue(this.absX,this.absY))
			count++
		}
		this.lastSelectedForeachCount=count
		return count
	}

	deleteSelectionContent(c)
	{
		this.forEachSelected((x,y,v)=>{
			this.setValue(x,y,"")
		})
		this.removeEmptyRowCols()
		this.redrawData()
		console.log("delee")
	}

	updateSelection()
	{
		let eles=Array.from(this.#elTable.getElementsByClassName("selected"));
		for(let i=0;i<eles.length;i++)eles[i].classList.remove("selected")

		let sx=Math.min(this.#selectionStartX,this.#selectionEndX)
		let sy=Math.min(this.#selectionStartY,this.#selectionEndY)
		let ex=Math.max(this.#selectionStartX,this.#selectionEndX)
		let ey=Math.max(this.#selectionStartY,this.#selectionEndY)
		if(sx==-1) sx=ex=sy=ey=-1

		for(let absy=sy;absy<=ey;absy++)
		{
			if(absy-this.#scrollY>this.#height)continue;

			const eleRowHead=document.getElementsByClassName(this.cellRowHeadId(absy))
			if(eleRowHead[0])eleRowHead[0].classList.add("selected")

			for(let absx=sx;absx<=ex;absx++)
			{
					if(absy==sy)
					{
						const eleColHead=document.getElementsByClassName(this.cellColHeadId(absx))
						if(eleColHead[0])eleColHead[0].classList.add("selected")
					}

					const ele=document.getElementById(this.cellId(absx,absy))
					ele?.classList.add("selected")
			}
		}
	}

	getCursorEl( )
	{
		return document.getElementById(this.cellId(this.absX,this.absY));
	}

	moveCursorUp(e)
	{
		if(this.cursorScreenY<1 && this.#scrollY)return this.scrollUp();
		this.setCursor(this.cursorScreenX,this.cursorScreenY-1,e);
		if(e)e.preventDefault();
	}

	moveCursorDown(e)
	{
		if(this.cursorScreenY>=this.#height-1)return this.scrollDown();
		this.setCursor(this.cursorScreenX,this.cursorScreenY+1,e);
		if(e)e.preventDefault();
	}

	moveCursorLeft(e)
	{
		if(this.cursorScreenX<1 && this.#scrollX)return this.scrollLeft();
		this.setCursor(this.cursorScreenX-1,this.cursorScreenY,e);
		if(e)e.preventDefault();
	}

	moveCursorRight(e)
	{
		if(this.cursorScreenX>=this.#width-1)return this.scrollRight();
		this.setCursor(this.cursorScreenX+1,this.cursorScreenY,e);
		if(e)e.preventDefault();
	}

	scrollUp()
	{
		this.#scrollY--;
		if(this.#scrollY<0)this.#scrollY=0;
		this.updateScrollBarsSoon()
		this.redrawDataSoon();
	}

	scrollDown(num)
	{
		this.#scrollY+=num||1;
		this.updateScrollBarsSoon()
		this.redrawDataSoon();
	}

	scrollRight(num)
	{
		this.#scrollX+=num||1;
		this.updateScrollBarsSoon()
		this.redrawDataSoon();
	}

	scrollLeft()
	{
		this.#scrollX--;
		this.updateScrollBarsSoon()
		this.redrawDataSoon();
	}

	moveY(num)
	{
		for(let i=0;i<Math.abs(num);i++)
		{
			if(num>0)this.moveCursorDown()
			else this.moveCursorUp()
		}
	}

redrawDataSoon(){
	
		clearTimeout(this.#redrawTimeout) 
		this.#redrawTimeout=setTimeout(()=>
			{
				this.redrawData();
			},10);
}
updateScrollBarsSoon()
	{
		clearTimeout(this.#scrollTimeOut) 
		this.#scrollTimeOut=setTimeout(()=>
			{
				this.updateScrollBars();
			},10);
	}

	updateScrollBars()
	{
		this.#elScrollVert.style.height=(this.#elContainer.clientHeight-this.#rowHeight)+"px";
		this.#elScrollVertInner.style.height=(this.#dataHeight*this.#rowHeight)+"px";

		this.#elScrollHor.style.width=(this.#elContainer.clientWidth-this.#cellWidth)+"px";
		this.#elScrollHorInner.style.width=(this.#dataWidth*this.#cellWidth)+"px";

		this.#pauseScrolling=true;
		this.#elScrollHor.scrollTo(this.#scrollX*this.#cellWidth,0);
		this.#elScrollVert.scrollTo(0,this.#scrollY*this.#rowHeight);
		this.#pauseScrolling=false;
	}

	resize()
	{
		const colNum=Math.floor(this.#elContainer.clientWidth/this.#cellWidth)-1;
		const rowNum=Math.floor(this.#elContainer.clientHeight/this.#rowHeight)-2;

		if(this.#width!=colNum||this.#height!=rowNum)
		{
			this.#width=colNum;
			this.#height=rowNum;
			this.html()
			const rows=this.#elTable.getElementsByClassName("row")

			for(let i=0;i<rows.length;i++)
			{
				rows[i].style["grid-template-columns"]="repeat("+(this.#width+1)+","+this.#cellWidth+"px)"
				// console.log("repeat("+this.#width+","+this.cellWidth+"px)");
			}
		}
		this.updateScrollBars()
	}

	resizeData(w,h)
	{
		const newData=[]
		for(let x=0;x<w;x++)
		{
			for(let y=0;y<h;y++)
			{
				newData[x+y*w]="";
				if(x<this.#dataWidth && y<this.#dataHeight)
				{
					newData[x+y*w]=this.#data[x+y*this.#dataWidth];
				}
			}
		}

		this.#data=newData;
		this.#dataWidth=w;
		this.#dataHeight=h;
		console.log("resize to ",w,h)
		this.resize()
		this.redrawDataArea()
	}

	isNumeric(n)
	{
	    return !isNaN(parseFloat(n)) && isFinite(n);
	}

	setValue(x,y,v)
	{
const		oldValue=this.getValue(x,y);

		if(x>=this.#dataWidth) this.resizeData(Math.max(x+1,this.#dataWidth-1),this.#dataHeight)
			else if( y>=this.#dataHeight) this.resizeData(this.#dataWidth,Math.max(y+1,this.#dataHeight-1))

		const idx=x+this.#dataWidth*y;
		while(idx>this.#data.length)
			for(let i=0;i<this.#width;i++) this.#data.push("");

		if(this.isNumeric(v))v=parseFloat(v);
		this.#data[idx]=v;

		const inputEle=document.getElementById(this.cellId(x,y))
		if(inputEle)inputEle.value=v;
		if(v=="")this.redrawDataArea()

		// setTimeout( this.removeEmptyRowCols.bind(this),300);
		if(this.#options.onChange)this.#options.onChange()

		if(this.#options.undo)
		{
			console.log("add undo")
			const that=this;
			const data=this.#data
      this.#options.undo.add({
          "title": "setvalue",
          undo()
          {
						console.log("undo",idx,oldValue)
						data[idx]=oldValue;
						that.redrawData()
          },
          redo()
          {
							data[idx]=v;
							that.redrawData()
          }
      });
			
		}
	}

	lastRowEmpty()
	{
			const y=this.#dataHeight-1;
			for(let i=0;i<this.#dataWidth;i++)
				if(this.#data[i+y*this.#dataWidth]) return false

			return true
	}
	lastColEmpty()
	{
			const x=this.#dataWidth-1;
			for(let i=0;i<this.#dataHeight;i++)
				if(this.#data[x+i*this.#dataWidth]) return false

			return true
	}

	removeEmptyRowCols()
	{

		let redraw=false
		while(this.lastRowEmpty())
		{
			this.resizeData(this.#dataWidth,this.#dataHeight-1)
			redraw=true
		}
		while(this.lastColEmpty())
		{
			this.resizeData(this.#dataWidth-1,this.#dataHeight)
			redraw=true
		}

		if(redraw)
		{
			this.redrawDataArea()
			this.redrawData()
			
		}
	}


	fromObj(o)
	{
		if(!o)
		{
			this.#data=[1]
			this.#dataWidth=1
			this.#dataHeight=1
			return;
		}

		if(o.colTitles)this.#colTitles=o.colTitles;
		if(o.data)this.#data=o.data;
		if(o.width)this.#dataWidth=o.width;
		if(o.height)this.#dataHeight=o.height;

		this.removeEmptyRowCols();
		this.updateStatus();
		this.redrawData();
	}
	
	toObj()
	{
		return{
			"colTitles":this.#colTitles,
			"data":this.#data,
			"width":this.#dataWidth,
			"height":this.#dataHeight
		}
		
	}

	fromTxt(txt,x,y)
	{
		const separator="\t";
		const rows=txt.split("\n");

		for(let i=0;i<rows.length;i++)
		{
			const cols=rows[i].split(separator);

			for(let j=0;j<cols.length;j++)
				if(cols[j]!=undefined && cols[j]!=null)
					this.setValue(this.absX+j,this.absY+i,cols[j])
		}
	}

	toCsv(includeHead=true)
	{
			let str=""
			const separator=";"
			if(includeHead)
			{
				for(let x=0;x<this.#dataWidth;x++)
				{
					str+=this.#colTitles[x]||x
					if(x<this.#dataWidth-1)str+=separator
				}

				str+="\n"
			}

			for(let y=0;y<this.#dataHeight;y++)
			{
				for(let x=0;x<this.#dataWidth;x++)
				{

					str+=this.getValue(x,y);
					if(x<this.#dataWidth-1)str+=separator
					
				}
				str+="\n"
			}
		return str
	}

	download(filename,str)
	{
	  var element = document.createElement('a');
	  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(str));
	  element.setAttribute('download', filename);

	  element.style.display = 'none';
	  document.body.appendChild(element);

	  element.click();

	  document.body.removeChild(element);
	}		
	
	toJson()
	{
		const arr=[]

			for(let y=0;y<this.#dataHeight;y++)
			{
				const json={};
				for(let x=0;x<this.#dataWidth;x++)
				{
					const title=this.#colTitles[x]||String(x);
					json[title]=this.getValue(x,y);
				}
				arr.push(json);
			}
			return arr
	}

	toArray(multiple )
	{
		if(multiple)
		{
			const arr=[]
			for(let x=0;x<this.#dataWidth;x++) arr[x]=[]

			for(let x=0;x<this.#dataWidth;x++)
				for(let y=0;y<this.#dataHeight;y++)
					arr[x][y]=this.getValue(x,y)

				
			return arr;
		
		}
		else{
			return structuredClone(this.#data)
		}
		
	}

	toTxt()
	{
		const separator="\t";
		let str="";
		let yy=-1;
		this.forEachSelected((x,y,v,xrel,yrel)=>
		{
			if(yy!=-1&&y>yy) str+="\n";

			if(xrel>0)str+=separator;
			str+=v;

			yy=y;
		});
		console.log(str)

		return str;
	}

	redrawDataArea()
	{
		
		for(let y=this.#scrollY;y<this.#scrollY+this.#height;y++)
			for(let x=this.#scrollX;x<this.#width+this.#scrollX;x++)
			{
				const elCell=document.getElementById(this.cellId(x,y));
				if(elCell&& x<this.#dataWidth&& y<this.#dataHeight) elCell.classList.add("value")
				else elCell.classList.remove("value")
			}
	}

	redrawData()
	{

		for(let x=0;x<this.#width;x++)
		{
			const head=document.getElementsByClassName(this.cellColHeadId(x+this.#scrollX))[0];
			if(!head)continue;
			let s=String(x+this.#scrollX);
			if(this.#colTitles[x+this.#scrollX]) s+=":" + this.#colTitles[x + this.#scrollX];
			head.innerHTML=s;
		}

		for(let y=this.#scrollY;y<this.#scrollY+this.#height;y++)
		{
			const eleRowHead=document.getElementsByClassName(this.cellRowHeadId(y))[0];
			if(!eleRowHead)return;
			eleRowHead.innerHTML=y+this.#scrollY;

			for(let x=this.#scrollX;x<this.#width+this.#scrollX;x++)
			{
				const elCell=document.getElementById(this.cellId(x,y));
				if(!elCell){console.log("cell not found");contiune}

				const v=this.#data[(x)+(y)*this.#dataWidth]

				if(elCell&& x<this.#dataWidth&& y<this.#dataHeight)
				{
					elCell.value=v;
					if(this.isNumeric(v))elCell.classList.add("numeric")
					else elCell.classList.remove("numeric")
				}
				else
				{
					elCell.value="";
				}
			}
		}

		this.redrawDataArea();
		this.updateSelection();
		this.updateStatus();
	}

	updateStatus()
	{
		let str="";
		str+=(this.absX )+","+(this.absY);
		str+=" | ";
		str+=this.#dataWidth+"x"+this.#dataHeight;
		if(this.#selectionStartX>-1)
		{
			str+=" | ";
			str+=this.#selectionStartX+","+this.#selectionStartY;
			str+=" - ";
			str+=this.#selectionEndX+","+this.#selectionEndY;
		}
		this.elStatus.innerHTML=str;
	}

	html()
	{
		this.#elContainer.innerHTML=""

		const elTable=document.createElement("div")
		elTable.classList.add("cellmatetable")
		elTable.setAttribute("tabindex",1);

		const elRow=document.createElement("div")
		elRow.classList.add("row");
		elTable.appendChild(elRow);

		this.#elScrollVert=document.createElement("div");
		this.#elScrollVert.classList.add("cellMateScrollVert")
		this.#elScrollVertInner=document.createElement("div")
		this.#elScrollVert.appendChild(this.#elScrollVertInner);
		this.#elContainer.appendChild(this.#elScrollVert);
		this.#elScrollVert.addEventListener("scroll", () => {
			if(!this.#pauseScrolling)
			{
				this.#scrollY=Math.floor(this.#elScrollVert.scrollTop/this.#rowHeight);
				this.redrawData()
			}
		 });
		this.#elScrollHor=document.createElement("div");
		this.#elScrollHor.classList.add("cellMateScrollHor")
		this.#elScrollHorInner=document.createElement("div")
		this.#elScrollHor.appendChild(this.#elScrollHorInner);
		this.#elContainer.appendChild(this.#elScrollHor);
		this.#elScrollHor.addEventListener("scroll", () => {
			if(!this.#pauseScrolling)
			{
				this.#scrollX=Math.floor(this.#elScrollHor.scrollLeft/this.#cellWidth);
				this.redrawData()
			}
		 });

		for(let x=0;x<this.#width+1;x++)
		{
			const elColHead=document.createElement("div")
			elColHead.classList.add("head");
			if(x>0)elColHead.classList.add(this.cellColHeadId(x-1));
			elColHead.dataset.idx=x;
			if(x>0)elColHead.dataset.x=x-1;
			elRow.appendChild(elColHead);
			if(x) elColHead.innerHTML=x;

			elColHead.addEventListener("dblclick",(e)=>{
				const t=prompt("title");
				this.#colTitles[parseInt(e.srcElement.dataset.x)]=t;
				this.redrawData();
			});

			const col=x;
			elColHead.addEventListener("click",(e)=>{
				this.selectCol(col-1,e)
			});
		}

		for(let y=0;y<this.#height;y++)
		{
			const elRow=document.createElement("div")
			elRow.classList.add("row");
			elTable.appendChild(elRow);

			const elRowHead=document.createElement("div")
			elRowHead.classList.add("head")
			elRowHead.classList.add(this.cellRowHeadId(y))
			elRow.appendChild(elRowHead)
			elRowHead.innerHTML=y;
			const row=y
			elRowHead.addEventListener("click",(e)=>{
				this.selectRow(row,e);
			});
			for(let x=0;x<this.#width;x++)
			{
				const elCell=document.createElement("div")
				elCell.classList.add("cell")
				elRow.appendChild(elCell)
				const elInput=document.createElement("input");
				elInput.id=this.cellId(x,y)
				elInput.setAttribute("readonly",true)
				elInput.dataset.x=x;
				elInput.dataset.y=y;
				elCell.appendChild(elInput);

				elInput.addEventListener("pointerdown",(e)=>
				{
					this.mouseDown=true;
					this.unselectAll();
					this.#selectionStartX=parseInt(e.srcElement.dataset.x)+this.#scrollX;
					this.#selectionStartY=parseInt(e.srcElement.dataset.y)+this.#scrollY;
					this.setCursorAbs(this.#selectionStartX,this.#selectionStartY)
				});

				elInput.addEventListener("pointerup",(e)=>
				{
					this.mouseDown=false;
					if(parseInt(e.srcElement.dataset.x)+this.#scrollX==this.#selectionStartX&& parseInt(e.srcElement.dataset.y)+this.#scrollY==this.#selectionStartY				)
					{
						this.#selectionStartX=-1;
						this.#selectionStartY=-1;
						this.#selectionEndX=-1;
						this.#selectionEndY=-1;
					}
				});

				elInput.addEventListener("pointerenter",(e)=>
				{
					if(this.mouseDown && this.#selectionStartX!=-1)
					{
						this.#selectionEndX=parseInt(e.srcElement.dataset.x)+this.#scrollX;
						this.#selectionEndY=parseInt(e.srcElement.dataset.y)+this.#scrollY;
						this.updateStatus();
						this.updateSelection();
					}
				});
				elInput.addEventListener("wheel",(e)=>
				{
					if(e.deltaY>0){
						this.scrollDown(1);
					}
					else {
						this.scrollUp(1);
					}

				});

				elInput.addEventListener("input",(e)=>
				{
				  if (this.#options.undo&& (e.ctrlKey || e.metaKey) && e.key === "z")
				  {
				  	e.preventDefault()
				  	elInput.blur()
				  	if(event.shiftKey) this.#options.undo.redo();
				  	else this.#options.undo.undo();
				  }
				  else
				  {
	 					this.setValue(this.absX,this.absY,e.srcElement.value)
				  }
				});

				elInput.addEventListener("blur",(e)=>
				{
					this.removeEmptyRowCols();
					this.redrawData();
				});

				elCell.addEventListener("click",(e)=>
				{
					this.setCursor(parseInt(e.srcElement.dataset.x), parseInt(e.srcElement.dataset.y),e);
				});

				elInput.addEventListener("dblclick",(e)=>
				{
					this.focusCell(parseInt(e.srcElement.dataset.x), parseInt(e.srcElement.dataset.y),e);
				});

				elInput.addEventListener("keydown",(e)=>
				{
	
				});
			}
		}

		this.#elTable=elTable;
		this.#elContainer.appendChild(elTable)

		this.elStatus=document.createElement("div");
		this.elStatus.classList.add("cellmateStatus");
		this.#elContainer.appendChild(this.elStatus);

		this.elNotify=document.createElement("div");
		this.elNotify.classList.add("cellmateNotification");
		this.#elContainer.appendChild(this.elNotify);

		this.#elTable.addEventListener("copy",(e)=>
		{
			navigator.clipboard.writeText(this.toTxt());

			this.notify("copied "+this.lastSelectedForeachCount+" entries");
		});
		this.#elTable.addEventListener("cut",(e)=>
		{
			navigator.clipboard.writeText(this.toTxt());
			this.deleteSelectionContent()

			this.notify("copied "+this.lastSelectedForeachCount+" entries");
		});

		this.#elTable.addEventListener("paste",(e)=>
		{
      this.isPasting = true;
      if (e.clipboardData.types.indexOf("text/plain") == -1)
      {
          console.log("Paste failed",e.clipboardData.types);
          return;
      }
      let str = e.clipboardData.getData("text/plain");

			this.fromTxt(str);
			e.preventDefault();
		});

		this.#elTable.addEventListener("keydown",(e)=>
		{
		  if (this.#options.undo&& (e.ctrlKey || e.metaKey) && e.key === "z")
		  {
		  	e.preventDefault()
		  	if(event.shiftKey) this.#options.undo.redo();
		  	else this.#options.undo.undo();
		  }
		  else
			if(e.key=="Enter")
			{
				if(this.#elActiveInput)
				{
					this.unFocusInput();
					this.moveCursorDown()
				}
				else
				{
					this.unFocusInput();
					this.focusCell(this.cursorScreenX,this.cursorScreenY);
					this.redrawDataArea()
				}
			}
			else if(!this.#elActiveInput && (e.key=="Delete"||e.key=="Backspace")) this.deleteSelectionContent();
			else if(!this.#elActiveInput &&  e.key=="ArrowDown") this.moveCursorDown(e);
			else if(!this.#elActiveInput &&  e.key=="ArrowUp") this.moveCursorUp(e);
			else if(!this.#elActiveInput &&  e.key=="ArrowLeft") this.moveCursorLeft(e);
			else if(!this.#elActiveInput &&  e.key=="ArrowRight") this.moveCursorRight(e);
			else if(!this.#elActiveInput &&  e.key=="PageUp") this.moveY(-this.#height);
			else if(!this.#elActiveInput &&  e.key=="PageDown") this.moveY(this.#height);
			else
				if(e.code && (e.code.startsWith("Digit") || e.code.startsWith("Key") ))
				{
					if(!this.#elActiveInput) this.focusCell(this.cursorScreenX,this.cursorScreenY);
				}
				else
				{
					console.log(e);
				}

		});
		this.redrawData();
	}

	dispose()
	{
		this.#elTable.remove()
		this.#elTable=null;
		this.#data=null;
	}
	
}

module.exports=CellMate;
