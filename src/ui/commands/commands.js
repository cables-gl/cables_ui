import debugCommands from "./cmd_debug.js";
import opCommands from "./cmd_op.js";
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
commands = commands.concat(opCommands.commands);

CMD.DEBUG = debugCommands.functions;
CMD.PATCH = patchCommands.functions;
CMD.OP = opCommands.functions;
CMD.RENDERER = rendererCommands.functions;
CMD.TIMELINE = timelineCommands.functions;
CMD.UI = uiCommands.functions;

CMD.commands = commands;

for (let i = 0; i < commands.length; i++)
{
    if (!commands[i].category)console.log("cmd has no category ", commands[i].cmd);
}

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

