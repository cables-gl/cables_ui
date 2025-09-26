import { Events, ele } from "cables-shared-client";
import { getHandleBarHtml } from "../utils/handlebars.js";
import PatchOutline from "./patchoutline.js";
import Gui, { gui } from "../gui.js";
import { platform } from "../platform.js";

/**
 * default panel when clicking into the pach background, shows patch summary and tree view
 *
 * @export
 * @class PatchPanel
 * @extends {Events}
 */
export default class PatchPanel extends Events
{
    constructor()
    {
        super();

        this._firstTime = true;
        this._outline = new PatchOutline();
    }

    /**
     * @param {object} obj
     */
    deserialize(obj)
    {
        this._outline.deserialize(obj);
    }

    /**
     * @param {object} obj
     */
    serialize(obj)
    {
        this._outline.serialize(obj);
    }

    /**
     * @param {boolean} [force]
     */
    show(force)
    {
        if (!gui.finishedLoading()) return;

        if (this._firstTime)
        {
            gui.corePatch().buildSubPatchCache();
            this._firstTime = false;
        }

        gui.opParams.emitEvent("opSelected", null);
        gui.opParams.emitEvent(Gui.EVENT_OP_SELECTIONCHANGED, null);

        if (!force && ele.byClass("patchParamPanel")) return;

        let html = "<div class=\"patchParamPanel  bookmarkpanel\">";

        const project = gui.project();
        if (project)
        {
            const projectId = project.shortId || project._id;
            const isSameHost = platform.isPatchSameHost();

            let host = "";

            if (!isSameHost)host = gui.project().buildInfo.host;

            html += getHandleBarHtml("patch_summary",
                {
                    "projectId": projectId,
                    "project": project,
                    "frontendOptions": platform.frontendOptions,
                    "isTrustedPatch": platform.isTrustedPatch(),
                    "cablesUrl": platform.getCablesUrl(),
                    "sameHost": isSameHost,
                    "patchHost": host
                });
        }

        html += "<div id=\"_cbl_outlinetree\" class=\"panel\"></div>";

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

        if (ele.byId(gui.getParamPanelEleId()))ele.byId(gui.getParamPanelEleId()).innerHTML = html;

        if (ele.byId("btn_patch_settings"))ele.clickable(ele.byId("btn_patch_settings"), CABLES.CMD.UI.settings);
        if (ele.byId("btn_analyze_patch"))ele.clickable(ele.byId("btn_analyze_patch"), CABLES.CMD.PATCH.analyze);
        if (ele.byId("btn_toggle_patch_like"))ele.clickable(ele.byId("btn_toggle_patch_like"), CABLES.CMD.PATCH.togglePatchLike);

        if (ele.byId("btn_patch_opendir"))ele.clickable(ele.byId("btn_patch_opendir"), (e) =>
        {
            if (e.ctrlKey || e.metaKey) navigator.clipboard.writeText(platform.config.currentPatchDir);
            else CABLES.CMD.ELECTRON.openProjectDir();
        });

        this._outline.insert();
    }
}
