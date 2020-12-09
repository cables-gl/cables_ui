CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.PatchView = class extends CABLES.EventTarget
{
    constructor(corepatch)
    {
        super();
        this._p = corepatch;
        this._element = null;
        this._pvRenderers = {};
        this._patchRenderer = null;
        this._cachedSubpatchNames = {};
        this.isPasting = false;
        this._showingNavHelperEmpty = false;
        this._lastTempOPs = [];

        this.boundingRect = null;
        this.store = new CABLES.UI.PatchServer();
        this._initListeners();
        this._eleSubpatchNav = ele.byId("subpatch_nav");

        corepatch.addEventListener("onLink", this.refreshCurrentOpParamsByPort.bind(this));
        corepatch.addEventListener("onUnLink", this.refreshCurrentOpParamsByPort.bind(this));
    }

    get element() { return this._element || CABLES.UI.PatchView.getElement(); }

    static getElement()
    {
        return document.querySelector("#patchviews .visible");
        // return $("#patchviews .visible");
    }

    setProject(proj, cb)
    {
        if (proj && proj.ui)
        {
            this._projUI = proj.ui;

            if (proj.ui.renderer)
            {
                if (proj.ui.renderer.w > document.body.clientWidth * 0.9 || proj.ui.renderer.h > document.body.clientHeight * 0.9)
                {
                    proj.ui.renderer.w = 640;
                    proj.ui.renderer.h = 360;
                }

                gui.rendererWidth = proj.ui.renderer.w;
                gui.rendererHeight = proj.ui.renderer.h;
                gui.corePatch().cgl.canvasScale = proj.ui.renderer.s || 1;
                gui.setLayout();
            }

            gui.timeLine().setTimeLineLength(proj.ui.timeLineLength);
        }

        this._patchRenderer.setProject(proj);

        this.store.setServerDate(proj.updated);

        gui.serverOps.loadProjectLibs(proj, () =>
        {
            gui.corePatch().deSerialize(proj);
            CABLES.undo.clear();
            CABLES.UI.MODAL.hideLoading();
            gui.patch().updateSubPatches();
            gui.patch().updateBounds();

            if (!this._showingNavHelperEmpty && gui.corePatch().ops.length == 0)
            {
                this._showingNavHelperEmpty = true;
                document.getElementById("patchnavhelperEmpty").style.display = "block";
            }

            if (cb)cb();
        });
    }


    _initListeners()
    {
        document.addEventListener("copy", (e) =>
        {
            if (this._patchRenderer.isFocussed()) this._patchRenderer.copy(e);
            if ($("#timeline").is(":focus")) gui.patch().timeLine.copy(e);
        });

        document.addEventListener("paste", (e) =>
        {
            if (this._patchRenderer.isFocussed()) this._patchRenderer.paste(e);
            if ($("#timeline").is(":focus")) gui.patch().timeLine.paste(e);
        });

        document.addEventListener("cut", (e) =>
        {
            if (this._patchRenderer.isFocussed()) this._patchRenderer.cut(e);
            if ($("#timeline").is(":focus")) gui.patch().timeLine.cut(e);
        });
    }

    switch(id)
    {
        const views = document.getElementById("patchviews");

        for (let i = 0; i < views.children.length; i++)
        {
            views.children[i].style.display = "none";
            views.children[i].classList.remove("visible");
        }

        const ele = document.getElementById(id);
        ele.classList.add("visible");
        ele.style.display = "block";

        this._patchRenderer = this._pvRenderers[id];
        gui.setLayout();
    }


    updateBoundingRect()
    {
        this.boundingRect = CABLES.UI.PatchView.getElement().getBoundingClientRect();
    }

    hasFocus()
    {
        return this._patchRenderer.isFocussed();
    }

    testCollision(op)
    {
        for (let j = 0; j < gui.corePatch().ops.length; j++)
        {
            const b = gui.corePatch().ops[j];
            if (b == op) continue;

            if (op.uiAttribs.translate && op.uiAttribs.translate.x == b.uiAttribs.translate.x && op.uiAttribs.translate.y == b.uiAttribs.translate.y)
                op.setUiAttrib({ "translate": { "x": b.uiAttribs.translate.x, "y": b.uiAttribs.translate.y + 40 } });
        }
    }

    focus()
    {
        if (this._patchRenderer.focus) this._patchRenderer.focus();
    }

    setPatchRenderer(id, pr)
    {
        this._pvRenderers[id] = pr;
        pr.setProject({ "ui": this._projUI });
        if (!this._patchRenderer) this._patchRenderer = pr;
    }

    addAssetOpAuto(filename, event)
    {
        const ops = CABLES.UI.getOpsForFilename(filename);

        if (ops.length == 0)
        {
            CABLES.UI.notify("no known operator found");
            return;
        }

        const opname = ops[0];

        const uiAttr = {};
        if (event)
        {
            const x = gui.patch().getCanvasCoordsMouse(event).x;
            const y = gui.patch().getCanvasCoordsMouse(event).y;

            uiAttr.translate = { "x": x, "y": y };
        }
        const op = gui.corePatch().addOp(opname, uiAttr);

        for (let i = 0; i < op.portsIn.length; i++)
            if (op.portsIn[i].uiAttribs.display == "file")
                op.portsIn[i].set(filename);
    }

    addOp(opname, options)
    {
        let hadCallback = false;
        setTimeout(() =>
        {
            if (!hadCallback)
            {
                console.error("HAD NO loadOpLibs CALLBACK!!!!");
            }
            // else console.log("had loadoplibs callback...");
        }, 500);
        gui.serverOps.loadOpLibs(opname, () =>
        {
            hadCallback = true;
            const uiAttribs = {};
            options = options || {};

            if (options.subPatch) uiAttribs.subPatch = options.subPatch;

            console.log("adding op. uiAttribs: ", uiAttribs);
            const op = this._p.addOp(opname, uiAttribs);

            if (this._showingNavHelperEmpty)
            {
                document.getElementById("patchnavhelperEmpty").style.display = "none";
            }

            // todo options:
            // - putIntoLink
            // ...?
            // positioning ?

            if (options.linkNewOpToPort)
            {
                const foundPort = op.findFittingPort(options.linkNewOpToPort);
                if (foundPort)
                {
                    // console.log(op.objName,'op.objName');
                    if (op.objName == CABLES.UI.DEFAULTOPNAMES.number)
                    {
                        const oldValue = options.linkNewOpToPort.get();
                        op.getPort("value").set(oldValue);
                        op.setTitle(options.linkNewOpToPort.getName());
                    }

                    gui.corePatch().link(
                        options.linkNewOpToOp,
                        options.linkNewOpToPort.getName(),
                        op,
                        foundPort.getName());
                }
            }
            if (options.linkNewLink)
            {
                console.log("new op into link!");

                let op1 = null;
                let op2 = null;
                let port1 = null;
                let port2 = null;

                if (options.linkNewLink.p1)
                {
                    // patch_link
                    op1 = options.linkNewLink.p1.op;
                    op2 = options.linkNewLink.p2.op;
                    port1 = options.linkNewLink.p1.thePort;
                    port2 = options.linkNewLink.p2.thePort;
                }
                else
                {
                    // core link
                    op2 = options.linkNewLink.portIn.parent;
                    op1 = options.linkNewLink.portOut.parent;
                    port2 = options.linkNewLink.portIn;
                    port1 = options.linkNewLink.portOut;
                }

                const foundPort1 = op.findFittingPort(port1);
                const foundPort2 = op.findFittingPort(port2);

                if (foundPort2 && foundPort1)
                {
                    for (const il in port1.links)
                    {
                        if (
                            (port1.links[il].portIn == port1 && port1.links[il].portOut == port2) ||
                            (port1.links[il].portOut == port1 && port1.links[il].portIn == port2)) port1.links[il].remove();
                    }

                    gui.corePatch().link(
                        op,
                        foundPort1.getName(),
                        op1,
                        port1.getName()
                    );

                    gui.corePatch().link(
                        op,
                        foundPort2.getName(),
                        op2,
                        port2.getName()
                    );
                }
            }

            if (options.onOpAdd) options.onOpAdd(op);
        });
    }

    addOpAndLink(opname, opid, portname)
    {
        const oldOp = gui.corePatch().getOpById(opid);
        const trans = {
            "x": oldOp.uiAttribs.translate.x,
            "y": oldOp.uiAttribs.translate.y - 100
        };

        gui.patchView.addOp(opname, {
            "onOpAdd": (newOp) =>
            {
                const newPort = newOp.getFirstOutPortByType(oldOp.getPortByName(portname).type);
                gui.corePatch().link(oldOp, portname, newOp, newPort.name);

                newOp.setUiAttrib({
                    "translate": trans,
                    "subPatch": this.getCurrentSubPatch()
                });
            } });
    }

    showSelectedOpsPanel()
    {
        const html = CABLES.UI.getHandleBarHtml(
            "params_ops", {
                "numOps": this.getSelectedOps().length,
            });

        gui.opParams.clear();

        ele.byId("options").innerHTML = html;
        gui.setTransformGizmo(null);

        CABLES.UI.showInfo(CABLES.UI.TEXTS.patchSelectedMultiOps);
    }

    showDefaultPanel()
    {
        // gui.texturePreview().pressedEscape();
        gui.setTransformGizmo(null);
        gui.opParams.clear();
        this.showBookmarkParamsPanel();
    }

    selectAllOpsSubPatch(subPatch, noUnselect)
    {
        for (let i = 0; i < this._p.ops.length; i++)
        {
            if ((this._p.ops[i].uiAttribs.subPatch || 0) == subPatch) this._p.ops[i].uiAttr({ "selected": true });
            else if (!noUnselect) this._p.ops[i].uiAttr({ "selected": false });
        }
        this.showSelectedOpsPanel();
    }

    showBookmarkParamsPanel()
    {
        let html = "<div class=\"panel\">";

        const project = gui.project();
        if (!gui.user.isPatchOwner && !project.users.includes(gui.user.id)) html += CABLES.UI.getHandleBarHtml("clonepatch", {});
        html += gui.bookmarks.getHtml();

        const views = document.getElementById("patchviews");
        if (views.children.length > 1)
        {
            html += "<h3>Patchviews</h3>";
            for (let i = 0; i < views.children.length; i++)
            {
                html += "<div class=\"list\" onclick=\"gui.patchView.switch('" + views.children[i].id + "')\"><div>" + views.children[i].id + "</div></div>";
            }
        }

        html += "</div>";

        ele.byId("options").innerHTML = html;
    }

    getSelectionBounds()
    {
        const ops = this.getSelectedOps();
        const bounds = {
            "minx": 9999999,
            "maxx": -9999999,
            "miny": 9999999,
            "maxy": -9999999,
        };

        for (let j = 0; j < ops.length; j++)
        {
            if (ops[j].uiAttribs && ops[j].uiAttribs.translate)
            {
                bounds.minx = Math.min(bounds.minx, ops[j].uiAttribs.translate.x);
                bounds.maxx = Math.max(bounds.maxx, ops[j].uiAttribs.translate.x);
                bounds.miny = Math.min(bounds.miny, ops[j].uiAttribs.translate.y);
                bounds.maxy = Math.max(bounds.maxy, ops[j].uiAttribs.translate.y);
            }
        }

        return bounds;
    }

    getSelectedOps()
    {
        const ops = [];
        for (let i = 0; i < this._p.ops.length; i++)
            if (this._p.ops[i].uiAttribs.selected)
                ops.push(this._p.ops[i]);

        return ops;
    }

    unlinkSelectedOps()
    {
        const undoGroup = CABLES.undo.startGroup();
        const ops = this.getSelectedOps();
        for (const i in ops) ops[i].unLinkTemporary();
        CABLES.undo.endGroup(undoGroup, "Unlink selected Ops");
    }

    deleteSelectedOps()
    {
        const undoGroup = CABLES.undo.startGroup();
        const ids = [];
        const ops = this.getSelectedOps();

        for (let i = 0; i < ops.length; i++)
            ids.push(ops[i].id);

        for (let i = 0; i < ids.length; i++) this._p.deleteOp(ids[i], true);

        CABLES.undo.endGroup(undoGroup, "Delete selected ops");

        console.log("deleted ops ", ids.length);
    }


    createSubPatchFromSelection()
    {
        const selectedOps = this.getSelectedOps();
        const bounds = this.getSelectionBounds();
        const trans = {
            "x": bounds.minx + (bounds.maxx - bounds.minx) / 2,
            "y": bounds.miny
        };
        const patchOp = this._p.addOp(CABLES.UI.OPNAME_SUBPATCH, { "translate": trans });
        const patchId = patchOp.patchId.get();

        patchOp.uiAttr({ "translate": trans });

        let i, j, k;
        for (i in selectedOps) selectedOps[i].uiAttribs.subPatch = patchId;

        for (i = 0; i < selectedOps.length; i++)
        {
            for (j = 0; j < selectedOps[i].portsIn.length; j++)
            {
                const theOp = selectedOps[i];
                let found = null;
                for (k = 0; k < theOp.portsIn[j].links.length; k++)
                {
                    const otherPort = theOp.portsIn[j].links[k].getOtherPort(theOp.portsIn[j]);
                    const otherOp = otherPort.parent;
                    if (otherOp.uiAttribs.subPatch != patchId)
                    {
                        theOp.portsIn[j].links[k].remove();
                        k--;

                        if (found)
                        {
                            this._p.link(
                                otherPort.parent,
                                otherPort.getName(),
                                patchOp,
                                found
                            );
                        }
                        else
                        {
                            this._p.link(
                                otherPort.parent,
                                otherPort.getName(),
                                patchOp,
                                patchOp.dyn.name
                            );

                            found = patchOp.addSubLink(theOp.portsIn[j], otherPort);
                        }
                    }
                }

                if (theOp.portsOut[j])
                {
                    for (k = 0; k < theOp.portsOut[j].links.length; k++)
                    {
                        const otherPortOut = theOp.portsOut[j].links[k].getOtherPort(theOp.portsOut[j]);
                        if (otherPortOut)
                        {
                            const otherOpOut = otherPortOut.parent;
                            if (otherOpOut.uiAttribs.subPatch != patchId)
                            {
                                console.log("found outside connection!! ", otherPortOut.name);
                                theOp.portsOut[j].links[k].remove();
                                this._p.link(
                                    otherPortOut.parent,
                                    otherPortOut.getName(),
                                    patchOp,
                                    patchOp.dynOut.name
                                );
                                patchOp.addSubLink(theOp.portsOut[j], otherPortOut);
                            }
                        }
                    }
                }
            }
        }
        this._p.emitEvent("subpatchCreated");
    }


    getSubPatchName(subpatch)
    {
        if (!subpatch) return "Main";
        if (this._cachedSubpatchNames[subpatch]) return this._cachedSubpatchNames[subpatch];

        const ops = gui.corePatch().ops;
        for (let i = 0; i < ops.length; i++)
            if (ops[i].objName == CABLES.UI.OPNAME_SUBPATCH && ops[i].patchId)
                this._cachedSubpatchNames[ops[i].patchId.get()] = ops[i].name;

        if (this._cachedSubpatchNames[subpatch]) return this._cachedSubpatchNames[subpatch];
    }

    getSubpatchPathArray(subId, arr)
    {
        arr = arr || [];
        const ops = gui.corePatch().ops;
        for (let i = 0; i < ops.length; i++)
        {
            if (ops[i].objName == CABLES.UI.OPNAME_SUBPATCH && ops[i].patchId)
            {
                if (ops[i].patchId.get() == subId)
                {
                    arr.push({
                        "name": ops[i].name,
                        "id": ops[i].patchId.get()
                    });
                    if (ops[i].uiAttribs.subPatch !== 0) this.getSubpatchPathArray(ops[i].uiAttribs.subPatch, arr);
                }
            }
        }
        return arr;
    }

    getSubPatches(sort)
    {
        let foundPatchIds = [];
        const subPatches = [];
        const ops = gui.corePatch().ops;

        let i = 0;

        for (i = 0; i < ops.length; i++)
            if (ops[i].patchId && ops[i].patchId.get() !== 0)
                foundPatchIds.push(ops[i].patchId.get());

        // find lost ops, which are in subpoatches, but no subpatch op exists for that subpatch..... :(
        for (i = 0; i < ops.length; i++)
            if (ops[i].uiAttribs && ops[i].uiAttribs.subPatch)
                if (foundPatchIds.indexOf(ops[i].uiAttribs.subPatch) == -1)
                    foundPatchIds.push(ops[i].uiAttribs.subPatch);

        foundPatchIds = CABLES.uniqueArray(foundPatchIds);

        for (i = 0; i < foundPatchIds.length; i++)
        {
            let found = false;
            for (let j = 0; j < ops.length; j++)
                if (ops[j].patchId != 0 && ops[j].patchId && ops[j].patchId.get() == foundPatchIds[i])
                {
                    subPatches.push({
                        "name": ops[j].name,
                        "id": foundPatchIds[i]
                    });
                    found = true;
                }

            if (!found && foundPatchIds[i] != 0)
                subPatches.push({
                    "name": "lost patch " + foundPatchIds[i],
                    "id": foundPatchIds[i]
                });
        }

        if (sort) subPatches.sort(function (a, b) { return a.name.localeCompare(b.name); });

        return subPatches;
    }

    updateSubPatchBreadCrumb(currentSubPatch)
    {
        if (currentSubPatch === 0) ele.hide(this._eleSubpatchNav);
        else ele.show(this._eleSubpatchNav);

        const names = this.getSubpatchPathArray(currentSubPatch);
        let str = "<a onclick=\"gui.patchView.setCurrentSubPatch(0)\">Main</a> ";

        for (let i = names.length - 1; i >= 0; i--)
        {
            if (i >= 0) str += "<span class=\"sparrow\">&rsaquo;</span>";
            str += "<a onclick=\"gui.patchView.setCurrentSubPatch('" + names[i].id + "')\">" + names[i].name + "</a>";
        }

        document.getElementById("subpatch_breadcrumb").innerHTML = str;
    }

    clipboardCutOps(e)
    {
        this.clipboardCopyOps(e);
        this.deleteSelectedOps();
    }

    clipboardCopyOps(e)
    {
        let selectedOps = this.getSelectedOps();
        const ops = [];
        const opIds = [];
        let j = 0, k = 0;

        for (const i in selectedOps)
        {
            if (selectedOps[i].objName == CABLES.UI.OPNAME_SUBPATCH)
            {
                console.log("selecting subpatch", selectedOps[i].patchId.get());
                this.selectAllOpsSubPatch(selectedOps[i].patchId.get(), true);
                // if (this._patchRenderer.selectAllOpsSubPatch) this.selectAllOpsSubPatch(selectedOps[i].patchId.get());
                // else console.log("this._patchRenderer.selectAllOpsSubPatch missin!");
            }
        }

        selectedOps = this.getSelectedOps();

        for (const i in selectedOps)
        {
            console.log(selectedOps[i].objName);
            ops.push(selectedOps[i].getSerialized());
            opIds.push(selectedOps[i].id);
            // selectedOps[i].oprect.showCopyAnim();
        }

        // remove links that are not fully copied...
        for (let i = 0; i < ops.length; i++)
        {
            for (j = 0; j < ops[i].portsIn.length; j++)
            {
                if (ops[i].portsIn[j].links)
                {
                    k = ops[i].portsIn[j].links.length;
                    while (k--)
                    {
                        if (ops[i].portsIn[j].links[k] && ops[i].portsIn[j].links[k].objIn && ops[i].portsIn[j].links[k].objOut)
                        {
                            if (!CABLES.UTILS.arrayContains(opIds, ops[i].portsIn[j].links[k].objIn) || !CABLES.UTILS.arrayContains(opIds, ops[i].portsIn[j].links[k].objOut))
                            {
                                // console.log(ops[i].portsIn[j].links[k]);
                                const p = selectedOps[0].patch.getOpById(ops[i].portsIn[j].links[k].objOut).getPort(ops[i].portsIn[j].links[k].portOut);
                                ops[i].portsIn[j].links[k] = null;
                                if (p && (p.type === CABLES.OP_PORT_TYPE_STRING || p.type === CABLES.OP_PORT_TYPE_VALUE))
                                {
                                    ops[i].portsIn[j].value = p.get();
                                }
                            }
                        }
                    }
                }
            }
        }

        const objStr = JSON.stringify({
            "ops": ops
        });
        CABLES.UI.notify("Copied " + selectedOps.length + " ops");

        e.clipboardData.setData("text/plain", objStr);
        e.preventDefault();
    }

    clipboardPaste(e, oldSub, mouseX, mouseY, next)
    {
        this.isPasting = true;
        if (e.clipboardData.types.indexOf("text/plain") == -1)
        {
            console.error("clipboard not type text");
            CABLES.UI.notifyError("Paste failed");
            return;
        }
        let str = e.clipboardData.getData("text/plain");
        e.preventDefault();

        str = str.replace("```", "");
        str = str.replace("```", "");

        let json = null;
        try
        {
            json = JSON.parse(str);
        }
        catch (exp)
        {
            CABLES.UI.notifyError("Paste failed");
            console.log(str);
            console.log(exp);
        }

        const undoGroup = CABLES.undo.startGroup();

        if (!json || !json.ops) return;

        let focusSubpatchop = null;
        gui.serverOps.loadProjectLibs(json, () =>
        {
            // change ids
            for (const i in json.ops)
            {
                const searchID = json.ops[i].id;
                const newID = json.ops[i].id = CABLES.generateUUID();

                json.ops[i].uiAttribs.pasted = true;

                for (const j in json.ops)
                {
                    if (json.ops[j].portsIn)
                        for (const k in json.ops[j].portsIn)
                        {
                            if (json.ops[j].portsIn[k].links)
                            {
                                let l = json.ops[j].portsIn[k].links.length;
                                while (l--)
                                {
                                    if (json.ops[j].portsIn[k].links[l] === null)
                                    {
                                        json.ops[j].portsIn[k].links.splice(l, 1);
                                    }
                                }

                                for (l in json.ops[j].portsIn[k].links)
                                {
                                    if (json.ops[j].portsIn[k].links[l].objIn == searchID) json.ops[j].portsIn[k].links[l].objIn = newID;
                                    if (json.ops[j].portsIn[k].links[l].objOut == searchID) json.ops[j].portsIn[k].links[l].objOut = newID;
                                }
                            }
                        }
                }
            }
            // set correct subpatch
            const subpatchIds = [];
            const fixedSubPatches = [];
            for (let i = 0; i < json.ops.length; i++)
            {
                if (CABLES.Op.isSubpatchOp(json.ops[i].objName))
                {
                    for (const k in json.ops[i].portsIn)
                    {
                        if (json.ops[i].portsIn[k].name == "patchId")
                        {
                            const oldSubPatchId = json.ops[i].portsIn[k].value;
                            const newSubPatchId = json.ops[i].portsIn[k].value = CABLES.generateUUID();

                            console.log("oldSubPatchId", oldSubPatchId);
                            console.log("newSubPatchId", newSubPatchId);
                            subpatchIds.push(newSubPatchId);

                            focusSubpatchop = json.ops[i];

                            for (let j = 0; j < json.ops.length; j++)
                            {
                                if (json.ops[j].uiAttribs.subPatch == oldSubPatchId)
                                {
                                    console.log("found child patch");

                                    json.ops[j].uiAttribs.subPatch = newSubPatchId;
                                    fixedSubPatches.push(json.ops[j].id);
                                }
                            }
                        }
                    }
                }
            }

            for (const kk in json.ops)
            {
                let found = false;
                for (let j = 0; j < fixedSubPatches.length; j++)
                {
                    if (json.ops[kk].id == fixedSubPatches[j])
                    {
                        found = true;
                        break;
                    }
                }
                if (!found)
                {
                    json.ops[kk].uiAttribs.subPatch = oldSub;
                }
            }

            for (const i in subpatchIds) this.setCurrentSubPatch(subpatchIds[i]);
            // gui.patch().setCurrentSubPatch(subpatchIds[i]);

            { // change position of ops to paste
                let minx = Number.MAX_VALUE;
                let miny = Number.MAX_VALUE;

                for (const i in json.ops)
                {
                    if (json.ops[i].uiAttribs && json.ops[i].uiAttribs && json.ops[i].uiAttribs.translate)
                    {
                        minx = Math.min(minx, json.ops[i].uiAttribs.translate.x);
                        miny = Math.min(miny, json.ops[i].uiAttribs.translate.y);
                    }
                }

                for (const i in json.ops)
                {
                    if (json.ops[i].uiAttribs && json.ops[i].uiAttribs && json.ops[i].uiAttribs.translate)
                    {
                        let x = json.ops[i].uiAttribs.translate.x + mouseX - minx;
                        let y = json.ops[i].uiAttribs.translate.y + mouseY - miny;
                        if (CABLES.UI.userSettings.get("snapToGrid"))
                        {
                            x = gui.patchView.snapOpPosX(x);
                            y = gui.patchView.snapOpPosY(y);
                        }
                        json.ops[i].uiAttribs.translate.x = x;
                        json.ops[i].uiAttribs.translate.y = y;
                    }

                    const undofunc = (function (opid)
                    {
                        CABLES.undo.add({
                            "title": "paste op",
                            undo()
                            {
                                gui.corePatch().deleteOp(opid, true);
                            },
                            redo()
                            {
                                gui.patch().paste(e);
                            }
                        });
                    }(json.ops[i].id));
                }
            }
            CABLES.UI.notify("Pasted " + json.ops.length + " ops");
            console.log("deserialize. now...");
            gui.corePatch().deSerialize(json, false);
            console.log("finish deserialize...");
            this.isPasting = false;
            next(json.ops, focusSubpatchop);
        });
        CABLES.undo.endGroup(undoGroup, "Paste");
    }


    compressSelectedOps(ops)
    {
        if (!ops || ops.length === 0) return;

        this.saveUndoSelectedOpsPositions(ops);

        ops.sort(function (a, b) { return a.uiAttribs.translate.y - b.uiAttribs.translate.y; });

        let y = ops[0].uiAttribs.translate.y;

        for (let j = 0; j < ops.length; j++)
        {
            if (j > 0) y += (ops[j].uiAttribs.height || CABLES.UI.uiConfig.opHeight) + 10;
            this.setOpPos(ops[j], ops[j].uiAttribs.translate.x, y);
        }
    }

    alignSelectedOpsVert(ops)
    {
        if (ops.length > 0)
        {
            let j = 0;
            let sum = 0;
            for (j in ops) sum += ops[j].uiAttribs.translate.x;

            let avg = sum / ops.length;

            if (CABLES.UI.userSettings.get("snapToGrid")) avg = gui.patchView.snapOpPosX(avg);

            for (j in ops) this.setOpPos(ops[j], avg, ops[j].uiAttribs.translate.y);
        }
        return ops;
    }

    alignSelectedOpsHor(ops)
    {
        if (ops.length > 0)
        {
            let j = 0, sum = 0;
            for (j in ops) sum += ops[j].uiAttribs.translate.y;

            let avg = sum / ops.length;

            if (CABLES.UI.userSettings.get("snapToGrid")) avg = CABLES.UI.snapOpPosY(avg);

            for (j in ops) this.setOpPos(ops[j], ops[j].uiAttribs.translate.x, avg);
        }
        return ops;
    }

    setOpPos(op, x, y)
    {
        op.uiAttr({ "translate":
            {
                "x": x,
                "y": y
            }
        });
    }

    saveUndoSelectedOpsPositions(selectedOps)
    {
        const opPositions = [];
        for (let j = 0; j < selectedOps.length; j++)
        {
            const obj = {};
            obj.id = selectedOps[j].id;
            obj.x = selectedOps[j].uiAttribs.translate.x;
            obj.y = selectedOps[j].uiAttribs.translate.y;
            opPositions.push(obj);
        }

        CABLES.undo.add({
            "title": "save op positions",
            undo()
            {
                const changedOps = [];
                for (let j = 0; j < opPositions.length; j++)
                {
                    const obj = opPositions[j];
                    const op = gui.corePatch().getOpById(obj.id);
                    gui.patchView.setOpPos(op, obj.x, obj.y);
                    changedOps.push(op);
                }

                // update svg patch...
                gui.patch().updatedOpPositionsFromUiAttribs(changedOps);
            },
            redo()
            {
                // gui.scene().addOp(objName, op.uiAttribs, opid);
            }
        });
    }

    alignOps(selectedOps)
    {
        // let minX = 9999999,
        //     minY = 9999999,
        //     maxX = -9999999,
        //     maxY = -9999999,
        //     j = 0;

        this.saveUndoSelectedOpsPositions(selectedOps);

        // for (j in selectedOps)
        // {
        //     minX = Math.min(minX, selectedOps[j].uiAttribs.translate.x);
        //     minY = Math.min(minY, selectedOps[j].uiAttribs.translate.y);

        //     maxX = Math.max(maxX, selectedOps[j].uiAttribs.translate.x); // magic number: reduce
        //     maxY = Math.max(maxY, selectedOps[j].uiAttribs.translate.y);
        // }

        // if (Math.abs(maxX - minX) > Math.abs(maxY - minY)) this.alignSelectedOpsHor(selectedOps);
        // else
        this.alignSelectedOpsVert(selectedOps);

        return selectedOps;
    }


    unlinkPort(opid, portid)
    {
        const op = gui.corePatch().getOpById(opid);
        const p = op.getPortById(portid);

        const undoGroup = CABLES.undo.startGroup();

        // for (let i = 0; i < p.links.length; i++)
        // {
        //     const undofunc = (function (patch, p1Name, p2Name, op1Id, op2Id)
        //     {
        //         CABLES.undo.add({
        //             "title": "Unlink port",
        //             undo()
        //             {
        //                 patch.link(patch.getOpById(op1Id), p1Name, patch.getOpById(op2Id), p2Name);
        //             },
        //             redo()
        //             {
        //                 const op1 = patch.getOpById(op1Id);
        //                 const op2 = patch.getOpById(op2Id);
        //                 if (!op1 || !op2)
        //                 {
        //                     console.warn("undo: op not found");
        //                     return;
        //                 }
        //                 op1.getPortByName(p1Name).removeLinkTo(op2.getPortByName(p2Name));
        //             }
        //         });
        //     }(
        //         this._p,
        //         p.links[i].portIn.getName(),
        //         p.links[i].portOut.getName(),
        //         p.links[i].portIn.parent.id,
        //         p.links[i].portOut.parent.id
        //     ));
        // }


        p.removeLinks();
        CABLES.undo.endGroup(undoGroup, "Unlink Port");
    }

    linkPortToOp(e, opid, pid, op2id)
    {
        const op1 = this._p.getOpById(opid);
        const op2 = this._p.getOpById(op2id);
        const p = op1.getPort(pid);
        const numFitting = op2.countFittingPorts(p);

        if (numFitting > 1)
        {
            new CABLES.UI.SuggestPortDialog(op2, p, e, (p2n) =>
            {
                this._p.link(op1, pid, op2, p2n);
            });
        }
        else
        {
            const fitp = op2.findFittingPort(p);
            if (fitp) this._p.link(op1, pid, op2, fitp.name);
        }
    }

    linkPortsToOp(e, opid, opids, portnames)
    {
        const op1 = this._p.getOpById(opid);
        let op2 = this._p.getOpById(opids[0]);
        const p = op2.getPort(portnames[0]);
        const numFitting = op1.countFittingPorts(p);

        if (numFitting > 1)
        {
            new CABLES.UI.SuggestPortDialog(op1, p, e, (suggport) =>
            {
                for (let i = 0; i < portnames.length; i++)
                {
                    op2 = this._p.getOpById(opids[i]);
                    this._p.link(op2, portnames[i], op1, suggport);
                }
            });
        }
        else
        {
            const fitp = op1.findFittingPort(p);

            if (fitp)
                for (let i = 0; i < portnames.length; i++)
                {
                    op2 = this._p.getOpById(opids[i]);
                    this._p.link(op2, portnames[i], op1, fitp.name);
                }
        }
    }

    linkPorts(opid, pid, op2id, p2id)
    {
        const op1 = this._p.getOpById(opid);
        const op2 = this._p.getOpById(op2id);

        this._p.link(op1, pid, op2, p2id);
    }

    centerView(x, y)
    {
        if (this._patchRenderer.center) this._patchRenderer.center(x, y);
        else console.log("patchRenderer has no function center");
    }

    getCurrentSubPatch()
    {
        return this._patchRenderer.getCurrentSubPatch();
    }

    serialize(dataUi)
    {
        this._patchRenderer.serialize(dataUi);
    }

    setCurrentSubPatch(subpatch)
    {
        if (this._patchRenderer.setCurrentSubPatch) this._patchRenderer.setCurrentSubPatch(subpatch);
        else console.log("patchRenderer has no function setCurrentSubPatch");

        gui.patchView.updateSubPatchBreadCrumb(subpatch);

        if (ele.byId("subpatchlist")) this.showDefaultPanel(); // update subpatchlist because its already visible
    }

    focusOp(opid)
    {
        if (this._patchRenderer.focusOp) this._patchRenderer.focusOp(opid);
        else console.log("patchRenderer has no function focusOp");
    }

    centerSelectOp(opid)
    {
        const op = this._p.getOpById(opid);

        this.focusOp(opid);
        this.setSelectedOpById(opid);
        this.focus();

        if (op && op.uiAttribs && op.uiAttribs.translate)
            this.centerView(op.uiAttribs.translate.x, op.uiAttribs.translate.y);
    }

    setSelectedOpById(opid)
    {
        if (this._patchRenderer.setSelectedOpById) this._patchRenderer.setSelectedOpById(opid);
        // else if (this._patchRenderer.selectOpId) this._patchRenderer.selectOpId(opid);
        else console.log("patchRenderer has no function setSelectedOpById");
    }

    refreshCurrentOpParamsByPort(p1, p2)
    {
        if (this.isCurrentOp(p2.parent) || this.isCurrentOp(p1.parent)) gui.opParams.refresh();
    }

    isCurrentOp(op)
    {
        return gui.opParams.isCurrentOp(op);
    }

    isCurrentOpId(opid)
    {
        return gui.opParams.isCurrentOpId(opid);
    }

    snapOpPosX(posX)
    {
        return Math.round(posX / CABLES.UI.uiConfig.snapX) * CABLES.UI.uiConfig.snapX;
    }

    snapOpPosY(posY)
    {
        return Math.round(posY / CABLES.UI.uiConfig.snapY) * CABLES.UI.uiConfig.snapY;
    }

    copyOpInputPorts(origOp, newOp)
    {
        for (let i = 0; i < origOp.portsIn.length; i++)
        {
            for (let j = 0; j < newOp.portsIn.length; j++)
            {
                // console.log("new ", newOp.portsIn[j].name);
                if (newOp.portsIn[j].name.toLowerCase() == origOp.portsIn[i].name.toLowerCase())
                    newOp.portsIn[j].set(origOp.portsIn[i].get());
            }
        }
    }

    replaceOpCheck(opid, newOpObjName)
    {
        this.addOp(newOpObjName, { "onOpAdd": (newOp) =>
        {
            const origOp = this._p.getOpById(opid);

            let allFine = true;
            let html = "<h3>Replacing Op</h3>";

            html += "Replacing <b>" + origOp.objName + "</b> with <b>" + newOp.objName + "</b><br/><br/>";


            let htmlList = "";
            htmlList += "<table>";
            for (let i = 0; i < origOp.portsIn.length; i++)
            {
                let found = false;

                htmlList += "<tr>";
                htmlList += "<td>Port " + origOp.portsIn[i].name + "</td>";

                for (let j = 0; j < newOp.portsIn.length; j++)
                {
                    console.log(newOp.portsIn[j].name, newOp.portsIn[i].name);
                    if (newOp.portsIn[j].name.toLowerCase() == origOp.portsIn[i].name.toLowerCase())
                    {
                        found = true;
                        break;
                    }
                }

                htmlList += "<td>";
                if (!found)
                {
                    htmlList += "NOT FOUND in new version!";
                    allFine = false;
                }
                // else htmlList += "found in new version";

                htmlList += "</td>";
                htmlList += "</tr>";
            }

            this._p.deleteOp(newOp.id);
            htmlList += "</table>";

            if (allFine)
            {
                html += "All old ports are available in the new op, it should be safe to replace with new version. Make sure you test if it behaves the same, very accurately.<br/><br/>";
            }
            else
            {
                html += "Not all old Ports are available in never version of the op. Make sure you test if it behaves the same, very accurately.<br/><br/>";
                html += htmlList;
            }

            html += "<br/><a onClick=\"gui.patchView.replaceOp('" + opid + "','" + newOpObjName + "');CABLES.UI.MODAL.hide();\" class=\"bluebutton\">Really Upgrade</a>";
            html += "<a onClick=\"CABLES.UI.MODAL.hide();\" class=\"button\">Cancel</a>";

            setTimeout(() =>
            {
                this.setSelectedOpById(origOp.id);
            }, 100);


            CABLES.UI.MODAL.show(html);
        } });
    }

    replaceOp(opid, newOpObjName)
    {
        this.addOp(newOpObjName, { "onOpAdd": (newOp) =>
        {
            const origOp = this._p.getOpById(opid);

            this.copyOpInputPorts(origOp, newOp);

            for (let i = 0; i < origOp.portsIn.length; i++)
            {
                for (let j = 0; j < origOp.portsIn[i].links.length; j++)
                {
                    const otherPort = origOp.portsIn[i].links[j].getOtherPort(origOp.portsIn[i]);

                    console.log("link", otherPort.name.toLowerCase(), origOp.portsIn[i].name.toLowerCase());


                    this._p.link(otherPort.parent, otherPort.name.toLowerCase(), newOp, origOp.portsIn[i].name.toLowerCase(), true);
                }
            }

            for (let i = 0; i < origOp.portsOut.length; i++)
            {
                for (let j = 0; j < origOp.portsOut[i].links.length; j++)
                {
                    const otherPort = origOp.portsOut[i].links[j].getOtherPort(origOp.portsOut[i]);
                    this._p.link(otherPort.parent, otherPort.name.toLowerCase(), newOp, origOp.portsOut[i].name.toLowerCase(), true);
                }
            }

            const oldUiAttribs = JSON.parse(JSON.stringify(origOp.uiAttribs));
            this._p.deleteOp(origOp.id);

            setTimeout(() =>
            {
                for (const i in oldUiAttribs)
                {
                    console.log(i, oldUiAttribs[i]);
                    const a = {};
                    a[i] = oldUiAttribs[i];
                    newOp.setUiAttrib(a);
                }
            }, 100);
        } });
    }


    tempUnlinkOp()
    {
    }

    insertOpInLink(oldLink, op, x, y)
    {
        let portIn = oldLink.portIn;
        let portOut = oldLink.portOut;

        if (oldLink.p1 && oldLink.p2)
        {
            portIn = oldLink.p1.thePort;
            portOut = oldLink.p2.thePort;

            if (oldLink.p2.thePort.direction == CABLES.PORT_DIR_IN)
            {
                portIn = oldLink.p2.thePort;
                portOut = oldLink.p1.thePort;
            }
            oldLink.unlink();
        }
        else
        {
            oldLink.remove();
        }

        if (portIn && portOut)
        {
            if (CABLES.Link.canLink(op.portsIn[0], portOut))
            {
                gui.corePatch().link(
                    op,
                    op.portsIn[0].getName(), portOut.parent, portOut.getName()
                );

                gui.corePatch().link(
                    op,
                    op.portsOut[0].getName(), portIn.parent, portIn.getName()
                );

                op.setUiAttrib({ "translate": { "x": x, "y": y } });
            }
            else
            {
                console.log(oldLink, portIn, portOut);
                gui.corePatch().link(
                    portIn.parent, portIn.getName(),
                    portOut.parent, portOut.getName());
            }
        }
    }

    pause()
    {
        if (this._patchRenderer && this._patchRenderer.pause) this._patchRenderer.pause();
    }

    resume()
    {
        if (this._patchRenderer && this._patchRenderer.resume) this._patchRenderer.resume();
    }

    setSize(x, y, w, h)
    {
        if (this._patchRenderer) this._patchRenderer.setSize(x, y, w, h);
    }
};
