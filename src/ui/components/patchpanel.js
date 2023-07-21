import { getHandleBarHtml } from "../utils/handlebars";
import TreeView from "./treeview";

export default class PatchPanel extends CABLES.EventTarget
{
    constructor()
    {
        super();

        this._subTree = new TreeView();

        this._subTree.on("threedots_click",
            (item, el) =>
            {
                // console.log("threedots!", item);
                this.subPatchContextMenu(item, el);
            });

        this._subTree.on("title_click",
            (item) =>
            {
                if (item.subPatchId)
                {
                    gui.patchView.setCurrentSubPatch(item.subPatchId);
                    gui.patchParamPanel.show();
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
                console.log("icon click", item);
                if (item.subPatchId) gui.patchView.focusSubpatchOp(item.subPatchId);
                else if (item.opid)
                {
                    gui.patchView.centerSelectOp(item.opid);
                }
                else console.log(item);
            });
    }

    show()
    {
        if (!CABLES.UI.loaded) return;
        let html = "<div class=\"panel bookmarkpanel\">";

        if (gui.longPressConnector.isActive())
        {
            html += gui.longPressConnector.getParamPanelHtml();
        }
        else
        {
            gui.patchView.checkPatchErrors();

            if (!gui.bookmarks.needRefreshSubs && ele.byId("patchsummary")) return;
            if (!gui.bookmarks.needRefreshSubs && ele.byId("bookmarkpanel")) return;

            const project = gui.project();
            if (project)
            {
                const projectId = project.shortId || project._id;
                console.log(project);
                html += getHandleBarHtml("patch_summary", { "projectId": projectId, "project": project, "cablesUrl": CABLES.sandbox.getCablesUrl() });
                // const notCollab = !gui.user.isPatchOwner && !project.users.includes(gui.user.id) && !project.usersReadOnly.includes(gui.user.id);
                // if (project.isOpExample || notCollab)
                // {
                //     const projectId = project.shortId || project._id;
                //     html += getHandleBarHtml("patch_summary", { "projectId": projectId });
                // }
                // if (notCollab)
                // {
                //     html += getHandleBarHtml("clonepatch", {});
                // }
            }
            html += gui.bookmarks.getHtml();
        }

        html += "<div id=\"tree\"></div>";

        ele.byId(gui.getParamPanelEleId()).innerHTML = html;

        const su = gui.patchView.getSubPatchesHierarchy();
        // html += this._subTree.html(su);
        this._subTree.insert(ele.byId("tree"), su);
    }

    subPatchContextMenu(item, el)
    {
        console.log(item);
        const outer = gui.patchView.getSubPatchOuterOp(item.subPatchId);

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
                    gui.serverOps.createBlueprint2Op(item.subPatchId);
                    // gui.patchView.focusSubpatchOp(item.subPatchId);
                },
            });

        if (item.blueprintver == 2)
        {
            items.push({
                "title": "Save Blueprint Op",
                func()
                {
                    const op = gui.patchView.getSubPatchOuterOp(item.subPatchId);

                    gui.serverOps.updateBluePrint2Attachment(op, { "oldSubId": item.subPatchId });
                    // gui.patchView.focusSubpatchOp(item.subPatchId);
                },
            });
        }
        CABLES.contextMenu.show({ items }, el);
    }
}
