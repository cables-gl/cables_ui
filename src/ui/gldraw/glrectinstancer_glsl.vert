IN vec3 vPosition;
IN vec3 instPos;
IN vec4 instCol;
IN highp vec2 attrTexCoord;
IN vec4 texRect;
IN vec2 instSize;
IN vec4 instDeco;

OUT vec4 decoration;

// OUT float outlinefrag;
OUT vec4 posSize;
OUT vec4 col;
OUT highp vec2 uv;

IN float contentTexture;
OUT float useTexture;
OUT float zz;

UNI highp float zoom,resX,resY,scrollX,scrollY;

void main()
{
    float aspect=resX/resY;

    useTexture=contentTexture;
    decoration=instDeco;


    uv=attrTexCoord*texRect.zw+texRect.xy;
    uv.y=1.0-uv.y;

    // outlinefrag=outline/resY*aspect*1.0;

    vec3 pos=vPosition;
    pos.xy*=instSize;

    posSize=vec4(pos.xy*zoom,instSize*zoom-pos.xy*zoom);

    pos.x+=instPos.x;
    pos.y+=instPos.y;
    pos.z+=instPos.z;

    pos.y*=aspect;
    pos.y=0.0-pos.y;

    col=instCol;

    pos.xy*=zoom;
    pos.x+=scrollX;
    pos.y+=scrollY;

    pos.x=ceil(pos.x*resX)/resX;
    pos.y=ceil(pos.y*resY)/resY;

    pos.z=zz=instPos.z;

    gl_Position = vec4(pos,1.0);
 }
