

CABLES.Gizmo=function()
{
    this._eleCenter=null;
    this._eleX=null;
    this._eleY=null;

    this._params=null;
    this._origValue=0;
    this._dragSum=0;
}

CABLES.Gizmo.prototype.drawLine=function(x,y,z)
{
    var cgl=gui.scene().cgl;
    if(!this.geom)
    {
        this.geom=new CGL.Geometry("gizmoline");
        this.geom.vertices=[0,0,0,0,0,0,0];
        this.geom.vertices.length=18;
        this.mesh=new CGL.Mesh(cgl,this.geom);

        this.shaderX=new CGL.Shader(cgl,'gizmo mat');
        this.shaderX.setSource(this.shaderX.getDefaultVertexShader(),this.shaderX.getDefaultFragmentShader(1,0,0));
        this.shaderX.glPrimitive=cgl.gl.LINES;

        this.shaderY=new CGL.Shader(cgl,'gizmo mat');
        this.shaderY.setSource(this.shaderY.getDefaultVertexShader(),this.shaderY.getDefaultFragmentShader(0,1,0));
        this.shaderY.glPrimitive=cgl.gl.LINES;

        this.shaderZ=new CGL.Shader(cgl,'gizmo mat');
        this.shaderZ.setSource(this.shaderZ.getDefaultVertexShader(),this.shaderZ.getDefaultFragmentShader(0,0,1));
        this.shaderZ.glPrimitive=cgl.gl.LINES;
    }

    var ind=0;




    this.geom.vertices[ind++]=this._params.posX.get();
    this.geom.vertices[ind++]=this._params.posY.get();
    this.geom.vertices[ind++]=this._params.posZ.get();

    this.geom.vertices[ind++]=this._params.posX.get()+x;
    this.geom.vertices[ind++]=this._params.posY.get()+y;
    this.geom.vertices[ind++]=this._params.posZ.get()+z;





    var shader=this.shaderX;
    if(y>0)shader=this.shaderY;
    if(z>0)shader=this.shaderZ;

    this.mesh.updateVertices(this.geom);

    cgl.setShader(shader);

    this.mesh.render(shader);

    cgl.setPreviousShader();

};

CABLES.Gizmo.prototype.set=function(params)
{
    this._params=params;

    if(!this._eleCenter)
    {
        var container = gui.scene().cgl.canvas.parentElement;

        this._eleCenter = document.createElement('div');
        this._eleCenter.id="gizmo";
        this._eleCenter.style.background="#fff";
        this._eleCenter.classList.add('gizmo');
        container.appendChild(this._eleCenter);

        this._eleX = document.createElement('div');
        this._eleX.id="gizmo";
        this._eleX.style.background="#f00";
        this._eleX.classList.add('gizmo');
        container.appendChild(this._eleX);

        this._eleY = document.createElement('div');
        this._eleY.id="gizmo";
        this._eleY.style.background="#0f0";
        this._eleY.classList.add('gizmo');
        container.appendChild(this._eleY);

        this._eleZ = document.createElement('div');
        this._eleZ.id="gizmo";
        this._eleZ.style.background="#00f";
        this._eleZ.classList.add('gizmo');
        container.appendChild(this._eleZ);


        this._eleX.addEventListener("mousedown",function()
        {
            if(!this._params)return;
            this._draggingPort=this._params.posX;
            this._origValue=this._params.posX.get();
            this._dragSum=0;
            this.dragger(this._eleCenter);
        }.bind(this));

        this._eleY.addEventListener("mousedown",function()
        {
            if(!this._params)return;
            this._draggingPort=this._params.posY;
            this._origValue=this._params.posY.get();
            this._dragSum=0;
            this.dragger(this._eleCenter);
        }.bind(this));

        this._eleZ.addEventListener("mousedown",function()
        {
            if(!this._params)return;
            this._draggingPort=this._params.posZ;
            this._origValue=this._params.posZ.get();
            this._dragSum=0;
            this.dragger(this._eleCenter);
        }.bind(this));


    }

    if(!params)
    {
        this._eleCenter.style.display="none";
        this._eleX.style.display="none";
        this._eleZ.style.display="none";
        this._eleY.style.display="none";

        return;
    }


    this._eleCenter.style.display="block";
    this._eleCenter.style.left=params.x+"px";
    this._eleCenter.style.top=params.y+"px";

    this._eleX.style.display="block";
    this._eleX.style.left=params.xx+"px";
    this._eleX.style.top=params.xy+"px";

    this._eleY.style.display="block";
    this._eleY.style.left=params.yx+"px";
    this._eleY.style.top=params.yy+"px";

    this._eleZ.style.display="block";
    this._eleZ.style.left=params.zx+"px";
    this._eleZ.style.top=params.zy+"px";

        this.drawLine(2,0,0);
        this.drawLine(0,2,0);
        this.drawLine(0,0,2);


}


CABLES.Gizmo.prototype.dragger=function(el)
{
    var isDown=false;
    var self=this;
    // var startVal=$('#'+ele).val();
    // var el=document.getElementById(ele);
    var incMode=0;

    function keydown(e)
    {
    }

    function down(e)
    {
        gui.setStateUnsaved();
        isDown=true;
        document.addEventListener('pointerlockchange', lockChange, false);
        document.addEventListener('mozpointerlockchange', lockChange, false);
        document.addEventListener('webkitpointerlockchange', lockChange, false);

        document.addEventListener('keydown', keydown, false);

        el.requestPointerLock = el.requestPointerLock ||
                                    el.mozRequestPointerLock ||
                                    el.webkitRequestPointerLock;
        if(el.requestPointerLock) el.requestPointerLock();
    }

    function up(e)
    {
        gui.setStateUnsaved();
        isDown=false;
        document.removeEventListener('pointerlockchange', lockChange, false);
        document.removeEventListener('mozpointerlockchange', lockChange, false);
        document.removeEventListener('webkitpointerlockchange', lockChange, false);
        document.removeEventListener('keydown', keydown, false);

        if(document.exitPointerLock)document.exitPointerLock();

        $( document ).unbind( "mouseup", up );
        $( document ).unbind( "mousedown", down );

        document.removeEventListener("mousemove", move, false);
    }

    function move(e)
    {
        gui.setStateUnsaved();

        console.log();

        self._dragSum+=e.movementY*-0.01;
        self._draggingPort.set(self._origValue+self._dragSum);

        // var v=parseFloat( $('#'+ele).val() ,10);
        // var inc=0;
        //
        // if(incMode==0)
        // {
        //     inc=e.movementY*-0.01;
        //     if(e.shiftKey || e.which==3)inc=e.movementY*-0.5;
        //
        //     v+=inc;
        //     v=Math.round(v*1000)/1000;
        // }
        // else
        // {
        //     inc=e.movementY*-1;
        //     if(e.shiftKey || e.which==3)inc=e.movementY*-5;
        //
        //     v+=inc;
        //     v=Math.floor(v);
        // }

        // $('#'+ele).val(v);
        // $('#'+ele).trigger('input');
    }

     function lockChange(e)
     {
        if (document.pointerLockElement === el || document.mozPointerLockElement === el || document.webkitPointerLockElement === el)
        {
            document.addEventListener("mousemove", move, false);
        }
        else
        {
            //propably cancled by escape key / reset value
            // $('#'+ele).val(startVal);
            // $('#'+ele).trigger('input');
            up();
        }

    }

    $( document ).bind( "mouseup", up );
    $( document ).bind( "mousedown", down );

}
