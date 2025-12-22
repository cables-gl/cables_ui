import { CmdPatch } from "./commands/cmd_patch.js";
import CMD, { Commands } from "./commands/commands.js";

export class InputBindings
{
    static MOUSE_PATCH_DBL_CLICK = "patch_dbl_cl";
    static MOUSE_PATCH_RIGHT_CLICK = "patch_right_cl";
    static MOUSE_PATCH_MIDDLE_CLICK = "patch_middle_cl";

    bindings = { };

    constructor()
    {
        this.bindings[InputBindings.MOUSE_PATCH_DBL_CLICK] = { "cmd": CmdPatch.gotoParentSubpatch.name };

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
        Commands.exec(b.func);
    }
}
new InputBindings();
console.log("text", CmdPatch.gotoParentSubpatch.name);
