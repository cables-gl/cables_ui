/**
 * extending core classes for helper functions which will be only available in ui/editor mode
 */

import defaultops from "./defaultops";
import gluiconfig from "./glpatch/gluiconfig";
import text from "./text";
import uiconfig from "./uiconfig";

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
                    this.oldLinks[i].in.op,
                    this.oldLinks[i].in.getName(),
                    this.oldLinks[i].out.op,
                    this.oldLinks[i].out.getName()
                );
            }
            this.oldLinks.length = 0;
        }

        CABLES.Op.unLinkTempReLinkP1 = null;
        CABLES.Op.unLinkTempReLinkP2 = null;
    };

    CABLES.Op.prototype.countFittingPorts = function (otherPort)
    {
        let count = 0;
        for (const ipo in this.portsOut) if (CABLES.Link.canLink(otherPort, this.portsOut[ipo])) count++;

        for (const ipi in this.portsIn) if (CABLES.Link.canLink(otherPort, this.portsIn[ipi])) count++;

        return count;
    };

    CABLES.Op.prototype.findFittingPort = function (otherPort, inPortsFirst = false)
    {
        if (inPortsFirst)
        {
            for (const ipi in this.portsIn) if (CABLES.Link.canLink(otherPort, this.portsIn[ipi])) return this.portsIn[ipi];
            for (const ipo in this.portsOut) if (CABLES.Link.canLink(otherPort, this.portsOut[ipo])) return this.portsOut[ipo];
        }
        else
        {
            for (const ipo in this.portsOut) if (CABLES.Link.canLink(otherPort, this.portsOut[ipo])) return this.portsOut[ipo];
            for (const ipi in this.portsIn) if (CABLES.Link.canLink(otherPort, this.portsIn[ipi])) return this.portsIn[ipi];
        }
    };


    /**
     * disconnect all links
     * @function
     * @instance
     * @memberof Op
     */
    CABLES.Op.prototype.unLink = function ()
    {
        for (let ipo = 0; ipo < this.portsOut.length; ipo++) this.portsOut[ipo].removeLinks();
        for (let ipi = 0; ipi < this.portsIn.length; ipi++) this.portsIn[ipi].removeLinks();
    };


    CABLES.Op.prototype.unLinkReconnectOthers = function ()
    {
        this.unLinkOptions(false, false);
    };

    CABLES.Op.prototype.unLinkTemporary = function ()
    {
        this.unLinkOptions(true, true);
    };

    CABLES.Op.prototype.unLinkOptions = function (tryRelink, temporary)
    {
        let i = 0;

        this.shakeLink = null;
        this.oldLinks = [];

        CABLES.Op.unLinkTempReLinkP1 = null;
        CABLES.Op.unLinkTempReLinkP2 = null;

        if (tryRelink)
        {
            if (
                this.portsIn.length > 0 &&
                this.portsIn[0].isLinked() &&
                this.portsOut.length > 0 &&
                this.portsOut[0].isLinked()
            )
            {
                if (this.portsIn[0].getType() == this.portsOut[0].getType() && this.portsIn[0].links[0])
                {
                    CABLES.Op.unLinkTempReLinkP1 = this.portsIn[0].links[0].getOtherPort(this.portsIn[0]);
                    CABLES.Op.unLinkTempReLinkP2 = this.portsOut[0].links[0].getOtherPort(this.portsOut[0]);
                }
            }
        }

        if (temporary)
        {
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
        }


        this.unLink();

        if (CABLES.Op.unLinkTempReLinkP1 && CABLES.Op.unLinkTempReLinkP2)
            this.shakeLink = this.patch.link(
                CABLES.Op.unLinkTempReLinkP1.op,
                CABLES.Op.unLinkTempReLinkP1.getName(),
                CABLES.Op.unLinkTempReLinkP2.op,
                CABLES.Op.unLinkTempReLinkP2.getName()
            );
    };


    CABLES.Op.prototype.hasParent = function (type, name, count)
    {
        if (this._ignoreParentChecks) return false;
        count = count || 1;
        count++;
        if (count >= 1000)
        {
            console.log("hasparent loop....", name);
            // this.removeLinks();
            this._ignoreParentChecks = true;
            return false;
        }
        for (let i = 0; i < this.portsIn.length; i++)
        {
            if (((type === undefined || type === null) || this.portsIn[i].type == type) && this.portsIn[i].isLinked())
            {
                const pi = this.portsIn[i];
                for (let li = 0; li < pi.links.length; li++)
                {
                    if (!pi.links[li]) continue;
                    if (pi.links[li].portOut.op.objName.indexOf(name) > -1) return true;
                    if (pi.links[li].portOut.op.hasParent(type, name, count)) return true;
                }
            }
        }
        return false;
    };


    CABLES.Op.prototype.checkLinkTimeWarnings = function ()
    {
        if (!CABLES.UI.loaded) return;
        // function hasParent(op, type, name, count)
        // {
        //     count = count || 1;
        //     count++;
        //     if (count >= 1000)
        //     {
        //         console.log("hasparent loop....");
        //         return false;
        //     }
        //     for (let i = 0; i < op.portsIn.length; i++)
        //     {
        //         if (((type === undefined || type === null) || op.portsIn[i].type == type) && op.portsIn[i].isLinked())
        //         {
        //             const pi = op.portsIn[i];
        //             for (let li = 0; li < pi.links.length; li++)
        //             {
        //                 if (!pi.links[li]) continue;
        //                 if (pi.links[li].portOut.op.objName.indexOf(name) > -1) return true;
        //                 if (hasParent(pi.links[li].portOut.op, type, name, count)) return true;
        //             }
        //         }
        //     }
        //     return false;
        // }

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
                this.hasParent(CABLES.OP_PORT_TYPE_FUNCTION, "TextureEffects.ImageCompose") ||
                this.hasParent(CABLES.OP_PORT_TYPE_FUNCTION, "TextureEffects.ImageCompose_v2");

            if (!working) notWorkingMsg = text.working_connected_to + "ImageCompose";
        }

        if (this._linkTimeRules.forbiddenParent && working)
        {
            working = !this.hasParent(this._linkTimeRules.forbiddenParentType || null, this._linkTimeRules.forbiddenParent);
            if (!working) notWorkingMsg = text.working_shouldNotBeChildOf + this._linkTimeRules.forbiddenParent + "";
        }

        if (this._linkTimeRules.needsParentOp && working)
        {
            working = this.hasParent(null, this._linkTimeRules.needsParentOp);
            if (!working) notWorkingMsg = text.working_connected_to + this._linkTimeRules.needsParentOp + "";
        }

        if (this._linkTimeRules.needsLinkedToWork.length > 0)
        {
            for (let i = 0; i < this._linkTimeRules.needsLinkedToWork.length; i++)
            {
                const p = this._linkTimeRules.needsLinkedToWork[i];
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

                    p.setUiAttribs({ "notWorking": true });
                }
                else p.setUiAttribs({ "notWorking": false });
            }
        }

        this.setUiError("wrongstride", null);
        for (let i = 0; i < this.portsIn.length; i++)
        {
            if (this.portsIn[i].type == CABLES.OP_PORT_TYPE_ARRAY && this.portsIn[i].links.length)
            {
                const otherPort = this.portsIn[i].links[0].getOtherPort(this.portsIn[i]);
                if (
                    otherPort.uiAttribs.stride != undefined &&
                    this.portsIn[i].uiAttribs.stride != undefined &&
                    otherPort.uiAttribs.stride != this.portsIn[i].uiAttribs.stride)
                {
                    this.setUiError("wrongstride", "Port \"" + this.portsIn[i].name + "\" : Incompatible Array" + otherPort.uiAttribs.stride + " to Array" + this.portsIn[i].uiAttribs.stride, 1);
                }
            }
        }

        const hadError = this.hasUiError("notworking");

        if (!working)
        {
            // console.log("ERRRRR");
            // this.setUiAttrib({ working, notWorkingMsg });
            this.setUiError("notworking", notWorkingMsg, 3);
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


    CABLES.Op.prototype.hasLinks = function ()
    {
        for (let i = 0; i < this.portsIn.length; i++) if (this.portsIn[i].isLinked()) return true;
        for (let i = 0; i < this.portsOut.length; i++) if (this.portsOut[i].isLinked()) return true;
        return false;
    };

    CABLES.Op.prototype.hasFirstInAndOutPortLinked = function ()
    {
        return (this.portsIn.length > 0 && this.portsIn[0].isLinked() && this.portsOut.length > 0 && this.portsOut[0].isLinked());
    };

    CABLES.Op.prototype.hasFirstInLinked = function ()
    {
        return (this.portsIn.length > 0 && this.portsIn[0].isLinked());
    };

    CABLES.Op.prototype.hasFirstOutLinked = function ()
    {
        return (this.portsOut.length > 0 && this.portsOut[0].isLinked());
    };
    CABLES.Op.prototype.hasAnyOutLinked = function ()
    {
        for (let i = 0; i < this.portsOut.length; i++) if (this.portsOut[i].isLinked()) return true;
    };

    CABLES.Op.prototype.hasMultipleOutLinked = function ()
    {
        let count = 0;
        for (let i = 0; i < this.portsOut.length; i++)
        {
            if (this.portsOut[i].links.length > 1) return true;
            if (this.portsOut[i].isLinked()) { count++; if (count > 2) return true; }
        }
    };

    CABLES.Op.prototype.hasAnyInLinked = function ()
    {
        for (let i = 0; i < this.portsIn.length; i++) if (this.portsIn[i].isLinked()) return true;
    };
    CABLES.Op.prototype.getFirstLinkedInPort = function ()
    {
        for (let i = 0; i < this.portsIn.length; i++) if (this.portsIn[i].isLinked()) return this.portsIn[i];
    };

    CABLES.Op.prototype.getFirstLinkedInOp = function ()
    {
        for (let i = 0; i < this.portsIn.length; i++) if (this.portsIn[i].isLinked())
        {
            const otherport = this.portsIn[i].links[0].getOtherPort(this.portsIn[i]);
            return otherport.op;
        }
    };

    CABLES.Op.prototype.getLowestLinkedInOp = function ()
    {
        let maxY = -999999;
        let lowestOp = null;
        for (let i = 0; i < this.portsIn.length; i++) if (this.portsIn[i].isLinked())
        {
            if (this.portsIn[i].links[0])
            {
                const otherport = this.portsIn[i].links[0].getOtherPort(this.portsIn[i]);

                if (otherport.op.getTempPosY() > maxY)
                {
                    maxY = otherport.op.getTempPosY();
                    lowestOp = otherport.op;
                }
            }
        }

        return lowestOp;

        // for (let i = 0; i < this.portsIn.length; i++) if (this.portsIn[i].isLinked())
        // {
        //     const otherport = this.portsIn[i].links[0].getOtherPort(this.portsIn[i]);
        //     return otherport.op;
        // }
    };



    CABLES.Op.prototype.isBlueprint2 = function ()
    {
        if(this.storage.blueprintVer===2)return this.patchId.get();
    }
    
    CABLES.Op.prototype.isInBlueprint2 = function ()
    {
        if(!this.uiAttribs.subPatch || this.uiAttribs.subPatch==0)return false;

        const sop=gui.patchView.getSubPatchOuterOp(this.uiAttribs.subPatch);
        if(sop)
        {
            if(sop.isBlueprint2())return sop.isBlueprint2();

            const bp2=sop.isInBlueprint2();
            if(bp2)return bp2;
        }
        
        return false;
    }

    CABLES.Op.prototype.isInLinkedToOpOutside = function (ops)
    {
        for (let i = 0; i < this.portsIn.length; i++) if (this.portsIn[i].isLinked())
        {
            for (let j = 0; j < this.portsIn[i].links.length; j++)
            {
                if (ops.indexOf(this.portsIn[i].links[j].getOtherPort(this.portsIn[i]).op) == -1) return true;
            }
        }
    };

    CABLES.Op.prototype.getTempPosX = function ()
    {
        if (this.uiAttribs.translateTemp) return this.uiAttribs.translateTemp.x;
        if (this.uiAttribs.translate) return this.uiAttribs.translate.x;

        console.log("no uiattribs ?!", this);
    };

    CABLES.Op.prototype.getTempPosY = function ()
    {
        if (this.uiAttribs.translateTemp) return this.uiAttribs.translateTemp.y;
        if (this.uiAttribs.translate) return this.uiAttribs.translate.y;

        console.log("no uiattribs ?!", this);
    };

    CABLES.Op.prototype.setTempOpPos = function (x, y, w, h)
    {
        const pos = {
            "x": x,
            "y": y
        };
        if (w !== undefined && h != undefined)
        {
            pos.w = w;
            pos.h = h;
        }
        else
        {
            pos.w = this.uiAttribs.translateTemp.w;
            pos.h = this.uiAttribs.translateTemp.h;
        }


        // console.log("settemppos", pos);

        this.setUiAttribs({ "translateTemp": pos });
    };

    CABLES.Op.prototype.setTempOpPosY = function (y)
    {
        this.setTempOpPos(this.getTempPosX(), y);
    };

    CABLES.Op.prototype.setTempOpPosX = function (x)
    {
        this.setTempOpPos(x, this.getTempPosY());
    };


    CABLES.Op.prototype.getChildsBoundings = function (glpatch, s, untilOp, count)
    {
        if (count > 100) return s;
        s = s || { "maxx": null, "maxy": null, "minx": null, "miny": null };

        if (!this.uiAttribs || !this.uiAttribs.translate) return s;

        s.maxx = Math.max(s.maxx || -99999999999, this.getTempPosX() + this.getWidth(glpatch));
        s.maxy = Math.max(s.maxy || -99999999999, this.getTempPosY() + this.getHeight(glpatch));

        s.minx = Math.min(s.minx || 99999999999, this.getTempPosX());
        s.miny = Math.min(s.miny || 99999999999, this.getTempPosY());


        if (untilOp && this == untilOp) return s;

        for (let i = 0; i < this.portsOut.length; i++)
        {
            for (let j = 0; j < this.portsOut[i].links.length; j++)
            {
                const p = this.portsOut[i].links[j].getOtherPort(this.portsOut[i]);

                s = p.op.getChildsBoundings(glpatch, s, untilOp, (count || 0) + 1);
            }
        }
        return s;
    };

    CABLES.Op.prototype.testTempCollision = function (ops, glpatch)
    {
        // console.log("testTempCollision");
        for (let j = 0; j < ops.length; j++)
        {
            const b = ops[j];
            if (b.deleted || b == this) continue;

            // console.log(b.uiAttribs.translateTemp);

            if (
                (
                    this.getTempPosX() >= b.getTempPosX() &&
                    this.getTempPosX() <= b.getTempPosX() + b.getWidth(glpatch)
                ) &&
                (
                    this.getTempPosY() >= b.getTempPosY() &&
                    this.getTempPosY() <= b.getTempPosY() + b.getHeight(glpatch)
                ))
            {
                // console.log("colliding!");
                return b;
            }
        }
    };

    CABLES.Op.prototype.getWidth = function (glpatch)
    {
        return glpatch.getGlOp(this).w;
    };

    CABLES.Op.prototype.getHeight = function (glpatch)
    {
        return glpatch.getGlOp(this).h;
    };


    CABLES.Op.prototype.selectChilds = function (options)
    {
        options = options || {};
        if (!options.oplist)options.oplist = [];

        if (options.oplist.indexOf(this.id) > -1) return;

        options.oplist.push(this.id);

        this.setUiAttrib({ "selected": true });
        for (const ipo in this.portsOut)
        {
            for (const l in this.portsOut[ipo].links)
            {
                this.portsOut[ipo].op.setUiAttrib({ "selected": true });
                if (this.portsOut[ipo].links[l].portIn.op != this)
                    this.portsOut[ipo].links[l].portIn.op.selectChilds(options);
            }
        }
    };

    CABLES.Op.prototype.getUiAttribs = function ()
    {
        return this.uiAttribs || {};
    };

    CABLES.Op.prototype.getSubPatch = function ()
    {
        return this.uiAttribs.subPatch || 0;
    };

    CABLES.Op.prototype.getPortPosX = function (name, opid)
    {
        if (this.isSubPatchOp() == 2)
        {
            const ports = gui.patchView.getSubPatchExposedPorts(this.patchId.get(), CABLES.PORT_DIR_IN);

            for (let i = 0; i < ports.length; i++)
            {
                if (ports[i].name == name)
                {
                    return i * (gluiconfig.portWidth + gluiconfig.portPadding) + uiconfig.portSize * 0.5;
                }
            }


            const portsOut = gui.patchView.getSubPatchExposedPorts(this.patchId.get(), CABLES.PORT_DIR_OUT);

            for (let i = 0; i < portsOut.length; i++)
            {
                if (portsOut[i].name == name)
                {
                    return i * (gluiconfig.portWidth + gluiconfig.portPadding) + uiconfig.portSize * 0.5;
                }
            }
        }


        for (let i = 0; i < this.portsIn.length; i++)
        {
            if (this.portsIn[i].name == name)
            {
                return (this.portsIn[i].uiAttribs["glPortIndex_" + opid] || this.portsIn[i].uiAttribs.glPortIndex || 0) * (gluiconfig.portWidth + gluiconfig.portPadding) + uiconfig.portSize * 0.5;
            }
        }

        for (let i = 0; i < this.portsOut.length; i++)
        {
            if (this.portsOut[i].name == name)
            {
                return i * (gluiconfig.portWidth + gluiconfig.portPadding) + uiconfig.portSize * 0.5;
            }
        }

        // console.log("could not find port posx ", name, this.getTitle(), opid);

        return 2;
    };

    // CABLES.Op.prototype.isSubPatchOp = function ()
    // {
    //     return (this.objName == "Ops.Ui.SubPatch" || this.objName == "Ops.Dev.SubpatchNew");
    // };
}
