
CABLES.Op.prototype.checkLinkTimeWarnings = function ()
{
    function hasParent(op, type, name)
    {
        for (let i = 0; i < op.portsIn.length; i++)
        {
            if (op.portsIn[i].type == type && op.portsIn[i].isLinked())
            {
                const pi = op.portsIn[i];
                for (let li = 0; li < pi.links.length; li++)
                {
                    if (!pi.links[li]) continue;
                    if (pi.links[li].portOut.parent.objName.indexOf(name) > -1) return true;
                    if (hasParent(pi.links[li].portOut.parent, type, name)) return true;
                }
            }
        }
        return false;
    }

    function hasTriggerInput(op)
    {
        if (op.portsIn.length > 0 && op.portsIn[0].type == CABLES.OP_PORT_TYPE_FUNCTION) return true;
        return false;
    }

    let notWorkingMsg = null;
    let working = true;

    if (working && this.objName.indexOf("Ops.Gl.TextureEffects") == 0 && hasTriggerInput(this) && this.objName.indexOf("TextureEffects.ImageCompose") == -1)
    {
        working =
            hasParent(this, CABLES.OP_PORT_TYPE_FUNCTION, "TextureEffects.ImageCompose") ||
            hasParent(this, CABLES.OP_PORT_TYPE_FUNCTION, "TextureEffects.ImageCompose_v2");

        if (!working) notWorkingMsg = CABLES.UI.TEXTS.working_connected_to + "ImageCompose";
    }

    if (this._needsParentOp && working)
    {
        working = hasParent(this, CABLES.OP_PORT_TYPE_OBJECT, this._needsParentOp);
        if (!working) notWorkingMsg = CABLES.UI.TEXTS.working_connected_to + this._needsParentOp + "";
    }


    if (this._needsLinkedToWork.length > 0)
    {
        for (let i = 0; i < this._needsLinkedToWork.length; i++)
        {
            const p = this._needsLinkedToWork[i];
            if (!p)
            {
                console.warn("[needsLinkedToWork] port not found");
                continue;
            }
            if (!p.isLinked())
            {
                working = false;

                if (!notWorkingMsg) notWorkingMsg = CABLES.UI.TEXTS.working_connected_needs_connections_to;
                else notWorkingMsg += ", ";
                notWorkingMsg += p.name.toUpperCase();
            }
        }
    }

    if (!working)
    {
        this.setUiAttrib({ working, notWorkingMsg });
        this.setUiError("notworking", notWorkingMsg, 1);
    }
    else if (!this.uiAttribs.working)
    {
        this.setUiAttrib({ "working": true, "notWorkingMsg": null });
        this.setUiError("notworking", null);
    }
};
