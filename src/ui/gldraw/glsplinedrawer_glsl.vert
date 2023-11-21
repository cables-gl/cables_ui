{{MODULES_HEAD}}

IN vec3 vPosition;
IN float attrVertIndex;
IN vec4 vcolor;
OUT vec4 fcolor;

IN vec4 vcolorInactive;
OUT vec4 finactiveColor;

IN vec4 vcolorBorder;
OUT vec4 fcolorBorder;



IN float speed;
OUT float fspeed;

IN float splineProgress;
OUT float fProgress;

IN float splineLength;
OUT float fSplineLength;

UNI float width;
UNI float zpos;

IN vec3 spline,spline2,spline3;

// IN vec2 attrTexCoord;
OUT vec2 texCoord;
OUT vec3 norm;
OUT float zz;

UNI float zoom,resX,resY,scrollX,scrollY;

float texOffset=0.0;
float sizeAtt=0.0;

#define PI 3.1415926538

vec2 rotate(vec2 v, float a)
{
    float s = sin(a);
    float c = cos(a);
    mat2 m = mat2(c, -s, s, c);
    return m * v;
}

vec2 fix(vec4 i)
{
    vec2 res = i.xy / i.w;
    return res;
}

void main()
{
    if(vcolor.a == 0.0)return;

    float aspect=resX/resY;

    fspeed=speed;
    fcolor=vcolor;
    finactiveColor=vcolorInactive;
    fcolorBorder=vcolorBorder;
    texCoord=vec2(0.0,(vPosition.y+1.0)/2.0);

    vec4 pos=vec4(vPosition, 1.0);
    vec4 finalPosition  =  (vec4(spline2,1.0));
    vec4 finalPosition2 =  (vec4(spline3,1.0));

    if(finalPosition.x==0.0 && finalPosition.y==0.0 && finalPosition.z==0.0)
    {
        finalPosition=vec4(10000.0);
        finalPosition2=vec4(10000.0);
    }

    vec2 screenPos =fix( vec4(spline,1.0));
    vec2 screenPos2=fix( vec4(spline2,1.0));
    vec2 screenPos3=fix( vec4(spline3,1.0));

    float wid=width*10.0+(3.0*fcolorBorder.a);
        //     if(sizeAtt>0.0) //todo as define
        //         wid=width*finalPosition.w*0.5;

    vec2 dir1 = normalize( screenPos2 - screenPos );
    vec2 dir2 = normalize( screenPos3 - screenPos2 );

    if( screenPos2 == screenPos ) dir1 = normalize( screenPos3 - screenPos2 );

    vec2 normal = vec2( -dir1.y, dir1.x ) * 0.5 * wid;
    vec2 normal2 = vec2( -dir2.y, dir2.x ) * 0.5 * wid;
    vec4 offset = vec4( mix(normal,normal2,pos.x) * (pos.y), 0.0, 1.0 );

    finalPosition = mix(finalPosition,finalPosition2,pos.x);


    fProgress=splineProgress;//*(zoom*300.0);
    fSplineLength=splineLength;//*(zoom*300.0);


    finalPosition.xy += offset.xy;

    finalPosition.y*=-aspect;


    finalPosition.xy*=zoom;
    finalPosition.x+=scrollX;
    finalPosition.y+=scrollY;
    finalPosition.z=spline.z;


    gl_Position = finalPosition;
}
