/**
 * extending core classes for helper functions which will be only available in ui/editor mode
 */

import text from "./text";

CABLES.Op.unLinkTempReLinkP1 = null;
CABLES.Op.unLinkTempReLinkP2 = null;

export default function extendCore()
{
    CABLES.Op.prototype.undoUnLinkTemporary = function ()
    {
        if (this.shakeLink) this.shakeLink.remove();
        this.shakeLink = null;

        if (this.oldLinks)
        {
            for (let i = 0; i < this.oldLinks.length; i++)
            {
                this.patch.link(
                    this.oldLinks[i].in.parent,
                    this.oldLinks[i].in.getName(),
                    this.oldLinks[i].out.parent,
                    this.oldLinks[i].out.getName()
                );
            }
            this.oldLinks.length = 0;
        }

        CABLES.Op.unLinkTempReLinkP1 = null;
        CABLES.Op.unLinkTempReLinkP2 = null;
    };

    CABLES.Op.prototype.unLinkTemporary = function ()
    {
        const tryRelink = true;
        let i = 0;

        this.shakeLink = null;
        this.oldLinks = [];

        if (tryRelink)
        {
            if (
                this.portsIn.length > 0 &&
                this.portsIn[0].isLinked() &&
                this.portsOut.length > 0 &&
                this.portsOut[0].isLinked()
            )
            {
                if (this.portsIn[0].getType() == this.portsOut[0].getType())
                {
                    CABLES.Op.unLinkTempReLinkP1 = this.portsIn[0].links[0].getOtherPort(this.portsIn[0]);
                    CABLES.Op.unLinkTempReLinkP2 = this.portsOut[0].links[0].getOtherPort(this.portsOut[0]);
                }
            }
        }

        for (let ipi = 0; ipi < this.portsIn.length; ipi++)
        {
            for (i = 0; i < this.portsIn[ipi].links.length; i++)
            {
                this.oldLinks.push({
                    "in": this.portsIn[ipi].links[i].portIn,
                    "out": this.portsIn[ipi].links[i].portOut
                });
            }
        }

        for (let ipo = 0; ipo < this.portsOut.length; ipo++)
            for (i = 0; i < this.portsOut[ipo].links.length; i++)
                this.oldLinks.push({
                    "in": this.portsOut[ipo].links[i].portIn,
                    "out": this.portsOut[ipo].links[i].portOut
                });

        this.unLink();

        if (CABLES.Op.unLinkTempReLinkP1 && CABLES.Op.unLinkTempReLinkP2)
            this.shakeLink = this.patch.link(
                CABLES.Op.unLinkTempReLinkP1.parent,
                CABLES.Op.unLinkTempReLinkP1.getName(),
                CABLES.Op.unLinkTempReLinkP2.parent,
                CABLES.Op.unLinkTempReLinkP2.getName()
            );
    };


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

            if (!working) notWorkingMsg = text.working_connected_to + "ImageCompose";
        }

        if (this._needsParentOp && working)
        {
            working = hasParent(this, CABLES.OP_PORT_TYPE_OBJECT, this._needsParentOp);
            if (!working) notWorkingMsg = text.working_connected_to + this._needsParentOp + "";
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

                    if (!notWorkingMsg) notWorkingMsg = text.working_connected_needs_connections_to;
                    else notWorkingMsg += ", ";
                    notWorkingMsg += p.name.toUpperCase();
                }
            }
        }

        const hadError = this.hasUiError("notworking");

        if (!working)
        {
            // console.log("ERRRRR");
            // this.setUiAttrib({ working, notWorkingMsg });
            this.setUiError("notworking", notWorkingMsg, 2);
        }
        else if (hadError)
        {
            // this.setUiAttrib({ "working": true, "notWorkingMsg": null });
            this.setUiError("notworking", null);
        }

        if (!hadError && !working)
        {

        }

        const broke = (!hadError && !working);
        if ((hadError && working) || broke)
        {
            clearTimeout(CABLES.timeoutCheckLinkTimeWarning);
            CABLES.timeoutCheckLinkTimeWarning = setTimeout(() =>
            {
                // check all ops for other follow up warnings to be resolved (possible optimization: check only ops under this one...)
                const perf = CABLES.UI.uiProfiler.start("[coreOpExt] checkLinkTimeWarnings");
                const ops = gui.corePatch().ops;

                for (let i = 0; i < ops.length; i++)
                    if (broke || (ops[i].id != this.id && ops[i].hasUiError("notworking")))
                        ops[i].checkLinkTimeWarnings();

                perf.finish();
            }, 33);
        }
    };
}
