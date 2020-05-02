var CABLES=CABLES||{}
CABLES.UI=CABLES.UI||{};

CABLES.UI.PatchView=class extends CABLES.EventTarget
{
    constructor(corepatch)
    {
        super();
        this._p=corepatch;
        this._element=null;

        this.store=new CABLES.UI.PatchServer();
    }

    get element(){ return this._element||this.getElement(); }

    getElement()
    {
        return $('#patchviews .visible');
    }

    switch(id)
    {
        const views=document.getElementById("patchviews");

        for(var i=0;i<views.children.length;i++)
        {
            views.children[i].style.display="none";
            views.children[i].classList.remove("visible");
        }
    
        const ele=document.getElementById(id);
        ele.classList.add("visible");
        ele.style.display="block";

        this._element=this.getElement();
        gui.setLayout();
    }

    showSelectedOpsPanel()
    {
        var html = CABLES.UI.getHandleBarHtml(
            'params_ops', {
                numOps: this.getSelectedOps().length,
            });

        $('#options').html(html);
        gui.setTransformGizmo(null);

        CABLES.UI.showInfo(CABLES.UI.TEXTS.patchSelectedMultiOps);
    }

    showDefaultPanel()
    {
        this.showBookmarkParamsPanel();
    }

    showBookmarkParamsPanel()
    {
        var html='<div class="panel">';

        if(!gui.user.isPatchOwner) html += CABLES.UI.getHandleBarHtml('clonepatch', {});
        html+=gui.bookmarks.getHtml();

        const views=document.getElementById("patchviews");
        if(views.children.length>1)
        {
            html+='<h3>Patchviews</h3>';
            for(var i=0;i<views.children.length;i++)
            {
                html+='<div class="list" onclick="gui.patchView.switch(\''+views.children[i].id+'\')"><div>'+views.children[i].id+'</div></div>';
            }
        }

        html+='</div>';

        $('#options').html(html);
    }


    getSelectionBounds()
    {
        const ops=this.getSelectedOps();
        const bounds = {
            minx: 9999999,
            maxx: -9999999,
            miny: 9999999,
            maxy: -9999999,
        };

        for (var j = 0; j < ops.length; j++)
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
        var ops=[];
        for(var i=0;i<this._p.ops.length;i++)
            if(this._p.ops[i].uiAttribs.selected)
                ops.push(this._p.ops[i]);

        return ops;
    }
    
    unlinkSelectedOps()
    {
        var undoGroup = CABLES.undo.startGroup();
        var ops=this.getSelectedOps();
        for (var i in ops) ops[i].unLinkTemporary();
        CABLES.undo.endGroup(undoGroup,"Unlink selected Ops");
    };

    deleteSelectedOps()
    {
        var undoGroup = CABLES.undo.startGroup();
        var ids=[];
        var ops=this.getSelectedOps();

        for(var i=0;i<ops.length;i++)
        ids.push(ops[i].id);
        
        for(var i=0;i<ids.length;i++) this._p.deleteOp(ids[i], true);
        
        CABLES.undo.endGroup(undoGroup,"Delete selected ops");

        console.log("deleted ops ",ids.length);
    }

    
    createSubPatchFromSelection()
    {
        const selectedOps=this.getSelectedOps();
        const bounds = this.getSelectionBounds();
        var trans = {
            x: bounds.minx + (bounds.maxx - bounds.minx) / 2,
            y: bounds.miny
        };
        var patchOp = this._p.addOp(CABLES.UI.OPNAME_SUBPATCH, { "translate": trans });
        var patchId = patchOp.patchId.get();

        patchOp.uiAttr({ "translate": trans });

        var i, j, k;
        for (i in selectedOps) selectedOps[i].uiAttribs.subPatch = patchId;

        for (i = 0; i < selectedOps.length; i++)
        {
            for (j = 0; j < selectedOps[i].portsIn.length; j++)
            {
                var theOp = selectedOps[i];
                var found=null;
                for (k = 0; k < theOp.portsIn[j].links.length; k++)
                {
                    var otherPort = theOp.portsIn[j].links[k].getOtherPort(theOp.portsIn[j]);
                    var otherOp = otherPort.parent;
                    if (otherOp.uiAttribs.subPatch != patchId)
                    {
                        theOp.portsIn[j].links[k].remove();
                        k--;

                        if(found)
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

                            found=patchOp.addSubLink(theOp.portsIn[j], otherPort);
                        }
                    }
                }

                if (theOp.portsOut[j])
                {
                    for (k = 0; k < theOp.portsOut[j].links.length; k++) {
                        var otherPortOut = theOp.portsOut[j].links[k].getOtherPort(theOp.portsOut[j]);
                        if (otherPortOut) {
                            var otherOpOut = otherPortOut.parent;
                            if (otherOpOut.uiAttribs.subPatch != patchId) {
                                console.log('found outside connection!! ', otherPortOut.name);
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
    };

    getSubpatchPathArray(subId, arr)
    {
        arr = arr || [];
        const ops=gui.corePatch().ops;
        for (var i=0;i< ops.length;i++) {
            if (ops[i].objName == CABLES.UI.OPNAME_SUBPATCH && ops[i].patchId) {
                if (ops[i].patchId.get() == subId) {
                    arr.push({
                        name: ops[i].name,
                        id: ops[i].patchId.get()
                    });
                    if (ops[i].uiAttribs.subPatch !== 0) this.getSubpatchPathArray(ops[i].uiAttribs.subPatch, arr);
                }
            }
        }
        return arr;
    }

    updateSubPatchBreadCrumb(currentSubPatch)
    {
        const names = this.getSubpatchPathArray(currentSubPatch);
        var str = '<a onclick="gui.patch().setCurrentSubPatch(0)">Main</a> ';

        for (var i = names.length - 1; i >= 0; i--)
        {
            if(i>=0) str+='<span class="sparrow">&rsaquo;</span>';
            str += '<a onclick="gui.patch().setCurrentSubPatch(\'' + names[i].id + '\')">' + names[i].name + '</a>';
        }

        document.getElementById("subpatch_breadcrumb").innerHTML=str;
    };

    clipboardCutOps(e)
    {
        this.clipboardCopyOps(e);
        this.deleteSelectedOps();
    };

    clipboardCopyOps(e)
    {
        const selectedOps=this.getSelectedOps();
        var ops = [];
        var opIds = [];
        var j=0,i=0,k=0,l=0;

        for (i in selectedOps) {
            if (selectedOps[i].objName == CABLES.UI.OPNAME_SUBPATCH) {
                console.log('selecting subpatch', selectedOps[i].patchId.get());
                self.selectAllOpsSubPatch(selectedOps[i].patchId.get());
            }
        }

        for (i in selectedOps) {
            ops.push(selectedOps[i].getSerialized());
            opIds.push(selectedOps[i].id);
            // selectedOps[i].oprect.showCopyAnim();
        }

        // remove links that are not fully copied...
        for (i = 0; i < ops.length; i++) {
            for (j = 0; j < ops[i].portsIn.length; j++) {
                if (ops[i].portsIn[j].links) {
                    k = ops[i].portsIn[j].links.length;
                    while (k--) {
                        if (ops[i].portsIn[j].links[k] && ops[i].portsIn[j].links[k].objIn && ops[i].portsIn[j].links[k].objOut) {
                            if (!CABLES.UTILS.arrayContains(opIds, ops[i].portsIn[j].links[k].objIn) || !CABLES.UTILS.arrayContains(opIds, ops[i].portsIn[j].links[k].objOut)) {
                                ops[i].portsIn[j].links[k] = null;
                            }
                        }
                    }
                }
            }
        }

        var objStr = JSON.stringify({
            "ops": ops
        });
        CABLES.UI.notify('Copied ' + selectedOps.length + ' ops');

        e.clipboardData.setData('text/plain', objStr);
        e.preventDefault();
    }
    
















    clipboardPaste(e,oldSub,mouseX,mouseY,next)
    {
        if (e.clipboardData.types.indexOf('text/plain') == -1)
        {
            console.error("clipboard not type text");
            CABLES.UI.notifyError("Paste failed");
            return;
        }
        var str = e.clipboardData.getData('text/plain');
        e.preventDefault();

        str=str.replace("```",'');
        str=str.replace("```",'');

        var json = null;
        try {
            json = JSON.parse(str);
        } catch (exp) {
            CABLES.UI.notifyError("Paste failed");
            console.log(str);
            console.log(exp);
        }

        var undoGroup = CABLES.undo.startGroup();
        var k = 0;

        if (json) {
            if (json.ops) {

                var focusSubpatchop=null;
                gui.serverOps.loadProjectLibs(json, function() {
                    var i = 0,
                        j = 0; { // change ids
                        for (i in json.ops) {
                            var searchID = json.ops[i].id;
                            var newID = json.ops[i].id = CABLES.generateUUID();

                            json.ops[i].uiAttribs.pasted = true;

                            for (j in json.ops)
                            {
                                if (json.ops[j].portsIn)
                                    for (k in json.ops[j].portsIn) {
                                        if (json.ops[j].portsIn[k].links) {
                                            var l = json.ops[j].portsIn[k].links.length;
                                            while (l--) {
                                                if (json.ops[j].portsIn[k].links[l] === null) {
                                                    console.log('delete null link');
                                                    json.ops[j].portsIn[k].links.splice(l, 1);
                                                }
                                            }

                                            for (l in json.ops[j].portsIn[k].links) {
                                                if (json.ops[j].portsIn[k].links[l].objIn == searchID) json.ops[j].portsIn[k].links[l].objIn = newID;
                                                if (json.ops[j].portsIn[k].links[l].objOut == searchID) json.ops[j].portsIn[k].links[l].objOut = newID;
                                            }
                                        }
                                    }
                            }
                        }
                    } { // set correct subpatch


                        var subpatchIds = [];
                        var fixedSubPatches = [];
                        for (i = 0; i < json.ops.length; i++)
                        {
                            if (CABLES.Op.isSubpatchOp(json.ops[i].objName))
                            {
                                for (k in json.ops[i].portsIn)
                                {
                                    if (json.ops[i].portsIn[k].name == 'patchId')
                                    {
                                        var oldSubPatchId = json.ops[i].portsIn[k].value;
                                        var newSubPatchId = json.ops[i].portsIn[k].value = CABLES.generateUUID();

                                        console.log('oldSubPatchId', oldSubPatchId);
                                        console.log('newSubPatchId', newSubPatchId);
                                        subpatchIds.push(newSubPatchId);

                                        focusSubpatchop=json.ops[i];

                                        for (j = 0; j < json.ops.length; j++) {
                                            // console.log('json.ops[j].uiAttribs.subPatch',json.ops[j].uiAttribs.subPatch);

                                            if (json.ops[j].uiAttribs.subPatch == oldSubPatchId) {
                                                console.log('found child patch');

                                                json.ops[j].uiAttribs.subPatch = newSubPatchId;
                                                fixedSubPatches.push(json.ops[j].id);
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        for (i in json.ops) {
                            var found = false;
                            for (j = 0; j < fixedSubPatches.length; j++) {
                                if (json.ops[i].id == fixedSubPatches[j]) {
                                    found = true;
                                    break;
                                }
                            }
                            if (!found) {
                                json.ops[i].uiAttribs.subPatch = oldSub;
                            }
                        }

                        for(i in subpatchIds)
                            gui.patch().setCurrentSubPatch(subpatchIds[i]);
                    }

                    { // change position of ops to paste
                        var minx = Number.MAX_VALUE;
                        var miny = Number.MAX_VALUE;

                        for (i in json.ops) {
                            if (json.ops[i].uiAttribs && json.ops[i].uiAttribs && json.ops[i].uiAttribs.translate) {
                                minx = Math.min(minx, json.ops[i].uiAttribs.translate.x);
                                miny = Math.min(miny, json.ops[i].uiAttribs.translate.y);
                            }
                        }

                        for (i in json.ops) {
                            if (json.ops[i].uiAttribs && json.ops[i].uiAttribs && json.ops[i].uiAttribs.translate) {

                                var x=json.ops[i].uiAttribs.translate.x + mouseX - minx;
                                var y=json.ops[i].uiAttribs.translate.y + mouseY - miny;
                                if(CABLES.UI.userSettings.get("snapToGrid"))
                                {
                                    x=CABLES.UI.snapOpPosX(x);
                                    y=CABLES.UI.snapOpPosY(y);
                                }
                                json.ops[i].uiAttribs.translate.x = x;
                                json.ops[i].uiAttribs.translate.y = y;

                            }

                            var undofunc = function(op) {
                                const opid=op.id;

                                CABLES.undo.add({
                                    title:"paste op",
                                    undo: function() {
                                        gui.scene().deleteOp(opid, true);
                                    },
                                    redo: function() {
                                        gui.patch().paste(e);
                                    }
                                });
                
                            }(json.ops[i]);
                        }
                    }

                    CABLES.UI.notify('Pasted ' + json.ops.length + ' ops');
                    

                    gui.patch().scene.deSerialize(json, false);

                    next(json.ops,focusSubpatchop);

                    return;
                });
            }
        }
        CABLES.undo.endGroup(undoGroup,"Paste");
    }


}
