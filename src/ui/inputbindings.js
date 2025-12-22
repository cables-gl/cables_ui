import { CmdPatch } from "./commands/cmd_patch.js";
import { Commands } from "./commands/commands.js";

export class InputBindings
{
    static MOUSE_PATCH_DBL_CLICK = "patch_dbl_cl";
    static MOUSE_PATCH_RIGHT_CLICK = "patch_right_cl";
    static MOUSE_PATCH_MIDDLE_CLICK = "patch_middle_cl";

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
        }
    ];

    bindings = { };

    constructor()
    {
        this.bindings[InputBindings.MOUSE_PATCH_DBL_CLICK] = { "func": CmdPatch.gotoParentSubpatch };

    }

    /**
     * @param {string} which
     */
    getBind(which)
    {
        return this.bindings[which];
    }

    exec(which)
    {
        console.log("whichhnhh", which);
        const b = this.getBind(which);

        let cmd = {};

        cmd = Commands.getCommandByFunction(b.func);
        console.log(cmd);
        Commands.exec(cmd.cmd);
    }
}
