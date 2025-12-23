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
    static KEY_1 = "key_1";
    static KEY_2 = "key_2";
    static KEY_3 = "key_3";
    static KEY_4 = "key_4";
    static KEY_5 = "key_5";
    static KEY_6 = "key_6";
    static KEY_7 = "key_7";
    static KEY_8 = "key_8";
    static KEY_9 = "key_9";
    static KEY_0 = "key_0";

    /** @type {BindingObject[]} */
    static ACTIONS = [
        {
            "title": "Background Double Click",
            "id": InputBindings.MOUSE_PATCH_DBL_CLICK,
            "default": CmdPatch.gotoParentSubpatch,
            "func": CmdPatch.gotoParentSubpatch,
            "category": "Patchfield Mouse"
        },
        {
            "title": "Background Right Click",
            "id": InputBindings.MOUSE_PATCH_RIGHT_CLICK,
            "default": null,
            "func": null,
            "category": "Patchfield Mouse"
        },
        {
            "title": "Key 1",
            "id": InputBindings.KEY_1,
            "default": null,
            "func": null,
            "category": "Keyboard Global"
        },
        {
            "title": "Key 2",
            "id": InputBindings.KEY_2,
            "default": null,
            "func": null,
            "category": "Keyboard Global"
        },
        {
            "title": "Key 3",
            "id": InputBindings.KEY_3,
            "default": null,
            "func": null,
            "category": "Keyboard Global"
        },
        {
            "title": "Key 4",
            "id": InputBindings.KEY_4,
            "default": null,
            "func": null,
            "category": "Keyboard Global"
        },
        {
            "title": "Key 5",
            "id": InputBindings.KEY_5,
            "default": null,
            "func": null,
            "category": "Keyboard Global"
        },
        {
            "title": "Key 6",
            "id": InputBindings.KEY_6,
            "default": null,
            "func": null,
            "category": "Keyboard Global"
        },
        {
            "title": "Key 7",
            "id": InputBindings.KEY_7,
            "default": null,
            "func": null,
            "category": "Keyboard Global"
        },
        {
            "title": "Key 8",
            "id": InputBindings.KEY_8,
            "default": null,
            "func": null,
            "category": "Keyboard Global"
        },
        {
            "title": "Key 9",
            "id": InputBindings.KEY_9,
            "default": null,
            "func": null,
            "category": "Keyboard Global"
        },
        {
            "title": "Key 0",
            "id": InputBindings.KEY_0,
            "default": null,
            "func": null,
            "category": "Keyboard Global"
        }
    ];

    constructor()
    {
        const userBinds = userSettings.get(InputBindings.USERSETTINGNAME) || [];
        for (let i = 0; i < userBinds.length; i++)
        {
            const cmd = Commands.getCommandByName(userBinds[i].cmd);
            this.setBindingFunc(userBinds[i].id, cmd.func, false);
        }

    }

    save()
    {
        const addbinds = [];
        for (let i = 0; i < InputBindings.ACTIONS.length; i++)
        {
            if (InputBindings.ACTIONS[i].default != InputBindings.ACTIONS[i].func)
            {
                const cmd = Commands.getCommandByFunction(InputBindings.ACTIONS[i].func);
                addbinds.push({ "id": InputBindings.ACTIONS[i].id, "cmd": cmd.cmd });

            }

        }
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
