
import GlRectInstancer from "./glrectinstancer.js";

export default class GlTextWriter
{
    constructor(cgl, options)
    {
        this._cgl = cgl;
        options = options || {};
        this._name = options.name || "unknown";
        if (!cgl) throw new Error("[gltextwriter] no cgl");

        this._rectDrawer = new GlRectInstancer(cgl, { "initNum": options.initNum, "name": "textrects_" + this._name });
        this._fontTex = null;
    }

    get rectDrawer() { return this._rectDrawer; }

    render(resX, resY, scrollX, scrollY, zoom)
    {
        if (!this._fontTex)
        {
            this._fontTex = CGL.Texture.load(this._cgl, "img/worksans-regular.png", () =>
            {
                this._rectDrawer.setAllTexture(this._fontTex, true);
            }, { "flip": false, "filter": CGL.Texture.FILTER_LINEAR });
        }

        this._rectDrawer.render(resX, resY, scrollX, scrollY, zoom);
    }

    getFontTexture()
    {
        return this._fontTex;
    }

    setDebugRenderer(i)
    {
        this._rectDrawer.setDebugRenderer(i);
    }
}
