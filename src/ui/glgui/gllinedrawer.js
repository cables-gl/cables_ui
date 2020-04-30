var CABLES=CABLES||{}
CABLES.GLGUI=CABLES.GLGUI||{};

CABLES.GLGUI.Linedrawer=class
{
    constructor(cgl,options)
    {
        if(!cgl) throw new Error("[Linedrawer] no cgl");

        this._startTime=performance.now();
        this._counter=0;
        this._num=10000;
        this._needsUpload=true;

        this._positions=new Float32Array(3*this._num);
        this._colors=new Float32Array(4*this._num);
        this._dists=new Float32Array(this._num);
        this._speeds=new Float32Array(this._num);

        this._shader=new CGL.Shader(cgl,'Linedrawer');
        this._shader.glPrimitive=cgl.gl.LINES;
        this._shader.setSource(''
            .endl()+'IN vec3 vPosition;'
            // .endl()+'IN vec3 pos;'
            .endl()+'IN vec4 color;'
            .endl()+'IN float vdist;'
            .endl()+'IN float speed;'
            .endl()+'OUT float speedy;'
            .endl()+'OUT float dist;'
            .endl()+'OUT vec4 col;'
            .endl()+'OUT vec2 pos2d;'
            .endl()+'UNI float zoom,resX,resY,scrollX,scrollY;'

            .endl()+'void main()'
            .endl()+'{'
            .endl()+'   float aspect=resX/resY;'

            .endl()+'   dist=vdist;'
            .endl()+'   speedy=speed;'

            .endl()+'   vec3 pos=vPosition;'

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
            .endl()+'IN float dist;'
            .endl()+'IN float speedy;'
            .endl()+'UNI float zoom;'

            .endl()+'void main()'
            .endl()+'{'
            .endl()+'   vec4 color=col;'
            .endl()+'   if(color.a==0.0) discard;'
            .endl()+'   float stepLength=5.0;'

            .endl()+'   float showSpeed=clamp(speedy,0.0,1.0);'


            .endl()+'   float colmul=step(stepLength*0.5,mod(dist+(speedy*time),stepLength))+0.7;'
            .endl()+'   if(speedy>=1.0) color.rgb *= clamp(speedy,0.5,1.0)*(showSpeed)*clamp(colmul,0.0,1.0);'
            .endl()+'   else color.rgb = color.rgb*0.55;'

            .endl()+'   color.rgb = color.rgb;'
            .endl()+'   color.a = 1.0;'
            // .endl()+'   color.r = 1.0;'



            // .endl()+'   color.rgb += (1.0-showSpeed) * col.rgb;'

            // .endl()+'   if(speedy==0)'
            
            // .endl()+'  float a=length(gl_FragCoord.xy);'// )+1.0)/2.0+0.5);'
            // .endl()+'  a=sin(a);'
            // .endl()+'  a=(a+1.0)/2.0;'
            // .endl()+'  a=floor(a);'
            
            .endl()+'   outColor=color;'
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
        for(i=0;i<1*this._num;i++) this._speeds[i]=0;
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
        this._uniTime.set(((performance.now()-this._startTime)/1000)*20.0);

        if(this._needsUpload)this.rebuild();


        this._mesh.render(this._shader);
    }

    rebuild()
    {
        var perf = CABLES.uiperf.start('[glLineDrawer] rebuild');

        // console.log(this._positions);
        // todo only update whats needed
        this._mesh.setAttribute(CGL.SHADERVAR_VERTEX_POSITION,this._positions,3);
        this._mesh.setAttribute('color',this._colors,4);
        this._mesh.setAttribute('vdist',this._dists,1);
        this._mesh.setAttribute('speed',this._speeds,1);

        perf.finish();

        this._needsUpload=false;
    }

    getIndex()
    {
        this._counter++;
        return this._counter;
    }

    _distance(x1, y1, x2, y2)
    {
        var xd = x2 - x1;
        var yd = y2 - y1;
        return Math.sqrt(xd * xd + yd * yd);
    }

    _float32Diff(a,b)
    {
        return Math.abs(a-b)>0.0001;
    }

    setLine(idx,x,y,x2,y2)
    {
        this._dists[idx*2]=0;
        this._dists[idx*2+1]=this._distance(x,y,x2,y2);
        
        if( 
            this._float32Diff(this._positions[idx*6+0],x) || 
            this._float32Diff(this._positions[idx*6+1],y) ||
            this._float32Diff(this._positions[idx*6+3],x2) || 
            this._float32Diff(this._positions[idx*6+4],y2)) { this._needsUpload=true; }


        this._positions[idx*6+0]=x;
        this._positions[idx*6+1]=y;
        this._positions[idx*6+2]=0;
        this._positions[idx*6+3]=x2;
        this._positions[idx*6+4]=y2;
        this._positions[idx*6+5]=0;
    }

    setColor(idx,r,g,b,a)
    {
        if( 
            this._float32Diff(this._colors[idx*8+0],r) || 
            this._float32Diff(this._colors[idx*8+1],g) ||
            this._float32Diff(this._colors[idx*8+2],b) || 
            this._float32Diff(this._colors[idx*8+3],a) || 
            this._float32Diff(this._colors[idx*8+4],r) ||
            this._float32Diff(this._colors[idx*8+5],g) || 
            this._float32Diff(this._colors[idx*8+6],b) ||
            this._float32Diff(this._colors[idx*8+7],a)) { this._needsUpload=true; }

        this._colors[idx*8+0]=r;
        this._colors[idx*8+1]=g;
        this._colors[idx*8+2]=b;
        this._colors[idx*8+3]=a;
        this._colors[idx*8+4]=r;
        this._colors[idx*8+5]=g;
        this._colors[idx*8+6]=b;
        this._colors[idx*8+7]=a;
    }

    setSpeed(idx,speed)
    {

        if( 
            this._float32Diff(this._speeds[idx*2+0],speed) || 
            this._float32Diff(this._speeds[idx*2+1],speed)) { this._needsUpload=true; }

        this._speeds[idx*2]=speed;
        this._speeds[idx*2+1]=speed;

    }
}
