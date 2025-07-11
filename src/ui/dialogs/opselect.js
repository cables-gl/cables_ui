import { ele, ModalBackground } from "cables-shared-client";
import { Port } from "cables";
import defaultOps from "../defaultops.js";
import { getHandleBarHtml } from "../utils/handlebars.js";
import OpTreeList from "../components/opselect_treelist.js";
import text from "../text.js";
import Gui, { gui } from "../gui.js";
import OpSearch from "../components/opsearch.js";
import { hideToolTip } from "../elements/tooltips.js";
import opNames from "../opnameutils.js";
import { platform } from "../platform.js";
import { userSettings } from "../components/usersettings.js";
import { portType } from "../core_constants.js";

CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.OPSELECT = {};
CABLES.UI.OPSELECT.linkNewLink = null;
CABLES.UI.OPSELECT.linkNewOpToPort = null;
CABLES.UI.OPSELECT.newOpPos = { "x": 0, "y": 0 };
CABLES.UI.OPSELECT.maxPop = 0;

const MIN_CHARS_QUERY = 2;

export default class OpSelect
{
    constructor()
    {
        this.displayBoxIndex = 0;
        this.itemHeight = 0;
        this.firstTime = true;
        this.tree = null;
        this._eleSearchinfo = null;
        this._newOpOptions = {};
        this._searchInputEle = null;
        this._enterPressedEarly = false;
        this._searching = false;
        this._bg = new ModalBackground();
        this._typedSinceOpening = false;
        this._currentInfo = "";
        this._lastScrollTop = -5711;
        this._eleOpsearchmodal = null;
        this._opSearch = new OpSearch();
        this._keyTimeout = null;
        this._hideUserOps = false;
    }

    close()
    {
        this._bg.hide();
        this._eleOpsearchmodal.style.zIndex = -9999;

        gui.currentModal = null;
        gui.patchView.focus();
    }

    _getQuery()
    {
        const el = ele.byId("opsearch");
        if (!el) return "";
        return el.value || "";
    }

    isMathQuery()
    {
        if (this._getQuery().length > 0)
        {
            let mathPortType = this._getMathPortType();
            for (let i in defaultOps.defaultMathOps[mathPortType])
                if (this._getQuery().charAt(0) === i) return true;
        }
        return false;
    }

    updateStatusBar()
    {
        if (!this._eleSearchinfo) return;
        this._hideUserOps = gui.project().isOpExample;

        const perf = gui.uiProfiler.start("opselect.udpateOptions");
        const num = ele.byQueryAll(".searchbrowser .searchable:not(.hidden)").length;
        const query = this._getQuery();

        this._eleTypeStart = this._eleTypeStart || ele.byId("search_startType");
        this._eleTypeMore = this._eleTypeMore || ele.byId("search_startTypeMore");
        this._eleNoResults = this._eleNoResults || ele.byId("search_noresults");

        if (query.length === 0)
        {
            ele.show(this._eleTypeStart);
            this._showSuggestionsInfo();

            for (let i = 0; i < this._opSearch.list.length; i++)
                if (this._opSearch.list[i].element && !this._opSearch.list[i].elementHidden)
                {
                    this._opSearch.list[i].elementHidden = true;
                    ele.hide(this._opSearch.list[i].element);
                }
        }
        else ele.hide(this._eleTypeStart);

        if (query.length > 0 && query.length < MIN_CHARS_QUERY && !this.isMathQuery())
        {
            ele.show(this._eleTypeMore);
            for (let i = 0; i < this._opSearch.list.length; i++)
            {
                if (!this._opSearch.list[i].elementHidden)
                {
                    this._opSearch.list[i].elementHidden = true;
                    ele.hide(this._opSearch.list[i].element);
                }
            }
            this._eleSearchinfo.innerHMTL = "";
        }
        else ele.hide(this._eleTypeMore);

        if (num === 0 && query.length >= MIN_CHARS_QUERY)
        {
            ele.show(this._eleNoResults);
            this._eleSearchinfo.innerHMTL = "";
        }
        else
        {
            ele.hide(this._eleNoResults);
        }

        let optionsHtml = "";

        if (query.length >= MIN_CHARS_QUERY)
        {
            if (this._hideUserOps)
            {
                optionsHtml += "<div class=\"warning\">Your user ops are hidden, patch is an op example</div>";
            }
            else
            {
                const isOwner = platform.currentUserIsPatchOwner();
                const isFullCollab = gui.project().users && gui.project().users.includes(gui.user.id);
                const isReadOnlyCollab = gui.project().usersReadOnly && gui.project().usersReadOnly.includes(gui.user.id);

                if (num === 0 && !(isOwner || isFullCollab || isReadOnlyCollab))
                {
                    optionsHtml += "<div class=\"warning\">Your user ops are hidden, you are not a collaborator of patch </div>";
                }
            }

            if (num > 0) optionsHtml += "&nbsp;Found " + num + " ops.";

            let score = 0;

            /** @type {HTMLCollectionOf<Element>} */
            const selected = document.getElementsByClassName("selected");

            if (query.length > 0 && selected.length > 0)score = Math.round(100 * parseFloat(selected[0].dataset.score)) / 100;

            if (score && score === score)
            {
                let scoredebug = "";

                if (selected.length > 0) scoredebug = selected[0].dataset.scoreDebug;

                optionsHtml += "&nbsp;&nbsp;|&nbsp;&nbsp;<span class=\"tt\" data-tt=\"" + scoredebug + "\">";
                optionsHtml += "Score: " + score;
                optionsHtml += "</span>";
            }
        }

        document.getElementById("opOptions").innerHTML = optionsHtml;
        perf.finish();
    }

    _showSuggestionsInfo()
    {
        if (this._minimal) return;

        const perf = gui.uiProfiler.start("opselect.suggestioninfo");

        let ops = opNames.getOpsForPortLink(CABLES.UI.OPSELECT.linkNewOpToPort, CABLES.UI.OPSELECT.linkNewLink);
        let vizops = opNames.getVizOpsForPortLink(CABLES.UI.OPSELECT.linkNewOpToPort, CABLES.UI.OPSELECT.linkNewLink);

        if (ops.length == 0 && vizops.length == 0 && !CABLES.UI.OPSELECT.linkNewOpToPort && !CABLES.UI.OPSELECT.linkNewLink)
        {
            if (this._eleSearchinfo) this._eleSearchinfo.innerHTML = this.tree.html();
            return;
        }

        let html = "nope...";
        html = getHandleBarHtml("op_select_sugggest", { "ops": ops, "vizops": vizops, "link": CABLES.UI.OPSELECT.linkNewLink, "port": CABLES.UI.OPSELECT.linkNewOpToPort });

        if (this._eleSearchinfo)
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
        if (link && link.portIn && (link.portIn.type == portType.trigger))
        {
            ele.show(ele.byId("opselect_createTrigger"));
            found = true;
        }
        else ele.hide(ele.byId("opselect_createTrigger"));

        if (CABLES.UI.OPSELECT.linkNewOpToPort && (CABLES.UI.OPSELECT.linkNewOpToPort.type == portType.number || CABLES.UI.OPSELECT.linkNewOpToPort.type == portType.string || CABLES.UI.OPSELECT.linkNewOpToPort.type == portType.array || CABLES.UI.OPSELECT.linkNewOpToPort.type == portType.object))
        {
            ele.show(ele.byId("opselect_createVar"));
            found = true;
        }
        else ele.hide(ele.byId("opselect_createVar"));

        if (link && link.portIn && (link.portIn.type == portType.number || link.portIn.type == portType.string || link.portIn.type == portType.array || link.portIn.type == portType.object))
        {
            ele.show(ele.byId("opselect_replaceVar"));
            found = true;
        }
        else ele.hide(ele.byId("opselect_replaceVar"));

        const eleReplaceLinkWithExistingTrigger = ele.byId("replaceLinkTriggerExists");
        if (link && link.portIn && link.portIn.type == portType.trigger)
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
        if (CABLES.UI.OPSELECT.linkNewOpToPort && CABLES.UI.OPSELECT.linkNewOpToPort.type === portType.trigger)
        {
            const numExistingTriggers = Object.keys(CABLES.patch.namedTriggers || {}).length;

            const inPort = (CABLES.UI.OPSELECT.linkNewOpToPort.direction === Port.DIR_IN);
            const eleTitle = ele.byId("createLinkTriggerExists");
            if (eleTitle)
            {
                if (inPort) eleTitle.innerText = "Receive from TriggerReceive";
                else eleTitle.innerText = "Send into TriggerSend";
            }

            if (inPort && !numExistingTriggers)
            {
                ele.hide(eleCreateWithExistingTrigger);
            }
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
            if (existingVars.length === 0) ele.hide(eleCreateWithExistingVar);
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
            if (existingVars.length === 0) ele.hide(eleReplaceWithExistingVar);
            else
            {
                ele.show(eleReplaceWithExistingVar);
                found = true;
            }
        }
        else ele.hide(eleReplaceWithExistingVar);

        perf.finish();
    }

    updateInfo()
    {
        if (this._minimal) return;
        this._eleSearchinfo = ele.byId("searchinfo");

        let opName = "";
        const selectedEle = ele.byClass("selected");

        if (selectedEle)
        {
            opName = selectedEle.dataset.opname;
        }

        this.updateStatusBar(opName);

        if (!this._typedSinceOpening && (CABLES.UI.OPSELECT.linkNewOpToPort || CABLES.UI.OPSELECT.linkNewLink))
        {
            if (selectedEle)
            {
                if (CABLES.UI.OPSELECT.linkNewOpToPort)
                {
                    if (this._currentInfo == "suggest_" + CABLES.UI.OPSELECT.linkNewOpToPort.op.objName) return;
                    this._currentInfo = "suggest_" + CABLES.UI.OPSELECT.linkNewOpToPort.op.objName;
                }

                if (CABLES.UI.OPSELECT.linkNewLink)
                {
                    this._currentInfo = "suggest_" + CABLES.UI.OPSELECT.linkNewLink.id;
                }
            }

            this._showSuggestionsInfo();
        }
        else if (this._getQuery().length < MIN_CHARS_QUERY)
        {
            this._eleSearchinfo.innerHTML = this.tree.html();
            return;
        }
        else if (opName)
        {
            if (selectedEle)
            {
                if (this._currentInfo == "docs_" + selectedEle.dataset.opname) return;
                this._currentInfo = "docs_" + selectedEle.dataset.opname;
            }
            const perf = gui.uiProfiler.start("opselect.updateInfo");

            this._eleSearchinfo.innerHTML = "??";
            const listItem = this.getListItemByOpName(opName);
            const opDocHtml = gui.opDocs.getHtml(opName, listItem);

            let html = "";
            if (listItem && listItem.isCollection)
            {
                html += opDocHtml;
            }
            else
            {
                html = "<div id=\"opselect-layout\" class=\"op\">";

                const svg = gui.opDocs.getLayoutSvg(opName);
                if (svg)html += svg;
                else html += "<img src=\"" + platform.getCablesUrl() + "/api/op/layout/" + opName + "\"/>";

                html += "</div>";
                html += "<a target=\"_blank\" href=\"" + platform.getCablesDocsUrl() + "/op/" + opName + "\" class=\"button-small\">View Documentation</a>";

                const docs = gui.opDocs.getOpDocByName(opName);

                if (docs)
                {
                    html += "<a class=\"button-small button-icon\" onkeypress=\"ele.keyClick(event,this)\" tabindex=\"0\" onclick=\"CABLES.CMD.OP.manageOp('" + docs.id + "');gui.pressedEscape();\"><span class=\"icon icon-op\"></span></a>";

                    if (docs.allowEdit)
                    {
                        html += "<a class=\"button-small button-icon\" onkeypress=\"ele.keyClick(event,this)\" tabindex=\"0\" onclick=\"gui.serverOps.edit('" + opName + "', false,null,true);gui.pressedEscape();\"><span class=\"icon icon-edit\"></span></a>";
                        if (platform.frontendOptions.hasOpDirectories && docs.opDirFull)
                            html += "<a class=\"button-small\" onkeypress=\"ele.keyClick(event,this)\" tabindex=\"0\" onclick=\"CABLES.CMD.ELECTRON.openOpDir('', '" + opName + "');gui.pressedEscape();\"><span class=\"icon icon-folder\"></span></a>";

                    }

                    if (docs.coreLibs && docs.coreLibs.indexOf("standalone_electron") > -1)
                        html += "<br/><br/>this is a <a class=\"link\" href=\"https://cables.gl/standalone\" target=\"_blank\">Standalone</a> op, it will not work fully in the web version.";
                }
                else html += "no opDocs found";

                html += opDocHtml;
            }
            this._eleSearchinfo.innerHTML = html;
            perf.finish();
        }
        else
        {
            this._currentInfo = "tree";

            if (this._getQuery().length < MIN_CHARS_QUERY)
                if (this._eleSearchinfo) this._eleSearchinfo.innerHTML = this.tree.html();
        }
    }

    _getMathPortType()
    {
        if (CABLES.UI.OPSELECT.linkNewLink && CABLES.UI.OPSELECT.linkNewLink.portIn && CABLES.UI.OPSELECT.linkNewLink.portIn.type === portType.array) return "array";
        if (CABLES.UI.OPSELECT.linkNewLink && CABLES.UI.OPSELECT.linkNewLink.portIn && CABLES.UI.OPSELECT.linkNewLink.portIn.type === portType.string) return "string";

        if (CABLES.UI.OPSELECT.linkNewOpToPort && CABLES.UI.OPSELECT.linkNewOpToPort.type === portType.array) return "array";
        if (CABLES.UI.OPSELECT.linkNewOpToPort && CABLES.UI.OPSELECT.linkNewOpToPort.type === portType.string) return "string";
        return "default";
    }

    getSearchQuery()
    {

    }

    search()
    {
        if (!this._opSearch.list || !this._html) this.prepare();

        let sq = this._getQuery();
        let mathPortType = this._getMathPortType();
        for (let i in defaultOps.defaultMathOps[mathPortType])
            if (sq.charAt(0) === i)
                sq = defaultOps.defaultMathOps[mathPortType][i];

        sq = sq || "";
        let query = sq.toLowerCase();
        this.firstTime = false;

        const options = {
            "linkNamespaceIsTextureEffects": false,
        };

        if (this._newOpOptions.linkNewOpToOp && this._newOpOptions.linkNewOpToOp.objName.toLowerCase().indexOf(".textureeffects") > -1) options.linkNamespaceIsTextureEffects = true;

        if (this._getQuery().length < MIN_CHARS_QUERY && !this.isMathQuery())
            this._opSearch.search("");
        else
            this._opSearch.search(query, sq);

        const perf = gui.uiProfiler.start("opselect.searchLoop");

        for (let i = 0; i < this._opSearch.list.length; i++)
        {
            this._opSearch.list[i].element = this._opSearch.list[i].element || ele.byId("result_" + this._opSearch.list[i].id);

            if (this._opSearch.list[i].score > 0)
            {
                this._opSearch.list[i].element.dataset.score = this._opSearch.list[i].score;
                this._opSearch.list[i].element.dataset.scoreDebug = this._opSearch.list[i].scoreDebug;
                this._opSearch.list[i].elementHidden = false;
                ele.show(this._opSearch.list[i].element);
            }
            else
            {
                this._opSearch.list[i].element.dataset.score = "0.0";
                this._opSearch.list[i].element.dataset.scoreDebug = "???";
                this._opSearch.list[i].elementHidden = true;
                ele.hide(this._opSearch.list[i].element);
            }
        }

        perf.finish();

        const perfTinysort = gui.uiProfiler.start("opselect.tinysort");
        tinysort.defaults.order = "desc";
        tinysort(".searchresult", { "data": "score" });
        perfTinysort.finish();

        this.navigate(0);

        const perf2 = gui.uiProfiler.start("opselect.searchLoop2");

        if (this.itemHeight === 0)
            this.itemHeight = ele.byClass("searchresult").getBoundingClientRect().height;

        this.updateStatusBar();
        perf2.finish();
    }

    navigate(diff)
    {
        const perf2 = gui.uiProfiler.start("opselect.navigate");

        this._typedSinceOpening = true;
        this.displayBoxIndex += diff;

        if (this.displayBoxIndex < 0) this.displayBoxIndex = 0;

        const oBoxCollection = ele.byQueryAll(".searchresult:not(.hidden)");

        if (this.displayBoxIndex >= oBoxCollection.length) this.displayBoxIndex = oBoxCollection.length - 1;
        if (this.displayBoxIndex < 0) this.displayBoxIndex = oBoxCollection.length - 1;

        const cssClass = "selected";

        for (let i = 0; i < oBoxCollection.length; i++) oBoxCollection[i].classList.remove(cssClass);

        if (oBoxCollection[this.displayBoxIndex]) oBoxCollection[this.displayBoxIndex].classList.add(cssClass);

        const perf3 = gui.uiProfiler.start("opselect.navigate.perf3");
        const scrollTop = (this.displayBoxIndex - 5) * (this.itemHeight + 1);

        if (this._lastScrollTop != scrollTop)
        {
            this._lastScrollTop = scrollTop;
            if (this.displayBoxIndex > 5) ele.byClass("searchbrowser").scrollTop = scrollTop; // .scrollTop is expensive!
            else ele.byClass("searchbrowser").scrollTop = 1;
        }
        perf3.finish();

        this.updateInfo();
        perf2.finish();
    }

    reload()
    {
        this._opSearch.resetList();
        this._html = null;
        this._eleSearchinfo = null;
    }

    prepare()
    {
        this.tree = new OpTreeList();

        if (!this._opSearch.list)
        {
            const perf = gui.uiProfiler.start("opselect.prepare.list");
            this._opSearch._buildList();
            perf.finish();
        }

        if (!this._html)
        {
            const perf = gui.uiProfiler.start("opselect.html");

            const head = getHandleBarHtml("op_select");

            this._eleOpsearchmodal = this._eleOpsearchmodal || ele.byId("opsearchmodal");
            this._eleOpsearchmodal.innerHTML = head;

            this._html = getHandleBarHtml("op_select_ops", { "ops": this._opSearch.list, "texts": text, "patchOps": this._opSearch.numPatchops });

            ele.byId("searchbrowserContainer").innerHTML = this._html;
            ele.byId("opsearch").addEventListener("input", this.onInput.bind(this));

            ele.forEachClass("addbutton", (e) =>
            {
                e.addEventListener("click", this._onClickAddButton.bind(this));
            });

            perf.finish();
        }
    }

    _onClickAddButton(evt)
    {
        this.addOp(evt.currentTarget.parentNode.dataset.opname, evt.shiftKey, evt.currentTarget.parentNode.dataset.itemType);
    }

    isOpen()
    {
        return this._bg.showing;
    }

    show(options, linkOp, linkPort, link)
    {
        if (gui.getRestriction() < Gui.RESTRICT_MODE_FULL) return;
        const perf = gui.uiProfiler.start("opselect.show");

        this._eleSearchinfo = ele.byId("searchinfo");

        if (window.gui) gui.currentModal = this;

        this._typedSinceOpening = false;
        this._lastScrollTop = -5711;
        this._minimal = userSettings.get("miniopselect") == true;

        this._options = options;
        hideToolTip();

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

        this._searchInputEle = ele.byId("opsearch");

        if (options.search) this._searchInputEle.value = options.search;

        if (this.firstTime || options.search) this.search();

        if (!this._opSearch.list || !this._html) this.prepare();

        ele.hide(ele.byId("search_noresults"));

        this._bg.show();
        this._bg.on("hide", () => { this.close(); });

        ele.show(this._eleOpsearchmodal);
        this._eleOpsearchmodal.style.zIndex = 9999999;

        if (this._minimal) document.getElementsByClassName("opsearch")[0].classList.add("minimal");
        else document.getElementsByClassName("opsearch")[0].classList.remove("minimal");

        const eleOpsearch = ele.byId("opsearch");

        eleOpsearch.removeEventListener("keydown", this._boundKeydown);
        this._boundKeydown = this.keyDown.bind(this);
        eleOpsearch.addEventListener("keydown", this._boundKeydown);

        this.updateStatusBar();

        setTimeout(() =>
        {
            this.updateInfo();

            perf.finish();

            eleOpsearch.select();
            eleOpsearch.focus();
        }, 50);
    }

    selectOp(name)
    {
        this._typedSinceOpening = true;

        ele.forEachClass("searchresult", (e) => { e.classList.remove("selected"); });

        const el = ele.byQuery(".searchresult[data-opname=\"" + name + "\"]");
        el.classList.add("selected");

        this.updateInfo();
    }

    searchFor(what)
    {
        ele.byId("opsearch").value = what;
        this.onInput();
    }

    onInput(e)
    {
        if (this._keyTimeout)clearTimeout(this._keyTimeout);
        this._typedSinceOpening = true;
        this._searching = true;

        let searchDelay = 0;
        if (this._getQuery().length == 2 && !this.isMathQuery())searchDelay = 250;
        if (this._getQuery().length == 3)searchDelay = 50;

        this._keyTimeout = setTimeout(() =>
        {
            this._keyTimeout = null;
            this._keyTimeout = null;
            this.displayBoxIndex = 0;
            this.updateInfo();
            this.search();

            this._searching = false;
            if (this._enterPressedEarly) this.addSelectedOp();
        }, searchDelay);
    }

    /**
     * @param {string} opname
     */
    addOp(opname, reopenModal = false, itemType = "op")
    {
        this._newOpOptions.onOpAdd = null;

        const sq = this._getQuery();
        const mathPortType = this._getMathPortType();

        for (let i in defaultOps.defaultMathOps[mathPortType])
        {
            if (sq.charAt(0) === i)
            {
                let mathNum = parseFloat(sq.substr(1));
                if (mathPortType == "string")mathNum = sq.substr(1);

                this._newOpOptions.onOpAdd =
                    (op) =>
                    {
                        if (op.portsIn.length > 1 && mathNum == mathNum)
                        {
                            op.portsIn[1].set(mathNum);
                        }
                        op.refreshParams();
                    };
            }
        }

        if (opname && opname.length > 2)
        {
            this._newOpOptions.createdLocally = true;

            if (itemType === "extension" || itemType === "team")
            {
                gui.opSelect().loadCollection(opname);
            }
            else if (itemType === "patchop")
            {
                gui.opSelect().addPatchOp(opname, reopenModal);
            }
            else
            {
                if (reopenModal)
                {
                    setTimeout(() =>
                    {
                        gui.opSelect().show({
                            "subPatch": gui.patchView.getCurrentSubPatch(),
                            "x": 0,
                            "y": 0
                        });
                    }, 50);
                }

                this.close();
                gui.patchView.addOp(opname, this._newOpOptions);
            }
        }
    }

    loadCollection(name)
    {
        gui.serverOps.loadCollectionOps(name, () =>
        {
            const q = this._getQuery();
            this.close();
            this.reload();
            this.prepare();
            setTimeout(() =>
            {
                const opts = this._options;

                opts.search = q;
                opts.subPatch = gui.patchView.getCurrentSubPatch();
                this.show(opts, this._newOpOptions.linkNewOpToOp, this._newOpOptions.linkNewOpToPort, this._newOpOptions.linkNewLink);
            }, 50);
        });
    }

    addPatchOp(name, reopenModal)
    {
        gui.serverOps.loadOpDependencies(name, () =>
        {
            if (reopenModal)
            {
                setTimeout(() =>
                {
                    const opts = this._options;
                    opts.search = name;
                    opts.subPatch = gui.patchView.getCurrentSubPatch();
                    this.show(opts, this._newOpOptions.linkNewOpToOp, this._newOpOptions.linkNewOpToPort, this._newOpOptions.linkNewLink);
                }, 50);
            }

            this.close();
            gui.patchView.addOp(name, this._newOpOptions);
        });
    }

    addSelectedOp(reopenModal)
    {
        const selEle = ele.byClass("selected");
        if (selEle)
        {
            const opname = selEle.dataset.opname;
            const listItem = this.getListItemByOpName(opname);
            // prevent adding of ops that are not usable

            // if (sq.charAt(0) === i)
            //     sq = defaultOps.defaultMathOps[i]+" "+sq.substr(1);

            if (!(listItem && listItem.notUsable))
            {
                this.addOp(opname, reopenModal, selEle.dataset.itemType);
            }
        }
    }

    keyDown(e)
    {
        const eleSelected = ele.byClass("selected");

        switch (e.which)
        {
        case 13:

            if (e.shiftKey)
            {
                this.addSelectedOp(true);
                return;
            }

            if (this._searching)
            {
                this._enterPressedEarly = true;
                return;
            }
            else
            {
                this.addSelectedOp();
            }

            e.preventDefault();
            break;

        case 8:
            this.onInput();
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

    getListItemByOpName(opName)
    {
        if (!this._opSearch.list) return null;
        return this._opSearch.list.find((item) => { return item.name === opName; });
    }
}
