var CABLES=CABLES||{}
CABLES.GLGUI=CABLES.GLGUI||{};

CABLES.GLGUI.GlPort=class
{
    constructor(glpatch,glop,rectInstancer,p,i,oprect)
    {
        this._port=p;
        this._glop=glop;
        this._rect=new CABLES.GLGUI.GlRect(rectInstancer,{"parent":oprect,"interactive":true});
        this._rect.setSize(CABLES.GLGUI.VISUALCONFIG.portWidth,CABLES.GLGUI.VISUALCONFIG.portHeight);

        glpatch.setDrawableColorByType(this._rect,p.type);

        var y=0;
        if(this._port.direction==1) y=CABLES.UI.uiConfig.opHeight-CABLES.GLGUI.VISUALCONFIG.portHeight;
        
        this._rect.setPosition(i*(CABLES.GLGUI.VISUALCONFIG.portWidth+CABLES.GLGUI.VISUALCONFIG.portPadding),y);
        oprect.addChild(this._rect);
        // this._portRects.push(r);
        // this._rect.data.portId=this._port.id;
        // this._rect.data.opId=this._port.parent.id; // not needed now as class...

        this._rect.on("mousedown",(e,rect) =>
        {
            console.log("PORT DIQB");
            if(e.buttons==CABLES.UI.MOUSE_BUTTON_RIGHT)
            {
                glpatch.patchAPI.unlinkPort(this._port.parent.id,this._port.id);
            }
            else 
            {
                glpatch.emitEvent("mouseDownOverPort",this,this._glop.id,this._port.name);
            }
        });

        this._rect.on("mouseup",(e,rect) =>
        {
            glpatch.emitEvent("mouseUpOverPort",this._glop.id,this._port.name);
        });

        this._rect.on("hover",(rect) =>
        {
            console.log("port",this._port.name,this._rect.isHovering());

            // rect.setOutline(true);
        });

        this._rect.on("unhover",(rect) =>
        {
            console.log("port",this._rect.isHovering());
            // rect.setOutline(false);
        });

        
    }
    get glOp()
    {
        return this._glop;
    }
    get rect()
    {
        return this._rect;
    }

    dispose()
    {
        this._rect.dispose();
    }


}





