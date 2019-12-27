var CABLES=CABLES||{}
CABLES.GLGUI=CABLES.GLGUI||{};

CABLES.GLGUI.GlUiCanvas=class
{
    constructor(patch)
    {
        this.width=0;
        this.height=0;
        this.canvas = document.createElement("canvas");
        this.canvas.id="glGuiCanvas-"+CABLES.uuid();
        this.canvas.style.display='block';
        this.canvas.style.position='absolute';
        this.canvas.style.border='3px solid black';
        this.canvas.style['z-index']=9999999991;
        document.body.appendChild(this.canvas);
        
        this.setSize(100,100);

        var ctx = this.canvas.getContext("2d");

        this.glPatch=new CABLES.GLGUI.GlPatch(patch);
        this.patchApi=new CABLES.GLGUI.GlPatchAPI(patch,this.glPatch);

        ctx.beginPath();
        ctx.rect(0, 0, 150, 100);
        ctx.fillStyle = "red";
        ctx.fill();
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
    }

    dispose()
    {
        this.canvas.remove();
    }

    render()
    {
        // p.setFont(inFont.get());

        p.render(
            width,
            height,
            0,0, //scroll
            1, //zoom
            0,0, //mouse
            0, // mouse button
            
            );
    
    }


}