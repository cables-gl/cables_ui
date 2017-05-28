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



CABLES.CMD.PATCH.uploadFile=function()
{
	var fileElem = document.getElementById("hiddenfileElem");
	if (fileElem) fileElem.click();
};




CABLES.CMD.commands.push(
	{
		cmd:"select all ops",
		category:"patch",
		func:CABLES.CMD.PATCH.selectAllOps
	},
	{
		cmd:"delete selected ops",
		category:"patch",
		func:CABLES.CMD.PATCH.deleteSelectedOps
	},
	{
		cmd:"reload patch",
		category:"patch",
		func:CABLES.CMD.PATCH.reload
	},
	{
		cmd:"save patch",
		category:"patch",
		func:CABLES.CMD.PATCH.save
	},
	{
		cmd:"upload file",
		category:"patch",
		func:CABLES.CMD.PATCH.uploadFile
	},


	{
		cmd:"select child ops",
		category:"op",
		func:CABLES.CMD.PATCH.selectChilds
	}


);
