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

export { Commands };
class Commands
{

    /** @type {CommandObject[]} */
    static commands = [];

    static init()
    {

        Commands.commands = Commands.commands.concat(CmdDebug.commands);
        Commands.commands = Commands.commands.concat(CmdPatch.commands);
        Commands.commands = Commands.commands.concat(CmdRenderer.commands);
        Commands.commands = Commands.commands.concat(CmdTimeline.commands);
        Commands.commands = Commands.commands.concat(CmdUi.commands);
        Commands.commands = Commands.commands.concat(CmdOps.commands);
        Commands.commands = Commands.commands.concat(CmdFiles.commands);

        for (let i = 0; i < Commands.commands.length; i++)
        {
            if (Commands.commands[i])
                if (!Commands.commands[i].category) console.warn("cmd has no category ", Commands.commands[i].cmd);
        }

        CMD.FILES = CmdFiles,
        CMD.UI = CmdUi,
        CMD.DEBUG = CmdDebug,
        CMD.OP = CmdOps,
        CMD.PATCH = CmdPatch,
        CMD.RENDERER = CmdRenderer,
        CMD.TIMELINE = CmdTimeline,
        CMD.commands = Commands.commands,
        CMD.exec = Commands.exec;
    }

    /**
     * @returns {CommandObject[]}
     */
    static getKeyBindableCommands()
    {
        const arr = [];
        for (let i = 0; i < Commands.commands.length; i++)
        {
            if (Commands.commands[i].keybindable)
                arr.push(Commands.commands[i]);

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
            if (Commands.commands[i].cmd == cmd)
            {
                if (Commands.commands[i].func)
                {
                    Commands.commands[i].func();
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

    /**
     * @param {function} func
     */
    static getCommandByFunction(func)
    {
        let cmd = null;
        for (let i = 0; i < Commands.commands.length; i++)
        {
            if (Commands.commands[i].func == func)
            {
                cmd = Commands.commands[i];
                break;
            }
        }
        return cmd;
    }
}
const CMD = {
};

export default CMD;
