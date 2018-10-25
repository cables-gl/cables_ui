var CABLES =CABLES||{};
CABLES.CMD=CABLES.CMD||{};
CABLES.CMD.PATCH={};
CABLES.CMD.TIMELINE={};
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

CABLES.CMD.PATCH.findUnconnectedOps=function()
{
	gui.find().show(':unconnected');
};

CABLES.CMD.PATCH.findUserOps=function()
{
	gui.find().show(':user');
};



CABLES.CMD.PATCH.createFile=function()
{
    CABLES.UI.MODAL.prompt(
        "Create new file",
        "Enter filename",
        "newfile.txt",
        function(fn)
        {
			CABLES.api.put(
				'project/' + gui.patch().getCurrentProject()._id + '/'+fn, {
					content: 'this is an empty file...'
				},
				function(res) {
					CABLES.UI.notify("file created");
					CABLES.UI.fileSelect.refresh();
				},
				function(res) {
					CABLES.UI.notifyError("error: file not created");
					CABLES.UI.fileSelect.refresh();
					console.log('err res', res);
				}
			);
		});

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


CABLES.CMD.PATCH.setOpTitle=function()
{
	var ops=gui.patch().getSelectedOps();
	if(ops.length!=1)
	{
		console.log("rename canceled - select one op!");
		return;
	}

	CABLES.UI.MODAL.prompt(
		"Set Title",
		"Enter a title for this op",
		ops[0].op.name,
		function(name) {
			gui.patch().setCurrentOpTitle(name); 
		});
}


CABLES.CMD.PATCH.tidyChildOps=function()
{
	var selops=gui.patch().getSelectedOps();
	var opWidth=150;
	var opHeight=40;

	function getChildColumns(op,depth)
	{
		depth=depth||0;
		var childs=op.getOutChilds();
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
	gui.patch().updateSubPatches();


};

CABLES.CMD.TIMELINE.setLength=function()
{
	gui.timeLine().setProjectLength();
};

CABLES.CMD.PATCH.resume=function()
{
	gui.patch().scene.resume();
};

CABLES.CMD.PATCH.pause=function()
{
	gui.patch().scene.pause();
};

CABLES.CMD.PATCH.replaceFilePath=function()
{
    CABLES.UI.MODAL.prompt(
        "Replace String Values",
        "Search for...",
        "assets/",
        function(srch)
        {
			CABLES.UI.MODAL.prompt(
				"Replace String Values",
				"...replace with",
				"/assets/"+gui.project()._id+'/',
				function(rplc)
				{
					var ops=gui.patch().ops;
					for(var i=0;i<ops.length;i++)
					{
						for(var j=0;j<ops[i].portsIn.length;j++)
						{
							if(ops[i].portsIn[j].thePort.uiAttribs && ops[i].portsIn[j].thePort.uiAttribs.display && ops[i].portsIn[j].thePort.uiAttribs.display=='file')
							{
								console.log("filename:",ops[i].portsIn[j].thePort.get());
								console.log('srch',srch);
								console.log('rplc',rplc);
								var v=ops[i].portsIn[j].thePort.get();

								if(v) console.log('srch index',v.indexOf(srch));
								if(v && v.indexOf(srch)==0)
								{
									v=rplc+v.substring(srch.length);
									ops[i].portsIn[j].thePort.set(v);
									console.log('result filename:',v);
								}
							}
						}
					}
				});
		});
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
		cmd:"create new file",
		category:"patch",
		func:CABLES.CMD.PATCH.createFile,
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
		cmd:"set title",
		category:"op",
		func:CABLES.CMD.PATCH.setOpTitle,
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
	},
	{
		cmd:"set timeline length",
		category:"timeline",
		func:CABLES.CMD.TIMELINE.setLength
	},
	{
		cmd:"pause patch execution",
		category:"patch",
		func:CABLES.CMD.PATCH.pause
	},
	{
		cmd:"resume patch execution",
		category:"patch",
		func:CABLES.CMD.PATCH.resume
	},
	{
		cmd:"replace file path",
		category:"patch",
		func:CABLES.CMD.PATCH.replaceFilePath
	},
	{
		cmd:"find unconnected ops",
		category:"patch",
		func:CABLES.CMD.PATCH.findUnconnectedOps
	},
	{
		cmd:"find user ops",
		category:"patch",
		func:CABLES.CMD.PATCH.findUserOps
	}


);
