CABLES=CABLES||{};
CABLES.UI=CABLES.UI||{};
CABLES.UI.TOOLS=CABLES.UI.TOOLS||{};


CABLES.UI.TOOLS.compressSelectedOps = function(ops)
{
    if (!ops || ops.length === 0) return;

    CABLES.UI.TOOLS.saveUndoSelectedOpsPositions(ops);

    ops.sort(function(a, b) { return a.uiAttribs.translate.y - b.uiAttribs.translate.y; });

    var y = ops[0].uiAttribs.translate.y;

    for (var j = 0; j < ops.length; j++)
    {
        if (j > 0) y += (ops[j].uiAttribs.height || CABLES.UI.uiConfig.opHeight) + 10;
        CABLES.UI.TOOLS.setOpPos(ops[j],ops[j].uiAttribs.translate.x, y);
    }
};

CABLES.UI.TOOLS.alignSelectedOpsVert = function(ops)
{
    if (ops.length > 0) {
        var j = 0;
        var sum = 0;
        for (j in ops) sum += ops[j].uiAttribs.translate.x;

        var avg = sum / ops.length;

        if(CABLES.UI.userSettings.get("snapToGrid")) avg=CABLES.UI.snapOpPosX(avg);

        for (j in ops) this.setOpPos(ops[j],avg, ops[j].uiAttribs.translate.y);

    }
    return ops;
};

CABLES.UI.TOOLS.alignSelectedOpsHor = function(ops)
{
    if (ops.length > 0)
    {
        var j = 0,sum = 0;
        for (j in ops) sum += ops[j].uiAttribs.translate.y;

        var avg = sum / ops.length;

        if(CABLES.UI.userSettings.get("snapToGrid")) avg=CABLES.UI.snapOpPosY(avg);

        // for (j in ops) this.setOpPos(op,x,y);
        for (j in ops) this.setOpPos(ops[j],ops[j].uiAttribs.translate.x,avg);
    }
    return ops;
};

CABLES.UI.TOOLS.setOpPos=function(op,x,y)
{
    op.setUiAttrib(
        {
            "translate":
            {
                "x":x,
                "y":y
            }
        });
};

CABLES.UI.TOOLS.saveUndoSelectedOpsPositions = function(selectedOps)
{
    var opPositions = [];
    for (var j = 0; j < selectedOps.length; j++)
    {
        var obj = {};
        obj.id = selectedOps[j].id;
        obj.x = selectedOps[j].uiAttribs.translate.x;
        obj.y = selectedOps[j].uiAttribs.translate.y;
        opPositions.push(obj);
    }

    CABLES.undo.add({
        undo: function()
        {

            var changedOps=[];
            for (var j = 0; j < opPositions.length; j++)
            {
                var obj = opPositions[j];
                const op=gui.scene().getOpById(obj.id);
                CABLES.UI.TOOLS.setOpPos(op,obj.x, obj.y);
                changedOps.push(op);
            }

            // update svg patch...
            gui.patch().updatedOpPositionsFromUiAttribs(changedOps);
        },
        redo: function()
        {
            // gui.scene().addOp(objName, op.uiAttribs, opid);
        }
    });
};


CABLES.UI.TOOLS.alignOps = function(selectedOps)
{
    var sumX = 0,
        minX = 9999999,
        sumY = 0,
        minY = 9999999,
        maxX = -9999999,
        maxY= -9999999,
        j = 0;

    CABLES.UI.TOOLS.saveUndoSelectedOpsPositions(selectedOps);

    for (j in selectedOps)
    {
        minX = Math.min(minX, selectedOps[j].uiAttribs.translate.x);
        minY = Math.min(minY, selectedOps[j].uiAttribs.translate.y);

        maxX = Math.max(maxX, selectedOps[j].uiAttribs.translate.x);
        maxY = Math.max(maxY, selectedOps[j].uiAttribs.translate.y);
    }

    if (Math.abs(maxX-minX) > Math.abs(maxY-minY)) CABLES.UI.TOOLS.alignSelectedOpsHor(selectedOps);
    else CABLES.UI.TOOLS.alignSelectedOpsVert(selectedOps);

    return selectedOps;
};
