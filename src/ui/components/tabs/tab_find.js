import { ele } from "cables-shared-client";
import defaultOps from "../../defaultops.js";
import Tab from "../../elements/tabpanel/tab.js";
import { getHandleBarHtml } from "../../utils/handlebars.js";
import text from "../../text.js";
import { escapeHTML } from "../../utils/helper.js";


/**
 * tab panel for searching through the patch
 *
 * @export
 * @class FindTab
 */
export default class FindTab
{
    constructor(tabs, str)
    {
        this._toggles = ["recent", "outdated", "attention", "bookmarked", "commented", "unconnected", "user", "error", "warning", "hint", "dupassets", "extassets", "textures", "history", "activity", "notcoreops", "currentSubpatch", "selected"];

        this._tab = new Tab("Search", { "icon": "search", "infotext": "tab_find", "padding": true });
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
        this._listenerids = [];

        this._resultsVars = [];
        let colors = [];
        const warnOps = [];

        for (let i = 0; i < gui.corePatch().ops.length; i++)
        {
            const op = gui.corePatch().ops[i];
            if (!op) continue;
            if (op.uiAttribs.error)
            {
                if (defaultOps.isDeprecatedOp(op.objName)) op.isDeprecated = true;
            }
            if (op.uiAttribs.warning) warnOps.push(op);
            if (op.uiAttribs.color) colors.push(op.uiAttribs.color);
        }
        colors = CABLES.uniqueArray(colors);

        const html = getHandleBarHtml("tab_find", { colors, "inputid": this._inputId, "toggles": this._toggles });

        this._tab.html(html);

        this._updateCb = this.searchAfterPatchUpdate.bind(this);

        const listenerChanged = gui.opHistory.addEventListener("changed", this.updateHistory.bind(this));
        this._listenerids.push(listenerChanged);

        this._listenerids.push(gui.corePatch().addEventListener("warningErrorIconChange", this._updateCb));
        this._listenerids.push(gui.corePatch().addEventListener("onOpDelete", this._updateCb));
        this._listenerids.push(gui.corePatch().addEventListener("onOpAdd", this._updateCb));
        this._listenerids.push(gui.corePatch().addEventListener("commentChanged", this._updateCb));

        this._tab.addEventListener("close", () =>
        {
            gui.opHistory.removeEventListener(listenerChanged);

            for (let i = 0; i < this._listenerids.length; i++)
            {
                gui.corePatch().removeEventListener(this._listenerids[i]);
            }

            this._closed = true;
        });

        if (ele.byId(this._inputId)) ele.byId(this._inputId).focus();

        ele.byId(this._inputId).addEventListener("input", (e) =>
        {
            this.search(e.target.value);
        });


        for (let i = 0; i < this._toggles.length; i++)
        {
            const toggleEle = ele.byId(this._inputId + "_" + this._toggles[i]);

            toggleEle.addEventListener("click", () =>
            {
                toggleEle.classList.toggle("findToggleActive");

                const toggles = ele.byClassAll("findToggleActive");

                let srchStr = "";
                for (let j = 0; j < toggles.length; j++)
                    srchStr += toggles[j].dataset.togglestr + " ";

                const toggleInput = ele.byId(this._inputId + "_toggles");
                toggleInput.value = srchStr;

                document.getElementById(this._inputId).dispatchEvent(new Event("input"));
            });
        }

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
        // this._findTimeoutId = setTimeout(() =>
        // {
        this.search(this._lastSearch);
        this.updateHistory();
        // }, 100);

        this._onTrigger = gui.corePatch().on("namedTriggerSent", this._updateTriggers.bind(this));


        this._updateVarsInterval = setInterval(() =>
        {
            if (this._closed)clearInterval(this._updateVarsInterval);

            if (this._resultsTriggers)
            {
                for (let i = 0; i < this._resultsTriggers.length; i++)
                {
                    const t = this._resultsTriggersTimes[this._resultsTriggers[i]];

                    const el = document.getElementById("triggerresult_" + this._resultsTriggers[i]);

                    if (t)
                    {
                        const timediff = performance.now() - t;

                        if (el) el.style.opacity = Math.max(0.1, 500 / (timediff * 6.0));
                    }
                    else if (el) el.style.opacity = 0.1;
                }
            }

            for (let i = 0; i < this._resultsVars.length; i++)
            {
                const el = document.getElementById("varresult_" + this._resultsVars[i].getName());

                let val = String(this._resultsVars[i].getValue());
                if (val.length > 30)
                {
                    val = val.substr(0, 30);
                    val += "...";
                }

                if (el)el.innerHTML = val;
            }
        }, 100);

        if (str)
        {
            this._eleInput.value = str;
            this.search(str);
            this.setSearchInputValue(str);
        }
        this.focus();
    }

    _updateTriggers(n)
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
    }

    focus()
    {
        this._tabs.activateTab(this._tab.id);
        if (ele.byId(this._inputId)) ele.byId(this._inputId).focus();
    }

    isClosed()
    {
        return this._closed;
    }

    setSearchInputValue(str)
    {
        this._eleInput.value = str;
    }

    searchAfterPatchUpdate()
    {
        clearTimeout(this._findTimeoutId);
        this._findTimeoutId = setTimeout(() =>
        {
            const el = ele.byId(this._inputId);
            if (el) this.search(el.value, true);
        }, 100);
    }

    isVisible()
    {
        return this._tab.isVisible();
    }

    _addResultVar(v)
    {
        let html = "";

        const colorClass = "" + defaultOps.getVarClass(v.type);

        html += "<div id=\"" + 0 + "\" class=\"info findresultvar_" + v.getName() + "\" > ";
        html += "<span class=\"" + colorClass + "\">#" + v.getName() + "</span> <span class=\"monospace\" id=\"varresult_" + v.getName() + "\">/span>";
        html += "</div>";

        return html;
    }

    _addResultTrigger(v)
    {
        let html = "";

        const colorClass = "" + defaultOps.getVarClass("trigger");

        html += "<div id=\"" + 0 + "\" class=\"info findresultvar_" + v + "\" > ";
        html += "<span class=\"" + colorClass + "\">#" + v + "</span> <span class=\"monospace\" style=\"opacity:0.1;background-color:var(--color_port_function);\" id=\"triggerresult_" + v + "\">&nbsp;&nbsp;</span>";
        html += "</div>";

        return html;
    }

    _addResultOp(op, result, idx)
    {
        if (!op || !op.uiAttribs || !op.uiAttribs.translate) return;
        let html = "";
        let info = "";
        this._maxIdx = idx;

        info += "## searchresult \n\n* score : " + result.score + text.searchResult + "\n";

        if (op.op)op = op.op;

        const colorClass = "" + defaultOps.getNamespaceClassName(op.objName);

        let hiddenClass = "";
        if (op.uiAttribs.hidden)hiddenClass = "resultHiddenOp";
        if (op.storage && op.storage.blueprint)hiddenClass = "resultHiddenOp";

        html += "<div tabindex=\"0\" id=\"findresult" + idx + "\" class=\"info findresultop" + op.id + " " + hiddenClass + " \" data-info=\"" + info + "\" ";
        html += "onkeypress=\"ele.keyClick(event,this)\" onclick=\"gui.focusFindResult('" + String(idx) + "','" + op.id + "','" + op.uiAttribs.subPatch + "'," + op.uiAttribs.translate.x + "," + op.uiAttribs.translate.y + ");\">";

        let colorHandle = "";
        if (op.uiAttribs.color) colorHandle = "<span style=\"background-color:" + op.uiAttribs.color + ";\">&nbsp;&nbsp;</span>&nbsp;&nbsp;";

        html += "<h3 class=\"" + colorClass + "\">" + colorHandle + op.shortName;
        if (op.uiAttribs.extendTitle) html += " <span style=\"color: var(--color-13);\"> | " + op.uiAttribs.extendTitle + "</span>";

        if (op.isSubPatchOp())
            html += "<span data-eletype=\"icon\" class=\"icon icon-blueprint iconhover\" style=\"margin-left: 6px;vertical-align: bottom;margin-bottom: 2px;\"></span>";

        html += "</h3>";

        if (result.hint) html += "<div class=\"warning-error-level0\">" + result.hint + "</div>";
        if (result.error) html += "<div class=\"warning-error-level2\">" + result.error + "</div>";
        if (result.history) html += "<span class=\"search-history-item\">" + result.history + "</span><br/>";
        if (op.uiAttribs.comment) html += "<span style=\"color: var(--color-special);\"> // " + op.uiAttribs.comment + "</span><br/>";
        // html += "" + op.objName + "<br/>";
        html += result.where || "";


        let highlightsubpatch = "";
        if (op.uiAttribs.subPatch == gui.patchView.getCurrentSubPatch()) highlightsubpatch = "highlight";


        if (op.uiAttribs.subPatch != 0) html += "<br/> Subpatch: <span class=\"" + highlightsubpatch + "\">" + gui.patchView.getSubPatchName(op.uiAttribs.subPatch) + "</span>";


        html += "</div>";

        // this._eleResults.innerHTML += html;
        return html;
    }

    highlightWord(word, str)
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
    }


    _doSearchTriggers(str, userInvoked, ops, results)
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
    }


    _doSearchVars(str, userInvoked, ops, results)
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
    }

    _doSearch(str, userInvoked, ops, results)
    {
        this._lastSearch = str;

        str = str.toLowerCase();

        results = results || [];

        if (str.indexOf(":") == 0)
        {
            if (str == ":attention")
            {
                if (
                    gui.project().summary.isBasicExample ||
                    (gui.project().summary.exampleForOps && gui.project().summary.exampleForOps.length > 0))
                {
                    FindTab.searchOutDated(ops, results);
                    for (let i = 0; i < results.length; i++)
                    {
                        if (defaultOps.isDeprecatedOp(results[i].op.objName)) results[i].error = "example patch: Op is deprecated, should not be used anymore ";
                        else results[i].error = "example patch: Newer version of op available!";
                    }
                }


                for (let i = 0; i < ops.length; i++)
                {
                    const op = ops[i];

                    if (op.uiAttribs && op.uiAttribs.uierrors && op.uiAttribs.uierrors.length > 0)
                        for (let j = 0; j < op.uiAttribs.uierrors.length; j++) if (op.uiAttribs.uierrors[j].level == 2)
                            results.push({ op, "score": 2, "error": op.uiAttribs.uierrors[j].txt });
                }
            }


            if (str == ":outdated")
            {
                FindTab.searchOutDated(ops, results);
            }

            if (str == ":selected")
            {
                FindTab.searchSelected(ops, results);
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
            if (str == ":notcoreops")
            {
                for (let i = 0; i < ops.length; i++)
                {
                    const op = ops[i];
                    if (
                        defaultOps.isPatchOp(op.objName) ||
                        defaultOps.isUserOp(op.objName) ||
                        defaultOps.isTeamOp(op.objName) ||
                        defaultOps.isExtensionOp(op.objName)
                    )
                    {
                        results.push({ op });
                    }
                }
            }

            if (str == ":activity")
            {
                for (let i = 0; i < ops.length; i++)
                {
                    const op = ops[i];

                    let activity = 0;
                    for (let k = 0; k < ops[i].portsIn.length; k++) activity += ops[i].portsIn[k].activityCounter;

                    if (activity) results.push({ op, "score": activity }); // "where": "activity: " + activity
                }
            }
            else
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
            if (str == ":currentsubpatch")
            {
                for (let i = 0; i < ops.length; i++)
                {
                    const op = ops[i];
                    if (op.uiAttribs && op.uiAttribs.subPatch == gui.patchView.getCurrentSubPatch()) results.push({ op, "score": 1 });
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
                            if (op.portsOut[j].get())
                            {
                                let strtex = "unknown";
                                if (op.portsOut[j].get() && op.portsOut[j].get().getInfo)
                                {
                                    const texInfo = op.portsOut[j].get().getInfo();
                                    strtex = op.portsOut[j].get().width + " x " + op.portsOut[j].get().height + " - " + texInfo.filter + " / " + texInfo.wrap + " / " + texInfo.textureType;
                                }

                                results.push({ op, "score": 1, "where": strtex });
                            }
                        }
                    }

                    // if (op.uiAttribs && op.uiAttribs.comment && op.uiAttribs.comment.length > 0)
                    //     results.push({ op, "score": 1, "where": op.uiAttribs.comment });
                }
            }
            else if (str == ":user")
            {
                FindTab.searchUserOps(ops, results);
            }
            else if (str == ":dupassets")
            {
                const assetOps = {};
                for (let i = 0; i < ops.length; i++)
                {
                    for (let k = 0; k < ops[i].portsIn.length; k++)
                    {
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
            else if (str == ":extassets")
            {
                for (let i = 0; i < ops.length; i++)
                {
                    for (let k = 0; k < ops[i].portsIn.length; k++)
                    {
                        if (ops[i].portsIn[k].uiAttribs.display === "file")
                        {
                            const value = ops[i].portsIn[k].get();
                            if (value && value.startsWith("/assets/") && !value.startsWith("/assets/" + gui.patchId))
                            {
                                results.push({ "op": ops[i], "score": 1 });
                            }
                        }
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
                let found = false;

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
                    found = true;
                }


                if (
                    ops[i].uiAttribs.extendTitle &&
                    (ops[i].uiAttribs.extendTitle + "").toLowerCase().indexOf(str) > -1)
                {
                    where = "title: " + this.highlightWord(str, ops[i].uiAttribs.extendTitle);
                    score += 1;
                    found = true;
                }

                if (
                    ops[i].uiAttribs.comment &&
                    ops[i].uiAttribs.comment.toLowerCase().indexOf(str) > -1)
                {
                    where = "comment: " + this.highlightWord(str, ops[i].uiAttribs.comment);
                    score += 1;
                    found = true;
                }

                if (ops[i].opId.indexOf(str) > -1)
                {
                    where = "opid: " + ops[i].opId;
                    score += 1;
                    found = true;
                }

                if (ops[i].id.indexOf(str) > -1)
                {
                    where = "id: " + ops[i].id;
                    score += 1;
                    found = true;
                }


                if (String(ops[i].name || "").toLowerCase().indexOf(str) > -1)
                {
                    if (ops[i].objName.indexOf(ops[i].name) == -1) score += 2; // extra points if non default name

                    if (String(ops[i].name || "").indexOf("var set") === 0) score += 2; // extra points if var setter

                    where = "name: " + this.highlightWord(str, ops[i].name);
                    score += 2;
                    found = true;
                }

                const op = ops[i];
                for (let j = 0; j < op.portsIn.length; j++)
                {
                    if (op.portsIn[j].getVariableName() && op.portsIn[j].getVariableName().toLowerCase().indexOf(str) > -1)
                    {
                        score += 2;
                        where += "port \"" + op.portsIn[j].name + "\" assigned to var " + op.portsIn[j].getVariableName();
                        found = true;
                    }

                    if ((op.portsIn[j].get() + "").toLowerCase().indexOf(str) > -1)
                    {
                        where = "<span style=\"color:var(--color_port_" + op.portsIn[j].getTypeString().toLowerCase() + ");\">▩</span> ";

                        if (!op.portsIn[j].isLinked()) score += 2;
                        else where += "linked ";
                        where += op.portsIn[j].name + ": " + this.highlightWord(str, escapeHTML(op.portsIn[j].get()));
                        score += 2;
                        found = true;
                    }
                }

                if (op.uiAttribs.hidden) score -= 5;
                if (op.storage && op.storage.blueprint) score -= 1;
                if (found && op.uiAttribs.subPatch == gui.patchView.getCurrentSubPatch()) score++;
                if (found) results.push({ "op": ops[i], score, where });
            }
        }
        return results;
    }

    search(str, userInvoked)
    {
        this._maxIdx = -1;
        this.setSelectedOp(null);
        this.setClicked(-1);

        const toggleInput = ele.byId(this._inputId + "_toggles");
        if (toggleInput && toggleInput.value)str += " " + toggleInput.value;

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
        let resultsVars = [];
        // resultsVars=this._doSearchVars(strs[0]);


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
                html += "<div style=\"pointer-events:none\" class=\"warning-error-level1\">found " + numResults + " ops showing only first " + limitResults + " ops<br/>";
                results = results.slice(0, limitResults);
            }
            for (let i = 0; i < results.length; i++)
                html += this._addResultOp(results[i].op, results[i], i);

            let onclickResults = "gui.patchView.unselectAllOps();";

            for (let i = 0; i < results.length; i++)
                onclickResults += "gui.patchView.selectOpId('" + results[i].op.id + "');";

            onclickResults += "gui.patchView.showSelectedOpsPanel();";
            html += "<div style=\"background-color:var(--color-02);border-bottom:none;\">" + results.length + " ops found";

            html += " &nbsp;&nbsp;<a class=\"button-small\" onclick=\"" + onclickResults + "\">Select results</a><br/>";

            html += "</div>";
        }

        this._eleResults.innerHTML = html;
        gui.patchView.checkPatchErrors();

        if (!userInvoked) this.focus();

        const timeUsed = performance.now() - startTime;
    }

    setClicked(num)
    {
        num = parseInt(num);

        let el = ele.byId("findresult" + this._lastClicked);
        if (el) el.classList.remove("lastClicked");

        el = ele.byId("findresult" + num);
        if (el) el.classList.add("lastClicked");
        this._lastClicked = num;
    }

    setSelectedOp(opid)
    {
        let els = document.getElementsByClassName("findresultop" + this._lastSelected);
        if (els && els.length == 1) els[0].classList.remove("selected");

        els = document.getElementsByClassName("findresultop" + opid);
        if (els && els.length == 1) els[0].classList.add("selected");
        this._lastSelected = opid;
    }

    updateHistory()
    {
        if (this._lastSearch == ":recent")
        {
            this._updateCb();
        }
    }
}

FindTab.searchOutDated = (ops, results) =>
{
    for (let i = 0; i < ops.length; i++)
    {
        const doc = gui.opDocs.getOpDocByName(ops[i].objName);
        if ((doc && doc.oldVersion) || defaultOps.isDeprecatedOp(ops[i].objName))
            results.push({ "op": ops[i], "score": 1 });
    }
    return results;
};

FindTab.searchSelected = (ops, results) =>
{
    for (let i = 0; i < ops.length; i++)
    {
        if (ops[i].uiAttribs.selected)
            results.push({ "op": ops[i], "score": 1 });
        // const doc = gui.opDocs.getOpDocByName(ops[i].objName);
        // if ((doc && doc.oldVersion) || defaultOps.isDeprecatedOp(ops[i].objName))
    }
    return results;
};

FindTab.searchUserOps = (ops, results) =>
{
    for (let i = 0; i < ops.length; i++)
    {
        const op = ops[i];
        if (defaultOps.isUserOp(op.objName))
            results.push({ "op": op, "score": 1, "where": op.objName });
    }
    return results;
};

FindTab.searchPatchOps = (ops, results) =>
{
    for (let i = 0; i < ops.length; i++)
    {
        const op = ops[i];
        if (defaultOps.isPatchOp(op.objName))
            results.push({ op, "score": 1, "where": op.objName });
    }
    return results;
};

FindTab.searchTeamOps = (ops, results) =>
{
    for (let i = 0; i < ops.length; i++)
    {
        const op = ops[i];
        if (defaultOps.isTeamOp(op.objName))
            results.push({ op, "score": 1, "where": op.objName });
    }
    return results;
};

FindTab.searchExtensionOps = (ops, results) =>
{
    for (let i = 0; i < ops.length; i++)
    {
        const op = ops[i];
        if (defaultOps.isExtensionOp(op.objName))
            results.push({ op, "score": 1, "where": op.objName });
    }
    return results;
};
