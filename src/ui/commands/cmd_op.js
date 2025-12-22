import { Op } from "cables";
import ManageOp from "../components/tabs/tab_manage_op.js";
import { notify } from "../elements/notification.js";
import { gui } from "../gui.js";
import { platform } from "../platform.js";

export { CmdOps };

class CmdOps
{

    /** @type {import("./commands.js").CommandObject[]} */
    static get commands()
    {

        return [{
            "cmd": "Code a new op",
            "category": "op",
            "icon": "op",
            "func": CmdOps.codeNewOp
        },
        {
            "cmd": "Downgrade selected op",
            "func": CmdOps.downGradeOp,
            "category": "op",
            "icon": "op"
        },
        {
            "cmd": "Upgrade selected ops",
            "func": CmdOps.upGradeOps,
            "category": "op",
            "icon": "op"
        },
        {
            "cmd": "Clone selected op",
            "func": CmdOps.cloneSelectedOp,
            "category": "op",
            "icon": "op"
        },
        {
            "cmd": "Clone selected ops to patch ops",
            "func": CmdOps.cloneSelectedOps,
            "category": "op",
            "icon": "op"
        },
        {
            "cmd": "Create new version of op",
            "func": CmdOps.createVersionSelectedOp,
            "category": "op",
            "icon": "op"
        },
        {
            "cmd": "Manage selected op",
            "func": CmdOps.manageOp,
            "category": "op",
            "icon": "op"
        },
        {
            "cmd": "Edit op",
            "category": "op",
            "func": CmdOps.editOp,
            "icon": "edit"
        },
        {
            "cmd": "Rename op",
            "func": CmdOps.renameOp,
            "category": "op",
            "icon": "op"
        },
        {
            "cmd": "Copy op names to clipboard",
            "func": CmdOps.copyNameClipboard,
            "category": "op",
            "icon": "op"
        },
        {
            "cmd": "Reload changed ops",
            "func": CmdOps.reloadChangedOps,
            "category": "op",
            "icon": "op"
        }

        ];
    }

    static codeNewOp()
    {
        gui.serverOps.createDialog();
    }

    static downGradeOp()
    {
        const selops = gui.patchView.getSelectedOps();
        for (let i = 0; i < selops.length; i++)
        {
            gui.patchView.downGradeOp(selops[i].id, selops[i].objName);
        }
    }

    static copyNameClipboard()
    {
        let str = "";
        const selops = gui.patchView.getSelectedOps();

        for (let i = 0; i < selops.length; i++)
            str += selops[i].objName.endl();

        navigator.clipboard.writeText(str);
        notify("copied " + selops.length + " op names to clipboard ", null, { "force": true });

    }

    static upGradeOps()
    {
        const selops = gui.patchView.getSelectedOps();
        for (let i = 0; i < selops.length; i++)
        {
            const opdoc = gui.opDocs.getOpDocById(selops[i].opId);
            if (opdoc && opdoc.oldVersion && opdoc.newestVersion && opdoc.newestVersion.name)
                gui.patchView.replaceOp(selops[i].id, opdoc.newestVersion.name);
        }
    }

    static reloadChangedOps()
    {
        for (let i in gui.serverOps.opIdsChangedOnServer)
        {
            gui.serverOps.execute(i, () =>
            {
                delete gui.serverOps.opIdsChangedOnServer[i];
                gui.opParams.refresh();
            });
        }
        gui.restriction.hide();

    }

    static cloneSelectedOp()
    {
        const ops = gui.patchView.getSelectedOps();
        if (ops.length > 0) gui.serverOps.cloneDialog(ops[0].objName, ops[0]);
    }

    static manageCurrentSubpatchOp()
    {
        const oldSubPatchId = gui.patchView.getCurrentSubPatch();
        const subOuter = gui.patchView.getSubPatchOuterOp(oldSubPatchId);

        new ManageOp(gui.mainTabs, subOuter.opId);
    }

    /**
     * @param {string} [opid]
     */
    static manageOp(opid)
    {
        if (!opid)
        {
            const ops = gui.patchView.getSelectedOps();
            if (ops.length > 0) opid = ops[0].opId;
        }
        new ManageOp(gui.mainTabs, opid);
    }

    /**
     * @param {Op[]} ops
     */
    static cloneSelectedOps(ops)
    {
        if (!ops)
        {
            ops = gui.patchView.getSelectedOps();

            for (let i = 0; i < ops.length; i++)
            {
                const op = ops[i];
                const opname = op.objName;
                let sanitizedOpName = opname.replaceAll(".", "_");

                let newOpname = platform.getPatchOpsNamespace() + sanitizedOpName;
                newOpname = newOpname.replaceAll(".Ops_", ".");

                const newOpnameNoVer = newOpname.replaceAll("_v", "V");

                let count = 0;
                newOpname = newOpnameNoVer;
                while (gui.opDocs.getOpDocByName(newOpname))
                {
                    newOpname = newOpnameNoVer + count;
                    count++;
                }
                op.renameopto = newOpname;

                console.log("new renameto name:", newOpname);
            }

            if (ops.length == 0) return;
        }

        // loadingModal = loadingModal || gui.startModalLoading("Cloning ops...");

        if (ops.length == 0)
        {
            gui.endModalLoading();
            return;
        }
        const op = ops.pop();
        const opname = op.objName;
        const newOpname = op.renameopto;

        if (gui.opDocs.getOpDocByName(newOpname))
        {
        // that opname was already renamed in list
            gui.patchView.replaceOp(op.id, newOpname);
            CmdOps.cloneSelectedOps(ops);
        }
        else
        {
            gui.serverOps.clone(op.opId, newOpname, () =>
            {
                gui.serverOps.loadOpDependencies(opname, function ()
                {
                    gui.patchView.replaceOp(op.id, newOpname);

                    notify("created op " + newOpname, null, { "force": true });

                    CmdOps.cloneSelectedOps(ops);
                });
            }, { "openEditor": false });
        }
    }

    static renameOp(opName = null)
    {
        if (!opName)
        {
            const ops = gui.patchView.getSelectedOps();
            if (!ops.length) return;
            const op = gui.patchView.getSelectedOps()[0];
            opName = op.objName;
        }

        if (platform.frontendOptions.opRenameInEditor)
        {
            gui.serverOps.renameDialog(opName);
        }
        else
        {
            gui.serverOps.renameDialogIframe(opName);
        }
    }

    static createVersionSelectedOp()
    {
        const ops = gui.patchView.getSelectedOps();
        if (ops.length == 0) return;

        const opname = ops[0].objName;
        let newOpname = "";
        if (opname.includes("_v"))
        {
            const parts = opname.split("_v");
            newOpname = parts[0] + "_v" + (parseFloat(parts[1]) + 1);
        }
        else newOpname = opname + "_v2";

        gui.serverOps.clone(ops[0].opId, newOpname, () =>
        {
            gui.serverOps.loadOpDependencies(opname, function ()
            {
                gui.patchView.replaceOp(ops[0].id, newOpname);

                notify("created op " + newOpname, null, { "force": true });
            });
        });
    }

    static editOp(userInteraction = true)
    {
        const selops = gui.patchView.getSelectedOps();

        if (selops && selops.length > 0)
        {
            for (let i = 0; i < selops.length; i++) gui.serverOps.edit(selops[i], false, null, userInteraction);
        }
    }

}
