/**
 * extending core classes for helper functions which will be only available in ui/editor mode
 */

import { portType } from "./core_constants.js";
import defaultOps from "./defaultops.js";
import gluiconfig from "./glpatch/gluiconfig.js";
import { gui } from "./gui.js";
import text from "./text.js";

CABLES.OpUnLinkTempReLinkP1 = null;
CABLES.OpUnLinkTempReLinkP2 = null;

/**
 * @external CABLES.Op
 */

export default function extendCoreOp()
{

    CABLES.Op.prototype.initUi = function ()
    {
        this.on("onPortAdd", () =>
        {
            for (let i = 0; i < this.portsIn.length; i++)
            {
                for (let j = 0; j < this.portsOut.length; j++)
                    if (this.portsIn[i].name == this.portsOut[j].name)
                        this.setUiError("dupeport", "Duplicate Port name: " + this.portsOut[j].name + ". Must be unique!", 2);
                for (let j = 0; j < this.portsIn.length; j++)
                    if (i != j && this.portsIn[i].name == this.portsIn[j].name)
                        this.setUiError("dupeport", "Duplicate Port name: " + this.portsIn[j].name + ". Must be unique!", 2);
            }
        });
    };

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

        CABLES.OpUnLinkTempReLinkP1 = null;
        CABLES.OpUnLinkTempReLinkP2 = null;
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
        this.unLinkOptions(true, false);
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

        CABLES.OpUnLinkTempReLinkP1 = null;
        CABLES.OpUnLinkTempReLinkP2 = null;

        if (tryRelink)
        {
            if (
                this.getFirstPortIn() &&
                this.getFirstPortOut() &&
                this.getFirstPortIn().isLinked() &&
                this.getFirstPortOut().isLinked()
                // this.portsIn.length > 0 &&
                // this.portsIn[0].isLinked() &&
                // this.portsOut.length > 0 &&
                // this.portsOut[0].isLinked()
            )
            {
                if (this.getFirstPortIn().getType() == this.getFirstPortOut().getType() && this.getFirstPortIn().links[0])
                {
                    CABLES.OpUnLinkTempReLinkP1 = this.getFirstPortIn().links[0].getOtherPort(this.getFirstPortIn());
                    CABLES.OpUnLinkTempReLinkP2 = this.getFirstPortOut().links[0].getOtherPort(this.getFirstPortOut());
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

        if (CABLES.OpUnLinkTempReLinkP1 && CABLES.OpUnLinkTempReLinkP2)
            this.shakeLink = this.patch.link(
                CABLES.OpUnLinkTempReLinkP1.op,
                CABLES.OpUnLinkTempReLinkP1.getName(),
                CABLES.OpUnLinkTempReLinkP2.op,
                CABLES.OpUnLinkTempReLinkP2.getName()
            );
    };

    CABLES.Op.prototype.isLinked = function ()
    {
        return this.isLinkedIn() || this.isLinkedOut();
    };

    CABLES.Op.prototype.isLinkedIn = function ()
    {
        for (let i = 0; i < this.portsIn.length; i++) if (this.portsIn[i] && this.portsIn[i].isLinked()) return true;
        return false;
    };
    CABLES.Op.prototype.isLinkedOut = function ()
    {
        for (let i = 0; i < this.portsOut.length; i++) if (this.portsOut[i] && this.portsOut[i].isLinked()) return true;
        return false;
    };

    CABLES.Op.prototype.hasParent = function (type, name, count)
    {
        if (this._ignoreParentChecks) return false;
        count = count || 1;
        count++;
        if (count >= 1000)
        {
            this._log.log("hasparent loop....", name);
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

    CABLES.Op.prototype.isConnectedTo = function (op2)
    {
        for (let i = 0; i < this.portsIn.length; i++)
            if (this.portsIn[i].isLinked())
                for (let j = 0; j < this.portsIn[i].links.length; j++)
                    if (this.portsIn[i].links[j].getOtherPort(this.portsIn[i]).op == op2) return this.portsIn[i].links[j];

        for (let i = 0; i < this.portsOut.length; i++)
            if (this.portsOut[i].isLinked())
                for (let j = 0; j < this.portsOut[i].links.length; j++)
                    if (this.portsOut[i].links[j].getOtherPort(this.portsOut[i]).op == op2) return this.portsOut[i].links[j];
    };

    CABLES.Op.prototype.isPatchOp = function ()
    {
        return this.objName.indexOf("Ops.Patch") == 0;
    };

    CABLES.Op.prototype.isTeamOp = function ()
    {
        return this.objName.indexOf("Ops.Team") == 0;
    };

    CABLES.Op.prototype.isUserOp = function ()
    {
        return this.objName.indexOf("Ops.User") == 0;
    };

    CABLES.Op.prototype.isCoreOp = function ()
    {
        return !this.isTeamOp() && !this.isPatchOp() && !this.isUserOp();
    };

    CABLES.Op.prototype.getUiError = function (id)
    {
        return this.uiErrors[id];
    };

    CABLES.Op.prototype.setUiError = function (id, txt, level)
    {
        if (!txt && !this.hasUiErrors) return;
        if (!txt && !this.uiErrors.hasOwnProperty(id)) return;
        if (this.uiErrors.hasOwnProperty(id) && this.uiErrors[id].txt == txt) return;

        if (id.indexOf(" ") > -1) this._log.warn("setuierror id cant have spaces! ", id);
        id = id.replaceAll(" ", "_");

        if (!txt && this.uiErrors.hasOwnProperty(id)) delete this.uiErrors[id];
        else
        {
            if (txt && (!this.uiErrors.hasOwnProperty(id) || this.uiErrors[id].txt != txt))
            {
                if (level == undefined) level = 2;
                this.uiErrors[id] = { "txt": txt, "level": level, "id": id };
            }
        }

        const errorArr = [];
        for (const i in this.uiErrors) errorArr.push(this.uiErrors[i]);

        this.uiAttr({ "uierrors": errorArr });
        this.hasUiErrors = Object.keys(this.uiErrors).length;

        this.emitEvent("uiErrorChange");
    };

    CABLES.Op.prototype.checkLinkTimeWarnings = function ()
    {
        if (!gui.finishedLoading()) return;

        if (this.isInBlueprint2())
        {
            const outer = gui.patchView.getSubPatchOuterOp(this.uiAttribs.subPatch);
            if (outer)
            {
                let subPatchOpError = null;
                if (this.objName == outer.objName) subPatchOpError = "SubPatchOp Recursion error";
                if (this.isPatchOp() && outer.isTeamOp()) subPatchOpError = "SubPatchOp Error: Patch op can't be in team ops";
                if (this.isUserOp() && outer.isTeamOp()) subPatchOpError = "SubPatchOp Error: User op can't be in team ops";
                if (this.isPatchOp() && outer.isCoreOp()) subPatchOpError = "SubPatchOp Error: Patch op can't be in core ops or extensions";
                if (this.isUserOp() && outer.isCoreOp()) subPatchOpError = "SubPatchOp Error: User op can't be in core ops or extensions";

                this.setUiError("subPatchOpNoSaveError", subPatchOpError);
            }
        }

        function hasTriggerInput(op)
        {
            if (op.portsIn.length > 0 && op.portsIn[0].type == portType.trigger) return true;
            return false;
        }

        let notWorkingMsg = null;
        let working = true;

        if (working && this.objName.indexOf("Ops.Gl.TextureEffects") == 0 && hasTriggerInput(this) && this.objName.indexOf("TextureEffects.ImageCompose") == -1)
        {
            working =
                this.hasParent(portType.trigger, "TextureEffects.ImageCompose") ||
                this.hasParent(portType.trigger, "TextureEffects.ImageCompose_v2");

            if (!working) notWorkingMsg = text.working_connected_to + "ImageCompose";
        }

        if (this.linkTimeRules.forbiddenParent && working)
        {
            working = !this.hasParent(this.linkTimeRules.forbiddenParentType || null, this.linkTimeRules.forbiddenParent);
            if (!working) notWorkingMsg = text.working_shouldNotBeChildOf + this.linkTimeRules.forbiddenParent + "";
        }

        if (this.linkTimeRules.needsParentOp && working)
        {
            working = this.hasParent(null, this.linkTimeRules.needsParentOp);
            if (!working) notWorkingMsg = text.working_connected_to + this.linkTimeRules.needsParentOp + "";
        }

        if (this.linkTimeRules.needsStringToWork.length > 0)
        {
            for (let i = 0; i < this.linkTimeRules.needsStringToWork.length; i++)
            {
                const p = this.linkTimeRules.needsStringToWork[i];
                if (!p)
                {
                    this._log.warn("[needsStringToWork] port not found");
                    continue;
                }
                if (p.linkTimeListener)p.off(p.linkTimeListener);
                if (!p.isLinked() && p.get() == "")
                {
                    working = false;

                    if (!notWorkingMsg) notWorkingMsg = text.working_connected_needs_connections_or_string;
                    else notWorkingMsg += ", ";
                    notWorkingMsg += p.name.toUpperCase();

                    p.linkTimeListener = p.on("change", (v, port) =>
                    {
                        if (port.op.checkLinkTimeWarnings)port.op.checkLinkTimeWarnings();
                    });

                    p.setUiAttribs({ "notWorking": true });
                }
                else p.setUiAttribs({ "notWorking": false });
            }
        }

        if (this.linkTimeRules.needsLinkedToWork.length > 0)
        {
            for (let i = 0; i < this.linkTimeRules.needsLinkedToWork.length; i++)
            {
                const p = this.linkTimeRules.needsLinkedToWork[i];
                if (!p)
                {
                    this._log.warn("[needsLinkedToWork] port not found");
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

        let isWebGpu = this.objName.indexOf(defaultOps.prefixes.webgpu) == 0;

        this.setUiError("wrongstride", null);
        this.setUiError("webglgpu", null);
        for (let i = 0; i < this.portsIn.length; i++)
        {
            if (this.portsIn[i].links.length && this.portsIn[i].links[0])
            {
                const otherPort = this.portsIn[i].links[0].getOtherPort(this.portsIn[i]);

                if (isWebGpu && otherPort.op.objName.indexOf(defaultOps.prefixes.webgl) == 0)
                {
                    this.setUiError("webglgpu", "mixing webgl/webgpu ops: " + otherPort.op.objName, 1);
                }

                if (this.portsIn[i].type == portType.array)
                {

                    if (
                        otherPort.uiAttribs.stride != undefined &&
                        this.portsIn[i].uiAttribs.stride != undefined &&
                        otherPort.uiAttribs.stride != this.portsIn[i].uiAttribs.stride)
                    {
                        this.setUiError("wrongstride", "Port \"" + this.portsIn[i].name + "\" : Incompatible Array" + otherPort.uiAttribs.stride + " to Array" + this.portsIn[i].uiAttribs.stride, 1);
                    }
                }
            }
        }

        const hadError = this.hasUiError("notworking");

        if (!working)
        {
            // this._log.log("ERRRRR");
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
                const perf = gui.uiProfiler.start("[coreOpExt] checkLinkTimeWarnings");
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
        return (this.portsIn.length > 0 && this.getFirstPortIn().isLinked() && this.portsOut.length > 0 && this.getFirstPortOut().isLinked());
    };

    CABLES.Op.prototype.hasFirstInLinked = function ()
    {
        return (this.portsIn.length > 0 && this.getFirstPortIn().isLinked());
    };

    CABLES.Op.prototype.hasFirstOutLinked = function ()
    {
        return (this.portsOut.length > 0 && this.getFirstPortOut().isLinked());
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
        if (this.storage.blueprintVer === 2) return this.patchId.get();
    };

    CABLES.Op.prototype.isInBlueprint2 = function ()
    {
        if (!this.uiAttribs.subPatch || this.uiAttribs.subPatch == 0) return false;

        const sop = gui.patchView.getSubPatchOuterOp(this.uiAttribs.subPatch);
        if (sop)
        {
            if (sop.isBlueprint2()) return sop.isBlueprint2();

            const bp2 = sop.isInBlueprint2();
            if (bp2) return bp2;
        }

        return false;
    };

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
    };

    CABLES.Op.prototype.getTempPosY = function ()
    {
        if (this.uiAttribs.translateTemp) return this.uiAttribs.translateTemp.y;
        if (this.uiAttribs.translate) return this.uiAttribs.translate.y;
    };

    CABLES.Op.prototype.setPos = function (x, y)
    {
        this.setUiAttribs({ "translate": { "x": x, "y": y } });
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

    // CABLES.Op.prototype.getChildsBoundings = function (glpatch, s, untilOp, count)
    // {
    //     if (count > 100) return s;
    //     s = s || { "maxx": null, "maxy": null, "minx": null, "miny": null };

    //     if (!this.uiAttribs || !this.uiAttribs.translate) return s;

    //     s.maxx = Math.max(s.maxx || -99999999999, this.getTempPosX() + this.getWidth(glpatch));
    //     s.maxy = Math.max(s.maxy || -99999999999, this.getTempPosY() + this.getHeight(glpatch));

    //     s.minx = Math.min(s.minx || 99999999999, this.getTempPosX());
    //     s.miny = Math.min(s.miny || 99999999999, this.getTempPosY());

    //     if (untilOp && this == untilOp) return s;

    //     for (let i = 0; i < this.portsOut.length; i++)
    //     {
    //         for (let j = 0; j < this.portsOut[i].links.length; j++)
    //         {
    //             const p = this.portsOut[i].links[j].getOtherPort(this.portsOut[i]);

    //             s = p.op.getChildsBoundings(glpatch, s, untilOp, (count || 0) + 1);
    //         }
    //     }
    //     return s;
    // };

    CABLES.Op.prototype.testTempCollision = function (ops, glpatch)
    {
        // this._log.log("testTempCollision");
        for (let j = 0; j < ops.length; j++)
        {
            const b = ops[j];
            if (b.deleted || b == this) continue;

            // this._log.log(b.uiAttribs.translateTemp);

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
                // this._log.log("colliding!");
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

    CABLES.Op.prototype.getParentSubPatch = function ()
    {
        if (this.uiAttribs.subPatch === 0) return 0;
        const sop = gui.patchView.getSubPatchOuterOp(this.uiAttribs.subPatch);
        if (sop) return sop.uiAttribs.subPatch;

        return 0;
    };

    CABLES.Op.prototype.countVisiblePorts = function (ports)
    {
        let index = 0;
        for (let i = 0; i < ports.length; i++)
        {
            if (ports[i].uiAttribs.hidePort) continue;
            index++;
        }
        return index;
    };

    CABLES.Op.prototype.getNumVisiblePortsOut = function ()
    {
        return this.countVisiblePorts(this.portsOut);
    };

    CABLES.Op.prototype.getNumVisiblePortsIn = function ()
    {
        return this.countVisiblePorts(this.portsIn);
    };

    CABLES.Op.prototype.posByIndex = function (portIndex, numports, center = false)
    {
        if (portIndex == 0)
        {
            if (center) return gluiconfig.portWidth / 2;
            else return 0;
        }

        if (numports === undefined) this._log.log("posbyindex needs numports param");
        let offCenter = gluiconfig.portWidth * 0.5;
        if (!center)offCenter = 0;

        let p = 0;

        const onePort = (gluiconfig.portWidth + gluiconfig.portPadding);

        if (this.uiAttribs.stretchPorts && this.uiAttribs.resizable)
            p = portIndex * (((this.uiAttribs.width || ((numports - 1) * onePort + gluiconfig.rectResizeSize)) - gluiconfig.rectResizeSize) / (numports - 1));
        else
            p = portIndex * onePort;

        p += (offCenter || 0);
        return p;
    };

    CABLES.Op.prototype.getPortPosX = function (name, opid, center, opwidth)
    {
        let index = 0;

        if (this.isSubPatchOp() == 2 && this.patchId)
        {
            const portsIn = gui.patchView.getSubPatchExposedPorts(this.patchId.get(), CABLES.Port.DIR_IN);

            index = 0;
            for (let i = 0; i < portsIn.length; i++)
            {
                if (portsIn[i].uiAttribs.hidePort) continue;
                if (portsIn[i].name == name)
                    return this.posByIndex(index, this.countVisiblePorts(portsIn), center);// * (gluiconfig.portWidth + gluiconfig.portPadding) + offCenter;
                index++;
            }

            const portsOut = gui.patchView.getSubPatchExposedPorts(this.patchId.get(), CABLES.Port.DIR_OUT);
            index = 0;

            for (let i = 0; i < portsOut.length; i++)
            {
                if (portsOut[i].uiAttribs.hidePort) continue;
                if (portsOut[i].name == name)
                    return this.posByIndex(index, this.countVisiblePorts(portsOut), center);// * (gluiconfig.portWidth + gluiconfig.portPadding) + offCenter;
                index++;
            }
        }

        index = 0;
        for (let i = 0; i < this.portsIn.length; i++)
        {
            if (this.portsIn[i].uiAttribs.hidePort) continue;

            if (this.portsIn[i].name == name)
            {
                // return (this.portsIn[i].uiAttribs["glPortIndex_" + opid] || this.portsIn[i].uiAttribs.glPortIndex || index) * (gluiconfig.portWidth + gluiconfig.portPadding) + offCenter;
                return this.posByIndex(index, this.getNumVisiblePortsIn(), center);
            }
            index++;
        }

        index = 0;
        for (let i = 0; i < this.portsOut.length; i++)
        {
            if (this.portsOut[i].uiAttribs.hidePort) continue;

            if (this.portsOut[i].name == name)
            {
                return this.posByIndex(index, this.getNumVisiblePortsOut(), center);// * (gluiconfig.portWidth + gluiconfig.portPadding) + offCenter;
            }
            index++;
        }

        // this._log.log("could not find port posx ", name, this.getTitle(), opid);

        return 2;
    };

    CABLES.Op.prototype.getFirstPortIn = function ()
    {
        if (this.portsIn.length == 0) return null;
        let portIn = this.portsIn[0];
        if (portIn.ports && portIn.ports.length > 0) portIn = portIn.ports[0];

        return portIn;
    };

    CABLES.Op.prototype.getFirstPortOut = function ()
    {
        if (this.portsOut.length == 0) return null;
        let portOut = this.portsOut[0];
        if (portOut.ports && portOut.ports.length > 0) portOut = portOut.ports[0];

        return portOut;
    };
}
