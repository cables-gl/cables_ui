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
        this._glPatch = glpatch;
        this._rect = new CABLES.GLGUI.GlRect(rectInstancer, { "parent": oprect, "interactive": true });

        this._posX = i * (CABLES.GLGUI.VISUALCONFIG.portWidth + CABLES.GLGUI.VISUALCONFIG.portPadding);
        glpatch.setDrawableColorByType(this._rect, p.type);

        oprect.addChild(this._rect);


        this._rect.on("mousedown", this._onMouseDown.bind(this));
        this._rect.on("mouseup", this._onMouseUp.bind(this));
        this._rect.on("hover", this._onHover.bind(this));
        this._rect.on("unhover", this._onUnhover.bind(this));

        this._port.on("onLinkChanged", this._onLinkChanged.bind(this));

        this._updateSize();
    }

    _updateSize()
    {
        let h = CABLES.GLGUI.VISUALCONFIG.portHeight;
        if (this._port.isLinked()) h *= 1.5;

        let y = 0;
        if (this._port.direction == 1) y = CABLES.UI.uiConfig.opHeight - CABLES.GLGUI.VISUALCONFIG.portHeight;
        else if (this._port.isLinked()) y -= CABLES.GLGUI.VISUALCONFIG.portHeight * 0.5;

        this._rect.setPosition(this._posX, y);
        this._rect.setSize(CABLES.GLGUI.VISUALCONFIG.portWidth, h);
    }

    _onLinkChanged()
    {
        this._updateSize();
    }

    _onMouseDown(e, rect)
    {
        // if (e.buttons == CABLES.UI.MOUSE_BUTTON_RIGHT)
        // {
        //     this._glPatch.emitEvent("mouseDownRightOverPort", this, this._glop.id, this._port.name);
        // }
        // else
        // {
        this._glPatch.emitEvent("mouseDownOverPort", this, this._glop.id, this._port.name, e.buttons);
        // }
    }

    _onMouseUp(e, rect)
    {
        this._glPatch.emitEvent("mouseUpOverPort", this._glop.id, this._port.name);
    }

    _onHover(rect)
    {
        const event = {
            "clientX": this._glPatch.viewBox.mouseX,
            "clientY": this._glPatch.viewBox.mouseY - 25,
        };

        console.log(this._glop._links);


        console.log("port", this._port.name, this._rect.isHovering());
        CABLES.UI.updateHoverToolTip(event, this._port);
    }

    _onUnhover(rect)
    {
        clearInterval(CABLES.UI.hoverInterval);
        CABLES.UI.hoverInterval = -1;
        CABLES.UI.hideToolTip();
    }

    get type() { return this._port.type; }

    get port() { return this._port; }

    get id() { return this._id; }

    get name() { return this._name; }

    get glOp() { return this._glop; }

    get rect() { return this._rect; }

    dispose()
    {
        this._rect.dispose();
    }
};
