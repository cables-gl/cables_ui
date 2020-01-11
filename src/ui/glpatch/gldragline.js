var CABLES=CABLES||{}
CABLES.GLGUI=CABLES.GLGUI||{};

CABLES.GLGUI.GlRectDragLine=class
{
    constructor(linedrawer,glpatch)
    {
        this._rect=null;
        this._lineDrawer=linedrawer;

        this._lineIdx0=this._lineDrawer.getIndex();
        this._glPatch=glpatch;
        this._patchDragWasAllowed=this._glPatch.allowDragging;

        this._startPortOpId=null;
        this._startPortName=null;


        glpatch.on("mouseup",(e) =>
        {
            if(this.isActive) this.stop();
        });

        
        glpatch.on("mouseDownOverPort",(p,opid,portName) =>
        {
            this.setPort(p,opid,portName);
        });

        glpatch.on("mouseUpOverPort",(opid,portName) =>
        {
            console.log('mouseUpOverPort',
            this._startPortOpId,
            this._startPortName,
            opid,
            portName);
    
            this._glPatch.patchAPI.linkPorts(this._startPortOpId,
                this._startPortName,
                opid,
                portName);
        });

        
    }

    setPort(p,opid,portName)
    {
        if(!p)
        {
            this._port=this._rect=null;
            this._lineDrawer.setLine(this._lineIdx0,0,0,0,0);
            return;
        }

        this._startPortOpId=opid;
        this._startPortName=portName;

        this._rect=p.rect;
        this._port=p;
        this._lineDrawer.setColor(this._lineIdx0,1,1,1,1);

        this._patchDragWasAllowed=this._glPatch.allowDragging;
        this._glPatch.allowDragging=false;

        this._update();
    }

    _update()
    {
        if(this._rect && this._port)
        {
            this._lineDrawer.setLine(this._lineIdx0,
                this._port.glOp.x+this._rect.x+CABLES.GLGUI.VISUALCONFIG.portWidth/2,
                this._port.glOp.y+this._rect.y+CABLES.GLGUI.VISUALCONFIG.portHeight/2,
                this._x,
                this._y);
        }

    }

    get isActive()
    {
        return this._port!=null;
    }

    stop()
    {
        console.log('stopopopopopop');
        this.setPort(null);
        this._glPatch.allowDragging=this._patchDragWasAllowed;
    }

    setPosition(x,y)
    {
        this._x=x;
        this._y=y;
        this._update();
    }

    setColor(r,g,b,a)
    {
        this._lineDrawer.setColor(this._lineIdx0,r,g,b,a);
    }


}
