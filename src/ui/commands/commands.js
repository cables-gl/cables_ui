var CABLES =CABLES||{};
CABLES.CMD=CABLES.CMD||{};
CABLES.CMD.commands=CABLES.CMD.commands||[];




CABLES.CMD.exec=function(cmd)
{
    var found=false;
	for(var i=0;i<CABLES.CMD.commands.length;i++)
	{
		if(CABLES.CMD.commands[i].cmd==cmd)
		{
			CABLES.CMD.commands[i].func();
            found=true;
		}
	}
    if(!found)console.log("command not found:"+cmd);

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
