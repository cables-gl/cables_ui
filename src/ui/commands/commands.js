var CABLES =CABLES||{};
CABLES.CMD=CABLES.CMD||{};
CABLES.CMD.commands=CABLES.CMD.commands||[];




CABLES.CMD.exec=function(cmd)
{
	for(var i=0;i<CABLES.CMD.commands.length;i++)
	{
		if(CABLES.CMD.commands[i].cmd==cmd)
		{
			console.log("CMD found!"+cmd);
			CABLES.CMD.commands[i].func();
		}
	}

};

/*
 * Returns a command-object by its name
 */
CABLES.CMD.getCmd = function(cmd) {
	var commands = CABLES.CMD.commands;
	for(var i=0; i<commands.length; i++) {
		if(commands[i].cmd === cmd) {
			return commands[i];
		}
	}
};

console.log('init commands');
