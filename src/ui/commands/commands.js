import debugCommands from "./cmd_debug.js";
import opCommands from "./cmd_op.js";
import patchCommands from "./cmd_patch.js";
import rendererCommands from "./cmd_renderer.js";
import timelineCommands from "./cmd_timeline.js";
import uiCommands from "./cmd_ui.js";
import fileCommands from "./cmd_files.js";

/**
 * @typedef commandObject
 * @property {string} cmd
 * @property {function} func
 * @property {string} category
 * @property {string} [icon]
 * @property {string} [infotext]
 * @property {string} [hotkey]
 * @property {("hasCommunity"|"showRemoteViewer")} [frontendOption]
 */

const CMD = {};
export let cblCommands = [];

cblCommands = cblCommands.concat(debugCommands.commands);
cblCommands = cblCommands.concat(patchCommands.commands);
cblCommands = cblCommands.concat(rendererCommands.commands);
cblCommands = cblCommands.concat(timelineCommands.commands);
cblCommands = cblCommands.concat(uiCommands.commands);
cblCommands = cblCommands.concat(opCommands.commands);
cblCommands = cblCommands.concat(fileCommands.commands);

CMD.DEBUG = debugCommands.functions;
CMD.PATCH = patchCommands.functions;
CMD.OP = opCommands.functions;
CMD.RENDERER = rendererCommands.functions;
CMD.TIMELINE = timelineCommands.functions;
CMD.UI = uiCommands.functions;
CMD.FILES = fileCommands.functions;

CMD.commands = cblCommands;

for (let i = 0; i < cblCommands.length; i++)
{
    if (!cblCommands[i].category)console.warn("cmd has no category ", cblCommands[i].cmd);
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
