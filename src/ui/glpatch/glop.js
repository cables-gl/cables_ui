
var CABLES=CABLES||{}
CABLES.GLGUI=CABLES.GLGUI||{};

CABLES.GLGUI.OP_MIN_WIDTH=100;
CABLES.GLGUI.OP_HEIGHT=30;

CABLES.GLGUI.OP_PORT_DISTANCE=10;
CABLES.GLGUI.OP_PORT_WIDTH=7;
CABLES.GLGUI.OP_PORT_HEIGHT=7;

CABLES.GLGUI.GlOp=class extends CABLES.EventTarget
{
    constructor(glPatch,instancer,op)
    {
        super();

        this._id=op.id;
        this._glPatch=glPatch;
        this.opUiAttribs=op.uiAttribs;
        this._op=op;
        this._instancer=instancer;
        this._glRectBg=new CABLES.GLGUI.GlRect(instancer);
        this._glRectBg.setSize(100,CABLES.GLGUI.OP_HEIGHT);
        this._glRectBg.setColor(51/255,51/255,51/255,1)
        
        this._portRects=[];
        this._links={};
        this._width=CABLES.GLGUI.OP_MIN_WIDTH;
        this._hovering=false;

        this.updatePosition();

        for(var i=0;i<this._op.portsIn.length;i++) this._setupPort(i,this._op.portsIn[i]);
        for(var i=0;i<this._op.portsOut.length;i++) this._setupPort(i,this._op.portsOut[i]);

        const portsSize=Math.max(this._op.portsIn.length,this._op.portsOut.length)*10;

        this._glRectBg.setSize(Math.max(this._width,portsSize),CABLES.GLGUI.OP_HEIGHT );
        this.setHover(false);
    }

    get id()
    {
        return this._id;
    }

    set uiAttribs(attr)
    {
        this.opUiAttribs=attr;
    }

    get uiAttribs()
    {
        return this.opUiAttribs;
    }

    addLink(l)
    {
        this._links[l.id]=l;
    }

    setMousePos(x,y)
    {
        const wasHovering=this._hovering;

        this.setHover(this._glRectBg.isPointInside(x,y));

        if(this._hovering)
        {
            for(var i=0;i<this._portRects.length;i++)
            {
                this._portRects[i].setOutline(this._portRects[i].isPointInside(x,y));
                // if( this._portRects[i].isPointInside(x,y) ) this._portRects[i].setColor(1,0,0,1);
                // else this._portRects[i].setColor(0,0,0,1);
            }
        }

        if(wasHovering && !this._hovering)
        {
            for(var i=0;i<this._portRects.length;i++)
                this._portRects[i].setOutline(false);

        }
    }

    setHover(h)
    {
        if(!this._hovering && h) this.emitEvent("hoverStart");
        if(this._hovering && !h) this.emitEvent("hoverEnd");

        this._hovering=h;
        this._glRectBg.setOutline(this._hovering);

        // if(h) this._glRectBg.setColor(80/255,80/255,80/255,0.3);
        // else this._glRectBg.setColor(51/255,51/255,51/255,0.3);
    }



    dispose()
    {
        if(this._glRectBg)
        {
            this._glRectBg.setSize(0,0);
            this._glRectBg.setPosition(0,0);
        }
        for(var i=0;i<this._portRects.length;i++)
        {
            this._portRects[i].setSize(0,0);
            this._portRects[i].setPosition(0,0);
        }

        this._op=null;
        this._portRects.length=0;
        this._glRectBg=null;
        this._instancer=null;
    }

    removeLink(linkId)
    {
        const l=this._links[linkId];
        if(l)
        {
            delete this._links[linkId];
            this.update();
        }
        
    }

    _setupPort(i,p)
    {
        var r=new CABLES.GLGUI.GlRect(this._instancer,{"parent":this._glRectBg});
        r.setSize(CABLES.GLGUI.OP_PORT_WIDTH,CABLES.GLGUI.OP_PORT_HEIGHT);

        this._glPatch.setDrawableColorByType(r,p.type);

        var y=0;
        if(p.direction==1) y=CABLES.GLGUI.OP_HEIGHT-5;
        r.setPosition(i*CABLES.GLGUI.OP_PORT_DISTANCE,y);
        this._glRectBg.addChild(r);
        this._portRects.push(r);
    }

    updatePosition()
    {
        if(!this._glRectBg)
        {
            return;
        }
        this._glRectBg.setPosition(this.opUiAttribs.translate.x,this.opUiAttribs.translate.y);
    }

    getUiAttribs()
    {
        return this.opUiAttribs;
    }

    getOp()
    {
        return this._op;
    }

    update()
    {
        this.updatePosition();
        for(var i in this._links)
        {
            this._links[i].update();
        }
    }

    getPortPos(id)
    {
        for(var i=0;i<this._op.portsIn.length;i++)
        {
            if(this._op.portsIn[i].id==id)
                return i*CABLES.GLGUI.OP_PORT_DISTANCE+CABLES.GLGUI.OP_PORT_WIDTH*0.5;
        }

        for(var i=0;i<this._op.portsOut.length;i++)
        {
            if(this._op.portsOut[i].id==id)
                return i*CABLES.GLGUI.OP_PORT_DISTANCE+CABLES.GLGUI.OP_PORT_WIDTH*0.5;
        }

        return 100;
    }

}

