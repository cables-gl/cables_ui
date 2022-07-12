import { notifyError } from "../elements/notification";
import Gui from "../gui";
import { getHandleBarHtml } from "./handlebars";

export default class KeyBindingsManager extends CABLES.EventTarget
{
    constructor()
    {
        super();
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
        if (gui && gui.user && (gui.user.isStaff || gui.user.isAdmin))
        {
            showDownloadButton = true;
        }

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
        const k = JSON.parse(JSON.stringify(keys));

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

        let lastTarget = "";
        for (let i = 0; i < k.length; i++)
        {
            if (k[i].target != lastTarget)
            {
                const group = k[i].options.displayGroup ? k[i].options.displayGroup : k[i].target;
                k[i].group = group;
            }
            lastTarget = k[i].target;

            if (k[i].key == " ")k[i].key = "Space";
        }
        return k;
    }

    _onKeyUp(e)
    {
        this.shiftKey = false;
        for (let i = 0; i < this._keys.length; i++)
        {
            const k = this._keys[i];

            if (!k.options.ignoreInput && document.activeElement && (document.activeElement.tagName == "INPUT" || document.activeElement.tagName == "TEXTAREA")) continue;

            if (k.key != (e.key + "").toLowerCase() || k.event != "up") continue;

            if (k.options.cmdCtrl) if (!e.ctrlKey && !e.metaKey) continue;

            if (!k.options.cmdCtrl) if (e.ctrlKey || e.metaKey) continue;
            if (k.options.shiftKey && !e.shiftKey) continue;
            if (!k.options.shiftKey && e.shiftKey) continue;


            if (!k.target || k.target == e.target.id)
            {
                if (k.options.minRestriction > window.gui.getRestriction())
                {
                    notifyError("Not allowed");
                    if (!e.dontPreventDefault) e.preventDefault();

                    continue;
                }


                if (k.cb) k.cb(e);
                else console.warn("[keys] key event has no callback", k);

                if (!e.dontPreventDefault) e.preventDefault();

                // return;
            }
        }
    }

    _onKeyPress(e)
    {
    }

    _onKeyDown(e)
    {
        this.shiftKey = e.shiftKey || e.keyCode == 16;

        for (let i = 0; i < this._keys.length; i++)
        {
            const k = this._keys[i];

            if (k.key != (e.key + "").toLowerCase() || k.event != "down") continue;
            if (k.options.cmdCtrl) if (!e.ctrlKey && !e.metaKey) continue;
            if (!k.options.cmdCtrl) if (e.ctrlKey || e.metaKey) continue;
            if (k.options.shiftKey && !e.shiftKey) continue;
            if (k.options.altKey && !e.altKey) continue;
            if (!k.options.shiftKey && e.shiftKey) continue;
            if (k.options.minRestriction > window.gui.getRestriction()) continue;

            if (!k.target || k.target == e.target.id)
            {
                if (k.options.ignoreInput && document.activeElement && (document.activeElement.tagName == "INPUT" || document.activeElement.tagName == "TEXTAREA")) continue;

                // gui.log.userInteraction("pressed " + e.key);

                if (k.cb) k.cb(e);
                else console.warn("[keys] key event has no callback", k);

                if (!e.dontPreventDefault) e.preventDefault();

                // return;
            }
        }
    }

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

    key(key, title, event, target, options, cb)
    {
        options = options || {};
        if (!options.hasOwnProperty("minRestriction")) options.minRestriction = Gui.RESTRICT_MODE_FULL;

        if (Array.isArray(key)) for (let i = 0; i < key.length; i++) this._addKey(key[i], title, event, target, options, cb);
        else this._addKey(key, title, event, target, options, cb);
    }
}
