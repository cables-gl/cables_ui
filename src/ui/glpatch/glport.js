CABLES = CABLES || {};
CABLES.GLGUI = CABLES.GLGUI || {};

CABLES.GLGUI.GlPort = class
{
    constructor(glpatch, glop, rectInstancer, p, i, oprect)
    {
        this._port = p;
        this._name = p.name;
        this._id = p.id;
        this._glop = glop;
        this._rect = new CABLES.GLGUI.GlRect(rectInstancer, { "parent": oprect, "interactive": true });
        this._rect.setSize(CABLES.GLGUI.VISUALCONFIG.portWidth, CABLES.GLGUI.VISUALCONFIG.portHeight);

        glpatch.setDrawableColorByType(this._rect, p.type);

        let y = 0;
        if (this._port.direction == 1) y = CABLES.UI.uiConfig.opHeight - CABLES.GLGUI.VISUALCONFIG.portHeight;

        this._rect.setPosition(i * (CABLES.GLGUI.VISUALCONFIG.portWidth + CABLES.GLGUI.VISUALCONFIG.portPadding), y);
        oprect.addChild(this._rect);

        this._rect.on("mousedown", (e, rect) =>
        {
            console.log("PORT DIQB");
            if (e.buttons == CABLES.UI.MOUSE_BUTTON_RIGHT)
            {
                glpatch.emitEvent("mouseDownRightOverPort", this, this._glop.id, this._port.name);
            }
            else
            {
                glpatch.emitEvent("mouseDownOverPort", this, this._glop.id, this._port.name);
            }
        });

        this._rect.on("mouseup", (e, rect) =>
        {
            glpatch.emitEvent("mouseUpOverPort", this._glop.id, this._port.name);
        });

        this._rect.on("hover", (rect) =>
        {
            console.log("port", this._port.name, this._rect.isHovering());
        });

        this._rect.on("unhover", (rect) =>
        {
            console.log("port", this._rect.isHovering());
        });
    }

    get id()
    {
        return this._id;
    }

    get name()
    {
        return this._name;
    }

    get glOp()
    {
        return this._glop;
    }

    get rect()
    {
        return this._rect;
    }

    dispose()
    {
        this._rect.dispose();
    }
};
