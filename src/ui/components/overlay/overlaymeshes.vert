{{MODULES_HEAD}}
IN vec3 vPosition; //!@
IN vec2 attrTexCoord;
IN vec3 attrVertNormal;
IN vec3 attrTangent,attrBiTangent;

IN float attrVertIndex;

OUT vec2 texCoord;
OUT vec3 norm;
UNI mat4 projMatrix;
UNI mat4 viewMatrix;
UNI mat4 modelMatrix;

void main()
{
    texCoord=attrTexCoord;
    norm=attrVertNormal;
    vec4 pos=vec4(vPosition,  1.0);
    vec3 tangent=attrTangent;
    vec3 bitangent=attrBiTangent;
    mat4 mMatrix=modelMatrix;
    gl_PointSize=10.0;

    {{MODULE_VERTEX_POSITION}}

    mat4 modelViewMatrix=viewMatrix*mMatrix;
    {{MODULE_VERTEX_MOVELVIEW}}



    #ifdef BILLBOARD
        modelViewMatrix[0][0] = mMatrix[0][0];
        modelViewMatrix[0][1] = 0.0;
        modelViewMatrix[0][2] = 0.0;

        modelViewMatrix[1][0] = 0.0;
        modelViewMatrix[1][1] = mMatrix[1][1];
        modelViewMatrix[1][2] = 0.0;

        modelViewMatrix[2][0] = 0.0;
        modelViewMatrix[2][1] = 0.0;
        modelViewMatrix[2][2] = mMatrix[2][2];
    #endif


    gl_Position = projMatrix * modelViewMatrix * pos;
}
