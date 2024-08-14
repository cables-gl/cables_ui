import { Events } from "cables-shared-client";
import TreeView from "./treeview.js";
import defaultOps from "../defaultops.js";

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

        this._subTree = new TreeView();

        this._subTree.on("threedots_click",
            (item, el) =>
            {
                this.subPatchContextMenu(item, el);
            });

        this._subTree.on("title_click",
            (item) =>
            {
                if (item.subPatchId)
                {
                    gui.patchView.clickSubPatchNav(item.subPatchId);
                }
                else if (item.opid)
                {
                    gui.patchView.centerSelectOp(item.opid);
                }
                else console.log(item);
            });

        this._subTree.on("icon_click",
            (item) =>
            {
                if (item.subPatchId) gui.patchView.focusSubpatchOp(item.subPatchId);
                else if (item.opid)
                {
                    gui.patchView.centerSelectOp(item.opid);
                }
                else console.log(item);
            });
    }

    updateFilterUi()
    {
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

    insert(id = "tree")
    {
        let html = "<h3>Outline</h3>";
        html += "<div style=\"margin-bottom:5px;\">";
        html += "<a id=\"subtreeFilterBookmarks\" class=\"iconbutton findToggle tt\" data-tt=\"bookmarks\" style=\"padding:3px;padding-bottom:0;\" onclick=\"\"><span class=\"icon icon-bookmark\"></span></a>";
        html += "<a id=\"subtreeFilterSubPatchOps\" class=\"iconbutton findToggle tt\" data-tt=\"subpatchops\" style=\"padding:3px;padding-bottom:0;\" onclick=\"\"><span class=\"icon icon-op\"></span></a>";
        html += "<a id=\"subtreeFilterCommented\" class=\"iconbutton findToggle tt\" data-tt=\"commented\" style=\"padding:3px;padding-bottom:0;\" onclick=\"\"><span class=\"icon icon-message\"></span></a>";
        html += "<a id=\"subtreeFilterComments\" class=\"iconbutton findToggle tt\" data-tt=\"comments\" style=\"padding:3px;padding-bottom:0;\" onclick=\"\"><span class=\"icon icon-message-square-text\"></span></a>";
        html += "<a id=\"subtreeFilterAreas\" class=\"iconbutton findToggle tt\" data-tt=\"areas\" style=\"padding:3px;padding-bottom:0;\" onclick=\"\"><span class=\"icon icon-box-select\"></span></a>";
        html += "<a id=\"subtreeFilterColored\" class=\"iconbutton findToggle tt\" data-tt=\"colored ops\" style=\"padding:3px;padding-bottom:0;\" onclick=\"\"><span class=\"icon icon-picker\"></span></a>";
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

    _getSubPatchesHierarchy(patchId = 0)
    {
        let mainTitle = "Main ";
        if (!gui.savedState.isSavedSubPatch(0))mainTitle += " (*) ";

        let sub =
        {
            "title": mainTitle,
            "id": "0",
            "order": 0,
            "subPatchId": "0",
            "childs": [],
            "icon": "op"
        };

        if (gui.patchView.getCurrentSubPatch() == 0)sub.rowClass = "active";

        let subs = [sub];


        if (patchId)
        {
            const subOp = gui.patchView.getSubPatchOuterOp(patchId);
            if (!subOp) return;
            sub.title = subOp.getTitle();
            if (!gui.savedState.isSavedSubPatch(patchId))sub.title += " (*) ";
            if (subOp.uiAttribs.comment)sub.title += " <span style=\"color: var(--color-special);\">// " + subOp.uiAttribs.comment + "</span>";

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
                sub.icon = "blueprint";
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
                    if (ops[i].uiAttribs.comment && this.includeComments) icon = "message";
                    else if (ops[i].objName.indexOf(defaultOps.defaultOpNames.uiArea) > -1) icon = "box-select";
                    else if (ops[i].uiAttribs.comment_title) icon = "message-square-text";

                    let title = ops[i].uiAttribs.comment_title || ops[i].getTitle();
                    if (ops[i].uiAttribs.comment)title += " <span style=\"color: var(--color-special);\">// " + ops[i].uiAttribs.comment + "</span>";


                    sub.childs.push({ "title": title, "icon": icon, "id": ops[i].id, "opid": ops[i].id, "order": title + ops[i].id });
                }
            }
        }

        if (patchId == 0) return subs;
        else return sub;
    }
}
