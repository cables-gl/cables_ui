CABLES = CABLES || {};
CABLES.GLGUI = CABLES.GLGUI || {};

CABLES.GLGUI.GlLink = class
{
    constructor(glpatch,
        link, id, opIdInput, opIdOutput,
        portNameIn,
        portNameOut, portIdInput, portIdOutput, type)
    {
        this._id = id;
        this._link = link;
        this._visible = true;
        this._glPatch = glpatch;
        this._type = type;
        this._portNameInput = portNameIn;
        this._portNameOutput = portNameOut;
        this._opIdInput = opIdInput;
        this._opIdOutput = opIdOutput;
        this._portIdInput = portIdInput;
        this._portIdOutput = portIdOutput;

        this._buttonDown = CABLES.UI.MOUSE_BUTTON_NONE;
        this._buttonDownTime = 0;

        this._buttonRect = this._glPatch.rectDrawer.createRect({});
        this._buttonRect.setDecoration(1);
        this._buttonRect.setColorHover(1, 0, 0, 1);

        this._buttonRect.on("mouseup", (e) =>
        {
            const pressTime = performance.now() - this._buttonDownTime;

            if (
                this._buttonDown == CABLES.UI.MOUSE_BUTTON_RIGHT &&
                pressTime < CABLES.GLGUI.VISUALCONFIG.clickMaxDuration)
            {
                this._glPatch.patchAPI.removeLink(this._opIdInput, this._opIdOutput, this._portIdInput, this._portIdOutput);
            }

            for (const i in this._glPatch.selectedGlOps)
            {
                if (this._glPatch.selectedGlOps[i].isHovering() && this._glPatch.selectedGlOps[i].isDragging)
                {
                    const coord = this._glPatch.mouseToPatchCoords(e.offsetX, e.offsetY);
                    gui.patchView.insertOpInLink(this._link, this._glPatch.selectedGlOps[i].op, coord[0], coord[1]);
                    return;
                }
            }


            if (this._buttonDown == CABLES.UI.MOUSE_BUTTON_LEFT &&
                pressTime < CABLES.GLGUI.VISUALCONFIG.clickMaxDuration)
            {
                this._glPatch.patchAPI.addOpIntoLink(
                    this._opIdInput,
                    this._opIdOutput,
                    this._portIdInput,
                    this._portIdOutput,
                    this._glPatch.viewBox.mousePatchX,
                    this._glPatch.viewBox.mousePatchY);
            }


            this._buttonDown = CABLES.UI.MOUSE_BUTTON_NONE;
        });

        this._buttonRect.on("mousedown", (e) =>
        {
            console.log("BUTTONRECT MOUSE DOWN!!!!!!");

            this._buttonDown = e.buttons;
            this._buttonDownTime = performance.now();
        });

        this._cable = new CABLES.GLGUI.GlCable(this._glPatch, this._glPatch.lineDrawer, this._buttonRect, this._type);
        this._glPatch.setDrawableColorByType(this._cable, this._type);

        this._opIn = null;
        this._opOut = null;

        this._offsetXInput = 0;
        this._offsetXOutput = 0;

        this._glPatch.addLink(this);
        this.update();
    }

    get id()
    {
        return this._id;
    }

    get nameInput()
    {
        return this._portNameInput;
    }

    get nameOutput()
    {
        return this._portNameOutput;
    }

    get opIdOutput() { return this._opIdOutput; }

    get opIdInput() { return this._opIdInput; }


    updateVisible()
    {

    }

    set visible(v)
    {
        this._cable.visible = v;
        this._visible = v;
        // this._buttonRect.visible = v;
        this._updatePosition();
    }

    _updatePosition()
    {
        if (this._visible)
        {
            if (this._opOut && this._opIn)
            {
                const pos1x = this._opIn.getUiAttribs().translate.x + this._offsetXInput;
                const pos1y = this._opIn.getUiAttribs().translate.y;

                const pos2x = this._opOut.getUiAttribs().translate.x + this._offsetXOutput;
                const pos2y = this._opOut.getUiAttribs().translate.y + CABLES.UI.uiConfig.opHeight;

                this._cable.setPosition(pos1x, pos1y, pos2x, pos2y);
            }
            else
            {
                console.log("gllink no op in/out");
            }
        }
        else this._cable.setPosition(0, 0, 0, 0);
    }


    update()
    {
        if (!this._opIn)
        {
            this._opIn = this._glPatch.getOp(this._opIdInput);
            if (this._opIn)
            {
                this._opIn.addLink(this);
                this._offsetXInput = this._opIn.getPortPos(this._portIdInput);
            }
        }

        if (!this._opOut)
        {
            this._opOut = this._glPatch.getOp(this._opIdOutput);
            if (this._opOut)
            {
                this._opOut.addLink(this);
                this._offsetXOutput = this._opOut.getPortPos(this._portIdOutput);
            }
        }

        if (!this._opIn || !this._opOut)
        {
            console.log("[glLink] unknown ops...");
            return;
        }

        this._updatePosition();
    }

    dispose()
    {
        if (this._opOut) this._opOut.removeLink(this._id);
        if (this._opIn) this._opIn.removeLink(this._id);
        this._cable.dispose();

        this._buttonRect.dispose();
        this._buttonRect = null;
    }

    setFlowModeActivity(act)
    {
        this._cable.setSpeed(act);
    }
};
