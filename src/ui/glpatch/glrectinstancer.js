var CABLES=CABLES||{}
CABLES.GLGUI=CABLES.GLGUI||{};


CABLES.GLGUI.RectInstancer=class
{

    constructor(cgl,options)
    {
        this._counter=0;
        this._num=10000;
        this._needsRebuild=true;
        this._rects=[];

        this._positions=new Float32Array(3*this._num);
        this._colors=new Float32Array(4*this._num);
        this._sizes=new Float32Array(2*this._num);
        this._outlines=new Float32Array(this._num);
        

        this._shader=new CGL.Shader(cgl,'rectinstancer');
        this._shader.setSource(''
            .endl()+'IN vec3 vPosition;'
            .endl()+'IN vec3 instPos;'
            .endl()+'IN vec4 instCol;'
            .endl()+'IN vec2 instSize;'
            .endl()+'IN float outline;'
            .endl()+'OUT float outlinefrag;'
            
            .endl()+'out vec4 posSize;'

            .endl()+'OUT vec4 col;'
            .endl()+'UNI float zoom,resX,resY,scrollX,scrollY;'

            .endl()+'void main()'
            .endl()+'{'
            .endl()+'    float aspect=resX/resY;'

            .endl()+'    outlinefrag=outline/resY*aspect;'

            .endl()+'    vec3 pos=vPosition;'
            .endl()+'    pos.xy*=instSize;'

            .endl()+'    posSize=vec4(pos.xy*zoom,instSize*zoom-pos.xy*zoom);'
            
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
            , ''
            .endl()+'IN vec4 col;'
            .endl()+'IN vec4 posSize;'
            .endl()+'IN float outlinefrag;'
            

            .endl()+'void main()'
            .endl()+'{'

            .endl()+'   outColor=col;'

            // outlines
            .endl()+'   if(outlinefrag>0.0){'
            .endl()+'       outColor+=1.0-smoothstep(0.0,outlinefrag,posSize.x);'
            .endl()+'       outColor+=1.0-smoothstep(0.0,outlinefrag,posSize.y);'
            .endl()+'       outColor+=1.0-smoothstep(0.0,outlinefrag,posSize.z);'
            .endl()+'       outColor+=1.0-smoothstep(0.0,outlinefrag,posSize.w);'
            .endl()+'   }'
            
            .endl()+'}');

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
        for(i=0;i<this._num;i++) this._outlines[i]=0;//Math.random();
    }

    dispose()
    {

    }

    // mouseMove(x,y)
    // {
    //     // var scrollX=this._uniscrollX.getValue();
    //     // var scrollY=this._uniscrollY.getValue();

    //     // for(var i=0;i<this._sizes.length/2;i++)
    //     // {
    //     //     if(x+scrollX>this._positions[i*3+0] && x+scrollX<this._positions[i*3+0]+100 )
    //     //     if(y+scrollY>this._positions[i*3+1] && y+scrollY<this._positions[i*3+1]+100 )
    //     //     {
    //     //         console.log('posx',this._colors[i*3+0]);

    //     //     }
    //     // }
    // }

    render(resX,resY,scrollX,scrollY,zoom)
    {
        this._uniResX.set(resX);
        this._uniResY.set(resY);
        this._uniscrollX.set(scrollX);
        this._uniscrollY.set(scrollY);
        this._uniZoom.set(1.0/zoom);

        if(this._needsRebuild)this.rebuild();

        this._mesh.render(this._shader);
    }

    rebuild()
    {
        // todo only update whats needed
        this._mesh.setAttribute('instPos',this._positions,3,{instanced:true});
        this._mesh.setAttribute('instCol',this._colors,4,{instanced:true});
        this._mesh.setAttribute('instSize',this._sizes,2,{instanced:true});
        this._mesh.setAttribute('outline',this._outlines,1,{instanced:true});

        // console.log('rebuild...');
        this._needsRebuild=false;
    }

    getIndex()
    {
        this._counter++;
        // console.log("inst counter",this._counter);
        return this._counter;
    }

    setPosition(idx,x,y)
    {
        this._positions[idx*3+0]=x;
        this._positions[idx*3+1]=y;
        this._needsRebuild=true;
    }

    setSize(idx,x,y)
    {
        this._sizes[idx*2+0]=x;
        this._sizes[idx*2+1]=y;
        this._needsRebuild=true;
    }

    setColor(idx,r,g,b)
    {
        this._colors[idx*4+0]=r;
        this._colors[idx*4+1]=g;
        this._colors[idx*4+2]=b;
        this._colors[idx*4+3]=1;
        this._needsRebuild=true;
    }

    setOutline(idx,o)
    {
        this._outlines[idx]=o;
        this._needsRebuild=true;
    }

    createRect(options)
    {
        var r=new CABLES.GLGUI.GlRect(this);
        this._rects.push(r);
        return r;
    }

    mouseMove(x,y)
    {
        for(var i=0;i<this._rects.length;i++)
        {
            this._rects[i].mouseMove(x,y);
        }
    }

    mouseDown(e)
    {
        for(var i=0;i<this._rects.length;i++)
        {
            this._rects[i].mouseDown(e);
        }
    }

}