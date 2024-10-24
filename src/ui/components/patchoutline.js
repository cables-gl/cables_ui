import { Events } from "cables-shared-client";
import TreeView from "./treeview.js";
import defaultOps from "../defaultops.js";
import subPatchOpUtil from "../subpatchop_util.js";
import { escapeHTML } from "../utils/helper.js";

export default class PatchOutline extends Events
{
    constructor()
    {
        super();

        this.includeAreas =
        this.includeSubpatches =
        this.includeComments =
        this.includeCommented =
        this.includeBookmarks =
        this.includeAnimated =
        this.includeColored = true;

        this._listeningSubs = false;
        this._subTree = new TreeView();

        this._subTree.on("threedots_click",
            (item, el) =>
            {
                this.subPatchContextMenu(item, el);
            });

        this._subTree.on("title_dblclick",
            (item, el, event) =>
            {
                if (item.subPatchId && gui.patchView.getSelectedOps() && gui.patchView.getSelectedOps().length > 0 && gui.patchView.getSelectedOps()[0].id == item.id)
                    gui.patchView.clickSubPatchNav(item.subPatchId);
            });

        this._subTree.on("title_click",
            (item, el, event) =>
            {
                if (item.id)
                {
                    if (event.shiftKey)
                    {
                        return gui.opParams.show(item.id);
                    }

                    if (gui.patchView.getSelectedOps().length > 0 && gui.patchView.getSelectedOps()[0].id == item.id)
                        gui.opParams.show(item.id);

                    gui.patchView.centerSelectOp(item.id);
                }
                else console.log(item);
            });

        this._subTree.on("icon_click",
            (item) =>
            {
                gui.patchView.centerSelectOp(item.id);
                gui.opParams.show(item.id);
            });
    }

    deserialize(p)
    {
        if (!p || !p.ui || !p.ui.outline) return;

        const outlineCfg = p.ui.outline;

        this.includeBookmarks = outlineCfg.includeBookmarks;
        this.includeSubpatches = outlineCfg.includeSubpatches;
        this.includeCommented = outlineCfg.includeCommented;
        this.includeComments = outlineCfg.includeComments;
        this.includeAreas = outlineCfg.includeAreas;
        this.includeColored = outlineCfg.includeColored;

        this.updateFilterUi();
    }

    serialize(obj)
    {
        const outlineCfg = {};

        outlineCfg.includeBookmarks = this.includeBookmarks;
        outlineCfg.includeSubpatches = this.includeSubpatches;
        outlineCfg.includeCommented = this.includeCommented;
        outlineCfg.includeComments = this.includeComments;
        outlineCfg.includeAreas = this.includeAreas;
        outlineCfg.includeColored = this.includeColored;

        obj.outline = outlineCfg;
    }

    updateFilterUi()
    {
        if (!ele.byId("subtreeFilterBookmarks")) return;

        if (this.includeBookmarks)ele.byId("subtreeFilterBookmarks").classList.add("findToggleActive");
        else ele.byId("subtreeFilterBookmarks").classList.remove("findToggleActive");

        if (this.includeSubpatches)ele.byId("subtreeFilterSubPatchOps").classList.add("findToggleActive");
        else ele.byId("subtreeFilterSubPatchOps").classList.remove("findToggleActive");

        if (this.includeCommented)ele.byId("subtreeFilterCommented").classList.add("findToggleActive");
        else ele.byId("subtreeFilterCommented").classList.remove("findToggleActive");

        if (this.includeComments)ele.byId("subtreeFilterComments").classList.add("findToggleActive");
        else ele.byId("subtreeFilterComments").classList.remove("findToggleActive");

        if (this.includeAreas)ele.byId("subtreeFilterAreas").classList.add("findToggleActive");
        else ele.byId("subtreeFilterAreas").classList.remove("findToggleActive");

        if (this.includeColored)ele.byId("subtreeFilterColored").classList.add("findToggleActive");
        else ele.byId("subtreeFilterColored").classList.remove("findToggleActive");
    }

    isCurrentlyVisible()
    {
        return !!ele.byId("_cbl_outlinetree");
    }

    insert(id = "_cbl_outlinetree")
    {
        if (!this._listeningSubs)
        {
            this._listeningSubs = true;
            gui.corePatch().on("subpatchesChanged", () =>
            {
                if (this.isCurrentlyVisible())
                    this.insert();
            });

            gui.on("multiUserSubpatchChanged", (_clientId, _subPatch) =>
            {
                if (this.isCurrentlyVisible())
                    this.insert();
            });
        }


        let html = "<h3>Patch Outline</h3>";
        html += "<div style=\"margin-bottom:5px;\">";
        html += "<a id=\"subtreeFilterBookmarks\" class=\"iconbutton findToggle tt info\" data-info=\"outline_filter_bookmarks\" data-tt=\"bookmarks\" style=\"padding:3px;padding-bottom:0;\" onclick=\"\"><span class=\"icon icon-bookmark\"></span></a>";
        html += "<a id=\"subtreeFilterSubPatchOps\" class=\"iconbutton findToggle tt info\" data-info=\"outline_filter_subpatchops\" data-tt=\"subpatchops\" style=\"padding:3px;padding-bottom:0;\" onclick=\"\"><span class=\"icon icon-folder\"></span></a>";
        html += "<a id=\"subtreeFilterCommented\" class=\"iconbutton findToggle tt info\" data-info=\"outline_filter_commented\" data-tt=\"commented\" style=\"padding:3px;padding-bottom:0;\" onclick=\"\"><span class=\"icon icon-message\"></span></a>";
        html += "<a id=\"subtreeFilterComments\" class=\"iconbutton findToggle tt info\" data-info=\"outline_filter_comments\" data-tt=\"comments\" style=\"padding:3px;padding-bottom:0;\" onclick=\"\"><span class=\"icon icon-message-square-text\"></span></a>";
        html += "<a id=\"subtreeFilterAreas\" class=\"iconbutton findToggle tt info\" data-info=\"outline_filter_areas\" data-tt=\"areas\" style=\"padding:3px;padding-bottom:0;\" onclick=\"\"><span class=\"icon icon-box-select\"></span></a>";
        html += "<a id=\"subtreeFilterColored\" class=\"iconbutton findToggle tt info\" data-info=\"outline_filter_colored\" data-tt=\"colored ops\" style=\"padding:3px;padding-bottom:0;\" onclick=\"\"><span class=\"icon icon-picker\"></span></a>";
        html += "</div>";

        const su = this._getSubPatchesHierarchy();

        html += this._subTree.html(su);

        let el = ele.byId(id);
        el.innerHTML = html;
        this._subTree.bindListeners();

        ele.byId("subtreeFilterBookmarks").addEventListener("click", () =>
        {
            this.includeBookmarks = !this.includeBookmarks;
            this.updateFilterUi();
            this.insert();
        });
        ele.byId("subtreeFilterSubPatchOps").addEventListener("click", () =>
        {
            this.includeSubpatches = !this.includeSubpatches;
            this.updateFilterUi();
            this.insert();
        });
        ele.byId("subtreeFilterCommented").addEventListener("click", () =>
        {
            this.includeCommented = !this.includeCommented;
            this.updateFilterUi();
            this.insert();
        });
        ele.byId("subtreeFilterComments").addEventListener("click", () =>
        {
            this.includeComments = !this.includeComments;
            this.updateFilterUi();
            this.insert();
        });
        ele.byId("subtreeFilterAreas").addEventListener("click", () =>
        {
            this.includeAreas = !this.includeAreas;
            this.updateFilterUi();
            this.insert();
        });
        ele.byId("subtreeFilterColored").addEventListener("click", () =>
        {
            this.includeColored = !this.includeColored;
            this.updateFilterUi();
            this.insert();
        });

        this.updateFilterUi();
    }

    _sanitizeComment(_cmt)
    {
        let cmt = escapeHTML(_cmt);

        if (cmt.length > 30)cmt = cmt.substring(0, 30) + "...";

        return cmt;
    }


    _getUserImagesStringSubpatch(patchId)
    {
        let str = "";
        const userIds = gui.socket.state.getUserInSubpatch(patchId);


        for (let i = 0; i < userIds.length; i++)
        {
            str += "<img style='height:15px;border-radius:100%;margin-left:10px;' src=\"" + CABLES.platform.getCablesUrl() + "/api/avatar/" + userIds[i] + "/mini\"/>";
        }

        return str;
    }

    _getSubPatchesHierarchy(patchId = 0)
    {
        let mainTitle = "Patch ";
        if (!gui.savedState.isSavedSubPatch(0))mainTitle += " (*) ";

        mainTitle += this._getUserImagesStringSubpatch(0);

        let sub =
        {
            "title": mainTitle,
            "id": "0",
            "order": 0,
            "subPatchId": "0",
            "childs": [],
            "icon": "folder"
        };

        if (gui.patchView.getCurrentSubPatch() == 0)sub.rowClass = "active";

        let subs = [sub];


        if (patchId)
        {
            const subOp = gui.patchView.getSubPatchOuterOp(patchId);
            if (!subOp) return;
            sub.title = subOp.getTitle();
            sub.id = subOp.id;
            if (!gui.savedState.isSavedSubPatch(patchId))sub.title += " (*) ";

            sub.title += this._getUserImagesStringSubpatch(patchId);

            // html += "!!";

            if (subOp.uiAttribs.comment)sub.title += " <span style=\"color: var(--color-special);\">// " + this._sanitizeComment(subOp.uiAttribs.comment) + "</span>";

            sub.subPatchId = patchId;
            sub.id = subOp.id;
            if (subOp.uiAttribs && subOp.uiAttribs.translate) sub.order = subOp.getTitle() + (subOp.uiAttribs.translate.x * subOp.uiAttribs.translate.y);
            else sub.order = subOp.getTitle();

            sub.subPatchVer = subOp.storage.subPatchVer || 0;

            if (gui.patchView.getCurrentSubPatch() == sub.subPatchId) sub.rowClass = "active";
            else sub.rowClass = "";

            if (subOp.storage.blueprintVer || subOp.isInBlueprint2())
            {
                sub.blueprintVer = subOp.storage.blueprintVer;
                sub.icon = "folder";
            }
        }

        const ops = gui.patchView.getAllSubPatchOps(patchId || 0);

        for (let i = 0; i < ops.length; i++)
        {
            let included = false;

            if (this.includeSubpatches && ops[i].patchId && ops[i].patchId.get() !== 0) included = true;
            if (this.includeColored && ops[i].uiAttribs.color) included = true;
            if (this.includeAreas && ops[i].objName.indexOf(defaultOps.defaultOpNames.uiArea) > -1) included = true;
            if (this.includeBookmarks && ops[i].uiAttribs.bookmarked) included = true;
            if (this.includeComments && ops[i].uiAttribs.comment_title) included = true;
            if (this.includeCommented && ops[i].uiAttribs.comment) included = true;

            if (included)
            {
                if (ops[i].patchId && ops[i].patchId.get() !== 0)
                {
                    sub.childs.push(this._getSubPatchesHierarchy(ops[i].patchId.get()));
                }
                else
                {
                    let icon = "bookmark";
                    if (this.includeCommented && ops[i].uiAttribs.comment) icon = "message";
                    if (this.includeColored && ops[i].uiAttribs.color) icon = "op";
                    if (this.includeComments && ops[i].objName.indexOf("Ops.Ui.Comment") > -1 && ops[i].uiAttribs.comment_title) icon = "message-square-text";
                    if (this.includeAreas && ops[i].objName.indexOf("Ops.Ui.Area") > -1) icon = "box-select";

                    let title = ops[i].uiAttribs.comment_title || ops[i].getTitle();
                    if (ops[i].uiAttribs.comment)title += " <span style=\"color: var(--color-special);\">// " + this._sanitizeComment(ops[i].uiAttribs.comment) + "</span>";

                    sub.childs.push({ "title": title, "icon": icon, "id": ops[i].id, "order": title + ops[i].id, "iconBgColor": ops[i].uiAttribs.color });
                }
            }
        }

        if (patchId == 0) return subs;
        else return sub;
    }


    subPatchContextMenu(item, el)
    {
        const items = [];
        items.push({
            "title": "Rename",
            func()
            {
                gui.patchView.focusSubpatchOp(item.subPatchId);
                CABLES.CMD.PATCH.setOpTitle();
            },
        });

        if (item.subPatchVer == "2" && item.blueprintVer != 2)
            items.push({
                "title": "Create op from subpatch",
                func()
                {
                    subPatchOpUtil.createBlueprint2Op(item.subPatchId);
                },
            });

        if (item.blueprintVer == 2)
        {
            items.push({
                "title": "Save Op",
                func()
                {
                    const op = gui.patchView.getSubPatchOuterOp(item.subPatchId);

                    subPatchOpUtil.updateSubPatchOpAttachment(op, { "oldSubId": item.subPatchId });
                },
            });
        }
        CABLES.contextMenu.show({ items }, el);
    }
}
