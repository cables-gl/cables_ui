import ManageOp from "../components/tabs/tab_manage_op.js";
import { notify } from "../elements/notification.js";
import { gui } from "../gui.js";
import { platform } from "../platform.js";

const CABLES_CMD_OP = {};
const CMD_OP_COMMANDS = [];

const opCommands =
{
    "commands": CMD_OP_COMMANDS,
    "functions": CABLES_CMD_OP
};

export default opCommands;

CABLES_CMD_OP.codeNewOp = () =>
{
    gui.serverOps.createDialog();
};

CABLES_CMD_OP.downGradeOp = function ()
{
    const selops = gui.patchView.getSelectedOps();
    for (let i = 0; i < selops.length; i++)
    {
        gui.patchView.downGradeOp(selops[i].id, selops[i].objName);
    }
};



CABLES_CMD_OP.upGradeOps = function ()
{
    const selops = gui.patchView.getSelectedOps();
    for (let i = 0; i < selops.length; i++)
    {
        const opdoc = gui.opDocs.getOpDocById(selops[i].opId);
        if (opdoc && opdoc.oldVersion && opdoc.newestVersion && opdoc.newestVersion.name)
            gui.patchView.replaceOp(selops[i].id, opdoc.newestVersion.name);
    }
};

CABLES_CMD_OP.cloneSelectedOp = function ()
{
    const ops = gui.patchView.getSelectedOps();
    if (ops.length > 0) gui.serverOps.cloneDialog(ops[0].objName, ops[0]);
};

CABLES_CMD_OP.manageCurrentSubpatchOp = function ()
{
    const oldSubPatchId = gui.patchView.getCurrentSubPatch();
    const subOuter = gui.patchView.getSubPatchOuterOp(oldSubPatchId);

    new ManageOp(gui.mainTabs, subOuter.opId);
};

CABLES_CMD_OP.manageOp = function (opid)
{
    if (!opid)
    {
        const ops = gui.patchView.getSelectedOps();
        if (ops.length > 0) opid = ops[0].opId;
    }
    new ManageOp(gui.mainTabs, opid);
};





CABLES_CMD_OP.cloneSelectedOps = (ops) =>
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
        CABLES_CMD_OP.cloneSelectedOps(ops);
    }
    else
    {
        gui.serverOps.clone(op.opId, newOpname, () =>
        {
            gui.serverOps.loadOpDependencies(opname, function ()
            {
                gui.patchView.replaceOp(op.id, newOpname);

                notify("created op " + newOpname, null, { "force": true });

                CABLES_CMD_OP.cloneSelectedOps(ops);
            });
        }, { "openEditor": false });
    }
};

CABLES_CMD_OP.renameOp = (opName = null) =>
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
};

CABLES_CMD_OP.createVersionSelectedOp = function ()
{
    const ops = gui.patchView.getSelectedOps();
    if (ops.length == 0) return;

    const opname = ops[0].objName;
    let newOpname = "";
    if (opname.contains("_v"))
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
};


CABLES_CMD_OP.editOp = function (userInteraction = true)
{
    const selops = gui.patchView.getSelectedOps();

    if (selops && selops.length > 0)
    {
        for (let i = 0; i < selops.length; i++) gui.serverOps.edit(selops[i], false, null, userInteraction);
    }
};



CMD_OP_COMMANDS.push(
    {
        "cmd": "Code a new op",
        "category": "op",
        "icon": "op",
        "func": CABLES_CMD_OP.codeNewOp
    },
    {
        "cmd": "Downgrade selected op",
        "func": CABLES_CMD_OP.downGradeOp,
        "category": "op",
        "icon": "op"
    },
    {
        "cmd": "Upgrade selected ops",
        "func": CABLES_CMD_OP.upGradeOps,
        "category": "op",
        "icon": "op"
    },
    {
        "cmd": "Clone selected op",
        "func": CABLES_CMD_OP.cloneSelectedOp,
        "category": "op",
        "icon": "op"
    },
    {
        "cmd": "Clone selected ops to patch ops",
        "func": CABLES_CMD_OP.cloneSelectedOps,
        "category": "op",
        "icon": "op"
    },
    {
        "cmd": "Create new version of op",
        "func": CABLES_CMD_OP.createVersionSelectedOp,
        "category": "op",
        "icon": "op"
    },
    {
        "cmd": "Manage selected op",
        "func": CABLES_CMD_OP.manageOp,
        "category": "op",
        "icon": "op"
    },
    {
        "cmd": "Edit op",
        "category": "op",
        "func": CABLES_CMD_OP.editOp,
        "icon": "edit"
    },
    {
        "cmd": "Rename op",
        "func": CABLES_CMD_OP.renameOp,
        "category": "op",
        "icon": "op"
    },


);
