
var CABLES=CABLES||{}
CABLES.GLGUI=CABLES.GLGUI||{};

CABLES.GLGUI.OP_MIN_WIDTH=100;

CABLES.GLGUI.GlOp=function(instancer,op)
{
    this._op=op;
    this._instancer=instancer;
    this._glRectBg=new CABLES.GLGUI.GlRect(instancer);
    // this._glRectBg.setPosition(0,0);
    this._glRectBg.setSize(100,30);
    this._glRectBg.setColor(0.1,0.1,0.1);
    this._portRects=[];

    this.updatePosition();

    for(var i=0;i<this._op.portsIn.length;i++)
        this._setupPort(i,this._op.portsIn[i]);

    for(var i=0;i<this._op.portsOut.length;i++)
        this._setupPort(i,this._op.portsOut[i]);

    const portsSize=Math.max(this._op.portsIn.length,this._op.portsOut.length)*10;

    this._glRectBg.setSize(Math.max(CABLES.GLGUI.OP_MIN_WIDTH,portsSize),30);
}

CABLES.GLGUI.GlOp.prototype.dispose=function()
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

CABLES.GLGUI.GlOp.prototype._setupPort=function(i,p)
{
    var r=new CABLES.GLGUI.GlRect(this._instancer,{"parent":this._glRectBg});
    r.setSize(7,5);

    if(p.type == CABLES.OP_PORT_TYPE_VALUE) r.setColor(0,1,0.7);
        else if(p.type == CABLES.OP_PORT_TYPE_FUNCTION) r.setColor(1,1,0);
        else if(p.type == CABLES.OP_PORT_TYPE_OBJECT) r.setColor(1,0,1);
        else if(p.type == CABLES.OP_PORT_TYPE_ARRAY) r.setColor(0,0.3,1);
        else if(p.type == CABLES.OP_PORT_TYPE_STRING) r.setColor(1,0.3,0);
        else if(p.type == CABLES.OP_PORT_TYPE_DYNAMIC) r.setColor(1,1,1);

    var y=0;
    if(p.direction==1)y=30-5;
    r.setPosition(i*10,y);
    this._glRectBg.addChild(r);
    this._portRects.push(r);
}



CABLES.GLGUI.GlOp.prototype.updatePosition=function()
{
    if(!this._glRectBg)
    {
        console.log("no this._glRectBg");
        return;
    }
    this._glRectBg.setPosition(this._op.uiAttribs.translate.x,this._op.uiAttribs.translate.y);
}

CABLES.GLGUI.GlOp.prototype.getOp=function()
{
    return this._op;
}

CABLES.GLGUI.GlOp.prototype.update=function()
{
    this.updatePosition();
}




// ------------------------------------

