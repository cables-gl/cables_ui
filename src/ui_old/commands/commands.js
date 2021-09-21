CABLES = CABLES || {};
CABLES.CMD = CABLES.CMD || {};
CABLES.CMD.commands = CABLES.CMD.commands || [];


CABLES.CMD.exec = function (cmd)
{
    let found = false;
    for (let i = 0; i < CABLES.CMD.commands.length; i++)
    {
        if (CABLES.CMD.commands[i].cmd == cmd)
        {
            if (CABLES.CMD.commands[i].func)
            {
                CABLES.CMD.commands[i].func();
                found = true;
            }
            else
            {
                console.log("cmd has no func", cmd, CABLES.CMD.commands[i]);
            }
        }
    }
    if (!found)console.log("command not found:" + cmd);
};

/*
 * Returns a command-object by its name
 */
CABLES.CMD.getCmd = function (cmd)
{
    const commands = CABLES.CMD.commands;
    for (let i = 0; i < commands.length; i++)
    {
        if (commands[i].cmd === cmd)
        {
            return commands[i];
        }
    }
};
