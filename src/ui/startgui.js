import ServerOps from "./api/opsserver";
import NoPatchEditor from "./components/nopatcheditor";
import Gui from "./gui";
import Tracking from "./tracking/tracking";
import OpDocs from "./components/opdocs";
import HtmlInspector from "./elements/canvasoverlays/htmlinspect";
import ModalDialog from "./dialogs/modaldialog";
import ScConnection from "./multiplayer/sc_connection";
import text from "./text";
import ele from "./utils/ele";
import userSettings from "./components/usersettings";
import ModalError from "./dialogs/modalerror";

export default function startUi(cfg)
{
    if (window.logStartup) logStartup("Init UI");
    CABLES.UI.initHandleBarsHelper();

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
            ele.byId("loadingstatus").remove();
            ele.byId("loadingstatusLog").remove();

            new ModalDialog({ "title": "GL Error", "html": "Could not initialize webgl, or it crashed. Try to restart your browser, or try another one..." });
            return;
        }


        gui.bind(() =>
        {
            incrementStartup();
            CABLES.sandbox.initRouting(() =>
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

                CABLES.editorSession.open();

                gui.setFontSize(userSettings.get("fontSizeOff"));

                userSettings.on("change", function (key, v)
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

                if (!userSettings.get("introCompleted"))gui.introduction.showIntroduction();

                gui.bindKeys();

                const socketClusterConfig = CABLES.sandbox.getSocketclusterConfig();
                if (!gui.socket && socketClusterConfig.enabled)
                {
                    gui.socket = new ScConnection(socketClusterConfig);
                }

                CABLES.UI.startIdleListeners();


                new HtmlInspector();


                if (userSettings.get("timelineOpened") == true) gui.showTiming();

                gui.maintabPanel.init();

                if (window.logStartup) logStartup("finished loading cables");

                setTimeout(() =>
                {
                    if (userSettings.get("forceWebGl1")) CABLES.UI.notifyError("Forcing WebGl v1 ");
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
                    "text": CABLES.sandbox.getCablesUrl() + "/remote_client/" + projectId,
                    "width": 200,
                    "height": 200,
                    "colorDark": "#000000",
                    "colorLight": "#ffffff",
                    "correctLevel": QRCode.CorrectLevel.H
                });

                new QRCode(document.getElementById("patch_view_qr"), {
                    "text": CABLES.sandbox.getCablesUrl() + "/p/" + projectId,
                    "width": 200,
                    "height": 200,
                    "colorDark": "#000000",
                    "colorLight": "#ffffff",
                    "correctLevel": QRCode.CorrectLevel.H
                });

                if (gui.user) gui.updateActivityFeedIcon(gui.user.activityFeed);

                CABLES.UI.loaded = true;
                CABLES.UI.loadedTime = performance.now();

                // gui.patchView.showBookmarkParamsPanel();
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
