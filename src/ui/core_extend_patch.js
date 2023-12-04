/**
 * extending core classes for helper functions which will be only available in ui/editor mode
 */



export default function extendCorePatch()
{
    CABLES.Patch.prototype._opIdsToOps = function (opids)
    {
        let ops = [];
        for (let i = 0; i < opids.length; i++)
        {
            ops.push(this.getOpById(opids[i]));
        }
        return ops;
    };

    CABLES.Patch.prototype.clearSubPatchCache = function (patchId)
    {
        this._subpatchOpCache = this._subpatchOpCache || {};
        delete this._subpatchOpCache[patchId];
    };


    CABLES.Patch.prototype.getSubPatchOps = function (patchId, recursive = false)
    {
        this._subpatchOpCache = this._subpatchOpCache || {};

        // console.log(patchId);
        let opids = [];

        if (this._subpatchOpCache[patchId] && this._subpatchOpCache[patchId].ops)
        {
            opids = this._subpatchOpCache[patchId].ops;
        }
        else
        {
            this._subpatchOpCache[patchId] = { "ops": {} };
            for (const i in this.ops)
            {
                if (this.ops[i].uiAttribs && this.ops[i].uiAttribs.subPatch == patchId)
                {
                    this._subpatchOpCache[patchId].ops[this.ops[i].id] = this.ops[i];
                    // opids.push(this.ops[i].id);
                }
            }
            // console.log(this.ops);
            this._subpatchOpCache[patchId].ops = opids;
        }
        opids = Object.keys(this._subpatchOpCache[patchId].ops);
        // console.log("opids", opids);
        let ops = this._opIdsToOps(opids);

        if (recursive)
        {
            for (const i in ops)
            {
                if (ops[i].storage && ops[i].storage.subPatchVer)
                {
                    const subPatchPort = ops[i].portsIn.find((port) => { return port.name === "patchId"; });
                    if (subPatchPort)
                    {
                        ops = ops.concat(this.getSubPatchOps(subPatchPort.value, true));
                    }
                }
            }
        }

        return ops;
    };
}
