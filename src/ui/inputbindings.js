import { CmdPatch } from "./commands/cmd_patch.js";
import { Commands } from "./commands/commands.js";
import { userSettings } from "./components/usersettings.js";
import Gui, { gui } from "./gui.js";

/**
 * @typedef BindingObject
 * @property {String} title
 * @property {String} category
 * @property {String} id
 * @property {function} default
 * @property {function} func
 */

/**
 * @typedef KeyCombo
 * @property {String} key
 * @property {boolean} cmdCtrl
 * @property {boolean} shift
 * @property {boolean} alt
 */

/**
 * @typedef KeyOverride
 * @property {String} context
 * @property {String} key
 * @property {boolean} cmdCtrl
 * @property {boolean} shift
 * @property {boolean} alt
 * @property {String} cmd
 */

export class InputBindings
{
    static USERSETTINGNAME = "inputbinds";
    static USERSETTING_KEYOVERRIDES = "keyoverrides";
    static MOUSE_PATCH_DBL_CLICK = "patch_dbl_cl";
    static MOUSE_PATCH_RIGHT_CLICK = "patch_right_cl";
    static MOUSE_PATCH_MIDDLE_CLICK = "patch_middle_cl";

    static CONTEXT_GLOBAL = "global";
    static CONTEXT_PATCH = "patch";
    static CONTEXT_TIMELINE = "timeline";
    static CONTEXTS = [InputBindings.CONTEXT_GLOBAL, InputBindings.CONTEXT_PATCH, InputBindings.CONTEXT_TIMELINE];

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
        }
    ];

    /** @type {KeyOverride[]} */
    #keyOverrides = [];

    constructor()
    {
        const userBinds = userSettings.get(InputBindings.USERSETTINGNAME) || [];
        const storedOverrides = userSettings.get(InputBindings.USERSETTING_KEYOVERRIDES) || [];
        for (let i = 0; i < storedOverrides.length; i++) this.#keyOverrides.push(storedOverrides[i]);

        let migrated = false;
        for (let i = 0; i < userBinds.length; i++)
        {
            const cmd = Commands.getCommandByName(userBinds[i].cmd);

            if (userBinds[i].id.indexOf("key_") == 0)
            {
                migrated = true;
                if (!cmd) continue;
                this.#keyOverrides.push({
                    "context": InputBindings.CONTEXT_GLOBAL,
                    "key": userBinds[i].id.substring(4),
                    "cmdCtrl": false,
                    "shift": false,
                    "alt": false,
                    "cmd": cmd.cmd
                });
                continue;
            }

            if (!cmd)
            {
                console.warn("input binding: command not found", userBinds[i].cmd);
                continue;
            }
            this.setBindingFunc(userBinds[i].id, cmd.func, false);
        }

        if (migrated)
        {
            this.save();
            this.#saveKeyOverrides();
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
                if (cmd) addbinds.push({ "id": InputBindings.ACTIONS[i].id, "cmd": cmd.cmd });
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

        if (!b) console.log("could not find bind for action", actionId);
        else b.func = f || b.default;

        if (userInteraction) this.save();
    }

    /**
     * @param {string} which
     */
    exec(which)
    {
        const b = this.getBind(which);
        if (!b || !b.func) return;

        const cmd = Commands.getCommandByFunction(b.func);
        if (cmd) Commands.exec(cmd.cmd);
    }

    /**
     * @returns {KeyOverride[]}
     */
    getKeyOverrides()
    {
        return this.#keyOverrides;
    }

    /**
     * @param {KeyOverride} override
     */
    setKeyOverride(override)
    {
        this.removeKeyOverride(override);
        this.#keyOverrides.push(override);
        this.#saveKeyOverrides();
    }

    /**
     * @param {KeyOverride} override
     */
    removeKeyOverride(override)
    {
        const kept = [];
        for (let i = 0; i < this.#keyOverrides.length; i++)
        {
            const o = this.#keyOverrides[i];
            if (o.context != override.context || !InputBindings.isSameCombo(o, override)) kept.push(o);
        }
        this.#keyOverrides = kept;
        this.#saveKeyOverrides();
    }

    #saveKeyOverrides()
    {
        userSettings.set(InputBindings.USERSETTING_KEYOVERRIDES, this.#keyOverrides);
    }

    /**
     * @param {KeyboardEvent} e
     * @returns {boolean} true if an override handled the event
     */
    handleKey(e)
    {
        if (this.#keyOverrides.length == 0) return false;
        if (gui.isRemoteClient || gui.getRestriction() < Gui.RESTRICT_MODE_FULL) return false;
        if (InputBindings.isTyping()) return false;

        const combo = InputBindings.comboFromEvent(e);
        const override = this.findKeyOverride(combo, InputBindings.contextFromEvent(e));
        if (!override) return false;

        if (e.type == "keydown" && override.cmd) Commands.exec(override.cmd);

        e.preventDefault();
        return true;
    }

    /**
     * @param {KeyCombo} combo
     * @param {string} context
     */
    findKeyOverride(combo, context)
    {
        let globalMatch = null;
        for (let i = 0; i < this.#keyOverrides.length; i++)
        {
            const o = this.#keyOverrides[i];
            if (!InputBindings.isSameCombo(o, combo)) continue;
            if (o.context == context) return o;
            if (o.context == InputBindings.CONTEXT_GLOBAL) globalMatch = o;
        }
        return globalMatch;
    }

    static isTyping()
    {
        const el = document.activeElement;
        if (!el) return false;
        if (el.tagName == "INPUT" || el.tagName == "TEXTAREA" || el.tagName == "SELECT") return true;
        if (el.classList.contains("cm-content")) return true;
        return el.getAttribute("contenteditable") == "true";
    }

    /**
     * @param {KeyboardEvent} e
     */
    static contextFromEvent(e)
    {
        const target = /** @type {HTMLElement} */ (e.target);
        if (target && target.dataset && target.dataset.keycontext) return target.dataset.keycontext;
        return InputBindings.CONTEXT_GLOBAL;
    }

    /**
     * @param {KeyboardEvent} e
     * @returns {KeyCombo}
     */
    static comboFromEvent(e)
    {
        return {
            "key": (e.key + "").toLowerCase(),
            "cmdCtrl": e.ctrlKey || e.metaKey,
            "shift": e.shiftKey,
            "alt": e.altKey
        };
    }

    /**
     * @param {KeyCombo} a
     * @param {KeyCombo} b
     */
    static isSameCombo(a, b)
    {
        return a.key == b.key && a.cmdCtrl == b.cmdCtrl && a.shift == b.shift && a.alt == b.alt;
    }

    /**
     * @param {string} key
     */
    static isModifierKey(key)
    {
        return key == "shift" || key == "control" || key == "alt" || key == "meta" || key == "altgraph";
    }

    /**
     * @param {KeyCombo} combo
     */
    static comboToString(combo)
    {
        let str = "";
        if (combo.cmdCtrl) str += "Cmd/Ctrl + ";
        if (combo.alt) str += "Alt + ";
        if (combo.shift) str += "Shift + ";
        if (combo.key == " ") str += "Space";
        else if (combo.key.length == 1) str += combo.key.toUpperCase();
        else str += combo.key.charAt(0).toUpperCase() + combo.key.substring(1);
        return str;
    }
}
