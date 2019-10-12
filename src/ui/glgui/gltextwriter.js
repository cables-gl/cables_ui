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

        const font=CABLES.GLGUI.SDF_FONT_ARIAL;

        var string="Hallo!";

        var posX=-100;
        for(var i=0;i<string.length;i++)
        {
            const ch=font.characters[string.charAt(i)];
            var rect=this._rectDrawer.createRect();
            rect.setSize(ch.width,ch.height);
            rect.setColor(1,0,0,1);
            rect.setPosition(posX,font.size-ch.originY);
            rect.setTexRect(
                ch.x/font.width,ch.y/font.height,
                ch.width/font.width,ch.height/font.height);
            
            posX+=ch.width-ch.originX;
        }

    }

    render(resX,resY,scrollX,scrollY,zoom)
    {
        this._rectDrawer.render(resX,resY,scrollX,scrollY,zoom)
    }

    setFont(tex)
    {
        this._rectDrawer.setTexture(tex)
    }

}