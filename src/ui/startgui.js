import { ele, HandlebarsHelper } from "cables-shared-client";
import ServerOps from "./api/opsserver.js";
import NoPatchEditor from "./components/nopatcheditor.js";
import Gui from "./gui.js";
import Tracking from "./tracking/tracking.js";
import HtmlInspector from "./elements/canvasoverlays/htmlinspect.js";
import ModalDialog from "./dialogs/modaldialog.js";
import ScConnection from "./multiplayer/sc_connection.js";
import text from "./text.js";
import { notifyError } from "./elements/notification.js";
import startIdleListeners from "./components/idlemode.js";


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

    window.gui = new Gui(cfg);

    gui.on("uiloaded", () =>
    {
        new Tracking(gui);
    });

    if (gui.isRemoteClient)
        new NoPatchEditor();
    else
        CABLES.CMD.DEBUG.glguiFull();

    incrementStartup();
    gui.serverOps = new ServerOps(gui, cfg.patchId, () =>
    {
        gui.init();
        gui.checkIdle();
        gui.initCoreListeners();

        gui.corePatch().timer.setTime(0);

        if (!gui.corePatch().cgl.gl)
        {
            // ele.byId("loadingstatus").remove();
            // ele.byId("loadingstatusLog").remove();

            new ModalDialog({ "title": "GL Error", "html": "Could not initialize webgl, or it crashed. Try to restart your browser, or try another one..." });
            return;
        }


        gui.bind(() =>
        {
            incrementStartup();
            CABLES.platform.initRouting(() =>
            {
                document.addEventListener("visibilitychange", function ()
                {
                    if (!document.hidden)
                    {
                        gui.setLayout();
                        gui.patchView.store.checkUpdated();
                    }
                }, false);

                incrementStartup();
                gui.opSelect().prepare();
                CABLES.UI.userSettings.init();
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

                CABLES.editorSession.open();

                gui.setFontSize(CABLES.UI.userSettings.get("fontSizeOff"));

                CABLES.UI.userSettings.on("change", function (key, v)
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

                if (!CABLES.UI.userSettings.get("introCompleted"))gui.introduction.showIntroduction();

                gui.bindKeys();

                const socketClusterConfig = CABLES.platform.getSocketclusterConfig();
                if (!gui.socket && socketClusterConfig.enabled)
                {
                    gui.socket = new ScConnection(socketClusterConfig);
                }

                startIdleListeners();

                new HtmlInspector();

                if (CABLES.UI.userSettings.get("openLogTab") == true) CABLES.CMD.DEBUG.logConsole();
                if (CABLES.UI.userSettings.get("timelineOpened") == true) gui.showTiming();

                gui.maintabPanel.init();

                if (window.logStartup) logStartup("finished loading cables");

                setTimeout(() =>
                {
                    if (CABLES.UI.userSettings.get("forceWebGl1")) notifyError("Forcing WebGl v1 ");
                }, 1000);

                gui.patchView.checkPatchErrors();

                gui.patchView.setCurrentSubPatch(0);

                ele.byId("patchnavhelperEmpty").innerHTML = text.patch_hint_overlay_empty;
                ele.byId("patchnavhelperBounds").innerHTML = text.patch_hint_overlay_outofbounds;

                document.getElementById("loadingstatusLog").style.display = "none";

                let projectId = gui.patchId;
                if (gui.project())
                {
                    projectId = gui.project().shortId || gui.project()._id;
                }
                new QRCode(document.getElementById("remote_view_qr"), {
                    "text": CABLES.platform.getCablesUrl() + "/remote_client/" + projectId,
                    "width": 200,
                    "height": 200,
                    "colorDark": "#000000",
                    "colorLight": "#ffffff",
                    "correctLevel": QRCode.CorrectLevel.H
                });

                new QRCode(document.getElementById("patch_view_qr"), {
                    "text": CABLES.platform.getCablesUrl() + "/p/" + projectId,
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

                for (let i = 0; i < gui.corePatch().ops.length; i++) gui.corePatch().ops[i].checkLinkTimeWarnings();

                gui.patchParamPanel.show();


                setTimeout(() =>
                {
                    window.gui.emitEvent("uiloaded");
                    gui.corePatch().timer.setTime(0);
                }, 100);
            });
        });
    });

    if (window.logStartup) logStartup("Init UI done");
}
