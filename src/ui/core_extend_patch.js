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
        // console.log("clear subpatch cache...", patchId);

        this._subpatchOpCache = this._subpatchOpCache || {};
        delete this._subpatchOpCache[patchId];
    };

    CABLES.Patch.prototype._subPatchCacheAdd = function (subPatchId, op)
    {
        if (this._subpatchOpCache[subPatchId])
            this._subpatchOpCache[subPatchId].ops[op.id] = op;
    };


    CABLES.Patch.prototype.getSubPatchOps = function (subPatchId, recursive = false)
    {
        this._subpatchOpCache = this._subpatchOpCache || {};

        // console.log(subPatchId);
        let opids = [];

        if (this._subpatchOpCache[subPatchId] && this._subpatchOpCache[subPatchId].ops)
        {
            opids = this._subpatchOpCache[subPatchId].ops;
        }
        else
        {
            this._subpatchOpCache[subPatchId] = { "ops": {}, "subPatchOpId": null };
            for (const i in this.ops)
            {
                const op = this.ops[i];
                if (op.uiAttribs && op.uiAttribs.subPatch == subPatchId)
                {
                    this._subpatchOpCache[subPatchId].ops[op.id] = op;
                }

                // if (op.isSubPatchOp()) console.log("issub", op.isSubPatchOp(), op.patchId.get(), subPatchId);

                if (op.isSubPatchOp() && op.patchId.get() == subPatchId)
                {
                    this._subpatchOpCache[subPatchId].subPatchOpId = op.id;
                    // console.log("subpatchiopid", op.patchId.get());
                }
            }
            this._subpatchOpCache[subPatchId].ops = opids;
        }
        opids = Object.keys(this._subpatchOpCache[subPatchId].ops);
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


    CABLES.Patch.prototype.getSubPatchOuterOp = function (subPatchId)
    {
        if (subPatchId == 0) return null;

        if (!this._subpatchOpCache[subPatchId] || !this._subpatchOpCache[subPatchId].subPatchOpId)
        {
            this.clearSubPatchCache(subPatchId);
            this.getSubPatchOps(subPatchId); // try build cache
            // console.error("unknown subpatchid cache ?!", subPatchId);
            return;
        }

        // console.log(this._subpatchOpCache);
        // console.log("subpatchopdi", this._subpatchOpCache[subPatchId].subPatchOpId);
        return this.getOpById(this._subpatchOpCache[subPatchId].subPatchOpId);

        //     const ops = this.ops;
        //     for (let i = 0; i < ops.length; i++)
        //     {
        //         const op = ops[i];
        //         if (op.isSubPatchOp() && op.patchId.get() == subPatchId) return op;
        //     }
    };
}
