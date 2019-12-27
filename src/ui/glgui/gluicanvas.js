var CABLES=CABLES||{}
CABLES.GLGUI=CABLES.GLGUI||{};


CABLES.GLGUI.GlGuiTab = function (tabs)
{
    this._tab = new CABLES.UI.Tab("GlGui", { icon: "cube", infotext: "tab_glgui" });
    tabs.addTab(this._tab, true);
    gui.maintabPanel.show();
    
    var a=new CABLES.GLGUI.GlUiCanvas(CABLES.patch,this._tab.contentEle);
    
    a.setSize(740,800);

};

// ---------------------------------------------------------------------


CABLES.GLGUI.GlUiCanvas=class
{
    constructor(_patch,parentEle)
    {
        this.width=0;
        this.height=0;
        this.canvas = document.createElement("canvas");
        this.canvas.id="glGuiCanvas-"+CABLES.uuid();
        this.canvas.style.display='block';
        // this.canvas.style.position='absolute';
        this.canvas.style.border='1px solid red';
        this.canvas.style['z-index']=9999999991;

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
        
        this.setSize(100,100);

    }

    get element()
    {
        return this.canvas;
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
        if(!this.glPatch.needsRedraw)return;

        // this.glPatch.setFont(inFont.get());
        // var identTranslate=vec3.create();
        // vec3.set(identTranslate, 0,0,0);
        // var identTranslateView=vec3.create();
        // vec3.set(identTranslateView, 0,0,-2);
        
        // console.log("render!");
        const cgl=this.patch.cgl;

        // this.setSize(800,400);
        cgl.renderStart(cgl);

        cgl.gl.clearColor(0.35,0.35,0.35,0);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);

        
        // this.patchApi.reset();

        this.glPatch.render(
            this.width,
            this.height,
            0,0, //scroll
            777, //zoom
            0,0, //mouse
            0, // mouse button
            
            );
    

        cgl.renderEnd(cgl);

    }


}