import defaultops from "../defaultops";
import ele from "../utils/ele";
import { getHandleBarHtml } from "../utils/handlebars";
import ModalBackground from "./modalbg";
import OpTreeList from "../components/opselect_treelist";
import text from "../text";
import userSettings from "../components/usersettings";
import Gui from "../gui";

CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.OPSELECT = {};
CABLES.UI.OPSELECT.linkNewLink = null;
CABLES.UI.OPSELECT.linkNewOpToPort = null;
CABLES.UI.OPSELECT.newOpPos = { "x": 0, "y": 0 };
CABLES.UI.OPSELECT.maxPop = 0;

export default class OpSelect
{
    constructor()
    {
        this._list = null;
        this.displayBoxIndex = 0;
        this.itemHeight = 0;
        this.firstTime = true;
        this.tree = new OpTreeList();
        this._sortTimeout = 0;
        this._backspaceDelay = -1;
        this._wordsDb = null;
        this._eleSearchinfo = null;
        this._forceShowOldOps = userSettings.get("showOldOps") || false;
        this._newOpOptions = {};
        this._searchInputEle = null;
        this._enterPressedEarly = false;
        this._searching = false;
        this._bg = new ModalBackground();
        this._escapeListener = null;
        this._typedSinceOpening = false;
    }

    close()
    {
        gui.patchView.focus();
        ele.hide();
        this._bg.hide();
        ele.hide(ele.byId("opsearchmodal"));
    }

    _getQuery()
    {
        const el = ele.byId("opsearch");
        if (!el) return "";
        return el.value || "";
    }

    updateOptions(opname)
    {
        this._hideUserOps = gui.project().isOpExample;

        const perf = CABLES.UI.uiProfiler.start("opselect.udpateOptions");
        const num = ele.byQueryAll(".searchbrowser .searchable:not(.hidden)").length;
        const query = this._getQuery();

        const eleTypeStart = ele.byId("search_startType");
        const eleTypeMore = ele.byId("search_startTypeMore");
        const eleNoResults = ele.byId("search_noresults");

        if (query.length === 0)
        {
            ele.show(eleTypeStart);// .classList.remove("hidden");

            for (let i = 0; i < this._list.length; i++)
                if (this._list[i].element)
                    ele.hide(this._list[i].element);
        }
        else ele.hide(eleTypeStart);// .classList.add("hidden");

        if (query.length == 1) ele.show(eleTypeMore);// .classList.remove("hidden");
        else ele.hide(eleTypeMore);// .classList.add("hidden");

        if (num == 0 && query.length > 1)
        {
            ele.show(eleNoResults);// .classList.remove("hidden");
            ele.byId("searchinfo").innerHMTL = "";
            // const userOpName = "Ops.User." + gui.user.usernameLowercase + "." + this._getQuery();
            // document.getElementById("userCreateOpName").innerHTML = userOpName;
            // document.getElementById("createuserop").addEventListener("click", () => { gui.serverOps.create(userOpName); });
        }
        else
        {
            ele.hide(eleNoResults);// .classList.add("hidden");
        }

        let optionsHtml = "";

        if (num == 0 && gui.project().users.indexOf(gui.user.id) == -1)
            optionsHtml += "<span class=\"warning\">Your user ops are hidden, you are not a collaborator of patch </span><br/>";

        if (this._hideUserOps)
            optionsHtml += "<span class=\"warning\">Your user ops are hidden, pach is an op example</span><br/>";

        optionsHtml += "&nbsp;Found " + num + " ops.";// in '+(Math.round(this._timeUsed)||0)+'ms ';


        let score = 0;
        const selected = document.getElementsByClassName("selected");// .data('scoreDebug')

        if (selected.length > 0)score = Math.round(100 * selected[0].dataset.score) / 100;

        if (score && score == score)
        {
            let scoredebug = "";

            if (selected.length > 0) scoredebug = selected[0].dataset.scoreDebug;

            optionsHtml += "&nbsp;&nbsp;|&nbsp;&nbsp;<span class=\"tt\" data-tt=\"" + scoredebug + "\">";
            optionsHtml += "Score:" + score;
            optionsHtml += "</span>";
        }

        document.getElementById("opOptions").innerHTML = optionsHtml;
        perf.finish();
    }

    _searchWord(wordIndex, orig, list, query, options)
    {
        if (!query || query == " " || query == "") return;

        const perf = CABLES.UI.uiProfiler.start("opselect._searchWord");

        for (let i = 0; i < list.length; i++)
        {
            if (wordIndex > 0 && list[i].score == 0) continue; // when second word was found, but first was not

            let scoreDebug = "<b>Query: " + query + " </b><br/>";
            let found = false;
            let points = 0;


            if (list[i].lowercasename.indexOf(query) > -1)
            {
                if (list[i].name == "Ops.Gl.MainLoop")
                {
                    found = true;
                    scoreDebug += "+2 vip op<br/>";
                    points += 2;
                }
            }

            if (list[i].userOp && this._hideUserOps)
            {
                continue;
            }


            if (list[i]._summary.indexOf(query) > -1)
            {
                found = true;
                points += 1;
                scoreDebug += "+1 found in summary (" + query + ")<br/>";
            }

            if (list[i]._nameSpace.indexOf(query) > -1)
            {
                found = true;
                points += 1;
                scoreDebug += "+1 found in namespace (" + query + ")<br/>";
            }

            if (list[i]._shortName.indexOf(query) > -1)
            {
                found = true;
                points += 4;
                scoreDebug += "+4 found in shortname (" + query + ")<br/>";
            }

            if (list[i]._shortName == query)
            {
                found = true;
                points += 5;
                scoreDebug += "+5 query quals shortname<br/>";
            }

            if (orig.length > 1 && list[i]._lowerCaseName.indexOf(orig) > -1)
            {
                found = true;
                points += 2;
                scoreDebug += "+2 found full namespace (" + query + ")<br/>";
            }

            if (points == 0)
            {
                if (list[i]._lowerCaseName.indexOf(query) > -1)
                {
                    found = true;
                    points += 2;
                    scoreDebug += "+2 found full namespace (" + query + ")<br/>";
                }
            }

            if (found)
            {
                if (list[i]._shortName.indexOf(query) === 0)
                {
                    points += 2.5;
                    scoreDebug += "+2.5 found in shortname at beginning (" + query + ")<br/>";

                    if (list[i]._shortName == query)
                    {
                        points += 2;
                        scoreDebug += "+2 exact name (" + query + ")<br/>";
                    }
                }

                if (list[i]._summary.length > 0)
                {
                    points += 0.5;
                    scoreDebug += "+0.5 has summary (" + query + ")<br/>";
                }

                if (list[i]._nameSpace.indexOf("ops.math") > -1)
                {
                    points += 1;
                    scoreDebug += "+1 is math (" + query + ")<br/>";
                }

                const shortnessPoints = Math.round((1.0 - Math.min(1, (list[i]._nameSpace + list[i]._shortName).length / 100)) * 100) / 100;
                points += shortnessPoints;
                scoreDebug += shortnessPoints + " shortness namespace<br/>";
            }

            if (found && this._list[i].old)
            {
                points -= 1;
                scoreDebug += "-1 outdated<br/>";
            }


            if (found && list[i].pop > 0)
            {
                points += (list[i].pop || 2) / CABLES.UI.OPSELECT.maxPop || 1;
            }

            if (!found) points = 0;
            // if(points && wordIndex>0 && list[i].score==0) points=0; // e.g. when second word was found, but first was not

            if (points === 0 && list[i].score > 0) list[i].score = 0;
            else list[i].score += points;

            list[i].scoreDebug = (list[i].scoreDebug || "") + scoreDebug + " (" + Math.round(points * 100) / 100 + " points)<br/><br/>";
        }

        perf.finish();
    }

    _search(sq)
    {
        for (let i in CABLES.UI.DEFAULTMATHOPS) if (sq === i)
        {
            sq = CABLES.UI.DEFAULTMATHOPS[i];
            this._enterPressedEarly = true;
        }

        if (!this._list || !this._html) this.prepare();

        this.firstTime = false;
        sq = sq || "";
        let query = sq.toLowerCase();

        const options = {
            "linkNamespaceIsTextureEffects": false,
        };

        if (this._newOpOptions.linkNewOpToOp && this._newOpOptions.linkNewOpToOp.objName.toLowerCase().indexOf(".textureeffects") > -1) options.linkNamespaceIsTextureEffects = true;

        const origQuery = query;

        if (this._wordsDb == null && this._list) // build word database by splitting up camelcase
        {
            const buildWordDB = {};
            for (let i = 0; i < this._list.length; i++)
            {
                const res = this._list[i].name.split(/(?=[A-Z,0-9,/.])/);
                for (let j = 0; j < res.length; j++)
                {
                    if (res[j][res[j].length - 2] == "_")res[j] = res[j].substr(0, res[j].length - 2);
                    if (res[j][0] == ".") res[j] = res[j].substr(1);
                    if (res[j].length > 2) buildWordDB[res[j].toLowerCase()] = 1;
                }
            }

            this._wordsDb = Object.keys(buildWordDB);
            this._wordsDb.sort((a, b) => { return b.length - a.length; });
        }

        if (this._wordsDb) // search through word db
        {
            let q = query;
            const queryParts = [];
            let found = false;
            do
            {
                found = false;
                for (let i = 0; i < this._wordsDb.length; i++)
                {
                    const idx = q.indexOf(this._wordsDb[i]);
                    if (idx > -1) // && queryParts.indexOf(this._wordsDb[i])==-1
                    {
                        found = true;
                        queryParts.push(this._wordsDb[i]);
                        q = q.substr(0, idx) + " " + q.substr(idx + this._wordsDb[i].length, q.length - idx);
                        break;
                    }
                }
            }
            while (found);

            if (queryParts.length > 0)
            {
                let nquery = queryParts.join(" ");
                nquery += " " + q;

                if (nquery != query) document.getElementById("realsearch").innerHTML = "Searching for: <b>" + nquery + "</b>";

                query = nquery;
            }
            else document.getElementById("realsearch").innerHTML = "";
        }

        if (query.length > 1)
        {
            for (let i = 0; i < this._list.length; i++)
            {
                this._list[i].score = 0;
                this._list[i].scoreDebug = "";
            }

            if (query.indexOf(" ") > -1)
            {
                const words = query.split(" ");
                for (let i = 0; i < words.length; i++) { this._searchWord(i, origQuery, this._list, words[i], options); }
            }
            else
            {
                this._searchWord(0, query, this._list, query, options);
            }
        }
    }

    updateInfo()
    {
        const htmlFoot = "";

        let opname = "";
        const selectedEle = ele.byClass("selected");

        if (selectedEle)opname = selectedEle.dataset.opname;

        this._eleSearchinfo = this._eleSearchinfo || document.getElementById("searchinfo");
        this.updateOptions(opname);

        if (!this._typedSinceOpening && (CABLES.UI.OPSELECT.linkNewLink || CABLES.UI.OPSELECT.linkNewOpToPort))
        {
            let ops = defaultops.getOpsForPortLink(CABLES.UI.OPSELECT.linkNewOpToPort, CABLES.UI.OPSELECT.linkNewLink);
            let vizops = defaultops.getVizOpsForPortLink(CABLES.UI.OPSELECT.linkNewOpToPort, CABLES.UI.OPSELECT.linkNewLink);

            const html = getHandleBarHtml("op_select_sugggest", { "ops": ops, "vizops": vizops });
            this._eleSearchinfo.innerHTML = html;

            /*
                var helper buttons / shortcuts

                case 1: pressing circle of an existing link on a "typed value" cable - show create button
                case 2: pressing circle of an existing link on a "typed value" cable - show "existing var" button IF a var by that port type exists already
                case 3: dragging out (or clicking title of) a "typed value" input port - show create button
                case 4: dragging out (or clicking title of) a "typed value" input port - show "existing var" button IF a var by that port type exists already
                case 5: pressing circle of an existing link on a trigger cable - show create button
                case 6: pressing circle of an existing link on a trigger cable - show "use existing" button IF already a triggersend exists
                case 7: dragging out (or clicking title of) a trigger input port - show "receive existing trigger" button IF already a triggersend exists
                case 8: dragging out (or clicking title of) a trigger output port - show "send existing trigger" button IF already a triggersend exists

                [case9]: for now we dont set vars when dragging out an output "typed value"-port because the whole discussion if this should be a triggerVar op or not...
            */
            const link = CABLES.UI.OPSELECT.linkNewLink;
            let found = false;
            if (link && link.portIn && (link.portIn.type == CABLES.OP_PORT_TYPE_FUNCTION))
            {
                ele.show(ele.byId("opselect_createTrigger"));
                found = true;
            }
            else ele.hide(ele.byId("opselect_createTrigger"));

            if (CABLES.UI.OPSELECT.linkNewOpToPort && (CABLES.UI.OPSELECT.linkNewOpToPort.type == CABLES.OP_PORT_TYPE_VALUE || CABLES.UI.OPSELECT.linkNewOpToPort.type == CABLES.OP_PORT_TYPE_STRING || CABLES.UI.OPSELECT.linkNewOpToPort.type == CABLES.OP_PORT_TYPE_ARRAY || CABLES.UI.OPSELECT.linkNewOpToPort.type == CABLES.OP_PORT_TYPE_OBJECT))
            {
                ele.show(ele.byId("opselect_createVar"));
                found = true;
            }
            else ele.hide(ele.byId("opselect_createVar"));

            if (link && link.portIn && (link.portIn.type == CABLES.OP_PORT_TYPE_VALUE || link.portIn.type == CABLES.OP_PORT_TYPE_STRING || link.portIn.type == CABLES.OP_PORT_TYPE_ARRAY || link.portIn.type == CABLES.OP_PORT_TYPE_OBJECT))
            {
                ele.show(ele.byId("opselect_replaceVar"));
                found = true;
            }
            else ele.hide(ele.byId("opselect_replaceVar"));


            const eleReplaceLinkWithExistingTrigger = ele.byId("replaceLinkTriggerExists");
            if (link && link.portIn && link.portIn.type == CABLES.OP_PORT_TYPE_FUNCTION)
            {
                // show "replace with existing var button..."
                const numExistingTriggers = Object.keys(CABLES.patch.namedTriggers || {}).length;

                if (numExistingTriggers == 0) ele.hide(eleReplaceLinkWithExistingTrigger);
                else
                {
                    ele.show(eleReplaceLinkWithExistingTrigger);
                    found = true;
                }
            }
            else ele.hide(eleReplaceLinkWithExistingTrigger);

            // case 7 / 8
            const eleCreateWithExistingTrigger = ele.byId("opselect_createTriggerExists");
            if (CABLES.UI.OPSELECT.linkNewOpToPort && CABLES.UI.OPSELECT.linkNewOpToPort.type == CABLES.OP_PORT_TYPE_FUNCTION)
            {
                const numExistingTriggers = Object.keys(CABLES.patch.namedTriggers || {}).length;

                const eleTitle = ele.byId("createLinkTriggerExists");
                if (eleTitle)
                    if (CABLES.UI.OPSELECT.linkNewOpToPort.direction == CABLES.PORT_DIR_IN) eleTitle.innerText = "Receive existing trigger send";
                    else eleTitle.innerText = "Send into existing trigger send";

                if (numExistingTriggers == 0) ele.hide(eleCreateWithExistingTrigger);
                else
                {
                    ele.show(eleCreateWithExistingTrigger);
                    found = true;
                }
            }
            else ele.hide(eleCreateWithExistingTrigger);


            const eleCreateWithExistingVar = ele.byId("createLinkVariableExists");
            if (CABLES.UI.OPSELECT.linkNewOpToPort)
            {
                const existingVars = gui.corePatch().getVars(CABLES.UI.OPSELECT.linkNewOpToPort.type);
                if (existingVars.length == 0) ele.hide(eleCreateWithExistingVar);
                else
                {
                    ele.show(eleCreateWithExistingVar);
                    found = true;
                }
            }
            else ele.hide(eleCreateWithExistingVar);

            const eleReplaceWithExistingVar = ele.byId("replaceLinkVariableExists");
            if ((link && link.portIn))
            {
                // show "replace with existing var button..."
                const existingVars = gui.corePatch().getVars(link.portIn.type);
                if (existingVars.length == 0) ele.hide(eleReplaceWithExistingVar);
                else
                {
                    ele.show(eleReplaceWithExistingVar);
                    found = true;
                }
            }
            else ele.hide(eleReplaceWithExistingVar);


            if (!ops && !found)
                this._eleSearchinfo.innerHTML = "";
        }
        else
        if (opname)
        {
            const perf = CABLES.UI.uiProfiler.start("opselect.updateInfo");

            this._eleSearchinfo.innerHTML = "";
            const opDoc = gui.opDocs.get2(opname);

            let html = "<div id=\"opselect-layout\">";

            html += "<img src=\"" + CABLES.sandbox.getCablesUrl() + "/api/op/layout/" + opname + "\"/>";

            html += "</div>";
            html += "<a target=\"_blank\" href=\"" + CABLES.sandbox.getCablesUrl() + "/op/" + opname + "\" class=\"button-small\">View Documentation</a>";

            html += opDoc;
            html += htmlFoot;

            this._eleSearchinfo.innerHTML = html;
            // setTimeout(() =>
            // {
            // gui.opDocs.opLayoutSVG(opname, "opselect-layout"); /* create op-svg image inside #opselect-layout */
            // }, 50);
            //! 23
            perf.finish();
        }
        else
        if (this._getQuery() == "")
        {
            this._eleSearchinfo.innerHTML = this.tree.html();
        }

        this._currentSearchInfo = opname;
    }

    search()
    {
        const q = this._getQuery();
        // if(q==this.lastQuery)return;
        this.lastQuery = q;
        this._search(q);
        let i = 0;

        const perf = CABLES.UI.uiProfiler.start("opselect.searchLoop");

        for (i = 0; i < this._list.length; i++)
        {
            this._list[i].element = this._list[i].element || ele.byId("result_" + this._list[i].id);

            if (this._list[i].score > 0)
            {
                this._list[i].element.dataset.score = this._list[i].score;
                this._list[i].element.dataset.scoreDebug = this._list[i].scoreDebug;
                // this._list[i].element.style.display = "block";
                ele.show(this._list[i].element);
            }
            else
            {
                this._list[i].element.dataset.score = 0.0;
                this._list[i].element.dataset.scoreDebug = "???";
                // this._list[i].element.style.display = "none";
                ele.hide(this._list[i].element);
            }
        }

        tinysort.defaults.order = "desc";

        tinysort(".searchresult", { "data": "score" });
        this.navigate(0);

        if (this.itemHeight === 0)
            this.itemHeight = ele.byClass("searchresult").getBoundingClientRect().height;

        this.updateOptions();
        perf.finish();
    }

    navigate(diff)
    {
        this._typedSinceOpening = true;
        this.displayBoxIndex += diff;

        if (this.displayBoxIndex < 0) this.displayBoxIndex = 0;

        const oBoxCollection = ele.byQueryAll(".searchresult:not(.hidden)");
        const oBoxCollectionAll = ele.byClass("searchresult");

        if (this.displayBoxIndex >= oBoxCollection.length) this.displayBoxIndex = oBoxCollection.length - 1;
        if (this.displayBoxIndex < 0) this.displayBoxIndex = oBoxCollection.length - 1;

        const cssClass = "selected";

        oBoxCollectionAll.classList.remove(cssClass);

        for (let i = 0; i < oBoxCollection.length; i++) oBoxCollection[i].classList.remove(cssClass);

        if (oBoxCollection[this.displayBoxIndex]) oBoxCollection[this.displayBoxIndex].classList.add(cssClass);

        if (this.displayBoxIndex > 5) ele.byClass("searchbrowser").scrollTop = (this.displayBoxIndex - 5) * (this.itemHeight + 1);
        else ele.byClass("searchbrowser").scrollTop = 1;

        this.updateInfo();
    }

    reload()
    {
        this._list = null;
        this._html = null;
    }

    prepare()
    {
        if (!this._list)
        {
            this._list = this.getOpList();

            let maxPop = 0;

            for (let i = 0; i < this._list.length; i++)
            {
                if (!this._list[i].shortName) this._list[i].shortName = this._list[i].name;

                maxPop = Math.max(this._list[i].pop || 0, maxPop);
                this._list[i].id = i;
                this._list[i].summary = this._list[i].summary || "";
                this._list[i]._summary = this._list[i].summary.toLowerCase();
                this._list[i]._shortName = this._list[i].shortName.toLowerCase();
                this._list[i]._lowerCaseName = this._list[i].name.toLowerCase();
                this._list[i]._nameSpace = this._list[i].nameSpace.toLowerCase() + ".";
                this._list[i]._nameSpaceFull = this._list[i].nameSpace.toLowerCase() + "." + this._list[i].shortName.toLowerCase();

                const opdoc = gui.opDocs.getOpDocByName(this._list[i].name);
                if (this._list[i]._lowerCaseName.indexOf("deprecated") > -1 || (opdoc && opdoc.oldVersion)) this._list[i].old = true;
            }

            CABLES.UI.OPSELECT.maxPop = maxPop;
        }

        if (!this._html)
        {
            const head = getHandleBarHtml("op_select");

            ele.byId("opsearchmodal").innerHTML = head;

            this._html = getHandleBarHtml("op_select_ops", { "ops": this._list, "texts": text });
            ele.byId("searchbrowserContainer").innerHTML = this._html;
            ele.byId("opsearch").addEventListener("input", this.onInput.bind(this));

            ele.forEachClass("addbutton", (e) =>
            {
                e.addEventListener("click", this._onClickAddButton.bind(this));
            });
        }
    }

    _onClickAddButton(evt)
    {
        gui.opSelect().addOp(evt.target.dataset.opname);

        // gui.closeModal();
        this.close();

        if (evt.shiftKey)
            setTimeout(() =>
            {
                gui.opSelect().show({
                    "subPatch": gui.patchView.getCurrentSubPatch(),
                    "x": 0,
                    "y": 0
                });
            }, 50);
    }

    isOpen()
    {
        return this._bg.showing;
    }

    show(options, linkOp, linkPort, link)
    {
        if (gui.getRestriction() < Gui.RESTRICT_MODE_FULL) return;

        this._typedSinceOpening = false;
        // if(!this._escapeListener)this._escapeListener = gui.on("pressedEscape", ()=>
        //     {
        //         console.log("pressed esc!");
        //         this.close();
        //     });

        CABLES.UI.hideToolTip();
        this._enterPressedEarly = false;
        CABLES.UI.OPSELECT.linkNewLink = link;
        CABLES.UI.OPSELECT.linkNewOpToPort = linkPort;
        CABLES.UI.OPSELECT.newOpPos = options;

        this._newOpOptions =
        {
            "subPatch": options.subPatch,
            "onOpAdd": options.onOpAdd,
            "linkNewOpToPort": linkPort,
            "linkNewOpToOp": linkOp,
            "linkNewLink": link
        };


        this._forceShowOldOps = userSettings.get("showOldOps") || false;
        this._searchInputEle = ele.byId("opsearch");

        if (options.search)
        {
            this._searchInputEle.value = options.search;
            this.search();
        }

        if (this.firstTime) this.search();
        if (!this._list || !this._html) this.prepare();

        ele.hide(ele.byId("search_noresults"));


        this._bg.show();
        ele.show(ele.byId("opsearchmodal"));


        // CABLES.UI.MODAL.show(null,
        //     {
        //         "title": null,
        //         "element": "#opsearchmodal",
        //         "transparent": true,
        //         "onClose": this.close,
        //         "nopadding": true
        //     });

        if (userSettings.get("miniopselect") == true) document.getElementsByClassName("opsearch")[0].classList.add("minimal");
        else document.getElementsByClassName("opsearch")[0].classList.remove("minimal");

        const eleOpsearch = ele.byId("opsearch");
        eleOpsearch.select();
        eleOpsearch.focus();

        eleOpsearch.removeEventListener("keydown", this._boundKeydown);
        this._boundKeydown = this.keyDown.bind(this);
        eleOpsearch.addEventListener("keydown", this._boundKeydown);

        this.clear = function ()
        {
            let v = this._getQuery();

            if (v.indexOf(".") > 0)
            {
                const arr = v.split(".");
                arr.length -= 1;
                v = arr.join(".");

                if (v == "Ops") v = "";

                eleOpsearch.value = v;
                this.search();
            }
            else
            {
                eleOpsearch.value = "";
                this.search();
            }
        };

        this.selectOp = function (name)
        {
            this._typedSinceOpening = true;

            ele.forEachClass("searchresult", (e) => { e.classList.remove("selected"); });

            const el = ele.byQuery(".searchresult[data-opname=\"" + name + "\"]");
            el.classList.add("selected");

            this.updateInfo();
        };

        this.updateOptions();

        setTimeout(() =>
        {
            this.updateInfo();

            eleOpsearch.focus();
        }, 50);
    }

    searchFor(what)
    {
        ele.byId("opsearch").value = what;
        this.onInput();
    }

    onInput(e)
    {
        clearTimeout(this._keyTimeout);
        this._typedSinceOpening = true;
        ele.byQuery("#searchbrowserContainer .searchbrowser").style.opacity = 0.6;
        this._searching = true;

        this._keyTimeout = setTimeout(() =>
        {
            this._keyTimeout = null;
            this.displayBoxIndex = 0;
            this.updateInfo();
            this.search();
            ele.byQuery("#searchbrowserContainer .searchbrowser").style.opacity = 1.0;
            this._searching = false;
            if (this._enterPressedEarly) this.addSelectedOp();
        }, 250);
    }

    addOp(opname)
    {
        if (opname && opname.length > 2)
        {
            this._newOpOptions.createdLocally = true;

            this.close();
            gui.patchView.addOp(opname, this._newOpOptions);
        }
    }

    addSelectedOp()
    {
        const selEle = ele.byClass("selected");
        if (selEle)
        {
            const opname = selEle.dataset.opname;
            this.addOp(opname);
        }
    }

    keyDown(e)
    {
        const eleSelected = ele.byClass("selected");

        switch (e.which)
        {
        // case 27:
        //     this.close();
        //     e.preventDefault();
        // console.log("opselect input escape!");

        // gui.pressedEscape();

        // break;

        case 13:

            if (e.shiftKey)
            {
                this.addSelectedOp();

                setTimeout(() =>
                {
                    gui.opSelect().show({
                        "subPatch": gui.patchView.getCurrentSubPatch(),
                        "x": 0,
                        "y": 0
                    });
                }, 50);

                return;
            }

            if (this._searching)
            {
                this._enterPressedEarly = true;
                return;
            }
            else this.addSelectedOp();

            e.preventDefault();
            break;

        case 8:
            // if (this._backspaceDelay)
            // {
            //     clearTimeout(this._backspaceDelay);
            // }

            // this._backspaceDelay = setTimeout(() =>
            // {
            // this._backspaceDelay = null;
            this.onInput();
            // }, 300);

            return true;
        case 38: // up

            if (eleSelected) eleSelected.classList.remove("selected");
            e.preventDefault();
            this.navigate(-1);
            break;

        case 40: // down

            if (eleSelected) eleSelected.classList.remove("selected");
            e.preventDefault();
            this.navigate(1);
            break;

        default: return true; // exit this handler for other keys
        }
        // prevent the default action (scroll / move caret)
    }

    _getop(ops, ns, val, parentname)
    {
        if (Object.prototype.toString.call(val) === "[object Object]")
        {
            for (const propertyName in val)
            {
                if (val.hasOwnProperty(propertyName))
                {
                    const opname = ns + "." + parentname + propertyName;
                    const isOp = false;
                    let isFunction = false;

                    if (typeof (CABLES.Patch.getOpClass(opname)) === "function") isFunction = true;

                    const parts = opname.split(".");
                    const lowercasename = opname.toLowerCase() + "_" + parts.join("").toLowerCase();
                    const opdoc = gui.opDocs.getOpDocByName(opname);
                    let shortName = parts[parts.length - 1];
                    let hidden = false;
                    let opdocHidden = false;

                    if (opdoc)
                    {
                        opdocHidden = opdoc.hidden;
                        hidden = opdoc.hidden;
                        if (!this._forceShowOldOps) shortName = opdoc.shortNameDisplay;
                    }

                    if (hidden)
                    {
                        if (this._forceShowOldOps) hidden = false;
                        if (opname.indexOf("Ops.Admin") == 0 && !gui.user.isAdmin) hidden = true;
                    }

                    if (opname.indexOf("Ops.Dev.") == 0 && !CABLES.sandbox.isDevEnv()) hidden = true;

                    parts.length -= 1;
                    const nameSpace = parts.join(".");


                    if (isFunction && !hidden)
                    {
                        let oldState = "";
                        if (hidden)oldState = "OLD";
                        if (opdocHidden)oldState = "OLD";
                        if (opname.indexOf("Deprecated") > -1)oldState = "DEPREC";
                        if (opname.indexOf("Ops.Admin") > -1)oldState = "ADMIN";

                        const op = {
                            "nscolor": defaultops.getNamespaceClassName(opname),
                            "isOp": isOp,
                            "name": opname,
                            "userOp": opname.startsWith("Ops.User"),
                            "devOp": opname.startsWith("Ops.Dev."),
                            "shortName": shortName,
                            "nameSpace": nameSpace,
                            "oldState": oldState,
                            "lowercasename": lowercasename,
                        };
                        op.pop = gui.opDocs.getPopularity(opname);
                        op.summary = gui.opDocs.getSummary(opname);
                        ops.push(op);
                    }

                    ops = this._getop(ops, ns, val[propertyName], parentname + propertyName + ".");
                }
            }
        }
        return ops;
    }

    getOpList()
    {
        const ops = this._getop([], "Ops", Ops, "");
        // getop('Op',CABLES.Op,'');

        ops.sort((a, b) => { return b.pop - a.pop; },
            // return a.name.length - b.name.length; // ASC -> a - b; DESC -> b - a
        );

        return ops;
    }
}
