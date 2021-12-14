
export default class GlPreviewLayerTexture extends CABLES.EventTarget
{
    constructor(previewLayer, item)
    {
        super();
        this._item = item;
        this._previewLayer = previewLayer;


        this._srcFrag = "".endl()
            .endl() + "IN vec2 texCoord;"
            .endl() + "UNI sampler2D tex;"
            .endl() + "UNI samplerCube cubeMap;"
            .endl() + "UNI float width;"
            .endl() + "UNI float height;"
            .endl() + "UNI float type;"

        // .endl() + "float checkerboard()"
        // .endl() + "{"
        // .endl() + "    float num=40.0;"
        // .endl() + "    float h=(height/width)*num;"
        // .endl() + "    float total = floor(texCoord.x*num) +floor(texCoord.y*h);"
        // .endl() + "    return mod(total,2.0)*0.1+0.05;"
        // .endl() + "}"
            .endl() + "float LinearizeDepth(float d,float zNear,float zFar)"
            .endl() + "{"
            .endl() + "    float z_n = 2.0 * d - 1.0;"
            .endl() + "    return 2.0 * zNear / (zFar + zNear - z_n * (zFar - zNear));"
            .endl() + "}"

            .endl() + "void main()"
            .endl() + "{"
            .endl() + "    vec4 col=vec4(0.0);"
            .endl() + "    vec4 colTex=texture2D(tex,texCoord);"
            .endl() + "    if(type==1.0)"
            .endl() + "    {"
            .endl() + "        vec4 depth=vec4(0.);"
            .endl() + "        vec2 localST=texCoord;"
            .endl() + "        localST.y = 1. - localST.y;"
        // .endl() + "        //Scale Tex coordinates such that each quad has local coordinates from 0,0 to 1,1"
            .endl() + "        localST.t = mod(localST.t*3.,1.);"
            .endl() + "        localST.s = mod(localST.s*4.,1.);"

            .endl() + "        #ifdef WEBGL2"
            .endl() + "            #define texCube texture"
            .endl() + "        #endif"
            .endl() + "        #ifdef WEBGL1"
            .endl() + "            #define texCube textureCube"
            .endl() + "        #endif"


        // .endl() + "        //Due to the way my depth-cubeMap is rendered, objects to the -x,y,z side is projected to the positive x,y,z side"
        // .endl() + "        //Inside where top/bottom is to be drawn?"
            .endl() + "        if (texCoord.s*4.> 1. && texCoord.s*4.<2.)"
            .endl() + "        {"
            .endl() + "            //Bottom (-y) quad"
            .endl() + "            if (texCoord.t*3. < 1.)"
            .endl() + "            {"
            .endl() + "                vec3 dir=vec3(localST.s*2.-1.,-1.,-localST.t*2.+1.);//Due to the (arbitrary) way I choose as up in my depth-viewmatrix, i her emultiply the latter coordinate with -1"
            .endl() + "                depth = texCube(cubeMap, dir);"
            .endl() + "            }"
            .endl() + "            //top (+y) quad"
            .endl() + "            else if (texCoord.t*3. > 2.)"
            .endl() + "            {"
            .endl() + "                vec3 dir=vec3(localST.s*2.-1.,1.,localST.t*2.-1.);//Get lower y texture, which is projected to the +y part of my cubeMap"
            .endl() + "                depth = texCube(cubeMap, dir);"
            .endl() + "            }"
            .endl() + "            else//Front (-z) quad"
            .endl() + "            {"
            .endl() + "                vec3 dir=vec3(localST.s*2.-1.,-localST.t*2.+1.,1.);"
            .endl() + "                depth = texCube(cubeMap, dir);"
            .endl() + "            }"
            .endl() + "        }"
        // .endl() + "        //If not, only these ranges should be drawn"
            .endl() + "        else if (texCoord.t*3. > 1. && texCoord.t*3. < 2.)"
            .endl() + "        {"
            .endl() + "            if (texCoord.x*4. < 1.)//left (-x) quad"
            .endl() + "            {"
            .endl() + "                vec3 dir=vec3(-1.,-localST.t*2.+1.,localST.s*2.-1.);"
            .endl() + "                depth = texCube(cubeMap, dir);"
            .endl() + "            }"
            .endl() + "            else if (texCoord.x*4. < 3.)//right (+x) quad (front was done above)"
            .endl() + "            {"
            .endl() + "                vec3 dir=vec3(1,-localST.t*2.+1.,-localST.s*2.+1.);"
            .endl() + "                depth = texCube(cubeMap, dir);"
            .endl() + "            }"
            .endl() + "            else //back (+z) quad"
            .endl() + "            {"
            .endl() + "                vec3 dir=vec3(-localST.s*2.+1.,-localST.t*2.+1.,-1.);"
            .endl() + "                depth = texCube(cubeMap, dir);"
            .endl() + "            }"
            .endl() + "        }"
            .endl() + "        colTex = vec4(vec3(depth),1.);"
            .endl() + "    }"

            .endl() + "    if(type==2.0)"
            .endl() + "    {"
            .endl() + "       float near = 0.1;"
            .endl() + "       float far = 50.;"
            .endl() + "       float depth = LinearizeDepth(colTex.r, near, far);"
            .endl() + "       colTex.rgb = vec3(depth);"
            .endl() + "    }"

            .endl() + "    outColor = mix(col,colTex,colTex.a);"
            .endl() + "}";

        this._srcVert = "".endl()
            .endl() + "IN vec3 vPosition;"
            .endl() + "IN vec2 attrTexCoord;"
            .endl() + "OUT vec2 texCoord;"
            .endl() + "UNI mat4 projMatrix;"
            .endl() + "UNI mat4 modelMatrix;"
            .endl() + "UNI mat4 viewMatrix;"

            .endl() + "void main()"
            .endl() + "{"
            .endl() + "    texCoord=vec2(attrTexCoord.x,1.0-attrTexCoord.y);"
            .endl() + "    vec4 pos = vec4( vPosition, 1. );"
            .endl() + "    mat4 mvMatrix=viewMatrix * modelMatrix;"
            .endl() + "    gl_Position = projMatrix * mvMatrix * pos;"
            .endl() + "}";
    }


    render(ctx, pos, size)
    {
        const port = this._item.port;
        if (!port) return;
        const texSlot = 5;
        const texSlotCubemap = texSlot + 1;

        const perf = CABLES.UI.uiProfiler.start("previewlayer texture");
        const cgl = port.parent.patch.cgl;

        if (!this._emptyCubemap) this._emptyCubemap = CGL.Texture.getEmptyCubemapTexture(cgl);
        port.parent.patch.cgl.profileData.profileTexPreviews++;

        const portTex = port.get() || CGL.Texture.getEmptyTexture(cgl);

        if (!this._mesh)
        {
            const geom = new CGL.Geometry("preview op rect");
            geom.vertices = [1.0, 1.0, 0.0, -1.0, 1.0, 0.0, 1.0, -1.0, 0.0, -1.0, -1.0, 0.0];
            geom.texCoords = [
                1.0, 1.0,
                0.0, 1.0,
                1.0, 0.0,
                0.0, 0.0];
            geom.verticesIndices = [0, 1, 2, 3, 1, 2];
            this._mesh = new CGL.Mesh(cgl, geom);
        }
        if (!this._shader)
        {
            this._shader = new CGL.Shader(cgl, "glpreviewtex");
            this._shader.setModules(["MODULE_VERTEX_POSITION", "MODULE_COLOR", "MODULE_BEGIN_FRAG"]);
            this._shader.setSource(this._srcVert, this._srcFrag);
            this._shaderTexUniform = new CGL.Uniform(this._shader, "t", "tex", texSlot);
            this._shaderTexCubemapUniform = new CGL.Uniform(this._shader, "tc", "cubeMap", texSlotCubemap);

            this._shaderTexUniformW = new CGL.Uniform(this._shader, "f", "width", portTex.width);
            this._shaderTexUniformH = new CGL.Uniform(this._shader, "f", "height", portTex.height);
            this._shaderTypeUniform = new CGL.Uniform(this._shader, "f", "type", 0);
        }

        cgl.pushPMatrix();
        const sizeTex = [portTex.width, portTex.height];
        const small = port.parent.patch.cgl.canvasWidth > sizeTex[0] && port.parent.patch.cgl.canvasHeight > sizeTex[1];

        if (small)
        {
            mat4.ortho(cgl.pMatrix, 0, port.parent.patch.cgl.canvasWidth, port.parent.patch.cgl.canvasHeight, 0, 0.001, 11);
        }
        else mat4.ortho(cgl.pMatrix, -1, 1, 1, -1, 0.001, 11);

        const oldTex = cgl.getTexture(texSlot);
        const oldTexCubemap = cgl.getTexture(texSlotCubemap);

        let texType = 0;
        if (!portTex) return;
        if (portTex.cubemap) texType = 1;
        if (portTex.textureType == CGL.Texture.TYPE_DEPTH) texType = 2;

        if (texType == 0 || texType == 2)
        {
            cgl.setTexture(texSlot, portTex.tex);
            cgl.setTexture(texSlotCubemap, this._emptyCubemap.cubemap, cgl.gl.TEXTURE_CUBE_MAP);
        }
        else if (texType == 1)
        {
            cgl.setTexture(texSlotCubemap, portTex.cubemap, cgl.gl.TEXTURE_CUBE_MAP);
        }

        // this._shader.toggleDefine("CUBEMAP", true);

        this._shaderTypeUniform.setValue(texType);
        let s = [port.parent.patch.cgl.canvasWidth, port.parent.patch.cgl.canvasHeight];

        cgl.gl.clearColor(1, 0, 0, 1);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);


        cgl.pushModelMatrix();
        if (small)
        {
            s = sizeTex;
            mat4.translate(cgl.mMatrix, cgl.mMatrix, [sizeTex[0] / 2, sizeTex[1] / 2, 0]);
            mat4.scale(cgl.mMatrix, cgl.mMatrix, [sizeTex[0] / 2, sizeTex[1] / 2, 0]);
        }
        this._mesh.render(this._shader);
        cgl.popModelMatrix();

        if (texType == 0) cgl.setTexture(texSlot, oldTex);
        if (texType == 1) cgl.setTexture(texSlotCubemap, oldTexCubemap);

        cgl.popPMatrix();
        cgl.resetViewPort();

        const sizeImg = [size[0], size[1]];

        const stretch = false;
        if (!stretch)
        {
            if (portTex.width > portTex.height) sizeImg[1] = size[0] * sizeTex[1] / sizeTex[0];
            else
            {
                sizeImg[1] = size[0] * (sizeTex[1] / sizeTex[0]);

                if (sizeImg[1] > size[1])
                {
                    const r = size[1] / sizeImg[1];
                    sizeImg[0] *= r;
                    sizeImg[1] *= r;
                }
            }
        }

        const scaledDown = sizeImg[0] > sizeTex[0] && sizeImg[1] > sizeTex[1];

        ctx.imageSmoothingEnabled = !small || !scaledDown;

        if (!ctx.imageSmoothingEnabled)
        {
            ctx.fillStyle = "#000000";
            ctx.fillRect(pos[0], pos[1] - 10, 10, 10);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(pos[0], pos[1] - 10, 5, 5);
            ctx.fillRect(pos[0] + 5, pos[1] - 10 + 5, 5, 5);
        }

        ctx.drawImage(cgl.canvas,
            0, 0,
            s[0], s[1],
            pos[0] + (size[0] - sizeImg[0]) / 2, pos[1] + (size[1] - sizeImg[1]) / 2,
            sizeImg[0], sizeImg[1]);

        cgl.gl.clearColor(0, 0, 0, 1);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);

        perf.finish();
    }
}
