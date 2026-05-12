import { ModalBackground, ele } from "cables-shared-client";
import { utils } from "cables";
import { uuid } from "cables/src/core/utils.js";
import { gui } from "../gui.js";
import { platform } from "../platform.js";
import { userSettings } from "../components/usersettings.js";
import { Commands } from "../commands/commands.js";
import { getHandleBarHtml } from "../utils/handlebars.js";
import ModalDialog from "./modaldialog.js";

Commands.init();

/**
 * @typedef CommandPaletteOptions
 * @property {boolean} [cablesCommands]
 * @property {boolean} [showCategory]
 * @property {boolean} [showIcons]
 * @property {import("../commands/commands.js").CommandObject[]} [commands]
 */

/**
 * show a searchable command palette (cmd/ctrl+p)
 *
 * @export
 * @class CommandPallete
 */
export class CommandPalette
{
    #id = uuid();

    /** @type {CommandPaletteOptions} */
    #options = {
        "cablesCommands": true,
        "showCategory": true,
        "showIcons": true
    };

    _lastSearch = "";
    _findTimeoutId = null;
    #cursorIndex = 0;
    _numResults = 0;
    _bookmarkActiveIcon = "icon-pin-filled";
    _bookmarkInactiveIcon = "icon-pin-outline";
    _defaultIcon = "square";

    #resultCommands = [];

    #bg = new ModalBackground();

    /** @type {import("../commands/commands.js").CommandObject[]} */
    dynamicCmds = [];

    /**
     * @param {CommandPaletteOptions} options
     */
    constructor(options = null)
    {
        if (options) this.#options = options;

        this.#bg.on("hide", () => { this.close(); });
    }

    /**
     * @param {KeyboardEvent} e
     */
    keyDown(e)
    {
        switch (e.which)
        {
        case 13:
            const rcmd = this.#resultCommands[this.#cursorIndex];

            const el = ele.byId("result" + rcmd.id);

            if (el) el.click();
            else console.log("no ele");
            break;
        case 27:
            this.close();
            break;

        case 38: // up
            this.navigate(-1);
            break;

        case 40: // down
            this.navigate(1);
            break;

        default: return;
        }
        e.preventDefault();
    }

    isVisible()
    {
        return !ele.byId("cmdpalette").classList.contains("hidden");
    }

    show()
    {
        this.#cursorIndex = 0;
        gui.closeModal();
        this.#bg.show();
        // document.getElementById("modalbg").style.display = "block";

        const html = getHandleBarHtml("cmdPalette", { "id": this.#id });

        ele.show(ele.byId("cmdpalette"));

        ele.byId("cmdpalette").innerHTML = html;

        const elInput = ele.byId("cmdinput" + this.#id);
        elInput.focus();
        elInput.value = this._lastSearch;
        elInput.setSelectionRange(0, this._lastSearch.length);

        clearTimeout(this._findTimeoutId);
        this._findTimeoutId = setTimeout(() =>
        {
            this.doSearch(this._lastSearch);
        }, 100);

        this.keyDown = this.keyDown.bind(this);
        document.addEventListener("keydown", this.keyDown);

        elInput.addEventListener("input", () =>
        {
            this.doSearch(elInput.value);
        });

        ele.clickable(ele.byId("cmdClose" + this.#id), () =>
        {
            this.close();
        });
    }

    /**
     * @param {MouseEvent} ev
     */
    onBookmarkIconClick(ev)
    {
        ev.stopPropagation();

        /** @type {HTMLElement} */
        const el = ev.target;
        const cmd = el.closest(".result").dataset.cmd;
        const itemObj = userSettings.get("sidebar_left") || {};

        // replace the pin-icon / set / remove icon from sidebar
        const addToSidebar = !this.isCmdInSidebar(cmd);
        if (addToSidebar)
        {
            el.classList.remove(this._bookmarkInactiveIcon);
            el.classList.add(this._bookmarkActiveIcon);

            itemObj[cmd] = true;
        }
        else
        { // remove from sidebar
            el.classList.remove(this._bookmarkActiveIcon);
            el.classList.add(this._bookmarkInactiveIcon);

            itemObj[cmd] = false;
        }

        userSettings.set("sidebar_left", JSON.parse(JSON.stringify(itemObj)));

        gui.iconBarLeft.refresh();
    }

    execIndex(el)
    {
        const index = el.dataset.index;
        const cmd = el.dataset.cmd;

        if (!this.#options.cablesCommands)
        {
            this.#options.commands[index].func(cmd);
            this.close();
        }
    }

    /**
     * @param {PointerEvent} ev
     */
    onResultClick(ev)
    {
        const el = ev.target;
        const cmdId = el.dataset.cmdid;
        const cmd = Commands.getById(cmdId);

        this.close();

        if (!cmd)
        {
            console.log("no cmd", this.#options.commands);
        }

        if (this.#options.commands)
        {
            for (let i = 0; i < this.#options.commands.length; i++)
            {
                if (this.#options.commands[i].id == cmdId)
                    this.#options.commands[i].func(this.#options.commands[i]);
            }
        }
        else
        if (el.classList.contains("dyn"))
        {
            this.dynamicCmds[el.dataset.index].func();
        }
        else
        {
            Commands.exec(cmd.cmd);
        }
    }

    /**
     * @param {string} cmdName
     */
    isCmdInSidebar(cmdName)
    {
        const itemObj = userSettings.get("sidebar_left") || {};
        return itemObj.hasOwnProperty(cmdName) && itemObj[cmdName];
    }

    /*
     * Checks if a commad is currently in the sidebar and returns the fitting icon (class name)
     * (filled pin or outline pin)
     */
    /**
     * @param {String} cmdName
     */
    getBookmarkIconForCmd(cmdName)
    {
        if (this.isCmdInSidebar(cmdName)) return this._bookmarkActiveIcon;
        return this._bookmarkInactiveIcon;
    }

    /**
     * add result
     *
     * @param {Object} cmd
     * @param {Number} num
     * @param {Number} idx
     * @returns {String}
     */
    addResult(cmd, num, idx)
    {
        let dynclass = "";

        this.#resultCommands.push(cmd);
        if (cmd.dyn)dynclass = "dyn";
        if (!cmd.id)cmd.id = uuid();

        let html = "";
        html += "<div class=\"result " + dynclass + "\" id=\"result" + cmd.id + "\"";
        html += " data-index=\"" + idx + "\"";
        html += " data-cmdId=\"" + cmd.id + "\"";
        // html += " data-cmd=\"" + cmd.cmd + "\"";
        // html += " onclick=gui.cmdPalette.onResultClick(event)>";

        if (this.#options.showIcons)
            html += "<span class=\"icon icon-" + (cmd.icon || "square") + "\"></span>";

        html += "<span class=\"title\">" + cmd.cmd + "</span>";

        if (this.#options.showCategory)
            html += "<span class=\"category\"> - " + cmd.category || "unknown category" + "</span>";

        if (this.#options.cablesCommands)
        {

            const bookmarkIcon = this.getBookmarkIconForCmd(cmd.cmd);
            html += "<span class=\"icon " + bookmarkIcon + " bookmark\" onclick=gui.cmdPalette.onBookmarkIconClick(event)></span>";
            if (cmd.hotkey)
            {
                html += "<span class=\"hotkey right\">[ " + cmd.hotkey + " ]</span>";
            }
            if (cmd.userSetting)
            {
                html += "<span class=\"right\">Usersetting: [ " + userSettings.get(cmd.userSetting) + " ]</span>";
            }

        }
        html += "</div>";
        return html;
    }

    /**
     * @param {String} str - String
     */
    doSearch(str)
    {
        this._lastSearch = str;
        this.#resultCommands = [];

        let html = "";
        ele.byId("searchresult_cmd").innerHTML = html;

        str = str.toLowerCase();

        let count = 0;

        if (this.#options.commands)
        {
            for (let i = 0; i < this.#options.commands.length; i++)
            {
                const cmd = this.#options.commands[i].cmd;

                if (cmd.toLowerCase().indexOf(str) >= 0)
                {
                    html += this.addResult(this.#options.commands[i], count, i);
                    count++;
                }
            }
        }

        if (this.#options.cablesCommands)
        {

            for (let i = 0; i < this.dynamicCmds.length; i++)
            {
                const cmd = this.dynamicCmds[i].cmd;

                if (cmd.toLowerCase().indexOf(str) >= 0)
                {
                    html += this.addResult(this.dynamicCmds[i], count, i);
                    count++;
                }
            }

            const commands = Commands.commands;
            for (let i = 0; i < commands.length; i++)
            {
                const cmd = commands[i].cmd;

                let show = true;
                if (commands[i].frontendOption)
                    show = platform.frontendOptions[commands[i].frontendOption];

                if (!show) continue;
                if (!str && commands[i].category == "debug") continue;
                if (cmd.toLowerCase().indexOf(str) >= 0)
                {
                    html += this.addResult(commands[i], count);
                    count++;
                }
            }

        }

        this._numResults = count;
        ele.byId("searchresult_cmd").innerHTML = html;

        for (let i = 0; i < this.#resultCommands.length; i++)
        {
            const id = "result" + this.#resultCommands[i].id;
            ele.byId(id).addEventListener("click", (e) =>
            {
                this.onResultClick(e);
            });
        }

        setTimeout(() =>
        {
            this.#cursorIndex = 0;
            this.navigate();
        }, 10);
    }

    /**
     * @param {number} [dir]
     */
    navigate(dir)
    {
        if (dir) this.#cursorIndex += dir;
        if (this.#cursorIndex < 0) this.#cursorIndex = this._numResults - 1;
        if (this.#cursorIndex >= this._numResults) this.#cursorIndex = 0;

        ele.forEachClass("result", (e) => { e.classList.remove("selected"); });

        // const e = ele.byId("result" + this.#resultCommands[this.#cursorIndex]);
        const c = this.#resultCommands[this.#cursorIndex];
        if (c)
        {
            const el = ele.byId("result" + c.id);
            if (el)
            {
                el.classList.add("selected");
                el.scrollIntoView({ "block": "end" });
            }
        }
    }

    close()
    {
        document.removeEventListener("keydown", this.keyDown);
        ele.byId("searchresult_cmd").innerHTML = "";
        this.#bg.hide();
        ele.hide(ele.byId("cmdpalette"));
    }

    /**
     * @param {string} id
     */
    removeDynamic(id)
    {
        for (let i = this.dynamicCmds.length - 1; i > 0; i--)
            if (this.dynamicCmds[i].id == id)
                this.dynamicCmds.splice(i, 1);
    }

    /**
     * @param {string} category
     * @param {string} title
     * @param {Function} func
     * @param {string} icon
     */
    addDynamic(category, title, func, icon)
    {
        const cmd = {
            "cmd": title,
            "category": category,
            "func": func,
            "icon": icon || "cables",
            "dyn": true,
            "id": utils.uuid()
        };

        this.dynamicCmds.push(cmd);
        return cmd.id;
    }
}
