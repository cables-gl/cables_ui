var CABLES=CABLES||{}
CABLES.GLGUI=CABLES.GLGUI||{};

CABLES.GLGUI.TextWriter=class
{
    constructor(cgl,options)
    {
        if(!cgl) throw new Error("[gltextwriter] no cgl");

        this._rectDrawer=new CABLES.GLGUI.RectInstancer(cgl);
        this._font=CABLES.GLGUI.SDF_FONT_ARIAL;

        var r=this._rectDrawer.createRect();
        r.setSize(214,68);
        r.setColor(1,0,0,1);
        r.setPosition(0,0);
    }

    render(resX,resY,scrollX,scrollY,zoom)
    {
        // console.log("render sdf font...");

        this._rectDrawer.render(resX,resY,scrollX,scrollY,zoom)
    }

    setFont(tex)
    {
        this._rectDrawer.setTexture(tex)
    }

}