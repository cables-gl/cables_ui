CABLES = CABLES || {};
CABLES.GLGUI = CABLES.GLGUI || {};

CABLES.GLGUI.TextWriter = class
{
    constructor(cgl, options)
    {
        this._cgl = cgl;
        options = options || {};
        this._name = options.name || "unknown";
        if (!cgl) throw new Error("[gltextwriter] no cgl");

        this._rectDrawer = new CABLES.GLGUI.RectInstancer(cgl, { "initNum": options.initNum, "name": "textrects_" + this._name });
        this._font = CABLES.GLGUI.SDF_FONT_ARIAL;
        this._fontTex = null;
        // var txt=new CABLES.GLGUI.Text(this,"H  u  n  d   e   k   u   c   h   e  n");
    }

    get rectDrawer() { return this._rectDrawer; }

    render(resX, resY, scrollX, scrollY, zoom)
    {
        if (!this._fontTex)
        {
            this._fontTex = CGL.Texture.load(this._cgl, "/ui/img/WorkSans-Regular.ttf.png", // sdf_font_arial.png
                () =>
                {
                    console.log(this._fontTex);
                    // this.glPatch.setFont(this._fontTex);
                    // this.glPatch.needsRedraw = true;
                    // this.loaded = true;
                    // this._rectDrawer
                    this._rectDrawer.setAllTexture(this._fontTex, true);
                }, { "flip": false, "filter": CGL.Texture.FILTER_LINEAR });
        }

        this._rectDrawer.render(resX, resY, scrollX, scrollY, zoom);
    }

    // setFont(tex)
    // {
    //     this._rectDrawer.setAllTexture(tex, true);
    //     this._fontTex = tex;
    // }

    getFontTexture()
    {
        return this._fontTex;
    }
};
