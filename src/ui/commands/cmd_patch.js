
const CABLES_CMD_PATCH = {};
const CMD_PATCH_COMMANDS = [];

const patchCommands =
{
    "commands": CMD_PATCH_COMMANDS,
    "functions": CABLES_CMD_PATCH
};

export default patchCommands;

CABLES_CMD_PATCH.selectAllOps = function ()
{
    gui.patchView.selectAllOpsSubPatch(gui.patchView.getCurrentSubPatch());
};

CABLES_CMD_PATCH.deleteSelectedOps = function ()
{
    gui.patchView.deleteSelectedOps();
};

CABLES_CMD_PATCH.reload = function ()
{
    CABLESUILOADER.talkerAPI.send("reload");
};

CABLES_CMD_PATCH.save = function (force)
{
    let dosave = true;

    if (!force)
    {
        if (gui.user.isStaff || gui.user.isAdmin)
        {
            if (gui.project().users.indexOf(gui.user.id) == -1)
            {
                dosave = false;

                CABLES.UI.MODAL.showError("Not Collaborator", "You are not a collaborator of this patch<br/>Be sure the owner knows that you make changes to this patch...<br/><br/>");
                CABLES.UI.MODAL.contentElement.innerHTML += "<a class=\"button\" onclick=\"CABLES.UI.MODAL.hide(true);CABLES.sandbox.addMeUserlist(null,()=>{CABLES.CMD.PATCH.save(true);});\">Add me as collaborator and save</a>&nbsp;&nbsp;";
                CABLES.UI.MODAL.contentElement.innerHTML += "<a class=\"button\" onclick=\"CABLES.UI.MODAL.hide(true);CABLES.CMD.PATCH.save(true);\">Save anyway</a>&nbsp;&nbsp;";
                CABLES.UI.MODAL.contentElement.innerHTML += "<a class=\"button\" onclick=\"CABLES.UI.MODAL.hide(true);\">Close</a>&nbsp;&nbsp;";
            }
        }
    }

    if (dosave)
    {
        if (force || !CABLES.UI.lastSave || Date.now() - CABLES.UI.lastSave > 1000)
        {
            gui.patchView.store.saveCurrentProject(undefined, undefined, undefined, force);
            CABLES.UI.lastSave = Date.now();
        }
    }
};

CABLES_CMD_PATCH.saveAs = function ()
{
    gui.patchView.store.saveAs();
};

CABLES_CMD_PATCH.createBackup = function ()
{
    CABLES.sandbox.createBackup();
};

CABLES_CMD_PATCH.clear = function ()
{
    gui.corePatch().clear();
};


CABLES_CMD_PATCH.createSubPatchFromSelection = function ()
{
    gui.patchView.createSubPatchFromSelection();
};

CABLES_CMD_PATCH.findCommentedOps = function ()
{
    gui.find(":commented");
};

CABLES_CMD_PATCH.findUnconnectedOps = function ()
{
    gui.find(":unconnected");
};

CABLES_CMD_PATCH.findUserOps = function ()
{
    gui.find(":user");
};


CABLES_CMD_PATCH.createFile = function ()
{
    gui.showFileManager(function ()
    {
        gui.fileManager.createFile();
    });
};

CABLES_CMD_PATCH.uploadFile = function ()
{
    if (!window.gui) return;
    const fileElem = document.getElementById("hiddenfileElem");
    if (fileElem) fileElem.click();
};

CABLES_CMD_PATCH.uploadFileDialog = function ()
{
    if (!window.gui) return;
    const fileElem = document.getElementById("uploaddialog");

    if (!fileElem)
    {
        const html = CABLES.UI.getHandleBarHtml("upload", { "patchId": gui.project()._id });
        CABLES.UI.MODAL.show(html, { "title": "" });
    }
};


CABLES_CMD_PATCH.showBackups = () =>
{
    gui.mainTabs.addIframeTab(
        "Patch Backups",
        CABLES.sandbox.getCablesUrl() + "/patch/" + gui.project()._id + "/settingsiframe#t=versions",
        {
            "icon": "settings",
            "closable": true,
            "singleton": true,
            "gotoUrl": CABLES.sandbox.getCablesUrl() + "/patch/" + gui.project()._id + "/settings#t=versions"
        });
};

CABLES_CMD_PATCH.export = function ()
{
    const exporter = new CABLES.UI.Exporter(gui.project(), CABLES.sandbox.getPatchVersion());
    exporter.show();
};

CABLES_CMD_PATCH.newPatch = function ()
{
    gui.createProject();
};

CABLES_CMD_PATCH.addOp = function (x, y)
{
    gui.opSelect().show({ "x": 0, "y": 0 });
};

CABLES_CMD_PATCH.patchWebsite = function ()
{
    // CABLES.sandbox.getCablesUrl() + "/p/" + p.shortId || p._id
    window.open(CABLES.sandbox.getCablesUrl() + "/p/" + gui.project().shortId || gui.project()._id);
};

// CABLES_CMD_PATCH.analyzePatch = function ()
// {
//     CABLES.UI.analyzePatch();
// };

CABLES_CMD_PATCH.renameVariable = function (oldname)
{
    CABLES.UI.MODAL.prompt("Rename Variable", "enter a new name for the variable " + oldname, oldname,
        function (newname)
        {
            gui.corePatch().emitEvent("variableRename", oldname, newname);
            gui.corePatch().deleteVar(oldname);
        });
};

CABLES_CMD_PATCH.createVariable = function (op)
{
    CABLES.UI.MODAL.prompt("New Variable", "enter a name for the new variable", "",
        function (str)
        {
            if (op)
            {
                op.setTitle(str);
                op.varName.set(str);
                gui.opParams.show(op);
            }
        });
};

CABLES_CMD_PATCH.createVarNumber = function (next)
{
    CABLES.UI.MODAL.prompt("New Variable", "enter a name for the new variable", "myNewVar",
        function (str)
        {
            const opSetter = gui.patchView.addOp(CABLES.UI.DEFAULTOPNAMES.VarSetNumber);
            const opGetter = gui.patchView.addOp(CABLES.UI.DEFAULTOPNAMES.VarGetNumber);

            opSetter.varName.set(str);
            opGetter.varName.set(str);
        });
};

CABLES_CMD_PATCH.stats = function (force)
{
    let report = "";
    const patch = gui.corePatch();

    report += "<h3>Ops</h3>";

    const opsCount = {};
    for (let i = 0; i < patch.ops.length; i++)
    {
        opsCount[patch.ops[i].objName] = opsCount[patch.ops[i].objName] || 0;
        opsCount[patch.ops[i].objName]++;
    }

    report += patch.ops.length + " Ops total<br/>";
    report += Object.keys(opsCount).length + " unique ops<br/>";
    report += "<br/>";

    for (const i in opsCount) report += opsCount[i] + "x " + i + " <br/>";

    // ---
    report += "<hr/>";

    report += "<h3>Subpatches</h3>";

    const subpatchNumOps = {};
    for (let i = 0; i < patch.ops.length; i++)
    {
        const key = patch.ops[i].uiAttribs.subPatch || "root";

        subpatchNumOps[key] = subpatchNumOps[key] || 0;
        subpatchNumOps[key]++;
    }

    for (const i in subpatchNumOps) report += subpatchNumOps[i] + " ops in " + i + " <br/>";


    CABLES.UI.MODAL.show(report, { "title": "stats" });
};


CABLES_CMD_PATCH._createVariable = function (name, p, p2, value, next)
{
    let portName = "Value";
    let opSetterName;
    let opGetterName;

    if (p.type == CABLES.OP_PORT_TYPE_VALUE)
    {
        opSetterName = CABLES.UI.DEFAULTOPNAMES.VarSetNumber;
        opGetterName = CABLES.UI.DEFAULTOPNAMES.VarGetNumber;
    }
    else if (p.type == CABLES.OP_PORT_TYPE_OBJECT)
    {
        portName = "Object";
        opSetterName = CABLES.UI.DEFAULTOPNAMES.VarSetObject;
        opGetterName = CABLES.UI.DEFAULTOPNAMES.VarGetObject;
    }
    else if (p.type == CABLES.OP_PORT_TYPE_ARRAY)
    {
        portName = "Array";
        opSetterName = CABLES.UI.DEFAULTOPNAMES.VarSetArray;
        opGetterName = CABLES.UI.DEFAULTOPNAMES.VarGetArray;
    }
    else if (p.type == CABLES.OP_PORT_TYPE_STRING)
    {
        opSetterName = CABLES.UI.DEFAULTOPNAMES.VarSetString;
        opGetterName = CABLES.UI.DEFAULTOPNAMES.VarGetString;
    }

    gui.patchView.addOp(opSetterName, { "onOpAdd": (opSetter) =>
    {
        gui.patchView.addOp(opGetterName, { "onOpAdd": (opGetter) =>
        {
            opSetter.uiAttr({ "subPatch": gui.patchView.getCurrentSubPatch() });
            opGetter.uiAttr({ "subPatch": gui.patchView.getCurrentSubPatch() });

            opSetter.getPort(portName).set(value);

            if (p.direction == CABLES.PORT_DIR_IN)
            {
                p.parent.patch.link(opGetter, portName, p.parent, p.name);

                if (p2)
                {
                    p2.parent.patch.link(opSetter, portName, p2.parent, p2.name);
                }
            }
            else
            {
                p.parent.patch.link(opSetter, portName, p.parent, p.name);

                if (p2)
                {
                    p2.parent.patch.link(opGetter, portName, p2.parent, p2.name);
                }
            }

            opSetter.varName.set(name);
            opGetter.varName.set(name);

            if (next)next(opSetter, opGetter);
        } });
    } });
};


CABLES_CMD_PATCH.replaceLinkVariableExist = function ()
{
    const link = CABLES.UI.OPSELECT.linkNewLink;
    const p = link.p1.thePort;
    const p2 = link.p2.thePort;
    CABLES.UI.OPSELECT.linkNewLink = null;

    const opGetter = gui.patchView.addOp("Ops.Vars.VarGetNumber");

    link.remove();
    p.removeLinks();

    const portName = "Value";

    let otherPort = p2;
    if (p.direction == CABLES.PORT_DIR_IN)
    {
        p.parent.patch.link(opGetter, portName, p.parent, p.name);
    }
    else
    {
        otherPort = p;
        p.parent.patch.link(opGetter, portName, p2.parent, p2.name);
    }

    if (otherPort.parent.objName.indexOf("Ops.Vars.VarGet") == 0)
    {
        opGetter.varName.set(otherPort.parent.varName.get());
    }

    CABLES.UI.MODAL.hide(true);
};

CABLES_CMD_PATCH.replaceLinkVariable = function ()
{
    CABLES.UI.MODAL.prompt("New Variable", "enter a name for the new variable", "",
        function (str)
        {
            const link = CABLES.UI.OPSELECT.linkNewLink;

            const p1 = link.portIn;
            const p2 = link.portOut;
            CABLES.UI.OPSELECT.linkNewLink = null;

            if (p1.direction == CABLES.PORT_DIR_IN)p1.removeLinks();
            else p2.removeLinks();

            link.remove();

            CABLES_CMD_PATCH._createVariable(str, p2, p1, p2.get(), (setter, getter) =>
            {
                getter.uiAttr({ "translate": {
                    "x": p1.parent.uiAttribs.translate.x,
                    "y": p1.parent.uiAttribs.translate.y - 40
                } });

                setter.uiAttr({ "translate": {
                    "x": p2.parent.uiAttribs.translate.x,
                    "y": p2.parent.uiAttribs.translate.y + 40
                } });
            });
        });
};

CABLES_CMD_PATCH.createAutoVariable = function ()
{
    const p = CABLES.UI.OPSELECT.linkNewOpToPort;

    CABLES.UI.MODAL.prompt("New Variable", "enter a name for the new variable", p.name,
        function (str)
        {
            CABLES_CMD_PATCH._createVariable(str, p, null, p.get(), (setter, getter) =>
            {
                if (!setter.uiAttribs.translate)
                    setter.uiAttr({ "translate": {
                        "x": p.parent.uiAttribs.translate.x,
                        "y": p.parent.uiAttribs.translate.y + 40
                    } });

                getter.uiAttr({ "translate": {

                    "x": setter.uiAttribs.translate.x,
                    "y": setter.uiAttribs.translate.y + 40
                } });
            });
        });
};

CABLES_CMD_PATCH.editOp = function ()
{
    const selops = gui.patchView.getSelectedOps();

    if (selops && selops.length > 0)
    {
        for (let i = 0; i < selops.length; i++)
        {
            gui.serverOps.edit(selops[i].objName, false, function ()
            {
                gui.maintabPanel.show();
            });
        }
    }
    else
    {
        console.log("no ops selected");
    }
};


CABLES_CMD_PATCH.setOpTitle = function ()
{
    const ops = gui.patchView.getSelectedOps();
    if (ops.length != 1)
    {
        console.log("rename canceled - select one op!");
        return;
    }

    CABLES.UI.MODAL.prompt(
        "Set Title",
        "Enter a title for this op",
        ops[0].name,
        function (name)
        {
            gui.opParams.setCurrentOpTitle(name);
        });
};


CABLES_CMD_PATCH.resume = function ()
{
    gui.corePatch.resume();
};

CABLES_CMD_PATCH.pause = function ()
{
    gui.corePatch.pause();
};

CABLES_CMD_PATCH.replaceFilePath = function ()
{
    CABLES.UI.MODAL.prompt(
        "Replace String Values",
        "Search for...",
        "/assets/",
        function (srch)
        {
            CABLES.UI.MODAL.prompt(
                "Replace String Values",
                "...replace with",
                "/assets/" + gui.project()._id,
                function (rplc)
                {
                    const ops = gui.corePatch().ops;
                    for (let i = 0; i < ops.length; i++)
                    {
                        for (let j = 0; j < ops[i].portsIn.length; j++)
                        {
                            if (ops[i].portsIn[j].uiAttribs && ops[i].portsIn[j].uiAttribs.display && ops[i].portsIn[j].uiAttribs.display == "file")
                            {
                                console.log("filename:", ops[i].portsIn[j].get());
                                // console.log("srch", srch);
                                // console.log("rplc", rplc);
                                let v = ops[i].portsIn[j].get();

                                if (v) console.log("srch index", v.indexOf(srch));
                                if (v && v.indexOf(srch) == 0)
                                {
                                    console.log("found str!");
                                    v = rplc + v.substring(srch.length);
                                    ops[i].portsIn[j].set(v);
                                    console.log("result filename:", v);
                                }
                            }
                        }
                    }
                });
        });
};


CMD_PATCH_COMMANDS.push(
    {
        "cmd": "select all ops",
        "category": "patch",
        "func": CABLES_CMD_PATCH.selectAllOps,
        "hotkey": "CMD + a"
    },
    {
        "cmd": "delete selected ops",
        "category": "patch",
        "func": CABLES_CMD_PATCH.deleteSelectedOps,
        "icon": "trash",
        "hotkey": "DEL"
    },
    {
        "cmd": "rename op",
        "category": "op",
        "func": CABLES_CMD_PATCH.renameOp,
        "icon": "edit"
    },
    {
        "cmd": "reload patch",
        "category": "patch",
        "func": CABLES_CMD_PATCH.reload
    },
    {
        "cmd": "save patch",
        "category": "patch",
        "func": CABLES_CMD_PATCH.save,
        "icon": "save",
        "hotkey": "CTRL/CMD + s",
        "infotext": "cmd_savepatch"

    },
    {
        "cmd": "save patch as...",
        "category": "patch",
        "func": CABLES_CMD_PATCH.saveAs,
        "icon": "save",
        "hotkey": "CTRL/CMD + SHIFT + s",
    },
    {
        "cmd": "upload file dialog",
        "category": "patch",
        "func": CABLES_CMD_PATCH.uploadFileDialog,
        "icon": "file"
    },
    {
        "cmd": "upload file",
        "category": "patch",
        "func": CABLES_CMD_PATCH.uploadFile,
        "icon": "file"
    },
    {
        "cmd": "create new file",
        "category": "patch",
        "func": CABLES_CMD_PATCH.createFile,
        "icon": "file"
    },
    {
        "cmd": "select child ops",
        "category": "op",
        "func": CABLES_CMD_PATCH.selectChilds
    },
    {
        "cmd": "create subpatch",
        "category": "patch",
        "func": CABLES_CMD_PATCH.createSubPatchFromSelection,
        "icon": "subpatch"
    },
    {
        "cmd": "export static html",
        "category": "patch",
        "func": CABLES_CMD_PATCH.export,
        "icon": "download"
    },
    {
        "cmd": "show backups",
        "category": "patch",
        "func": CABLES_CMD_PATCH.showBackups,
        "icon": "file"
    },
    {
        "cmd": "create new patch",
        "category": "patch",
        "func": CABLES_CMD_PATCH.newPatch,
        "icon": "file"
    },
    {
        "cmd": "add op",
        "category": "patch",
        "func": CABLES_CMD_PATCH.addOp,
        "icon": "op",
        "infotext": "cmd_addop"
    },
    {
        "cmd": "edit op",
        "category": "op",
        "func": CABLES_CMD_PATCH.editOp,
        "icon": "edit"
    },
    {
        "cmd": "set title",
        "category": "op",
        "func": CABLES_CMD_PATCH.setOpTitle,
        "icon": "edit"
    },
    {
        "cmd": "clear patch",
        "category": "patch",
        "func": CABLES_CMD_PATCH.clear
    },
    {
        "cmd": "open patch website",
        "category": "patch",
        "func": CABLES_CMD_PATCH.patchWebsite,
        "icon": "link"
    },
    {
        "cmd": "pause patch execution",
        "category": "patch",
        "func": CABLES_CMD_PATCH.pause
    },
    {
        "cmd": "resume patch execution",
        "category": "patch",
        "func": CABLES_CMD_PATCH.resume
    },
    {
        "cmd": "replace file path",
        "category": "patch",
        "func": CABLES_CMD_PATCH.replaceFilePath
    },
    {
        "cmd": "find unconnected ops",
        "category": "patch",
        "func": CABLES_CMD_PATCH.findUnconnectedOps
    },
    {
        "cmd": "find user ops",
        "category": "patch",
        "func": CABLES_CMD_PATCH.findUserOps
    },
    {
        "cmd": "find commented ops",
        "category": "patch",
        "func": CABLES_CMD_PATCH.findCommentedOps
    },
    {
        "cmd": "patch statistics",
        "category": "patch",
        "func": CABLES_CMD_PATCH.stats
    },
    // {
    //     "cmd": "analyze patch",
    //     "category": "patch",
    //     "func": CABLES_CMD_PATCH.analyzePatch
    // },
    {
        "cmd": "create number variable",
        "category": "patch",
        "func": CABLES_CMD_PATCH.createVarNumber
    },
    {
        "cmd": "create backup",
        "category": "patch",
        "func": CABLES_CMD_PATCH.createBackup
    }


);
