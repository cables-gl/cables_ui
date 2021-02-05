CABLES = CABLES || {};
CABLES.CMD = CABLES.CMD || {};
CABLES.CMD.PATCH = {};
CABLES.CMD.TIMELINE = {};
CABLES.CMD.commands = CABLES.CMD.commands || [];

CABLES.CMD.PATCH.selectAllOps = function ()
{
    gui.patch().selectAllOps();
};

CABLES.CMD.PATCH.deleteSelectedOps = function ()
{
    // gui.patch().deleteSelectedOps();
    gui.patchView.deleteSelectedOps();
};

CABLES.CMD.PATCH.reload = function ()
{
    CABLESUILOADER.talkerAPI.send("reload");
};

CABLES.CMD.PATCH.save = function (force)
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
            gui.patch().saveCurrentProject(undefined, undefined, undefined, force);
            CABLES.UI.lastSave = Date.now();
        }
    }
};

CABLES.CMD.PATCH.saveAs = function ()
{
    gui.patch().saveCurrentProjectAs();
};

CABLES.CMD.PATCH.createBackup = function ()
{
    CABLES.sandbox.createBackup();
};

CABLES.CMD.PATCH.clear = function ()
{
    gui.corePatch().clear();
};

CABLES.CMD.PATCH.selectChilds = function ()
{
    gui.patch().selectChilds();
};

CABLES.CMD.PATCH.createSubPatchFromSelection = function ()
{
    gui.patchView.createSubPatchFromSelection();
};

CABLES.CMD.PATCH.findCommentedOps = function ()
{
    gui.find(":commented");
};

CABLES.CMD.PATCH.findUnconnectedOps = function ()
{
    gui.find(":unconnected");
};

CABLES.CMD.PATCH.findUserOps = function ()
{
    gui.find(":user");
};


CABLES.CMD.PATCH.createFile = function ()
{
    gui.showFileManager(function ()
    {
        gui.fileManager.createFile();
    });
};

CABLES.CMD.PATCH.uploadFile = function ()
{
    if (!window.gui) return;
    const fileElem = document.getElementById("hiddenfileElem");
    if (fileElem) fileElem.click();
};

CABLES.CMD.PATCH.uploadFileDialog = function ()
{
    if (!window.gui) return;
    const fileElem = document.getElementById("uploaddialog");
    jQuery.event.props.push("dataTransfer");

    if (!fileElem)
    {
        const html = CABLES.UI.getHandleBarHtml("upload", { "patchId": gui.patch().getCurrentProject()._id });
        CABLES.UI.MODAL.show(html, { "title": "" });
    }
};


CABLES.CMD.PATCH.opsAlignHorizontal = function ()
{
    gui.patch().alignSelectedOps();
};

CABLES.CMD.PATCH.opsCompress = function ()
{
    gui.patch().compressSelectedOps();
};

CABLES.CMD.PATCH.export = function ()
{
    const exporter = new CABLES.UI.Exporter();
    exporter.show();
};

CABLES.CMD.PATCH.newPatch = function ()
{
    gui.createProject();
};

CABLES.CMD.PATCH.addOp = function (x, y)
{
    gui.opSelect().show({ "x": 0, "y": 0 });
};

CABLES.CMD.PATCH.patchWebsite = function ()
{
    window.open("/p/" + gui.patch().getCurrentProject()._id);
};

CABLES.CMD.PATCH.analyzePatch = function ()
{
    CABLES.UI.AnalyzePatch();
};

CABLES.CMD.PATCH.renameVariable = function (oldname)
{
    CABLES.UI.MODAL.prompt("Rename Variable", "enter a new name for the variable " + oldname, oldname,
        function (newname)
        {
            gui.corePatch().emitEvent("variableRename", oldname, newname);
            gui.corePatch().deleteVar(oldname);
        });
};

CABLES.CMD.PATCH.createVariable = function (op)
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

CABLES.CMD.PATCH.createVarNumber = function (next)
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

CABLES.CMD.PATCH.stats = function (force)
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


CABLES.CMD.PATCH._createVariable = function (name, p, p2, value, next)
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

            console.log(p, p.type, CABLES.OP_PORT_TYPE_VALUE, opGetter, opSetter);
            opSetter.getPort(portName).set(value);

            if (p.direction == CABLES.PORT_DIR_IN)
            {
                p.parent.patch.link(opGetter, portName, p.parent, p.name);

                if (p2)
                {
                    p2.parent.patch.link(opSetter, portName, p2.parent, p2.name);
                    console.log(p2);
                }
            }
            else
            {
                p.parent.patch.link(opSetter, portName, p.parent, p.name);

                if (p2)
                {
                    p2.parent.patch.link(opGetter, portName, p2.parent, p2.name);
                    console.log(p2);
                }
            }

            opSetter.varName.set(name);
            opGetter.varName.set(name);

            if (next)next(opSetter, opGetter);
        } });
    } });
};


CABLES.CMD.PATCH.replaceLinkVariableExist = function ()
{
    const link = CABLES.UI.OPSELECT.linkNewLink;
    console.log(link);
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
        console.log("otherPort.parent.varName.get()", otherPort.parent.varName.get());
        opGetter.varName.set(otherPort.parent.varName.get());
    }

    CABLES.UI.MODAL.hide(true);
};

CABLES.CMD.PATCH.replaceLinkVariable = function ()
{
    CABLES.UI.MODAL.prompt("New Variable", "enter a name for the new variable", "",
        function (str)
        {
            const link = CABLES.UI.OPSELECT.linkNewLink;

            const p1 = link.p1.thePort;
            const p2 = link.p2.thePort;
            CABLES.UI.OPSELECT.linkNewLink = null;

            if (p1.direction == CABLES.PORT_DIR_IN)p1.removeLinks();
            else p2.removeLinks();

            link.remove();

            CABLES.CMD.PATCH._createVariable(str, p2, p1, p2.get(), (setter, getter) =>
            {
                let uiop = gui.patch().getUiOp(getter);
                uiop.setPos(p1.parent.uiAttribs.translate.x, p1.parent.uiAttribs.translate.y - 40);

                uiop = gui.patch().getUiOp(setter);
                uiop.setPos(p2.parent.uiAttribs.translate.x, p2.parent.uiAttribs.translate.y + 40);
            });
        });
};

CABLES.CMD.PATCH.createAutoVariable = function ()
{
    const p = CABLES.UI.OPSELECT.linkNewOpToPort;

    CABLES.UI.MODAL.prompt("New Variable", "enter a name for the new variable", p.name,
        function (str)
        {
            CABLES.CMD.PATCH._createVariable(str, p, null, p.get(), (setter, getter) =>
            {
                getter.uiAttr({ "translate": {

                    "x": setter.uiAttribs.translate.x,
                    "y": setter.uiAttribs.translate.y + 40
                } });
                // const uiop = gui.patch().getUiOp(getter);
                // uiop.setPos(setter.uiAttribs.translate.x, setter.uiAttribs.translate.y + 40);
            });
        });
};

CABLES.CMD.PATCH.editOp = function ()
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


CABLES.CMD.PATCH.setOpTitle = function ()
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


CABLES.CMD.PATCH.tidyChildOps = function ()
{
    const selops = gui.patch().getSelectedOps();
    const opWidth = 150;
    const opHeight = 40;

    function getChildColumns(op, depth)
    {
        depth = depth || 0;
        const childs = op.getOutChilds();
        for (let i = 0; i < childs.length; i++)
        {
            depth = getChildColumns(childs[i], depth);
            if (i > 0)depth++;
        }

        return depth;
    }


    function tidyChilds(op, parentX, parentY)
    {
        const childs = op.getOutChilds();
        let addY = 0;
        if (childs.length > 1) addY = opHeight * 0.5;

        let i = 0;
        let childWidth = 0;
        for (i = 0; i < childs.length; i++)
        {
            if (i > 0)childWidth += getChildColumns(childs[i - 1]) * opWidth;

            childs[i].uiAttr({
                "translate": {
                    "x": parentX + childWidth + (i * opWidth),
                    "y": parentY + opHeight + addY
                }
            });
        }

        for (i = 0; i < childs.length; i++)
        {
            tidyChilds(childs[i], childs[i].uiAttribs.translate.x, childs[i].uiAttribs.translate.y);
        }
    }

    if (selops && selops.length > 0)
    {
        console.log("tidy!");

        for (let i = 0; i < selops.length; i++)
        {
            const op = selops[i].op;
            const y = op.uiAttribs.translate.y;
            const x = op.uiAttribs.translate.x;

            tidyChilds(op, x, y);
        }
    }

    for (let i = 0; i < gui.patch().ops.length; i++)
    {
        gui.patch().ops[i].setPosFromUiAttr();
    }
    gui.patch().updateSubPatches();
};

CABLES.CMD.TIMELINE.setLength = function ()
{
    gui.timeLine().setProjectLength();
};

CABLES.CMD.PATCH.resume = function ()
{
    gui.patchView.resume();
};

CABLES.CMD.PATCH.pause = function ()
{
    gui.patchView.pause();
};

CABLES.CMD.PATCH.replaceFilePath = function ()
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
                    const ops = gui.patch().ops;
                    for (let i = 0; i < ops.length; i++)
                    {
                        for (let j = 0; j < ops[i].portsIn.length; j++)
                        {
                            if (ops[i].portsIn[j].thePort.uiAttribs && ops[i].portsIn[j].thePort.uiAttribs.display && ops[i].portsIn[j].thePort.uiAttribs.display == "file")
                            {
                                console.log("filename:", ops[i].portsIn[j].thePort.get());
                                // console.log("srch", srch);
                                // console.log("rplc", rplc);
                                let v = ops[i].portsIn[j].thePort.get();

                                if (v) console.log("srch index", v.indexOf(srch));
                                if (v && v.indexOf(srch) == 0)
                                {
                                    console.log("found str!");
                                    v = rplc + v.substring(srch.length);
                                    ops[i].portsIn[j].thePort.set(v);
                                    console.log("result filename:", v);
                                }
                            }
                        }
                    }
                });
        });
};


CABLES.CMD.commands.push(
    {
        "cmd": "select all ops",
        "category": "patch",
        "func": CABLES.CMD.PATCH.selectAllOps,
        "hotkey": "CMD + a"
    },
    {
        "cmd": "delete selected ops",
        "category": "patch",
        "func": CABLES.CMD.PATCH.deleteSelectedOps,
        "icon": "trash",
        "hotkey": "DEL"
    },
    {
        "cmd": "rename op",
        "category": "op",
        "func": CABLES.CMD.PATCH.renameOp,
        "icon": "edit"
    },
    {
        "cmd": "reload patch",
        "category": "patch",
        "func": CABLES.CMD.PATCH.reload
    },
    {
        "cmd": "save patch",
        "category": "patch",
        "func": CABLES.CMD.PATCH.save,
        "icon": "save",
        "hotkey": "CMD + s"
    },
    {
        "cmd": "save patch as...",
        "category": "patch",
        "func": CABLES.CMD.PATCH.saveAs,
        "icon": "save",
        "hotkey": "CMD + SHIFT + s"
    },
    {
        "cmd": "upload file dialog",
        "category": "patch",
        "func": CABLES.CMD.PATCH.uploadFileDialog,
        "icon": "file"
    },
    {
        "cmd": "upload file",
        "category": "patch",
        "func": CABLES.CMD.PATCH.uploadFile,
        "icon": "file"
    },
    {
        "cmd": "create new file",
        "category": "patch",
        "func": CABLES.CMD.PATCH.createFile,
        "icon": "file"
    },
    {
        "cmd": "select child ops",
        "category": "op",
        "func": CABLES.CMD.PATCH.selectChilds
    },
    {
        "cmd": "align selected ops",
        "category": "op",
        "func": CABLES.CMD.PATCH.opsAlignHorizontal,
        "hotkey": "a",
        "icon": "align-left"
    },
    {
        "cmd": "compress selected ops",
        "category": "op",
        "func": CABLES.CMD.PATCH.opsCompress,
        "hotkey": "SHIFT + a",
        "icon": "align-justify"
    },
    {
        "cmd": "create subpatch",
        "category": "patch",
        "func": CABLES.CMD.PATCH.createSubPatchFromSelection,
        "icon": "maximize"
    },
    {
        "cmd": "export static html",
        "category": "patch",
        "func": CABLES.CMD.PATCH.export,
        "icon": "download"
    },
    {
        "cmd": "create new patch",
        "category": "patch",
        "func": CABLES.CMD.PATCH.newPatch,
        "icon": "file"
    },
    {
        "cmd": "add op",
        "category": "patch",
        "func": CABLES.CMD.PATCH.addOp,
        "icon": "add_op"
    },
    {
        "cmd": "edit op",
        "category": "op",
        "func": CABLES.CMD.PATCH.editOp,
        "icon": "edit"
    },
    {
        "cmd": "set title",
        "category": "op",
        "func": CABLES.CMD.PATCH.setOpTitle,
        "icon": "edit"
    },
    {
        "cmd": "clear patch",
        "category": "patch",
        "func": CABLES.CMD.PATCH.clear
    },
    {
        "cmd": "open patch website",
        "category": "patch",
        "func": CABLES.CMD.PATCH.patchWebsite,
        "icon": "link"
    },
    {
        "cmd": "tidy selected ops",
        "category": "patch",
        "func": CABLES.CMD.PATCH.tidyChildOps
    },
    {
        "cmd": "set timeline length",
        "category": "timeline",
        "func": CABLES.CMD.TIMELINE.setLength
    },
    {
        "cmd": "pause patch execution",
        "category": "patch",
        "func": CABLES.CMD.PATCH.pause
    },
    {
        "cmd": "resume patch execution",
        "category": "patch",
        "func": CABLES.CMD.PATCH.resume
    },
    {
        "cmd": "replace file path",
        "category": "patch",
        "func": CABLES.CMD.PATCH.replaceFilePath
    },
    {
        "cmd": "find unconnected ops",
        "category": "patch",
        "func": CABLES.CMD.PATCH.findUnconnectedOps
    },
    {
        "cmd": "find user ops",
        "category": "patch",
        "func": CABLES.CMD.PATCH.findUserOps
    },
    {
        "cmd": "find commented ops",
        "category": "patch",
        "func": CABLES.CMD.PATCH.findCommentedOps
    },
    {
        "cmd": "patch statistics",
        "category": "patch",
        "func": CABLES.CMD.PATCH.stats
    },
    {
        "cmd": "analyze patch",
        "category": "patch",
        "func": CABLES.CMD.PATCH.analyzePatch
    },
    {
        "cmd": "create number variable",
        "category": "patch",
        "func": CABLES.CMD.PATCH.createVarNumber
    },
    {
        "cmd": "create backup",
        "category": "patch",
        "func": CABLES.CMD.PATCH.createBackup
    }


);
