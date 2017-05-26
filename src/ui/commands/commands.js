var CABLES =CABLES||{};
CABLES.CMD=CABLES.CMD||{};
CABLES.CMD.commands=CABLES.CMD.commands||[];




CABLES.CMD.exec=function(cmd)
{
	for(var i=0;i<CABLES.CMD.commands.length;i++)
	{
		if(CABLES.CMD.commands[i].cmd==cmd)
		{
			console.log("CMD found!");
			CABLES.CMD.commands[i].func();
		}
	}

};

console.log('init commands');
