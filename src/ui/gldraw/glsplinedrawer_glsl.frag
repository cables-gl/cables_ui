IN vec2 texCoord;
IN vec4 fcolor;
IN float fProgress;
IN float fSplineLength;
IN float fspeed;
IN float zz;

UNI vec2 mousePos;

UNI float a;
UNI float time;

{{MODULES_HEAD}}

void main()
{
    vec4 finalColor=fcolor;
    float darken=1.0;
    float minOpacity=0.7;

    if(fspeed==0.0)darken=1.0;
    if(fspeed==1.0)darken=1.1;
    if(fspeed>=2.0)
    {
        float ffspeed=clamp(fspeed,0.,25.0);
        darken=step(0.5,mod((time*ffspeed/2.0)+fProgress*0.2*(ffspeed*0.1),1.0))+minOpacity;
        darken=clamp(darken,0.3,1.0);
    }

    {{MODULE_COLOR}}
    finalColor.rgb*=darken;

// #ifdef LINE_OUTLINE
//     if(abs(texCoord.y)>0.7) finalColor.rgb*=0.7;
// #endif

    #ifdef DEBUG_1
        finalColor.rgb=vec3((zz+1.0)/2.0);
        finalColor.a=1.0;
    #endif
    #ifdef DEBUG_2
        finalColor.rg=texCoord;
        finalColor.a=1.0;
    #endif

if(fSplineLength>200.0)
{

    float lengthFull=50.0;
    finalColor.a=0.0;
    finalColor.a=1.0-smoothstep(fProgress,0.0,lengthFull);
    finalColor.a+=(1.0-smoothstep(fProgress,fSplineLength,fSplineLength-lengthFull));
    finalColor.a=clamp(finalColor.a,0.1,1.0);
}

    // finalColor.a=abs(fProgressNorm-0.5)*2.0+0.1;

    outColor = finalColor;
}
