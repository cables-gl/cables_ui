var CABLES=CABLES||{}
CABLES.GLGUI=CABLES.GLGUI||{};

CABLES.GLGUI.TextWriter=class
{
    constructor(cgl,options)
    {
        this._rects=new CABLES.GLGUI.RectInstancer();
        this._font=CABLES.GLGUI.SDF_FONT_ARIAL;
    }

    render()
    {
        console.log("render sdf font...");
    }

}