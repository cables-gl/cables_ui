var CABLES =CABLES||{};
CABLES.CMD=CABLES.CMD||{};
CABLES.CMD.PATCH={};
CABLES.CMD.commands=CABLES.CMD.commands||[];

CABLES.CMD.PATCH.selectAllOps=function()
{
	gui.patch().selectAllOps();
};

CABLES.CMD.PATCH.deleteSelectedOps=function()
{
	gui.patch().deleteSelectedOps();
};

CABLES.CMD.PATCH.reload=function()
{
	document.location.reload();
};

CABLES.CMD.PATCH.save=function()
{
    if(!CABLES.UI.lastSave || Date.now()-CABLES.UI.lastSave>1000)
    {
        gui.patch().saveCurrentProject();
        CABLES.UI.lastSave=Date.now();
    }
};

CABLES.CMD.PATCH.saveAs=function()
{
	gui.patch().saveCurrentProjectAs();
};

CABLES.CMD.PATCH.clear=function()
{
	gui.scene().clear();
};

CABLES.CMD.PATCH.selectChilds=function()
{
	gui.patch().selectChilds();
};

CABLES.CMD.PATCH.createSubPatchFromSelection=function()
{
	gui.patch().createSubPatchFromSelection();
};

CABLES.CMD.PATCH.uploadFile=function()
{
	var fileElem = document.getElementById("hiddenfileElem");
	if (fileElem) fileElem.click();
};

CABLES.CMD.PATCH.opsAlignHorizontal=function()
{
	gui.patch().alignSelectedOps();
};

CABLES.CMD.PATCH.opsCompress=function()
{
	gui.patch().compressSelectedOps();
};


CABLES.CMD.PATCH.export=function()
{
	gui.patch().exportStatic();
};

CABLES.CMD.PATCH.newPatch=function()
{
	gui.createProject();
};

CABLES.CMD.PATCH.addOp=function()
{
	gui.opSelect().showOpSelect({x:0,y:0});
};

CABLES.CMD.PATCH.renameOp=function()
{
	CABLES.UI.MetaCode.rename();
};

CABLES.CMD.PATCH.patchWebsite=function()
{
	window.open("/p/"+gui.patch().getCurrentProject()._id);


	// console.log(gui.patch().getCurrentProject()._id);
};

CABLES.CMD.PATCH.createVariable=function(op)
{
	CABLES.UI.MODAL.prompt("New Variable","enter a name for the new variable",'',
		function(str)
		{
			if(op)
			{
				op.setTitle(str);
				op.varName.set(str);
				gui.patch().showOpParams(op);
			}


		});

};


CABLES.CMD.PATCH.editOp=function()
{
    var selops=gui.patch().getSelectedOps();

    if(selops && selops.length>0)
    {
        console.log('edit op!');

        for(var i=0;i<selops.length;i++)
        {
            gui.serverOps.edit(selops[i].op.objName);
        }
    }
    else
    {
        console.log('no ops selected');
    }
};

















CABLES.CMD.PATCH.tidyChildOps=function()
{
	var selops=gui.patch().getSelectedOps();
	
	var opWidth=150;
	var opHeight=40;

	function getChildColumns(op,depth)
	{
		depth=depth||0;
		var childs=op.getOutChilds();
		// num=Math.max(num,childs.length);
		for(var i=0;i<childs.length;i++)
		{
			
			depth=getChildColumns(childs[i],depth);
			if(i>0)depth++;
		}

		return depth;
	}


	function tidyChilds(op,parentX,parentY)
	{
		var childs=op.getOutChilds();
		var addY=0;
		if(childs.length>1) addY=opHeight*0.5;

		console.log(op.name+' child columns:',getChildColumns(op));
		var i=0;
		var childWidth=0;
		for(i=0;i<childs.length;i++)
		{
			if(i>0)childWidth+=getChildColumns(childs[i-1])*opWidth;

			childs[i].uiAttr({
				translate:{
					x:parentX+childWidth+(i*opWidth),
					y:parentY+opHeight+addY
				}
			});
		}

		for(i=0;i<childs.length;i++)
		{
			tidyChilds(childs[i],childs[i].uiAttribs.translate.x,childs[i].uiAttribs.translate.y);
		}
	}

    if(selops && selops.length>0)
    {
        console.log('tidy!');

        for(i=0;i<selops.length;i++)
        {
			var op=selops[i].op;
			var y=op.uiAttribs.translate.y;
			var x=op.uiAttribs.translate.x;
	
			tidyChilds(op,x,y);

        }
    }
	
	for(i=0;i<gui.patch().ops.length;i++)
	{
		gui.patch().ops[i].setPosFromUiAttr();
	}


};















CABLES.CMD.commands.push(
	{
		cmd:"select all ops",
		category:"patch",
		func:CABLES.CMD.PATCH.selectAllOps,
		hotkey:'CMD + a'
	},
	{
		cmd:"delete selected ops",
		category:"patch",
		func:CABLES.CMD.PATCH.deleteSelectedOps,
		icon:'trash',
		hotkey:'DEL'
	},
	{
		cmd:"rename op",
		category:"op",
		func:CABLES.CMD.PATCH.renameOp,
		icon:'edit'
	},



	{
		cmd:"reload patch",
		category:"patch",
		func:CABLES.CMD.PATCH.reload
	},
	{
		cmd:"save patch",
		category:"patch",
		func:CABLES.CMD.PATCH.save,
		icon:'save',
		hotkey:'CMD + s'
	},
	{
		cmd:"save patch as...",
		category:"patch",
		func:CABLES.CMD.PATCH.saveAs,
		icon:'save',
		hotkey:'CMD + SHIFT + s'
	},
	{
		cmd:"upload file",
		category:"patch",
		func:CABLES.CMD.PATCH.uploadFile,
		icon:'file'
	},
	{
		cmd:"select child ops",
		category:"op",
		func:CABLES.CMD.PATCH.selectChilds
	},
	{
		cmd:"align selected ops",
		category:"op",
		func:CABLES.CMD.PATCH.opsAlignHorizontal,
		hotkey:'a',
		icon:"align-left"
	},
	{
		cmd:"compress selected ops",
		category:"op",
		func:CABLES.CMD.PATCH.opsCompress,
		hotkey:'SHIFT + a',
		icon:"align-justify"
	},
	{
		cmd:"create subpatch",
		category:"patch",
		func:CABLES.CMD.PATCH.createSubPatchFromSelection,
		icon:"maximize"
	},
	{
		cmd:"export static html",
		category:"patch",
		func:CABLES.CMD.PATCH.export,
		icon:"download"
	},
	{
		cmd:"create new patch",
		category:"patch",
		func:CABLES.CMD.PATCH.newPatch,
		icon:"file"
	},
	{
		cmd:"add op",
		category:"patch",
		func:CABLES.CMD.PATCH.addOp,
		icon:"plus"
	},
	{
		cmd:"edit op",
		category:"op",
		func:CABLES.CMD.PATCH.editOp,
		icon:"edit"
	},
	{
		cmd:"clear patch",
		category:"patch",
		func:CABLES.CMD.PATCH.clear
	},
	{
		cmd:"open patch website",
		category:"patch",
		func:CABLES.CMD.PATCH.patchWebsite,
		icon:"link"
	},
	{
		cmd:"create variable",
		category:"patch",
		func:CABLES.CMD.PATCH.createVariable
	},
	{
		cmd:"tidy selected ops",
		category:"patch",
		func:CABLES.CMD.PATCH.tidyChildOps
	}

);
