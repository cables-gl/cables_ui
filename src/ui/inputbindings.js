import { CmdPatch } from "./commands/cmd_patch.js";
import { Commands } from "./commands/commands.js";

/**
 * @typedef BindingObject
 * @property {String} title
 * @property {String} id
 * @property {function} [default]
 * @property {function} [func]
 */

export class InputBindings
{
    static MOUSE_PATCH_DBL_CLICK = "patch_dbl_cl";
    static MOUSE_PATCH_RIGHT_CLICK = "patch_right_cl";
    static MOUSE_PATCH_MIDDLE_CLICK = "patch_middle_cl";

    /** @type {BindingObject[]}} */
    static MOUSE_ACTIONS = [
        {
            "id": InputBindings.MOUSE_PATCH_DBL_CLICK,
            "default": CmdPatch.gotoParentSubpatch,
            "func": CmdPatch.gotoParentSubpatch,
            "title": "Patchfield Double Click"
        },
        {
            "id": InputBindings.MOUSE_PATCH_RIGHT_CLICK,
            "default": null,
            "func": null,
            "title": "Patchfield Background Right Click"
        },
        {
            "id": InputBindings.MOUSE_PATCH_MIDDLE_CLICK,
            "default": null,
            "func": null,
            "title": "Patchfield Background Middle Click"
        }
    ];

    // bindings = { };

    constructor()
    {
        // this.bindings[InputBindings.MOUSE_PATCH_DBL_CLICK] = { "func": CmdPatch.gotoParentSubpatch };

    }

    /**
     * @param {string} actionid
     */
    getBind(actionid)
    {
        for (let i = 0; i < InputBindings.MOUSE_ACTIONS.length; i++)
        {
            if (InputBindings.MOUSE_ACTIONS[i].id == actionid)
                return InputBindings.MOUSE_ACTIONS[i];
        }
    }

    /**
     * @param {string} actionId
     * @param {Function} f
     */
    setBindingFunc(actionId, f)
    {
        const b = this.getBind(actionId);

        if (!b)
        {
            console.log("could not find bind for action", actionId);
        }
        else
        {
            b.func = f;
        }
    }

    /**
     * @param {string} which
     */
    exec(which)
    {
        console.log("whichhnhh", which);
        const b = this.getBind(which);

        let cmd = {};
        console.log("bbbbb", b);

        cmd = Commands.getCommandByFunction(b.func);
        console.log(cmd);
        Commands.exec(cmd.cmd);
    }
}
