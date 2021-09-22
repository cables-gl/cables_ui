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
    this._resultsTriggersTimes = {};

    this._resultsVars = [];

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

    this._onTrigger = gui.corePatch().on("namedTriggerSent", this._updateTriggers.bind(this));


    this._updateVarsInterval = setInterval(() =>
    {
        if (this._closed)clearInterval(this._updateVarsInterval);

        if (this._resultsTriggers)
        {
            for (let i = 0; i < this._resultsTriggers.length; i++)
            {
                const t = this._resultsTriggersTimes[this._resultsTriggers[i]];

                const ele = document.getElementById("triggerresult_" + this._resultsTriggers[i]);

                if (t)
                {
                    const timediff = performance.now() - t;

                    if (ele) ele.style.opacity = Math.max(0.1, 500 / (timediff * 6.0));
                }
                else if (ele) ele.style.opacity = 0.1;
            }
        }

        for (let i = 0; i < this._resultsVars.length; i++)
        {
            const ele = document.getElementById("varresult_" + this._resultsVars[i].getName());

            let val = String(this._resultsVars[i].getValue());
            if (val.length > 30)
            {
                val = val.substr(0, 30);
                val += "...";
            }

            if (ele)ele.innerHTML = val;
        }
    }, 100);

    if (str)
    {
        this._eleInput.value = str;
        this.search(str);
    }
    this.focus();
};

CABLES.UI.FindTab.prototype._updateTriggers = function (n)
{
    if (!this._resultsTriggers) return;
    this._resultsTriggersTimes = this._resultsTriggersTimes || {};
    for (let i = 0; i < this._resultsTriggers.length; i++)
    {
        if (this._resultsTriggers[i] == n)
        {
            this._resultsTriggersTimes[n] = performance.now();
        }
    }
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

CABLES.UI.FindTab.prototype._addResultVar = function (v)
{
    let html = "";

    const colorClass = "" + CABLES.UI.uiConfig.getVarClass(v.type);

    html += "<div id=\"" + 0 + "\" class=\"info findresultvar_" + v.getName() + "\" > ";
    html += "<span class=\"" + colorClass + "\">#" + v.getName() + "</span> <span class=\"monospace\" id=\"varresult_" + v.getName() + "\">/span>";
    html += "</div>";

    return html;
};

CABLES.UI.FindTab.prototype._addResultTrigger = function (v)
{
    let html = "";

    const colorClass = "" + CABLES.UI.uiConfig.getVarClass("trigger");

    html += "<div id=\"" + 0 + "\" class=\"info findresultvar_" + v + "\" > ";
    html += "<span class=\"" + colorClass + "\">#" + v + "</span> <span class=\"monospace\" style=\"opacity:0.1;background-color:var(--color_port_function);\" id=\"triggerresult_" + v + "\">&nbsp;&nbsp;</span>";
    html += "</div>";

    return html;
};

CABLES.UI.FindTab.prototype._addResultOp = function (op, result, idx)
{
    if (!op || !op.uiAttribs || !op.uiAttribs.translate) return;
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
    if (result.history) html += "<span class=\"search-history-item\">" + result.history + "</span><br/>";
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


CABLES.UI.FindTab.prototype._doSearchTriggers = function (str, userInvoked, ops, results)
{
    const triggers = gui.corePatch().namedTriggers;
    const foundtriggers = [];

    for (let i in triggers)
    {
        if (i.toLowerCase().indexOf(str) > -1)
        {
            foundtriggers.push(i);
        }
    }
    return foundtriggers;
};


CABLES.UI.FindTab.prototype._doSearchVars = function (str, userInvoked, ops, results)
{
    const vars = gui.corePatch().getVars();
    const foundVars = [];

    for (let i in vars)
    {
        if (i.toLowerCase().indexOf(str) > -1)
        {
            foundVars.push(vars[i]);
        }
    }
    return foundVars;
};

CABLES.UI.FindTab.prototype._doSearch = function (str, userInvoked, ops, results)
{
    console.log("_doSearch", str);
    this._lastSearch = str;

    str = str.toLowerCase();

    results = results || [];

    gui.log.userInteraction("searches " + str);

    if (str.indexOf(":") == 0)
    {
        if (str == ":outdated")
        {
            for (let i = 0; i < ops.length; i++)
            {
                const doc = gui.opDocs.getOpDocByName(ops[i].objName);
                if ((doc && doc.oldVersion) || ops[i].objName.toLowerCase().indexOf("Deprecated") > -1)
                    results.push({ "op": ops[i], "score": 1 });
            }
        }

        if (str == ":recent")
        {
            const history = gui.opHistory.getAsArray(99);

            for (let i = 0; i < history.length; i++)
            {
                const op = gui.corePatch().getOpById(history[i].id);
                results.push({ op, "score": 1 });
            }
        }

        if (str == ":error")
        {
            for (let i = 0; i < ops.length; i++)
            {
                const op = ops[i];

                if (op.uiAttribs && op.uiAttribs.uierrors && op.uiAttribs.uierrors.length > 0)
                    for (let j = 0; j < op.uiAttribs.uierrors.length; j++) if (op.uiAttribs.uierrors[j].level == 2)
                        results.push({ op, "score": 1, "error": op.uiAttribs.uierrors[j].txt });
            }
        }
        else
        if (str == ":warning")
        {
            for (let i = 0; i < ops.length; i++)
            {
                const op = ops[i];

                if (op.uiAttribs && op.uiAttribs.uierrors && op.uiAttribs.uierrors.length > 0)
                    for (let j = 0; j < op.uiAttribs.uierrors.length; j++) if (op.uiAttribs.uierrors[j].level == 1)
                        results.push({ op, "score": 1 });
            }
        }
        else
        if (str == ":hint")
        {
            for (let i = 0; i < ops.length; i++)
            {
                const op = ops[i];
                if (op.uiAttribs && op.uiAttribs.uierrors && op.uiAttribs.uierrors.length > 0)
                    results.push({ op, "score": 1 });
            }
        }
        else
        if (str == ":commented")
        {
            for (let i = 0; i < ops.length; i++)
            {
                const op = ops[i];

                if (op.uiAttribs && op.uiAttribs.comment && op.uiAttribs.comment.length > 0)
                    results.push({ op, "score": 1, "where": op.uiAttribs.comment });
            }
        }
        else
        if (str == ":textures")
        {
            for (let i = 0; i < ops.length; i++)
            {
                const op = ops[i];
                for (let j = 0; j < op.portsOut.length; j++)
                {
                    if (op.portsOut[j].get() && op.portsOut[j].uiAttribs.objType === "texture")
                    {
                        const texInfo = op.portsOut[j].get().getInfo();
                        const strtex = op.portsOut[j].get().width + " x " + op.portsOut[j].get().height + " - " + texInfo.filter + " / " + texInfo.wrap + " / " + texInfo.textureType;

                        results.push({ op, "score": 1, "where": strtex });
                    }
                }

                // if (op.uiAttribs && op.uiAttribs.comment && op.uiAttribs.comment.length > 0)
                //     results.push({ op, "score": 1, "where": op.uiAttribs.comment });
            }
        }
        else if (str == ":user")
        {
            for (let i = 0; i < ops.length; i++)
            {
                const op = ops[i];
                if (op.objName.indexOf("Ops.User") == 0)
                    results.push({ op, "score": 1, "where": op.objName });
            }
        }
        else if (str == ":dupassets")
        {
            const assetOps = {};
            for (let i = 0; i < ops.length; i++)
            {
                for (let k = 0; k < ops[i].portsIn.length; k++)
                {
                    console.log(ops[i].portsIn[k].uiAttribs.display);
                    if (ops[i].portsIn[k].uiAttribs.display === "file")
                    {
                        if (ops[i].portsIn[k].get())
                        {
                            assetOps[ops[i].portsIn[k].get()] = assetOps[ops[i].portsIn[k].get()] || { "ops": [] };
                            assetOps[ops[i].portsIn[k].get()].ops.push(ops[i]);
                        }
                    }
                }
            }

            for (let i in assetOps)
            {
                if (assetOps[i].ops.length > 1)
                {
                    for (let j = 0; j < assetOps[i].ops.length; j++)
                        results.push({ "op": assetOps[i].ops[j], "score": 1 });
                }
            }
        }
        else if (str.indexOf(":color=") == 0)
        {
            const col = str.substr(7).toLowerCase();

            for (let i = 0; i < ops.length; i++)
            {
                const op = ops[i];
                if (op.uiAttribs.color && op.uiAttribs.color.toLowerCase() == col)
                    results.push({ "op": op, "score": 1 });
            }
        }
        else if (str == ":bookmarked")
        {
            const bms = gui.bookmarks.getBookmarks();

            for (let i = 0; i < bms.length; i++)
            {
                const op = gui.corePatch().getOpById(bms[i]);
                results.push({ op, "score": 1 });
            }
        }
        else if (str == ":unconnected")
        {
            for (let i = 0; i < ops.length; i++)
            {
                const op = ops[i];
                let count = 0;
                for (let j = 0; j < op.portsIn.length; j++)
                    if (op.portsIn[j].isLinked())
                        count++;

                if (count == 0)
                {
                    for (let j = 0; j < op.portsOut.length; j++)
                        if (op.portsOut[j].isLinked())
                            count++;
                }

                if (count == 0)
                    results.push({ op, "score": 1 });
            }
        }
        else if (str == ":history")
        {
            for (let i = 0; i < ops.length; i++)
            {
                const op = ops[i];
                let score = 0;
                let dateString = null;
                let userName = null;
                if (op.uiAttribs.history && op.uiAttribs.history.lastInteractionAt)
                {
                    score = op.uiAttribs.history.lastInteractionAt;
                    userName = op.uiAttribs.history.lastInteractionBy.name;
                    dateString = moment(op.uiAttribs.history.lastInteractionAt).fromNow();
                }
                if (score > 0)
                {
                    results.push({ op, "score": score, "history": dateString + " - changed by " + userName });
                }
            }
        }
    }
    else
    {
        let where = "";

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

                if (String(ops[i].name || "").indexOf("var set") === 0) score += 2; // extra points if var setter

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
            if (score > 0) results.push({ "op": ops[i], score, where });
        }
    }
    return results;
};

CABLES.UI.FindTab.prototype.search = function (str, userInvoked)
{
    this._maxIdx = -1;
    this.setSelectedOp(null);
    this.setClicked(-1);

    const strs = str.split(" ");

    const startTime = performance.now();

    let html = "";
    this._eleResults.innerHTML = "";

    if (str.length < 2)
    {
        this._eleResults.innerHTML = "Type some more!";
        return;
    }

    let results = this._doSearch(strs[0] || "", userInvoked, gui.corePatch().ops) || [];

    let resultsTriggers = this._doSearchTriggers(strs[0]);
    let resultsVars = this._doSearchVars(strs[0]);


    if (strs.length > 1)
    {
        for (let i = 1; i < strs.length; i++)
        {
            if (!strs[i]) continue;

            const ops = [];
            for (let j = 0; j < results.length; j++) ops.push(results[j].op);

            const newResults = this._doSearch(strs[i] || "", userInvoked, ops) || [];

            results = newResults;
        }
    }

    let foundNum = results.length + resultsVars.length;

    if (foundNum === 0)
    {
        let what = "ops";
        if (str == ":error")what = "errors";

        html = "<div style=\"pointer-events:none\">&nbsp;&nbsp;&nbsp;No " + what + " found</div>";
    }
    else
    {
        this._resultsVars = resultsVars;
        for (let i = 0; i < resultsVars.length; i++) html += this._addResultVar(resultsVars[i]);

        this._resultsTriggers = resultsTriggers;
        for (let i = 0; i < resultsTriggers.length; i++) html += this._addResultTrigger(resultsTriggers[i]);


        results.sort(function (a, b) { return b.score - a.score; });
        const numResults = results.length;
        const limitResults = 200;
        if (numResults > limitResults)
        {
            html += "<div style=\"pointer-events:none\" class=\"warning-error-level1\">found " + numResults + " ops showing only first " + limitResults + " results</div>";
            results = results.slice(0, limitResults);
        }
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

    if (!userInvoked) this.focus();

    const timeUsed = performance.now() - startTime;
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
