import { ele, HandlebarsHelper, TalkerAPI } from "cables-shared-client";
import ServerOps from "./api/opsserver.js";
import NoPatchEditor from "./components/nopatcheditor.js";
import Gui, { gui } from "./gui.js";
import Tracking from "./tracking/tracking.js";
import HtmlInspector from "./elements/canvasoverlays/htmlinspect.js";
import ModalDialog from "./dialogs/modaldialog.js";
import ScConnection from "./socketcluster/sc_connection.js";
import { notifyError } from "./elements/notification.js";
import startIdleListeners from "./components/idlemode.js";
import GlGuiFull from "./glpatch/gluifull.js";
import { platform } from "./platform.js";
import { editorSession } from "./elements/tabpanel/editor_session.js";
import UserSettings, { userSettings } from "./components/usersettings.js";
import { getHandleBarHtml } from "./utils/handlebars.js";
import { GuiText } from "./text.js";

/**
 * manage the start of the ui/editor
 *
 * @export
 * @param {*} cfg
 */
export default function startUi(cfg)
{
    if (window.logStartup) logStartup("Init UI");
    HandlebarsHelper.initHandleBarsHelper();

    const gui = new Gui(cfg);

    gui.on("uiloaded", () =>
    {
        new Tracking();
    });

    if (gui.isRemoteClient)
        new NoPatchEditor();
    else
        new GlGuiFull(gui.corePatch());

    incrementStartup();
    gui.serverOps = new ServerOps(cfg.patchId, () =>
    {
        gui.init();
        gui.checkIdle();
        gui.initCoreListeners();

        gui.corePatch().timer.setTime(0);
        gui.corePatch().timer.pause();

        if (!gui.corePatch().cgl.gl)
        {
            // ele.byId("loadingstatus").remove();
            // ele.byId("loadingstatusLog").remove();

            new ModalDialog({ "title": "GL Error", "html": "Could not initialize webgl, or it crashed. Try to restart your browser, or try another one..." });
            return;
        }

        platform.talkerAPI.send(TalkerAPI.CMD_GET_PATCH_SUMMARY, {}, (err, summary) =>
        {
            if (err)
                console.log("error in summary", err);

            gui.bind(() =>
            {
                incrementStartup();
                platform.initRouting(() =>
                {
                    incrementStartup();
                    gui.opSelect().prepare();
                    gui.setPatchSummary(summary.data);
                    userSettings.init();
                    incrementStartup();

                    gui.opSelect().reload();
                    gui.showWelcomeNotifications();
                    incrementStartup();
                    gui.showUiElements();
                    gui.setLayout();
                    gui.opSelect().prepare();
                    incrementStartup();
                    gui.opSelect().search();
                    gui.setElementBgPattern(ele.byId("cablescanvas"));

                    editorSession.open();

                    gui.setFontSize(userSettings.get("fontSizeOff"));

                    userSettings.on(UserSettings.EVENT_CHANGE, function (key, v)
                    {
                        if (key == "fontSizeOff")
                        {
                            gui.setFontSize(v);
                        }

                        if (key == "bgpattern")
                        {
                            gui.setElementBgPattern(ele.byId("cablescanvas"));
                            gui.setElementBgPattern(ele.byId("bgpreview"));
                        }

                        if (key == "hideSizeBar")
                        {
                            gui.setLayout();
                        }
                    });

                    gui.bindKeys();
                    ele.byId("maincomponents").style.display = "inline";

                    const socketClusterConfig = platform.getSocketclusterConfig();
                    if (!gui.socket && socketClusterConfig.enabled)
                    {
                        gui.socket = new ScConnection(socketClusterConfig);
                    }

                    startIdleListeners();

                    new HtmlInspector();

                    if (userSettings.get("openLogTab") == true) CABLES.CMD.DEBUG.logConsole();

                    gui.maintabPanel.init();

                    gui.corePatch().logStartup("finished loading cables");

                    setTimeout(() =>
                    {
                        if (userSettings.get("forceWebGl1")) notifyError("Forcing WebGl v1 ");
                    }, 1000);

                    gui.patchView.checkPatchErrors();

                    gui.patchView.setCurrentSubPatch(0);

                    ele.byId("patchnavhelperEmpty").innerHTML = GuiText.patch_hint_overlay_empty;
                    ele.byId("patchnavhelperBounds").innerHTML = GuiText.patch_hint_overlay_outofbounds;

                    document.getElementById("loadingstatusLog").style.display = "none";

                    let projectId = gui.patchId;
                    if (gui.project())
                    {
                        projectId = gui.project().shortId || gui.project()._id;
                    }
                    new QRCode(document.getElementById("remote_view_qr"), {
                        "text": platform.getCablesUrl() + "/remote_client/" + projectId,
                        "width": 200,
                        "height": 200,
                        "colorDark": "#000000",
                        "colorLight": "#ffffff",
                        "correctLevel": QRCode.CorrectLevel.H
                    });

                    new QRCode(document.getElementById("patch_view_qr"), {
                        "text": platform.getCablesUrl() + "/p/" + projectId,
                        "width": 200,
                        "height": 200,
                        "colorDark": "#000000",
                        "colorLight": "#ffffff",
                        "correctLevel": QRCode.CorrectLevel.H
                    });

                    if (gui.user) gui.updateActivityFeedIcon(gui.user.activityFeed);

                    CABLES.UI.loaded = true;
                    CABLES.UI.loadedTime = performance.now();

                    gui.corePatch().clearSubPatchCache();
                    gui.patchView.highlightExamplePatchOps();

                    for (let i = 0; i < gui.corePatch().ops.length; i++) if (gui.corePatch().ops[i].checkLinkTimeWarnings)gui.corePatch().ops[i].checkLinkTimeWarnings();

                    gui.patchParamPanel.show();

                    if (!userSettings.get("introCompleted"))gui.introduction.showIntroduction();

                    setTimeout(() =>
                    {
                        gui.emitEvent(Gui.EVENT_UILOADED);
                        gui.corePatch().timer.setTime(0);
                        gui.corePatch().timer.play();
                    }, 100);
                });

            });
        });
    });

    gui.corePatch().logStartup("Init UI done");
}
