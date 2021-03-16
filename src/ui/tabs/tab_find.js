CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.FindTab = function (tabs, str)
{
    this._tab = new CABLES.UI.Tab("Search", { "icon": "search", "infotext": "tab_find", "padding": true });
    tabs.addTab(this._tab, true);
    this._tabs = tabs;

    this._lastSearch = "";
    this._findTimeoutId = 0;
    this._canceledSearch = 0;
    this._lastClicked = -1;
    this._lastSelected = -1;
    this._maxIdx = -1;
    this._inputId = "tabFindInput" + CABLES.uuid();
    this._closed = false;
    this._eleInput = null;

    let colors = [];
    const warnOps = [];

    for (let i = 0; i < gui.corePatch().ops.length; i++)
    {
        const op = gui.corePatch().ops[i];
        if (!op) continue;
        if (op.uiAttribs.error)
        {
            if (op.objName.toLowerCase().indexOf("Deprecated") > -1)op.isDeprecated = true;
        }
        if (op.uiAttribs.warning) warnOps.push(op);
        if (op.uiAttribs.color) colors.push(op.uiAttribs.color);
    }
    colors = CABLES.uniqueArray(colors);

    const html = CABLES.UI.getHandleBarHtml("tab_find", { colors, "inputid": this._inputId });

    this._tab.html(html);

    this._updateCb = this.searchAfterPatchUpdate.bind(this);

    gui.opHistory.addEventListener("changed", this.updateHistory.bind(this));

    gui.corePatch().addEventListener("warningErrorIconChange", this._updateCb);
    gui.corePatch().addEventListener("onOpDelete", this._updateCb);
    gui.corePatch().addEventListener("onOpAdd", this._updateCb);
    gui.corePatch().addEventListener("commentChanged", this._updateCb);

    this._tab.addEventListener("onClose", () =>
    {
        gui.opHistory.removeEventListener("changed", this.updateHistory.bind(this));

        gui.corePatch().removeEventListener("onOpDelete", this._updateCb);
        gui.corePatch().removeEventListener("onOpAdd", this._updateCb);
        gui.corePatch().removeEventListener("commentChanged", this._updateCb);
        this._closed = true;
    });

    if (ele.byId(this._inputId)) ele.byId(this._inputId).focus();

    ele.byId(this._inputId).addEventListener("input", (e) =>
    {
        this.search(e.target.value);
    });

    ele.byId(this._inputId).addEventListener(
        "keydown",
        (e) =>
        {
            if (e.keyCode == 38)
            {
                let c = this._lastClicked - 1;
                if (c < 0) c = 0;
                this.setClicked(c);
                const resultEle = ele.byId("findresult" + c);
                if (resultEle) resultEle.click();
                if (ele.byId(this._inputId)) ele.byId(this._inputId).focus();
            }
            else if (e.keyCode == 40)
            {
                let c = this._lastClicked + 1;
                if (c > this._maxIdx - 1) c = this._maxIdx;
                this.setClicked(c);
                const resultEle = ele.byId("findresult" + c);
                if (resultEle) resultEle.click();
                if (ele.byId(this._inputId)) ele.byId(this._inputId).focus();
            }
        }

    );

    this._eleInput = document.querySelector("#tabsearchbox input");
    this._eleInput.value = this._lastSearch;
    this._eleResults = ele.byId("tabsearchresult");

    this.focus();
    ele.byId(this._inputId).setSelectionRange(0, this._lastSearch.length);

    clearTimeout(this._findTimeoutId);
    this._findTimeoutId = setTimeout(() =>
    {
        this.search(this._lastSearch);
        this.updateHistory();
    }, 100);

    if (str)
    {
        this._eleInput.value = str;
        this.search(str);
    }
    this.focus();
};

CABLES.UI.FindTab.prototype.focus = function ()
{
    this._tabs.activateTab(this._tab.id);
    if (ele.byId(this._inputId)) ele.byId(this._inputId).focus();
};

CABLES.UI.FindTab.prototype.isClosed = function ()
{
    return this._closed;
};

CABLES.UI.FindTab.prototype.setSearchInputValue = function (str)
{
    this._eleInput.value = str;
};

CABLES.UI.FindTab.prototype.searchAfterPatchUpdate = function ()
{
    clearTimeout(this._findTimeoutId);
    this._findTimeoutId = setTimeout(() =>
    {
        const el = ele.byId(this._inputId);
        if (el) this.search(el.value, true);
    }, 100);
};

CABLES.UI.FindTab.prototype.isVisible = function ()
{
    return this._tab.isVisible();
};

// CABLES.UI.FindTab.prototype._addResultOp
// {

// }

CABLES.UI.FindTab.prototype._addResultOp = function (op, result, idx)
{
    if (!op.uiAttribs || !op.uiAttribs.translate) return;
    let html = "";
    let info = "";
    this._maxIdx = idx;

    info += "* score : " + result.score + "\n";

    if (op.op)op = op.op;

    const colorClass = "op_color_" + CABLES.UI.uiConfig.getNamespaceClassName(op.objName);
    html += "<div id=\"findresult" + idx + "\" class=\"info findresultop" + op.id + "\" data-info=\"" + info + "\" ";
    html += "onclick=\"gui.focusFindResult('" + String(idx) + "','" + op.id + "','" + op.uiAttribs.subPatch + "'," + op.uiAttribs.translate.x + "," + op.uiAttribs.translate.y + ");\">";

    let colorHandle = "";
    if (op.uiAttribs.color) colorHandle = "<span style=\"background-color:" + op.uiAttribs.color + ";\">&nbsp;&nbsp;</span>&nbsp;&nbsp;";

    html += "<h3 class=\"" + colorClass + "\">" + colorHandle + op.name;
    if (op.uiAttribs.extendTitle) html += " <span style=\"color: var(--color-13);\"> | " + op.uiAttribs.extendTitle + "</span>";

    html += "</h3>";

    if (result.error) html += "<div class=\"warning-error-level2\">" + result.error + "</div>";
    if (op.uiAttribs.comment) html += "<span style=\"color: var(--color-special);\"> // " + op.uiAttribs.comment + "</span><br/>";
    // html += "" + op.objName + "<br/>";
    html += result.where || "";


    let highlightsubpatch = "";
    if (op.uiAttribs.subPatch == gui.patchView.getCurrentSubPatch()) highlightsubpatch = "highlight";

    if (op.uiAttribs.subPatch != 0) html += "<br/> subpatch: <span class=\"" + highlightsubpatch + "\">" + gui.patchView.getSubPatchName(op.uiAttribs.subPatch) + "</span>";

    html += "</div>";

    // this._eleResults.innerHTML += html;
    return html;
};

CABLES.UI.FindTab.prototype.highlightWord = function (word, str)
{
    if (!str || str == "") return "";
    str += "";

    const pos = str.toLowerCase().indexOf(word.toLowerCase());
    if (pos >= 0)
    {
        const outStrA = str.substring(pos - 15, pos);
        const outStrB = str.substring(pos, pos + word.length);
        const outStrC = str.substring(pos + word.length, pos + 15);
        // str = str.replace(stringReg, "<span class=\"highlight\">" + word + "</span>");
        str = outStrA + "<b style=\"background-color:#aaa;color:black;\">" + outStrB + "</b>" + outStrC;
    }

    return str;
};

CABLES.UI.FindTab.prototype.doSearch = function (str, userInvoked)
{
    const startTime = performance.now();
    this._lastSearch = str;
    let html = "";
    this._eleResults.innerHTML = "";

    if (str.length < 2)
    {
        this._eleResults.innerHTML = "Type some more!";
        return;
    }

    str = str.toLowerCase();

    let foundNum = 0;
    const results = [];

    gui.log.userInteraction("searches " + str);

    if (str.indexOf(":") == 0)
    {
        if (str == ":outdated")
        {
            const ops = gui.corePatch().ops;
            for (let i = 0; i < ops.length; i++)
            {
                const doc = gui.opDocs.getOpDocByName(ops[i].objName);
                if ((doc && doc.oldVersion) || ops[i].objName.toLowerCase().indexOf("Deprecated") > -1)
                {
                    results.push({ "op": ops[i], "score": 1 });
                    foundNum++;
                }
            }
        }

        if (str == ":recent")
        {
            const history = gui.opHistory.getAsArray(99);

            for (let i = 0; i < history.length; i++)
            {
                const op = gui.corePatch().getOpById(history[i].id);
                results.push({ op, "score": 1 });
                foundNum++;
            }
        }

        if (str == ":error")
        {
            for (let i = 0; i < gui.corePatch().ops.length; i++)
            {
                const op = gui.corePatch().ops[i];

                if (op.uiAttribs && op.uiAttribs.uierrors && op.uiAttribs.uierrors.length > 0)
                    for (let j = 0; j < op.uiAttribs.uierrors.length; j++) if (op.uiAttribs.uierrors[j].level == 2)
                    {
                        results.push({ op, "score": 1, "error": op.uiAttribs.uierrors[j].txt });
                        foundNum++;
                    }
            }
        }
        else
        if (str == ":warning")
        {
            for (let i = 0; i < gui.corePatch().ops.length; i++)
            {
                const op = gui.corePatch().ops[i];

                if (op.uiAttribs && op.uiAttribs.uierrors && op.uiAttribs.uierrors.length > 0)
                    for (let j = 0; j < op.uiAttribs.uierrors.length; j++) if (op.uiAttribs.uierrors[j].level == 1)
                    {
                        results.push({ op, "score": 1 });
                        foundNum++;
                    }
            }
        }
        else
        if (str == ":hint")
        {
            for (let i = 0; i < gui.corePatch().ops.length; i++)
            {
                const op = gui.corePatch().ops[i];
                if (op.uiAttribs && op.uiAttribs.uierrors && op.uiAttribs.uierrors.length > 0)
                {
                    results.push({ op, "score": 1 });
                    foundNum++;
                }
            }
        }
        else
        if (str == ":commented")
        {
            for (let i = 0; i < gui.corePatch().ops.length; i++)
            {
                const op = gui.corePatch().ops[i];

                if (op.uiAttribs && op.uiAttribs.comment && op.uiAttribs.comment.length > 0)
                {
                    results.push({ op, "score": 1, "where": op.uiAttribs.comment });
                    foundNum++;
                }
            }
        }
        else if (str == ":user")
        {
            for (let i = 0; i < gui.corePatch().ops.length; i++)
            {
                const op = gui.corePatch().ops[i];
                if (op.objName.indexOf("Ops.User") == 0)
                {
                    results.push({ op, "score": 1, "where": op.objName });
                    foundNum++;
                }
            }
        }
        else if (str.indexOf(":color=") == 0)
        {
            const col = str.substr(7).toLowerCase();

            for (let i = 0; i < gui.corePatch().ops.length; i++)
            {
                const op = gui.corePatch().ops[i];
                if (op.uiAttribs.color && op.uiAttribs.color.toLowerCase() == col)
                {
                    results.push({ op, "score": 1 });
                    foundNum++;
                }
            }
        }
        else if (str == ":bookmarked")
        {
            const bms = gui.bookmarks.getBookmarks();

            for (let i = 0; i < bms.length; i++)
            {
                const op = gui.corePatch().getOpById(bms[i]);
                results.push({ op, "score": 1 });
                foundNum++;
            }
        }
        else if (str == ":unconnected")
        {
            for (let i = 0; i < gui.corePatch().ops.length; i++)
            {
                const op = gui.corePatch().ops[i];
                let count = 0;
                for (let j = 0; j < op.portsIn.length; j++)
                {
                    if (op.portsIn[j].isLinked())
                    {
                        count++;
                    }
                }
                if (count == 0)
                {
                    for (let j = 0; j < op.portsOut.length; j++)
                        if (op.portsOut[j].isLinked())
                            count++;
                }

                if (count == 0)
                {
                    results.push({ op, "score": 1 });
                    foundNum++;
                }
            }
        }
    }
    else
    {
        let where = "";
        const ops = gui.corePatch().ops;
        for (let i = 0; i < ops.length; i++)
        {
            let score = 0;

            if (str.length > 5)
            {
                if (ops[i].id.indexOf(str) > -1)
                {
                    where = "op id ";
                    score += 1;
                }
            }

            if (ops[i].objName.toLowerCase().indexOf(str) > -1)
            {
                where = "name: " + this.highlightWord(str, ops[i].objName);
                score += 1;
            }

            if (
                ops[i].uiAttribs.comment &&
                ops[i].uiAttribs.comment.toLowerCase().indexOf(str) > -1)
            {
                where = "comment: " + this.highlightWord(str, ops[i].uiAttribs.comment);
                score += 1;
            }

            if (String(ops[i].name || "").toLowerCase().indexOf(str) > -1)
            {
                if (ops[i].objName.indexOf(ops[i].name) == -1) score += 2; // extra points if non default name

                where = "name: " + this.highlightWord(str, ops[i].name);
                score += 2;
            }

            const op = ops[i];
            for (let j = 0; j < op.portsIn.length; j++)
            {
                if ((op.portsIn[j].get() + "").toLowerCase().indexOf(str) > -1)
                {
                    where = "<span style=\"color:var(--color_port_" + op.portsIn[j].getTypeString().toLowerCase() + ");\">▩</span> ";
                    where += op.portsIn[j].name + ": " + this.highlightWord(str, op.portsIn[j].get());
                    score += 2;
                }
            }

            if (score > 0 && op.uiAttribs.subPatch == gui.patchView.getCurrentSubPatch()) score++;
            if (score > 0)
            {
                results.push({ "op": ops[i], score, where });
                foundNum++;
            }
        }
    }

    if (foundNum === 0)
    {
        let what = "ops";
        if (str == ":error")what = "errors";

        html = "<div style=\"pointer-events:none\">&nbsp;&nbsp;&nbsp;No " + what + " found</div>";
    }
    else
    {
        results.sort(function (a, b) { return b.score - a.score; });

        for (let i = 0; i < results.length; i++)
            html += this._addResultOp(results[i].op, results[i], i);

        let onclickResults = "gui.log.userInteraction('searchresult click');gui.patch().setSelectedOp(null);";
        for (let i = 0; i < results.length; i++)
            onclickResults += "gui.patch().addSelectedOpById('" + results[i].op.id + "');";
        onclickResults += "gui.patch().setStatusSelectedOps();";
        html += "<div style=\"background-color:var(--color-02);border-bottom:none;\"><a class=\"button-small\" onclick=\"" + onclickResults + "\">" + results.length + " results</a></div>";
    }

    this._eleResults.innerHTML = html;
    gui.patchView.checkPatchErrors();
    const timeUsed = performance.now() - startTime;

    if (!userInvoked) this.focus();
};

CABLES.UI.FindTab.prototype.search = function (str, userInvoked)
{
    this._maxIdx = -1;
    this.setSelectedOp(null);
    this.setClicked(-1);
    this.doSearch(str || "", userInvoked);
};

CABLES.UI.FindTab.prototype.setClicked = function (num)
{
    num = parseInt(num);

    let el = ele.byId("findresult" + this._lastClicked);
    if (el) el.classList.remove("lastClicked");

    el = ele.byId("findresult" + num);
    if (el) el.classList.add("lastClicked");
    this._lastClicked = num;
};

CABLES.UI.FindTab.prototype.setSelectedOp = function (opid)
{
    let els = document.getElementsByClassName("findresultop" + this._lastSelected);
    if (els && els.length == 1) els[0].classList.remove("selected");

    els = document.getElementsByClassName("findresultop" + opid);
    if (els && els.length == 1) els[0].classList.add("selected");
    this._lastSelected = opid;
};

CABLES.UI.FindTab.prototype.updateHistory = function ()
{
    if (this._lastSearch == ":recent")
    {
        this._updateCb();
    }
};
