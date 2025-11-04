import { ele } from "cables-shared-client";
import { utils } from "cables";
import { gui } from "../gui.js";
import { platform } from "../platform.js";
import { userSettings } from "../components/usersettings.js";

/**
 * show a searchable command palette (cmd/ctrl+p)
 *
 * @export
 * @class CommandPallete
 */
export default class CommandPalette
{
    constructor()
    {
        this._lastSearch = "";
        this._findTimeoutId = null;
        this._cursorIndex = 0;
        this._numResults = 0;
        this._bookmarkActiveIcon = "icon-pin-filled";
        this._bookmarkInactiveIcon = "icon-pin-outline";
        this._defaultIcon = "square";
        this.dynamicCmds = [];

    }

    /**
     * @param {KeyboardEvent} e
     */
    keyDown(e)
    {
        switch (e.which)
        {
        case 13:
            const el = ele.byId("result" + this._cursorIndex);
            if (el)el.click();
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
        this._cursorIndex = 0;
        gui.closeModal();
        document.getElementById("modalbg").style.display = "block";
        ele.show(ele.byId("cmdpalette"));
        ele.byId("cmdinput").focus();
        ele.byId("cmdinput").value = this._lastSearch;
        document.getElementById("cmdinput").setSelectionRange(0, this._lastSearch.length);

        clearTimeout(this._findTimeoutId);
        this._findTimeoutId = setTimeout(() =>
        {
            this.doSearch(this._lastSearch);
        }, 100);

        this.keyDown = this.keyDown.bind(this);
        document.addEventListener("keydown", this.keyDown);
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

    onResultClick(ev)
    {
        const el = ev.target;
        const cmd = el.dataset.cmd;

        gui.cmdPalette.close();

        if (el.classList.contains("dyn"))
        {
            this.dynamicCmds[el.dataset.index].func();
        }
        else
        {
            CABLES.CMD.exec(cmd);
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

        if (cmd.dyn)dynclass = "dyn";

        let html = "";
        html += "<div class=\"result " + dynclass + "\" id=\"result" + num + "\" data-index=\"" + idx + "\" data-cmd=\"" + cmd.cmd + "\" onclick=gui.cmdPalette.onResultClick(event)>";
        html += "<span class=\"icon icon-" + (cmd.icon || "square") + "\"></span>";
        html += "<span class=\"title\">" + cmd.cmd + "</span>";
        html += "<span class=\"category\"> - " + cmd.category || "unknown category" + "</span>";

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
        html += "</div>";

        return html;
    }

    /**
     * @param {String} str - String
     */
    doSearch(str)
    {
        this._lastSearch = str;

        let html = "";
        ele.byId("searchresult_cmd").innerHTML = html;

        str = str.toLowerCase();

        let count = 0;

        for (let i = 0; i < this.dynamicCmds.length; i++)
        {
            const cmd = this.dynamicCmds[i].cmd;

            if (cmd.toLowerCase().indexOf(str) >= 0)
            {
                html += this.addResult(this.dynamicCmds[i], count, i);
                count++;
            }
        }

        const commands = CABLES.CMD.commands;
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

        this._numResults = count;
        ele.byId("searchresult_cmd").innerHTML = html;

        setTimeout(() =>
        {
            this._cursorIndex = 0;
            this.navigate();
        }, 10);
    }

    navigate(dir)
    {
        if (dir) this._cursorIndex += dir;
        if (this._cursorIndex < 0) this._cursorIndex = this._numResults - 1;
        if (this._cursorIndex >= this._numResults) this._cursorIndex = 0;

        ele.forEachClass("result", (e) => { e.classList.remove("selected"); });

        const e = ele.byId("result" + this._cursorIndex);
        if (e)
        {
            e.classList.add("selected");
            e.scrollIntoView({ "block": "end" });
        }
    }

    close()
    {
        document.removeEventListener("keydown", this.keyDown);
        ele.byId("searchresult_cmd").innerHTML = "";
        document.getElementById("modalbg").style.display = "none";
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
