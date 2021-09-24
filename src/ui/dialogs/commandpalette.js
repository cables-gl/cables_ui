
export default class CommandPallete
{
    constructor()
    {
        this._lastSearch = "";
        this._findTimeoutId = 0;
        this._cursorIndex = 0;
        this._numResults = 0;
        this._bookmarkActiveIcon = "icon-pin-filled";
        this._bookmarkInactiveIcon = "icon-pin-outline";
        this._defaultIcon = "square";

        this.keyDown = (e) =>
        {
            switch (e.which)
            {
            case 13:
                ele.byId("result" + this._cursorIndex).click();
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
        };
    }

    isVisible()
    {
        return ele.isVisible(ele.byId("cmdpalette"));
    }

    show()
    {
        this._cursorIndex = 0;
        CABLES.UI.MODAL.hide(true);
        // ele.show(ele.byId("modalbg"));
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

        document.addEventListener("keydown", this.keyDown);
    }

    onBookmarkIconClick(ev)
    {
        ev.stopPropagation();

        const el = ev.target;
        const cmd = el.closest(".result").dataset.cmd;
        const itemObj = CABLES.UI.userSettings.get("sidebar_left") || {};

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

        CABLES.UI.userSettings.set("sidebar_left", JSON.parse(JSON.stringify(itemObj)));

        gui.iconBarLeft.refresh();
    }

    onResultClick(ev)
    {
        const el = ev.target;
        const cmd = el.dataset.cmd;
        gui.cmdPallet.close();
        CABLES.CMD.exec(cmd);
    }

    isCmdInSidebar(cmdName)
    {
        const itemObj = CABLES.UI.userSettings.get("sidebar_left") || {};
        return itemObj.hasOwnProperty(cmdName) && itemObj[cmdName];
    }

    /*
     * Checks if a commad is currently in the sidebar and returns the fitting icon (class name)
     * (filled pin or outline pin)
     */
    getBookmarkIconForCmd(cmdName)
    {
        if (this.isCmdInSidebar(cmdName)) return this._bookmarkActiveIcon;
        return this._bookmarkInactiveIcon;
    }

    addResult(cmd, num)
    {
        let html = "";
        html += "<div class=\"result\" id=\"result" + num + "\" data-cmd=\"" + cmd.cmd + "\" onclick=gui.cmdPallet.onResultClick(event)>";
        html += "<span class=\"icon icon-" + (cmd.icon || "square") + "\"></span>";
        html += "<span class=\"title\">" + cmd.cmd + "</span>";
        html += "<span class=\"category\"> – " + cmd.category + "</span>";

        const bookmarkIcon = this.getBookmarkIconForCmd(cmd.cmd);
        html += "<span class=\"icon " + bookmarkIcon + " bookmark\" onclick=gui.cmdPallet.onBookmarkIconClick(event)></span>";
        if (cmd.hotkey)
        {
            html += "<span class=\"hotkey\">[ " + cmd.hotkey + " ]</span>";
        }
        html += "</div>";

        return html;
    }


    doSearch(str, searchId)
    {
        this._lastSearch = str;

        let html = "";
        ele.byId("searchresult_cmd").innerHTML = html;

        str = str.toLowerCase();

        let count = 0;

        for (let i = 0; i < CABLES.CMD.commands.length; i++)
        {
            const cmd = CABLES.CMD.commands[i].cmd;
            if (cmd.toLowerCase().indexOf(str) >= 0)
            {
                html += this.addResult(CABLES.CMD.commands[i], count);
                count++;
            }
        }

        this._numResults = count;
        ele.byId("searchresult_cmd").innerHTML = html;

        setTimeout(function ()
        {
            this._cursorIndex = 0;
            this.navigate();
        }.bind(this), 10);
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
}
