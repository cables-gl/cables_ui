import ServerOps from './api/opsserver';
import NoPatchEditor from './components/nopatcheditor';
import Gui from './gui';
import Tracking from './tracking/tracking';
import OpDocs from './components/opdocs';
import HtmlInspector from './elements/canvasoverlays/htmlinspect';
import ModalDialog from './dialogs/modaldialog';
import ScUiMultiplayer from './multiplayer/sc_ui_multiplayer';
import ScUi from './multiplayer/sc_ui';
import ScConnection from './multiplayer/sc_connection';

export default function startUi(cfg)
{
    logStartup("Init UI");
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
            // console.log("yep,b0rken!.............");
            ele.byId("loadingstatus").remove();
            ele.byId("loadingstatusLog").remove();

            new ModalDialog({html: "could not initialize webgl. try to restart your browser, or try another one" });
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
                gui.opDocs = new OpDocs();
                gui.opSelect().prepare();
                CABLES.UI.userSettings.init();
                incrementStartup();

                gui.metaCode().init();

                gui.metaDoc.init();
                gui.opSelect().reload();
                // gui.setMetaTab(CABLES.UI.userSettings.get("metatab") || 'doc');
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

                CABLES.UI.userSettings.addEventListener("onChange", function (key, v)
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

                    if (key == "theme-bright")
                    {
                        gui.updateTheme();
                    }

                    if (key == "hideSizeBar")
                    {
                        gui.setLayout();
                    }
                });

                if (!CABLES.UI.userSettings.get("introCompleted"))gui.introduction.showIntroduction();

                gui.bindKeys();

                const socketClusterConfig = CABLES.sandbox.getSocketclusterConfig();
                gui.socket = new ScConnection(socketClusterConfig);
                gui.socketUi = new ScUi(gui.socket);
                if (gui.socket.multiplayerEnabled)
                {
                    gui.multiplayerUi = new ScUiMultiplayer(gui.socket);
                    gui.chat = new CABLES.UI.Chat(gui.mainTabs, gui.socket);
                }

                CABLES.UI.startIdleListeners();

                gui.jobs().updateJobListing();

                new HtmlInspector();


                if (CABLES.UI.userSettings.get("timelineOpened") == true) gui.showTiming();

                gui.maintabPanel.init();

                logStartup("finished loading cables");

                setTimeout(() =>
                {
                    if (CABLES.UI.userSettings.get("forceWebGl1")) CABLES.UI.notify("Forcing WebGl v1 ");
                }, 1000);

                if (window.module) module = window.module; // electronn workaround/fix

                gui.patchView.checkPatchErrors();

                gui.patchView.setCurrentSubPatch(0);

                ele.byId("patchnavhelperEmpty").innerHTML = CABLES.UI.TEXTS.patch_hint_overlay_empty;
                ele.byId("patchnavhelperBounds").innerHTML = CABLES.UI.TEXTS.patch_hint_overlay_outofbounds;

                document.getElementById("loadingstatusLog").style.display = "none";

                new QRCode(document.getElementById("remote_view_qr"), {
                    "text": CABLES.sandbox.getCablesUrl() + "/remote_client/" + gui.patchId,
                    "width": 200,
                    "height": 200,
                    "colorDark": "#000000",
                    "colorLight": "#ffffff",
                    "correctLevel": QRCode.CorrectLevel.H
                });

                CABLES.UI.loaded = true;
                setTimeout(() =>
                {
                    window.gui.emitEvent("uiloaded");
                    gui.corePatch().timer.setTime(0);
                }, 100);
            });
        });
    });

    logStartup("Init UI done");
}