
CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.CommandPallet = function ()
{
    let lastSearch = "";
    let findTimeoutId = 0;
    this._cursorIndex = 0;
    this._numResults = 0;
    this._bookmarkActiveIcon = "icon-pin-filled";
    this._bookmarkInactiveIcon = "icon-pin-outline";
    this._defaultIcon = "square";
    const self = this;
    const canceledSearch = 0;
    const idSearch = 1;


    this.isVisible = function ()
    {
        return $("#cmdpalette").is(":visible");
    };

    this.show = function ()
    {
        this._cursorIndex = 0;
        CABLES.UI.MODAL.hide(true);
        $("#modalbg").show();
        $("#cmdpalette").show();
        $("#cmdinput").focus();

        $("#cmdinput").val(lastSearch);
        document.getElementById("cmdinput").setSelectionRange(0, lastSearch.length);

        clearTimeout(findTimeoutId);
        findTimeoutId = setTimeout(function ()
        {
            self.doSearch(lastSearch);
        }, 100);

        $("body").on("keydown", this.keyDown);
    };

    this.onBookmarkIconClick = function (ev)
    {
        ev.stopPropagation();
        const el = $(ev.target);
        const cmd = el.closest(".result").data("cmd");

        const itemObj = CABLES.UI.userSettings.get("sidebar_left") || {};

        // replace the pin-icon / set / remove icon from sidebar
        const addToSidebar = !isCmdInSidebar(cmd);
        if (addToSidebar)
        {
            el.removeClass(self._bookmarkInactiveIcon);
            el.addClass(self._bookmarkActiveIcon);

            itemObj[cmd] = true;
        }
        else
        { // remove from sidebar
            el.removeClass(self._bookmarkActiveIcon);
            el.addClass(self._bookmarkInactiveIcon);

            itemObj[cmd] = false;
        }

        CABLES.UI.userSettings.set("sidebar_left", JSON.parse(JSON.stringify(itemObj)));

        gui.iconBarLeft.refresh();
    };

    this.onResultClick = function (ev)
    {
        const el = $(ev.target);
        const cmd = el.data("cmd");
        gui.cmdPallet.close();
        CABLES.CMD.exec(cmd);
    };

    function isCmdInSidebar(cmdName)
    {
        const itemObj = CABLES.UI.userSettings.get("sidebar_left") || {};
        return itemObj.hasOwnProperty(cmdName) && itemObj[cmdName];
    }

    /*
     * Checks if a commad is currently in the sidebar and returns the fitting icon (class name)
     * (filled pin or outline pin)
     */
    function getBookmarkIconForCmd(cmdName)
    {
        if (isCmdInSidebar(cmdName))
        {
            return self._bookmarkActiveIcon;
        }
        return self._bookmarkInactiveIcon;
    }

    function addResult(cmd, num)
    {
        let html = "";
        html += "<div class=\"result\" id=\"result" + num + "\" data-cmd=\"" + cmd.cmd + "\" onclick=gui.cmdPallet.onResultClick(event)>";
        html += "<span class=\"icon icon-" + (cmd.icon || "square") + "\"/>";
        html += "<span class=\"title\">" + cmd.cmd + "</span>";
        html += "<span class=\"category\"> – " + cmd.category + "</span>";

        const bookmarkIcon = getBookmarkIconForCmd(cmd.cmd);
        html += "<span class=\"icon " + bookmarkIcon + " bookmark\" onclick=gui.cmdPallet.onBookmarkIconClick(event)></span>";
        if (cmd.hotkey)
        {
            html += "<span class=\"hotkey\">[ " + cmd.hotkey + " ]</span>";
        }
        html += "</div>";

        setTimeout(
            function ()
            {
                $("#searchresult_cmd").append(html);
            }, 1);
    }


    this.doSearch = function (str, searchId)
    {
        lastSearch = str;
        $("#searchresult_cmd").html("");

        str = str.toLowerCase();

        let count = 0;

        for (let i = 0; i < CABLES.CMD.commands.length; i++)
        {
            const cmd = CABLES.CMD.commands[i].cmd;
            if (cmd.toLowerCase().indexOf(str) >= 0)
            {
                addResult(CABLES.CMD.commands[i], count);
                count++;
            }
        }

        this._numResults = count;

        setTimeout(function ()
        {
            this._cursorIndex = 0;
            this.navigate();
        }.bind(this), 10);
    };

    this.navigate = function (dir)
    {
        if (dir) self._cursorIndex += dir;
        if (self._cursorIndex < 0)self._cursorIndex = this._numResults - 1;
        if (self._cursorIndex >= this._numResults)self._cursorIndex = 0;

        $(".result").removeClass("selected");

        const e = ele.byId("result" + self._cursorIndex);
        if (e) e.classList.add("selected");

        if ($("#result" + self._cursorIndex)[0]) $("#result" + self._cursorIndex)[0].scrollIntoView({ "block": "end" });
    };


    this.keyDown = function (e)
    {
        switch (e.which)
        {
        case 13:
            $("#result" + self._cursorIndex).click();
            break;

        case 38: // up
            self.navigate(-1);
            break;

        case 40: // down
            self.navigate(1);
            break;

        default: return;
        }
        e.preventDefault();
    };


    this.close = function ()
    {
        $("body").off("keydown", this.keyDown);
        $("#searchresult_cmd").html("");
        $("#cmdpalette").hide();
        $("#modalbg").hide();
    };
};
