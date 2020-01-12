var CABLES=CABLES||{}
CABLES.GLGUI=CABLES.GLGUI||{};


CABLES.GLGUI.GlGuiTab = function (tabs)
{
    this._tab = new CABLES.UI.Tab("GlGui", { icon: "cube", infotext: "tab_glgui" });
    tabs.addTab(this._tab, true);
    gui.maintabPanel.show();
    this._tab.contentEle.innerHTML="";
    var a=new CABLES.GLGUI.GlUiCanvas(CABLES.patch,this._tab.contentEle);

    
    a.parentResized();

    this._tab.on("resize",()=>
    {
        a.parentResized();
    });

};

// ---------------------------------------------------------------------


CABLES.GLGUI.GlUiCanvas=class
{
    constructor(_patch,parentEle)
    {
        this._moveover=true;
        this._firstTime=true;
        this._lastTime=0;
        this.width=0,this.height=0;
        this._mouseX=0,this._mouseY=0;
        this._zoom=333;
        this._smoothedZoom=new CABLES.UI.ValueSmoother(this._zoom,CABLES.GLGUI.VISUALCONFIG.zoomSmooth);


        this._scrollX=0,this._scrollY=0;
        this._oldScrollX=0,this._oldScrollY=0;

        this.canvas = document.createElement("canvas");
        this.canvas.id="glGuiCanvas-"+CABLES.uuid();
        // this.canvas.style.display='block';
        // this.canvas.style.position='absolute';
        this.canvas.style.border='0px solid white';
        // this.canvas.style.cursor='none';
        // this.canvas.style['z-index']=9999999991;
        this._parentEle=parentEle;

        if(parentEle)parentEle.appendChild(this.canvas);
        else document.body.appendChild(this.canvas);

        this.patch=new CABLES.Patch(
            {
                "glCanvasId":this.canvas.id,
                "glCanvasResizeToParent":false,
                "glCanvasResizeToWindow":false
            });

        for(var i=0;i<=8;i++) this.patch.cgl.setTexture(i,CGL.Texture.getEmptyTexture(this.patch.cgl).tex);

        this.glPatch=new CABLES.GLGUI.GlPatch(this.patch.cgl);
        this.patchApi=new CABLES.GLGUI.GlPatchAPI(_patch,this.glPatch);
        
        this.patchApi.reset();
        
        this.patch.addEventListener("onRenderFrame",this.render.bind(this));

        this.patch.cgl.pixelDensity=window.devicePixelRatio;
        this.setSize(100,100);

        this.canvas.addEventListener("mousemove",(e)=>
        {
            this.activityHigh();

            if(this._mouseButton==2 && this.glPatch.allowDragging)
            {
                const pixelMulX=this.width/this._zoom*0.5;
                const pixelMulY=this.height/this._zoom*0.5;

                this._scrollX=this._oldScrollX+(this._mouseRightDownStartX-e.offsetX)/pixelMulX;
                this._scrollY=this._oldScrollY+(this._mouseRightDownStartY-e.offsetY)/pixelMulY;
            }
            this._mouseX=e.offsetX;
            this._mouseY=e.offsetY;
            this.glPatch.needsRedraw=true;
        });

        this.canvas.addEventListener("mousedown",(e)=>
        {
            this.activityHigh();
            if(e.buttons==2)
            {
                this._oldScrollX=this._scrollX;
                this._oldScrollY=this._scrollY;
                this._mouseRightDownStartX=e.offsetX;
                this._mouseRightDownStartY=e.offsetY;
            }
            this.glPatch.needsRedraw=true;
            this._mouseButton=e.buttons;
        });

        this.canvas.addEventListener("mouseup",(e)=>
        {
            this.activityHigh();
            this.glPatch.needsRedraw=true;
            this._mouseButton=-1;

            this._oldScrollX=this._scrollX;
            this._oldScrollY=this._scrollY;
        });

        this.canvas.addEventListener("mouseleave",(e)=>
        {
            this.activityMedium();
            this._mouseOver=false;
        });

        this.canvas.addEventListener("mouseenter",(e)=>
        {
            this.activityHigh();
            this._mouseOver=true;
        });

        this.canvas.addEventListener("wheel", (event)=>
        {
            this.activityHigh();
            const wheelMultiplier=CABLES.UI.userSettings.get("wheelmultiplier")||1;
    
            var delta = CGL.getWheelSpeed(event);
            event = mouseEvent(event);
            delta*=wheelMultiplier;

            if(event.altKey) this._scrollY-=delta;
            else if(event.shiftKey) this._scrollX-=delta;
            else this._zoom+=delta*(this._zoom/155);

            this._zoom=Math.max(CABLES.GLGUI.VISUALCONFIG.minZoom,this._zoom);
            this._smoothedZoom.set(this._zoom);

            if (event.ctrlKey || event.altKey) // disable chrome pinch/zoom gesture
            {
                event.preventDefault();
                event.stopImmediatePropagation();
                return;
            }
    
        });





        this._fontTex=CGL.Texture.load(this.patch.cgl,"/ui/img/sdf_font_arial.png",
            ()=>{
                this.glPatch.setFont(this._fontTex);
                this.glPatch.needsRedraw=true;
            },{flip:false});

        this.parentResized();
        this.activityHigh();
    
    }

    get element()
    {
        return this.canvas;
    }

    parentResized()
    {
        this.setSize(this._parentEle.clientWidth,this._parentEle.clientHeight);
        this.glPatch.needsRedraw=true;
    }

    setSize(w,h)
    {
        this.width=w;
        this.height=h;
        this.canvas.style.width=w+'px';
        this.canvas.style.height=h+'px';
        this.canvas.width=w;
        this.canvas.height=h;
        this.patch.cgl.setSize(w,h);
    }

    dispose()
    {
        this.patch.removeEventListener("onRenderFrame",this.render.bind(this));
        this.patch.pause();
        this.patch.dispose();
        this.canvas.remove();
    }

    activityIdle()
    {
        this._targetFps=20;
    }

    activityHigh()
    {
        this._targetFps=0;
        clearTimeout(this._activityTimeout);
        this._activityTimeout=setTimeout(()=>{ this.activityMedium(); },1000);
    }

    activityMedium()
    {
        this._targetFps=30;
        if(!this._mouseOver)this._targetFps=25;
        clearTimeout(this._activityTimeout);
        this._activityTimeout=setTimeout(()=>{ this.activityIdle(); },2000);
    }

    render()
    {
        if(this._targetFps!=0 && !this._mouseOver && performance.now()-this._lastTime < 1000/this._targetFps)
        {
            return;
        }

        if(this._oldTargetFps!=this._targetFps)
        {
            // console.log("target fps:",this._targetFps)
            this._oldTargetFps=this._targetFps;
        }

        const cgl=this.patch.cgl;

        cgl.renderStart(cgl);

        if(this._firstTime)
        {
            this._firstTime=false;
        }

        cgl.gl.clearColor(0.23,0.23,0.23,0);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);

        this._smoothedZoom.update();
        this.glPatch.debugData['targetFps']=this._targetFps;

        this.glPatch.render(
            this.width,this.height,
            -this._scrollX,this._scrollY, //scroll
            this._smoothedZoom.value, //zoom
            this._mouseX,this._mouseY, //mouse
            this._mouseButton // mouse button
            );

        cgl.renderEnd(cgl);
        this._lastTime=performance.now();
    }


}