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
        this._lastTime=0;
        this.width=0,this.height=0;
        this._mouseX=0,this._mouseY=0;

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
        
        this.glPatch=new CABLES.GLGUI.GlPatch(this.patch.cgl);
        this.patchApi=new CABLES.GLGUI.GlPatchAPI(_patch,this.glPatch);
        
        this.patchApi.reset();
        
        this.patch.addEventListener("onRenderFrame",this.render.bind(this));
        this.patch.cgl.pixelDensity=window.devicePixelRatio;
        this.setSize(100,100);

        this.canvas.addEventListener("mousemove",(e)=>
        {
            this._mouseX=e.offsetX;
            this._mouseY=e.offsetY;
            this.glPatch.needsRedraw=true;
        });

        this.canvas.addEventListener("mousedown",(e)=>
        {
            this.glPatch.needsRedraw=true;
            this._mouseButton=e.buttons;
        });

        this.canvas.addEventListener("mouseup",(e)=>
        {
            this.glPatch.needsRedraw=true;
            this._mouseButton=-1;
        });

        this.canvas.addEventListener("mouseleave",(e)=>
        {
            this._mouseOver=false;
        });

        this.canvas.addEventListener("mouseenter",(e)=>
        {
            this._mouseOver=true;
        });


        this.parentResized();

        this._fontTex=CGL.Texture.load(this.patch.cgl,"/ui/img/sdf_font_arial.png",
            ()=>{
                this.glPatch.needsRedraw=true;
            },{flip:false});

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
        this.canvas.remove();
        this.patch.removeEventListener("onRenderFrame",this.render.bind(this));
    }

    render()
    {
        // if(!this.glPatch.needsRedraw)return;
        if(!this._mouseOver && performance.now()-this._lastTime < 25)
        {
            // console.log("skip frame!");
            return;
        }
        

        this.glPatch.setFont(this._fontTex);
        // var identTranslate=vec3.create();
        // vec3.set(identTranslate, 0,0,0);
        // var identTranslateView=vec3.create();
        // vec3.set(identTranslateView, 0,0,-2);
        
        // console.log("render!");
        const cgl=this.patch.cgl;

        // this.setSize(800,400);
        cgl.renderStart(cgl);

        cgl.gl.clearColor(0.23,0.23,0.23,0);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);

        
        // this.patchApi.reset();

        this.glPatch.render(
            this.width,this.height,
            0,0, //scroll
            333, //zoom
            this._mouseX,this._mouseY, //mouse
            this._mouseButton // mouse button
            );

        cgl.renderEnd(cgl);
        this._lastTime=performance.now();
    }


}