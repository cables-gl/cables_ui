import { ele, ModalBackground } from "cables-shared-client";
import defaultOps from "../defaultops.js";
import { getHandleBarHtml } from "../utils/handlebars.js";
import OpTreeList from "../components/opselect_treelist.js";
import text from "../text.js";
import userSettings from "../components/usersettings.js";
import Gui from "../gui.js";
import OpSearch from "../components/opsearch.js";

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
    }

    close()
    {
        this._bg.hide();
        this._eleOpsearchmodal.style.zIndex = -9999;

        gui.patchView.focus();
    }

    _getQuery()
    {
        const el = ele.byId("opsearch");
        if (!el) return "";
        return el.value || "";
    }

    updateStatusBar()
    {
        if (!this._eleSearchinfo) return;
        this._hideUserOps = gui.project().isOpExample;

        const perf = CABLES.UI.uiProfiler.start("opselect.udpateOptions");
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

        if (query.length === 1) ele.show(this._eleTypeMore);
        else ele.hide(this._eleTypeMore);

        if (num === 0 && query.length > 1)
        {
            ele.show(this._eleNoResults);
            this._eleSearchinfo.innerHMTL = "";
        }
        else
        {
            ele.hide(this._eleNoResults);
        }

        let optionsHtml = "";

        if (this._hideUserOps)
        {
            optionsHtml += "<div class=\"warning\">Your user ops are hidden, patch is an op example</div>";
        }
        else
        {
            const isOwner = gui.project().userId === gui.user.id;
            const isFullCollab = gui.project().users && gui.project().users.includes(gui.user.id);
            const isReadOnlyCollab = gui.project().usersReadOnly && gui.project().usersReadOnly.includes(gui.user.id);

            if (num === 0 && !(isOwner || isFullCollab || isReadOnlyCollab))
            {
                optionsHtml += "<div class=\"warning\">Your user ops are hidden, you are not a collaborator of patch </div>";
            }
        }

        if (num > 0) optionsHtml += "&nbsp;Found " + num + " ops.";

        let score = 0;
        const selected = document.getElementsByClassName("selected");

        if (query.length > 0 && selected.length > 0)score = Math.round(100 * selected[0].dataset.score) / 100;

        if (score && score === score)
        {
            let scoredebug = "";

            if (selected.length > 0) scoredebug = selected[0].dataset.scoreDebug;

            optionsHtml += "&nbsp;&nbsp;|&nbsp;&nbsp;<span class=\"tt\" data-tt=\"" + scoredebug + "\">";
            optionsHtml += "Score: " + score;
            optionsHtml += "</span>";
        }

        document.getElementById("opOptions").innerHTML = optionsHtml;
        perf.finish();
    }



    _showSuggestionsInfo()
    {
        if (this._minimal) return;

        const perf = CABLES.UI.uiProfiler.start("opselect.suggestioninfo");

        let ops = defaultOps.getOpsForPortLink(CABLES.UI.OPSELECT.linkNewOpToPort, CABLES.UI.OPSELECT.linkNewLink);
        let vizops = defaultOps.getVizOpsForPortLink(CABLES.UI.OPSELECT.linkNewOpToPort, CABLES.UI.OPSELECT.linkNewLink);


        if (ops.length == 0 && vizops.length == 0 && !CABLES.UI.OPSELECT.linkNewOpToPort && !CABLES.UI.OPSELECT.linkNewLink)
        {
            if (this._eleSearchinfo) this._eleSearchinfo.innerHTML = this.tree.html();
            return;
        }

        const html = getHandleBarHtml("op_select_sugggest", { "ops": ops, "vizops": vizops, "port": CABLES.UI.OPSELECT.linkNewOpToPort });
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
        if (CABLES.UI.OPSELECT.linkNewOpToPort && CABLES.UI.OPSELECT.linkNewOpToPort.type === CABLES.OP_PORT_TYPE_FUNCTION)
        {
            const numExistingTriggers = Object.keys(CABLES.patch.namedTriggers || {}).length;

            const inPort = (CABLES.UI.OPSELECT.linkNewOpToPort.direction === CABLES.PORT_DIR_IN);
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
        else if (opName)
        {
            if (selectedEle)
            {
                if (this._currentInfo == "docs_" + selectedEle.dataset.opname) return;
                this._currentInfo = "docs_" + selectedEle.dataset.opname;
            }
            const perf = CABLES.UI.uiProfiler.start("opselect.updateInfo");

            this._eleSearchinfo.innerHTML = "";
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
                else html += "<img src=\"" + CABLES.sandbox.getCablesUrl() + "/api/op/layout/" + opName + "\"/>";

                html += "</div>";
                html += "<a target=\"_blank\" href=\"" + CABLES.sandbox.getCablesUrl() + "/op/" + opName + "\" class=\"button-small\">View Documentation</a>";
                html += opDocHtml;
            }
            this._eleSearchinfo.innerHTML = html;
            perf.finish();
        }
        else
        {
            this._currentInfo = "tree";

            if (this._getQuery() == "")
                if (this._eleSearchinfo) this._eleSearchinfo.innerHTML = this.tree.html();
        }
    }

    _getMathPortType()
    {
        if (CABLES.UI.OPSELECT.linkNewLink && CABLES.UI.OPSELECT.linkNewLink.portIn && CABLES.UI.OPSELECT.linkNewLink.portIn.type === CABLES.OP_PORT_TYPE_ARRAY) return "array";
        if (CABLES.UI.OPSELECT.linkNewLink && CABLES.UI.OPSELECT.linkNewLink.portIn && CABLES.UI.OPSELECT.linkNewLink.portIn.type === CABLES.OP_PORT_TYPE_STRING) return "string";

        if (CABLES.UI.OPSELECT.linkNewOpToPort && CABLES.UI.OPSELECT.linkNewOpToPort.type === CABLES.OP_PORT_TYPE_ARRAY) return "array";
        if (CABLES.UI.OPSELECT.linkNewOpToPort && CABLES.UI.OPSELECT.linkNewOpToPort.type === CABLES.OP_PORT_TYPE_STRING) return "string";
        return "default";
    }

    search()
    {
        if (!this._opSearch.list || !this._html) this.prepare();

        let sq = this._getQuery();
        let mathPortType = this._getMathPortType();
        for (let i in CABLES.UI.DEFAULTMATHOPS[mathPortType])
            if (sq.charAt(0) === i)
                sq = CABLES.UI.DEFAULTMATHOPS[mathPortType][i];

        this.firstTime = false;
        sq = sq || "";
        let query = sq.toLowerCase();

        const options = {
            "linkNamespaceIsTextureEffects": false,
        };

        if (this._newOpOptions.linkNewOpToOp && this._newOpOptions.linkNewOpToOp.objName.toLowerCase().indexOf(".textureeffects") > -1) options.linkNamespaceIsTextureEffects = true;

        this._opSearch.search(query);
        const perf = CABLES.UI.uiProfiler.start("opselect.searchLoop");

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

        const perfTinysort = CABLES.UI.uiProfiler.start("opselect.tinysort");
        tinysort.defaults.order = "desc";
        tinysort(".searchresult", { "data": "score" });
        perfTinysort.finish();

        this.navigate(0);

        const perf2 = CABLES.UI.uiProfiler.start("opselect.searchLoop2");

        if (this.itemHeight === 0)
            this.itemHeight = ele.byClass("searchresult").getBoundingClientRect().height;

        this.updateStatusBar();
        perf2.finish();
    }

    navigate(diff)
    {
        const perf2 = CABLES.UI.uiProfiler.start("opselect.navigate");

        this._typedSinceOpening = true;
        this.displayBoxIndex += diff;

        if (this.displayBoxIndex < 0) this.displayBoxIndex = 0;

        const oBoxCollection = ele.byQueryAll(".searchresult:not(.hidden)");
        // const oBoxCollectionAll = ele.byClass("searchresult");

        if (this.displayBoxIndex >= oBoxCollection.length) this.displayBoxIndex = oBoxCollection.length - 1;
        if (this.displayBoxIndex < 0) this.displayBoxIndex = oBoxCollection.length - 1;

        const cssClass = "selected";

        // oBoxCollectionAll.classList.remove(cssClass);

        for (let i = 0; i < oBoxCollection.length; i++) oBoxCollection[i].classList.remove(cssClass);

        if (oBoxCollection[this.displayBoxIndex]) oBoxCollection[this.displayBoxIndex].classList.add(cssClass);

        const perf3 = CABLES.UI.uiProfiler.start("opselect.navigate.perf3");
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
            const perf = CABLES.UI.uiProfiler.start("opselect.prepare.list");

            this._opSearch._buildList();

            perf.finish();
        }

        if (!this._html)
        {
            const perf = CABLES.UI.uiProfiler.start("opselect.html");

            const head = getHandleBarHtml("op_select");

            this._eleOpsearchmodal = this._eleOpsearchmodal || ele.byId("opsearchmodal");
            this._eleOpsearchmodal.innerHTML = head;

            this._html = getHandleBarHtml("op_select_ops", { "ops": this._opSearch.list, "texts": text });


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
        const perf = CABLES.UI.uiProfiler.start("opselect.show");

        this._eleSearchinfo = document.getElementById("searchinfo");

        this._typedSinceOpening = false;
        this._lastScrollTop = -5711;
        this._minimal = userSettings.get("miniopselect") == true;

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

        this._searchInputEle = ele.byId("opsearch");

        if (options.search)
        {
            this._searchInputEle.value = options.search;
            this.search();
        }

        if (this.firstTime) this.search();

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
        clearTimeout(this._keyTimeout);
        this._typedSinceOpening = true;
        // ele.byQuery("#searchbrowserContainer .searchbrowser").style.opacity = 0.6;
        this._searching = true;

        this._keyTimeout = setTimeout(() =>
        {
            this._keyTimeout = null;
            this.displayBoxIndex = 0;
            this.updateInfo();
            this.search();
            // ele.byQuery("#searchbrowserContainer .searchbrowser").style.opacity = 1.0;
            this._searching = false;
            if (this._enterPressedEarly)
            {
                this.addSelectedOp();
            }
        }, 100);
    }

    addOp(opname, reopenModal = false, itemType = "op")
    {
        this._newOpOptions.onOpAdd = null;

        const sq = this._getQuery();
        const mathPortType = this._getMathPortType();

        for (let i in CABLES.UI.DEFAULTMATHOPS[mathPortType])
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

            if (itemType === "extension")
            {
                gui.opSelect().loadExtension(opname);
            }
            else if (itemType === "teamnamespace")
            {
                gui.opSelect().loadTeamOps(opname);
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

    loadExtension(name)
    {
        gui.serverOps.loadExtensionOps(name, () =>
        {
            this.close();
            this.reload();
            this.prepare();
            setTimeout(() =>
            {
                gui.opSelect().show({
                    "search": name,
                    "subPatch": gui.patchView.getCurrentSubPatch(),
                    "x": 0,
                    "y": 0
                });
            }, 50);
        });
    }

    loadTeamOps(name)
    {
        gui.serverOps.loadTeamNamespaceOps(name, () =>
        {
            this.close();
            this.reload();
            this.prepare();
            setTimeout(() =>
            {
                gui.opSelect().show({
                    "search": name,
                    "subPatch": gui.patchView.getCurrentSubPatch(),
                    "x": 0,
                    "y": 0
                });
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
                    gui.opSelect().show({
                        "subPatch": gui.patchView.getCurrentSubPatch(),
                        "x": 0,
                        "y": 0
                    });
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
            //     sq = CABLES.UI.DEFAULTMATHOPS[i]+" "+sq.substr(1);

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
