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
	gui.patch().saveCurrentProject();
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
		category:"op",
		func:CABLES.CMD.PATCH.createSubPatchFromSelection,
		icon:"maximize"
	}



);
