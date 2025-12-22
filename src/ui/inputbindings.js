import { CmdPatch } from "./commands/cmd_patch.js";
import { Commands } from "./commands/commands.js";
import { userSettings } from "./components/usersettings.js";

/**
 * @typedef BindingObject
 * @property {String} title
 * @property {String} category
 * @property {String} id
 * @property {function} default
 * @property {function} func
 */

export class InputBindings
{
    static USERSETTINGNAME = "inputbinds";
    static MOUSE_PATCH_DBL_CLICK = "patch_dbl_cl";
    static MOUSE_PATCH_RIGHT_CLICK = "patch_right_cl";
    static MOUSE_PATCH_MIDDLE_CLICK = "patch_middle_cl";

    /** @type {BindingObject[]} */
    static ACTIONS = [
        {
            "id": InputBindings.MOUSE_PATCH_DBL_CLICK,
            "default": CmdPatch.gotoParentSubpatch,
            "func": CmdPatch.gotoParentSubpatch,
            "title": "Double Click",
            "category": "Patchfield Mouse"
        },
        {
            "id": InputBindings.MOUSE_PATCH_RIGHT_CLICK,
            "default": null,
            "func": null,
            "title": " Background Right Click",
            "category": "Patchfield Mouse"
        }
    ];

    constructor()
    {
        const userBinds = userSettings.get(InputBindings.USERSETTINGNAME);
        for (let i = 0; i < userBinds.length; i++)
        {
            const cmd = Commands.getCommandByName(userBinds[i].cmd);
            this.setBindingFunc(userBinds[i].id, cmd.func, false);
        }

    }

    save()
    {
        console.log("saved userbinds");
        const addbinds = [];
        for (let i = 0; i < InputBindings.ACTIONS.length; i++)
        {
            if (InputBindings.ACTIONS[i].default != InputBindings.ACTIONS[i].func)
            {
                const cmd = Commands.getCommandByFunction(InputBindings.ACTIONS[i].func);
                addbinds.push({ "id": InputBindings.ACTIONS[i].id, "cmd": cmd.cmd });

            }

        }
        console.log("addbinds", addbinds);
        userSettings.set(InputBindings.USERSETTINGNAME, addbinds);

    }

    /**
     * @param {string} actionid
     */
    getBind(actionid)
    {
        for (let i = 0; i < InputBindings.ACTIONS.length; i++)
        {
            if (InputBindings.ACTIONS[i].id == actionid)
                return InputBindings.ACTIONS[i];
        }
    }

    /**
     * @param {string} actionId
     * @param {Function} f
     * @param {boolean} userInteraction
     */
    setBindingFunc(actionId, f, userInteraction)
    {
        const b = this.getBind(actionId);

        if (!b)
        {
            console.log("could not find bind for action", actionId);
        }
        else
        {
            b.func = f || b.default;
        }
        console.log("userint", userInteraction);
        if (userInteraction) this.save();
    }

    /**
     * @param {string} which
     */
    exec(which)
    {
        const b = this.getBind(which);

        let cmd = {};

        cmd = Commands.getCommandByFunction(b.func);
        if (cmd)
            Commands.exec(cmd.cmd);
        else
            console.log("command not found", cmd);
    }
}
