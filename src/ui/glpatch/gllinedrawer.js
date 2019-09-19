var CABLES=CABLES||{}
CABLES.GLGUI=CABLES.GLGUI||{};

CABLES.GLGUI.Linedrawer=class
{
    constructor(cgl,options)
    {
        this._counter=0;
        this._num=10000;
        this._needsRebuild=true;

        this._positions=new Float32Array(3*this._num);
        this._colors=new Float32Array(4*this._num);

        this._shader=new CGL.Shader(cgl,'Linedrawer');
        this._shader.glPrimitive=cgl.gl.LINES;
        this._shader.setSource(''
            .endl()+'IN vec3 vPosition;'
            // .endl()+'IN vec3 pos;'
            .endl()+'IN vec4 color;'
            .endl()+'OUT vec4 col;'
            .endl()+'OUT vec2 pos2d;'
            .endl()+'UNI float zoom,resX,resY,scrollX,scrollY;'

            .endl()+'void main()'
            .endl()+'{'
            .endl()+'   float aspect=resX/resY;'

            .endl()+'    vec3 pos=vPosition;'

            // .endl()+'    pos.x+=pos.x;'
            // .endl()+'    pos.y+=pos.y;'

            .endl()+'    pos.y*=aspect;'
            .endl()+'    pos.y=0.0-pos.y;'

            .endl()+'    pos2d=pos.xy;'

            .endl()+'    col=color;'
            .endl()+'    pos*=zoom;'
            

            .endl()+'    pos.x+=scrollX;'
            .endl()+'    pos.y+=scrollY;'

            .endl()+'    gl_Position = vec4(pos,1.0);'
            .endl()+'}'

            ,''
            .endl()+'UNI float time;'
            .endl()+'IN vec2 pos2d;'
            .endl()+'IN vec4 col;'
            .endl()+'void main()'
            .endl()+'{'
            .endl()+'  if(col.a==0.0) discard;'
            // .endl()+'float a=mod(gl_FragCoord.x,10.0);'// )+1.0)/2.0+0.5);'
            .endl()+'  float a=length(gl_FragCoord.xy);'// )+1.0)/2.0+0.5);'
            .endl()+'  a=sin(a);'
            .endl()+'  a=(a+1.0)/2.0;'
            // .endl()+'  a=floor(a);'
            
            .endl()+'  outColor=vec4(col.rgb, a );'
            .endl()+'}'
            );

            //floor((sin( distance(vec4(0.,0.,0.,1.0),gl_FragCoord

        this._uniZoom=new CGL.Uniform(this._shader,'f','zoom',0),
        this._uniResX=new CGL.Uniform(this._shader,'f','resX',0),
        this._uniResY=new CGL.Uniform(this._shader,'f','resY',0),
        this._uniscrollX=new CGL.Uniform(this._shader,'f','scrollX',0),
        this._uniscrollY=new CGL.Uniform(this._shader,'f','scrollY',0);
        this._uniTime=new CGL.Uniform(this._shader,'f','time',0);

        this._geom=new CGL.Geometry("glpatchLineDrawer");
        this._geom.vertices = new Float32Array([10,10,0, 60,60,0, 10,0,0, 0,0,0]);

        this._mesh=new CGL.Mesh(cgl,this._geom);

        var i=0;
        for(i=0;i<3*this._num;i++) this._positions[i]=0;//Math.random()*60;
        for(i=0;i<4*this._num;i++) this._colors[i]=Math.random();
    }

    dispose()
    {
        this._mesh.dispose();
        this._shader.dispose();
    }

    render(resX,resY,scrollX,scrollY,zoom)
    {
        this._uniResX.set(resX);
        this._uniResY.set(resY);
        this._uniscrollX.set(scrollX);
        this._uniscrollY.set(scrollY);
        this._uniZoom.set(1.0/zoom);

        // console.log(this._positions);

        if(this._needsRebuild)this.rebuild();

        this._mesh.render(this._shader);
    }

    rebuild()
    {
        // todo only update whats needed
        this._mesh.setAttribute(CGL.SHADERVAR_VERTEX_POSITION,this._positions,3);
        this._mesh.setAttribute('color',this._colors,4);

        this._needsRebuild=false;
    }

    getIndex()
    {
        this._counter++;
        return this._counter;
    }

    setLine(idx,x,y,x2,y2)
    {
        this._positions[idx*6+0]=x;
        this._positions[idx*6+1]=y;
        this._positions[idx*6+2]=0;
        this._positions[idx*6+3]=x2;
        this._positions[idx*6+4]=y2;
        this._positions[idx*6+5]=0;
        this._needsRebuild=true;
    }

    setColor(idx,r,g,b,a)
    {
        this._colors[idx*8+0]=r;
        this._colors[idx*8+1]=g;
        this._colors[idx*8+2]=b;
        this._colors[idx*8+3]=a;
        this._colors[idx*8+4]=r;
        this._colors[idx*8+5]=g;
        this._colors[idx*8+6]=b;
        this._colors[idx*8+7]=a;
        this._needsRebuild=true;
    }
}
