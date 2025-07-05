import { Events, Logger } from "cables-shared-client";
import { notifyError } from "../elements/notification.js";
import Gui, { gui } from "../gui.js";
import { getHandleBarHtml } from "./handlebars.js";

/**
 * @typedef KeyOptions
 * @property {number} [minRestriction]
 * @property {string} [displayGroup]
 * @property {boolean} [cmdCtrl]
 * @property {boolean} [shiftKey]
 * @property {boolean} [altKey]
 * @property {boolean} [ignoreInput]
*/

/**
 * manage keybindings for hotkeys/shortcuts
 *
 * @export
 * @class KeyBindingsManager
 * @extends {Events}
 */
export default class KeyBindingsManager extends Events
{
    constructor()
    {
        super();
        this._log = new Logger("KeyBindingsManager");
        this._keys = [];
        this.shiftKey = false;
        document.addEventListener("keydown", this._onKeyDown.bind(this), false);
        document.addEventListener("keyup", this._onKeyUp.bind(this), false);
        document.addEventListener("keypress", this._onKeyPress.bind(this), false);
    }

    show()
    {
        this._tab = new CABLES.UI.Tab("keyboard shortcuts", { "icon": "help", "infotext": "tab_keys", "padding": true, "singleton": true });
        gui.mainTabs.addTab(this._tab, true);

        const k = this._prepareKeysForDisplay(this._keys);

        let showDownloadButton = false;
        if (gui && gui.user && (gui.user.isStaff || gui.user.isAdmin)) showDownloadButton = true;

        const html = getHandleBarHtml("tab_keys", { "keys": k, "showDownloadButton": showDownloadButton });
        this._tab.html(html);

        gui.maintabPanel.show(true);
    }

    download()
    {
        const k = this._prepareKeysForDisplay(this._keys);

        const markdown = getHandleBarHtml("tab_keys_markdown", { "keys": k });

        let element = document.createElement("a");
        element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(markdown));
        element.setAttribute("download", "keys.md");
        element.style.display = "none";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    _prepareKeysForDisplay(keys)
    {
        let k = JSON.parse(JSON.stringify(keys));

        k.sort(function (a, b)
        {
            return a.key.localeCompare(b.key);
        });

        k.sort(function (a, b)
        {
            if (!a.target)a.target = "global";
            if (!b.target)b.target = "global";
            return a.target.localeCompare(b.target);
        });

        // remove double entries
        let lastCombined = "";
        let lines = [];
        for (let i = 0; i < k.length; i++)
        {
            let combined = k[i].title + k[i].key + k[i].options.shiftKey + k[i].options.cmdCtrl;
            if (combined != lastCombined) lines.push(k[i]);
            lastCombined = combined;
        }

        let lastTarget = "";
        for (let i = 0; i < lines.length; i++)
        {
            if (lines[i].target != lastTarget)
            {
                const group = lines[i].options.displayGroup ? lines[i].options.displayGroup : lines[i].target;
                lines[i].group = group;
            }
            lastTarget = lines[i].target;

            if (lines[i].key == " ")lines[i].key = "Space";
        }
        lines = lines.filter((key) => { return key.title !== ""; });
        return lines;
    }

    _onKeyUp(e)
    {
        this.shiftKey = false;
        for (let i = 0; i < this._keys.length; i++)
        {
            const k = this._keys[i];

            if (!k.options.ignoreInput && document.activeElement && (document.activeElement.tagName == "INPUT" || document.activeElement.tagName == "TEXTAREA")) continue;

            if (k.key != (e.key + "").toLowerCase() || k.event != "up") continue;

            if (!k.options.ctrlKey)
            {
                if (k.options.cmdCtrl) if (!e.ctrlKey && !e.metaKey) continue;
                if (!k.options.cmdCtrl) if (e.ctrlKey || e.metaKey) continue;
            }
            if (k.options.shiftKey && !e.shiftKey) continue;
            if (!k.options.shiftKey && e.shiftKey) continue;
            if (!k.options.ctrlKey && e.ctrlKey) continue;

            if (!k.target || k.target == e.target.id)
            {
                if (k.options.minRestriction > gui.getRestriction())
                {
                    notifyError("Not allowed");
                    if (!e.dontPreventDefault) e.preventDefault();

                    continue;
                }

                if (k.cb) k.cb(e);
                else this._log.warn("[keys] key event has no callback", k);

                if (!e.dontPreventDefault) e.preventDefault();

                // return;
            }
        }
    }

    /**
     * @param {KeyboardEvent} e
     */
    _onKeyPress(e)
    {
    }

    /**
     * @param {KeyboardEvent} e
     */
    _onKeyDown(e)
    {
        this.shiftKey = e.shiftKey || e.keyCode == 16;

        for (let i = 0; i < this._keys.length; i++)
        {
            const k = this._keys[i];

            if (k.key != (e.key + "").toLowerCase() || k.event != "down") continue;

            if (!k.options.ctrlKey)
            {
                if (k.options.cmdCtrl) if (!e.ctrlKey && !e.metaKey) continue;
                if (!k.options.cmdCtrl) if (e.ctrlKey || e.metaKey) continue;
            }
            if (k.options.shiftKey && !e.shiftKey) continue;
            if (k.options.altKey && !e.altKey) continue;
            if (!k.options.shiftKey && e.shiftKey) continue;
            if (k.options.minRestriction > gui.getRestriction()) continue;

            if (!k.target || k.target == e.target.id)
            {
                if (k.options.ignoreInput && document.activeElement && (document.activeElement.tagName == "INPUT" || document.activeElement.tagName == "TEXTAREA")) continue;

                // gui.log.userInteraction("pressed " + e.key);

                if (k.cb) k.cb(e);
                else this._log.warn("[keys] key event has no callback", k);

                if (!e.dontPreventDefault) e.preventDefault();

                // return;
            }
        }
    }

    /**
     * @param {string} key
     * @param {string} title
     * @param {string} event
     * @param {null} target
     * @param {KeyOptions} options
     * @param {Function} cb
     */
    _addKey(key, title, event, target, options, cb)
    {
        const k =
        {
            "key": key.toLowerCase(),
            "title": title,
            "event": event,
            "target": target,
            "options": options,
            "cb": cb,
        };

        this._keys.push(k);
    }

    /**
    * @callback keyCallback
    * @param {KeyboardEvent} e
    */

    /**
     * @param {string | any[]} key
     * @param {string} title
     * @param {string} event
     * @param {null} target
     * @param {KeyOptions} options
     * @param {keyCallback} cb
     */
    key(key, title, event, target, options, cb)
    {
        options = options || {};
        if (!options.hasOwnProperty("minRestriction")) options.minRestriction = Gui.RESTRICT_MODE_FULL;

        if (Array.isArray(key)) for (let i = 0; i < key.length; i++) this._addKey(key[i], title, event, target, options, cb);
        else this._addKey(key, title, event, target, options, cb);
    }
}
