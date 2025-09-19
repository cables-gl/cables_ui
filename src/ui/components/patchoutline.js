import { Events, Logger, ele } from "cables-shared-client";
import TreeView from "./treeview.js";
import defaultOps from "../defaultops.js";
import subPatchOpUtil from "../subpatchop_util.js";
import { escapeHTML } from "../utils/helper.js";
import { gui } from "../gui.js";
import { platform } from "../platform.js";
import { contextMenu } from "../elements/contextmenu.js";
import namespaceutils from "../namespaceutils.js";
import patchCommands from "../commands/cmd_patch.js";
import { patchStructureQuery } from "./patchstructurequery.js";

export default class PatchOutline extends Events
{
    constructor()
    {
        super();

        /** @type {import("./patchstructurequery.js").PatchStructureQueryOptions} */
        this.queryOptions = {
            "include": {
                "bookmarks": true,
                "subpatches": true,
                "commented": true,
                "comments": true,
                "areas": true,
                "animated": true,
                "customOps": true,
                "colored": true
            }

        };

        this._log = new Logger("PatchOutline");
        this.query = new patchStructureQuery();

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
                        return gui.opParams.show(item.id);

                    if (gui.patchView.getSelectedOps().length > 0 && gui.patchView.getSelectedOps()[0].id == item.id)
                        gui.opParams.show(item.id);

                    gui.patchView.centerSelectOp(item.id);
                }
                else this._log.warn("unknown", item);
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

        this.queryOptions = outlineCfg;

        this.updateFilterUi();
    }

    serialize(obj = {})
    {
        obj.outline = this.queryOptions;
    }

    updateFilterUi()
    {
        if (!ele.byId("subtreeFilterBookmarks")) return;

        if (this.queryOptions.include.bookmarks)ele.byId("subtreeFilterBookmarks").classList.add("findToggleActive");
        else ele.byId("subtreeFilterBookmarks").classList.remove("findToggleActive");

        if (this.queryOptions.include.subpatches)ele.byId("subtreeFilterSubPatchOps").classList.add("findToggleActive");
        else ele.byId("subtreeFilterSubPatchOps").classList.remove("findToggleActive");

        if (this.queryOptions.include.commented)ele.byId("subtreeFilterCommented").classList.add("findToggleActive");
        else ele.byId("subtreeFilterCommented").classList.remove("findToggleActive");

        if (this.queryOptions.include.comments)ele.byId("subtreeFilterComments").classList.add("findToggleActive");
        else ele.byId("subtreeFilterComments").classList.remove("findToggleActive");

        if (this.queryOptions.include.areas)ele.byId("subtreeFilterAreas").classList.add("findToggleActive");
        else ele.byId("subtreeFilterAreas").classList.remove("findToggleActive");

        if (this.queryOptions.include.colored)ele.byId("subtreeFilterColored").classList.add("findToggleActive");
        else ele.byId("subtreeFilterColored").classList.remove("findToggleActive");

        if (this.queryOptions.include.animated)ele.byId("subtreeFilterAnimated").classList.add("findToggleActive");
        else ele.byId("subtreeFilterAnimated").classList.remove("findToggleActive");

        if (this.queryOptions.include.customOps)ele.byId("subtreeFilterCustomOps").classList.add("findToggleActive");
        else ele.byId("subtreeFilterCustomOps").classList.remove("findToggleActive");
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
        html += "<a id=\"subtreeFilterCustomOps\" class=\"iconbutton findToggle tt info\" data-info=\"outline_filter_customops\" data-tt=\"customops\" style=\"padding:3px;padding-bottom:0;\" onclick=\"\"><span class=\"icon icon-op\"></span></a>";
        html += "<a id=\"subtreeFilterCommented\" class=\"iconbutton findToggle tt info\" data-info=\"outline_filter_commented\" data-tt=\"commented\" style=\"padding:3px;padding-bottom:0;\" onclick=\"\"><span class=\"icon icon-message\"></span></a>";
        html += "<a id=\"subtreeFilterComments\" class=\"iconbutton findToggle tt info\" data-info=\"outline_filter_comments\" data-tt=\"comments\" style=\"padding:3px;padding-bottom:0;\" onclick=\"\"><span class=\"icon icon-message-square-text\"></span></a>";
        html += "<a id=\"subtreeFilterAreas\" class=\"iconbutton findToggle tt info\" data-info=\"outline_filter_areas\" data-tt=\"areas\" style=\"padding:3px;padding-bottom:0;\" onclick=\"\"><span class=\"icon icon-box-select\"></span></a>";
        html += "<a id=\"subtreeFilterColored\" class=\"iconbutton findToggle tt info\" data-info=\"outline_filter_colored\" data-tt=\"colored ops\" style=\"padding:3px;padding-bottom:0;\" onclick=\"\"><span class=\"icon icon-picker\"></span></a>";
        html += "<a id=\"subtreeFilterAnimated\" class=\"iconbutton findToggle tt info\" data-info=\"outline_filter_animated\" data-tt=\"animated ops\" style=\"padding:3px;padding-bottom:0;\" onclick=\"\"><span class=\"icon icon-clock\"></span></a>";
        html += "<a id=\"subtreeFilterSubPatchOps\" class=\"iconbutton findToggle tt info\" data-info=\"outline_filter_subpatchops\" data-tt=\"subpatchops\" style=\"padding:3px;padding-bottom:0;\" onclick=\"\"><span class=\"icon icon-folder\"></span></a>";
        html += "</div>";

        this.query.setOptions(this.queryOptions);

        const su = this.query.getHierarchy();

        html += this._subTree.html(su);

        let el = ele.byId(id);
        if (!el)
        {
            this._log.warn("no ele for outliner");
            return;
        }
        el.innerHTML = html;
        this._subTree.bindListeners();

        ele.byId("subtreeFilterBookmarks").addEventListener("click", () =>
        {
            this.queryOptions.include.bookmarks = !this.queryOptions.include.bookmarks;
            this.updateFilterUi();
            this.insert();
            gui.setStateUnsaved();
        });
        ele.byId("subtreeFilterSubPatchOps").addEventListener("click", () =>
        {
            this.queryOptions.include.subpatches = !this.queryOptions.include.subpatches;
            this.updateFilterUi();
            this.insert();
            gui.setStateUnsaved();
        });
        ele.byId("subtreeFilterCommented").addEventListener("click", () =>
        {
            this.queryOptions.include.commented = !this.queryOptions.include.commented;
            this.updateFilterUi();
            this.insert();
            gui.setStateUnsaved();
        });
        ele.byId("subtreeFilterComments").addEventListener("click", () =>
        {
            this.queryOptions.include.comments = !this.queryOptions.include.comments;
            this.updateFilterUi();
            this.insert();
            gui.setStateUnsaved();
        });
        ele.byId("subtreeFilterAreas").addEventListener("click", () =>
        {
            this.queryOptions.include.areas = !this.queryOptions.include.areas;
            this.updateFilterUi();
            this.insert();
            gui.setStateUnsaved();
        });
        ele.byId("subtreeFilterColored").addEventListener("click", () =>
        {
            this.queryOptions.include.colored = !this.queryOptions.include.colored;
            this.updateFilterUi();
            this.insert();
            gui.setStateUnsaved();
        });
        ele.byId("subtreeFilterAnimated").addEventListener("click", () =>
        {
            this.queryOptions.include.animated = !this.queryOptions.include.animated;
            this.updateFilterUi();
            this.insert();
            gui.setStateUnsaved();
        });
        ele.byId("subtreeFilterCustomOps").addEventListener("click", () =>
        {
            this.queryOptions.include.customOps = !this.queryOptions.include.customOps;
            this.updateFilterUi();
            this.insert();
            gui.setStateUnsaved();
        });

        this.updateFilterUi();
    }

    /**
     * @param {{ subPatchId: string; subPatchVer: string; blueprintVer: number; }} item
     * @param {HTMLElement} el
     */
    subPatchContextMenu(item, el)
    {
        const items = [];
        items.push({
            "title": "Rename",
            func()
            {
                gui.patchView.focusSubpatchOp(item.subPatchId);
                patchCommands.setOpTitle();
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
        contextMenu.show({ items }, el);
    }
}
