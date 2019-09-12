var CABLES=CABLES||{}
CABLES.GLGUI=CABLES.GLGUI||{};


CABLES.GLGUI.RectInstancer=function(cgl,options)
{
    this._counter=0;
    this._num=100000;
    this._needsRebuild=true;

    this._positions=new Float32Array(3*this._num);
    this._colors=new Float32Array(4*this._num);
    this._sizes=new Float32Array(2*this._num);

    this._shader=new CGL.Shader(cgl,'rectinstancer');
    this._shader.setSource(''
        .endl()+'IN vec3 vPosition;'
        .endl()+'IN vec3 instPos;'
        .endl()+'IN vec4 instCol;'
        .endl()+'IN vec2 instSize;'
        .endl()+'OUT vec4 col;'
        .endl()+'UNI float zoom,resX,resY,scrollX,scrollY;'

        .endl()+'void main()'
        .endl()+'{'

        .endl()+'   float aspect=resX/resY;'

        .endl()+'    vec3 pos=vPosition;'
        .endl()+'    pos.xy*=instSize;'


        .endl()+'    pos.x+=instPos.x;'
        .endl()+'    pos.y+=instPos.y;'

        .endl()+'    pos.y*=aspect;'

        .endl()+'    pos.y=0.0-pos.y;'

        .endl()+'    col=instCol;'


        .endl()+'    pos*=zoom;'


        .endl()+'    pos.x+=scrollX;'
        .endl()+'    pos.y+=scrollY;'


        .endl()+'    gl_Position = vec4(pos,1.0);'
        .endl()+'}'
        , 'IN vec4 col;void main(){outColor=vec4(col.rgb,1.0);}');

    this._uniZoom=new CGL.Uniform(this._shader,'f','zoom',0),
    this._uniResX=new CGL.Uniform(this._shader,'f','resX',0),
    this._uniResY=new CGL.Uniform(this._shader,'f','resY',0),
    this._uniscrollX=new CGL.Uniform(this._shader,'f','scrollX',0),
    this._uniscrollY=new CGL.Uniform(this._shader,'f','scrollY',0);

    this._geom=new CGL.Geometry("rectinstancer");
    this._geom.vertices = new Float32Array([1,1,0, 0,1,0, 1,0,0, 0,0,0]);
    this._geom.verticesIndices = new Float32Array([ 2, 1, 0,  3, 1, 2 ]);

    this._mesh=new CGL.Mesh(cgl,this._geom);
    this._mesh.numInstances=this._num;

    var i=0;
    for(i=0;i<2*this._num;i++) this._sizes[i]=0;//Math.random()*61;
    for(i=0;i<3*this._num;i++) this._positions[i]=0;//Math.random()*60;
    for(i=0;i<4*this._num;i++) this._colors[i]=1;//Math.random();
}

CABLES.GLGUI.RectInstancer.prototype.dispose=function()
{

}

CABLES.GLGUI.RectInstancer.prototype.mouseMove=function(x,y)
{
    // var scrollX=this._uniscrollX.getValue();
    // var scrollY=this._uniscrollY.getValue();

    // for(var i=0;i<this._sizes.length/2;i++)
    // {
    //     if(x+scrollX>this._positions[i*3+0] && x+scrollX<this._positions[i*3+0]+100 )
    //     if(y+scrollY>this._positions[i*3+1] && y+scrollY<this._positions[i*3+1]+100 )
    //     {
    //         console.log('posx',this._colors[i*3+0]);

    //     }
    // }
}

CABLES.GLGUI.RectInstancer.prototype.render=function(resX,resY,scrollX,scrollY,zoom)
{
    this._uniResX.set(resX);
    this._uniResY.set(resY);
    this._uniscrollX.set(scrollX);
    this._uniscrollY.set(scrollY);
    this._uniZoom.set(1.0/zoom);

    if(this._needsRebuild)this.rebuild();

    this._mesh.render(this._shader);
}

CABLES.GLGUI.RectInstancer.prototype.rebuild=function()
{
    // todo only update whats needed
    this._mesh.setAttribute('instPos',this._positions,3,{instanced:true});
    this._mesh.setAttribute('instCol',this._colors,4,{instanced:true});
    this._mesh.setAttribute('instSize',this._sizes,2,{instanced:true});

    // console.log('rebuild...');
    this._needsRebuild=false;
}

CABLES.GLGUI.RectInstancer.prototype.getIndex=function()
{
    this._counter++;
    // console.log("inst counter",this._counter);
    return this._counter;
}

CABLES.GLGUI.RectInstancer.prototype.setPosition=function(idx,x,y)
{
    this._positions[idx*3+0]=x;
    this._positions[idx*3+1]=y;
    this._needsRebuild=true;
}

CABLES.GLGUI.RectInstancer.prototype.setSize=function(idx,x,y)
{
    this._sizes[idx*2+0]=x;
    this._sizes[idx*2+1]=y;
    this._needsRebuild=true;
}

CABLES.GLGUI.RectInstancer.prototype.setColor=function(idx,r,g,b)
{
    this._colors[idx*4+0]=r;
    this._colors[idx*4+1]=g;
    this._colors[idx*4+2]=b;
    this._colors[idx*4+3]=1;
    this._needsRebuild=true;
}


