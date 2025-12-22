import CMD from "./commands/commands.js";

export class InputBindings
{
    static MOUSE_PATCH_DBL_CLICK = "patch_dbl_cl";
    static MOUSE_PATCH_RIGHT_CLICK = "patch_right_cl";
    static MOUSE_PATCH_MIDDLE_CLICK = "patch_middle_cl";

    bindings = { };

    constructor()
    {
        this.bindings[InputBindings.MOUSE_PATCH_DBL_CLICK] = { "cmd": CMD.PATCH.gotoParentSubpatch.name };

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
        CMD.exec(b.func);
    }
}
