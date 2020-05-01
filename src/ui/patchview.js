var CABLES=CABLES||{}
CABLES.UI=CABLES.UI||{};

CABLES.UI.PatchView=class extends CABLES.EventTarget
{
    constructor(corepatch)
    {
        super();
        this._p=corepatch;
        this._element=null;
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

    

}
