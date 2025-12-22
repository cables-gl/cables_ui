import { CmdDebug } from "./cmd_debug.js";
import { CmdFiles } from "./cmd_files.js";
import { CmdOps } from "./cmd_op.js";
import { CmdPatch } from "./cmd_patch.js";
import { CmdRenderer } from "./cmd_renderer.js";
import { CmdTimeline } from "./cmd_timeline.js";
import { CmdUi } from "./cmd_ui.js";

/**
 * @typedef CommandObject
 * @property {string} cmd
 * @property {function} func
 * @property {string} category
 * @property {string} [icon]
 * @property {string} [infotext]
 * @property {string} [hotkey]
 * @property {boolean} [keybindable]
 * @property {("hasCommunity"|"showRemoteViewer")} [frontendOption]
 */

/** @type {CommandObject[]} */
let cblCommands = [];

cblCommands = cblCommands.concat(CmdDebug.commands);
cblCommands = cblCommands.concat(CmdPatch.commands);
cblCommands = cblCommands.concat(CmdRenderer.commands);
cblCommands = cblCommands.concat(CmdTimeline.commands);
cblCommands = cblCommands.concat(CmdUi.commands);
cblCommands = cblCommands.concat(CmdOps.commands);
cblCommands = cblCommands.concat(CmdFiles.commands);

for (let i = 0; i < cblCommands.length; i++)
{
    if (cblCommands[i])
        if (!cblCommands[i].category) console.warn("cmd has no category ", cblCommands[i].cmd);
}

export { Commands };
class Commands
{

    static commands = cblCommands;

    /**
     * @returns {CommandObject[]}
     */
    static getKeyBindableCommands()
    {
        const arr = [];
        for (let i = 0; i < cblCommands.length; i++)
        {
            if (cblCommands[i].keybindable)
                arr.push(cblCommands[i]);

        }
        console.log("arr", arr);
        return arr;
    }

    /**
     * @param {string} cmd
     */
    static exec(cmd)
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
    }
}
const CMD = {
    "FILES": CmdFiles,
    "UI": CmdUi,
    "DEBUG": CmdDebug,
    "OP": CmdOps,
    "PATCH": CmdPatch,
    "RENDERER": CmdRenderer,
    "TIMELINE": CmdTimeline,
    "commands": cblCommands,
    "exec": Commands.exec
};

export default CMD;
