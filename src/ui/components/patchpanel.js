import { Events } from "cables-shared-client";
import { getHandleBarHtml } from "../utils/handlebars.js";
import TreeView from "./treeview.js";
import subPatchOpUtil from "../subpatchop_util.js";

export default class PatchPanel extends Events
{
    constructor()
    {
        super();

        this._firstTime = true;
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

    show(force)
    {
        if (!CABLES.UI.loaded) return;

        if (this._firstTime)
        {
            gui.corePatch().buildSubPatchCache();
            this._firstTime = false;
        }

        if (!force && ele.byClass("patchParamPanel")) return;

        let html = "<div class=\"patchParamPanel panel bookmarkpanel\">";

        const project = gui.project();
        if (project)
        {
            const projectId = project.shortId || project._id;


            const isSameHost = CABLES.sandbox.isPatchSameHost();
            let host = "";

            if (!isSameHost)host = gui.project().buildInfo.host;

            html += getHandleBarHtml("patch_summary",
                {
                    "projectId": projectId,
                    "project": project,
                    "cablesUrl": CABLES.sandbox.getCablesUrl(),
                    "sameHost": isSameHost,
                    "patchHost": host
                });
        }

        html += "<br/><div id=\"tree\"></div>";

        if (gui.longPressConnector.isActive())
        {
            html += gui.longPressConnector.getParamPanelHtml();
        }
        else
        {
            gui.patchView.checkPatchErrors();

            if (!gui.bookmarks.needRefreshSubs && ele.byId("patchsummary")) return;
            if (!gui.bookmarks.needRefreshSubs && ele.byId("bookmarkpanel")) return;

            html += gui.bookmarks.getHtml();
        }

        ele.byId(gui.getParamPanelEleId()).innerHTML = html;

        const su = gui.patchView.getSubPatchesHierarchy();
        // html += this._subTree.html(su);
        this._subTree.insert(ele.byId("tree"), su);
    }

    subPatchContextMenu(item, el)
    {
        // const outer = gui.patchView.getSubPatchOuterOp(item.subPatchId);

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

        if (item.blueprintver == 2)
        {
            items.push({
                "title": "Save Blueprint Op",
                func()
                {
                    const op = gui.patchView.getSubPatchOuterOp(item.subPatchId);

                    subPatchOpUtil.updateBluePrint2Attachment(op, { "oldSubId": item.subPatchId });
                },
            });
        }
        CABLES.contextMenu.show({ items }, el);
    }
}
