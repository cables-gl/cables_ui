import debugCommands from "./cmd_debug.js";
import patchCommands from "./cmd_patch.js";
import rendererCommands from "./cmd_renderer.js";
import timelineCommands from "./cmd_timeline.js";
import uiCommands from "./cmd_ui.js";

const CMD = {};
let commands = [];

commands = commands.concat(debugCommands.commands);
commands = commands.concat(patchCommands.commands);
commands = commands.concat(rendererCommands.commands);
commands = commands.concat(timelineCommands.commands);
commands = commands.concat(uiCommands.commands);

CMD.DEBUG = debugCommands.functions;
CMD.PATCH = patchCommands.functions;
CMD.RENDERER = rendererCommands.functions;
CMD.TIMELINE = timelineCommands.functions;
CMD.UI = uiCommands.functions;

CMD.commands = commands;

export default CMD;

CMD.exec = function (cmd)
{
    let found = false;
    for (let i = 0; i < CMD.commands.length; i++)
    {
        if (CMD.commands[i].cmd == cmd)
        {
            if (CMD.commands[i].func)
            {
                CMD.commands[i].func();
                found = true;
            }
            else
            {
                console.warn("cmd has no func", cmd, CMD.commands[i]);
            }
        }
    }


    if (!found)console.warn("command not found:" + cmd);
};

/*
 * Returns a command-object by its name
 */
// CABLES.CMD.getCmd = function (cmd)
// {
//     const commands = CABLES.CMD.commands;
//     for (let i = 0; i < commands.length; i++)
//     {
//         if (commands[i].cmd === cmd)
//         {
//             return commands[i];
//         }
//     }
// };
