import { ModalBackground, Logger } from "cables-shared-client";
import uiConfig from "../uiconfig.js";
import { gui } from "../gui.js";
import { userSettings } from "./usersettings.js";

let idling = false;
let idleTimeout = null;
let idleModeStart = 0;
let idleFocus = false;
let idleModal = null;
let activeModeStart = performance.now();

const logger = new Logger("idlemode");

function startIdleMode()
{
    if (gui.canvasManager.mode == gui.canvasManager.CANVASMODE_POPOUT || gui.canvasManager.mode == gui.canvasManager.CANVASMODE_FULLSCREEN) return;
    if (gui.patchView.hasFocus() && idleFocus) return;

    if (!window.gui || !gui.finishedLoading()) return;
    if (idling) return;
    if (!userSettings.get("idlemode")) return;
    if (gui.socket && gui.socket.inMultiplayerSession) return;

    const wasActiveSeconds = (performance.now() - activeModeStart) / 1000;
    if (window.gui && !(gui.currentModal && gui.currentModal.persistInIdleMode && gui.currentModal.persistInIdleMode()))
    {
        gui.restriction.setMessage("idlemode", "cables is paused! Click to resume");
        idleModal = new ModalBackground();
        idleModal.show();
    }

    gui.corePatch().pause();
    gui.emitEvent("uiIdleStart", wasActiveSeconds);
    idling = true;

    clearTimeout(idleTimeout);
    idleModeStart = Date.now();
}

function idleInteractivity()
{
    idleFocus = true;

    if (idling) stopIdleMode();
    if (!document.hidden)
    {
        clearTimeout(idleTimeout);
        idleTimeout = setTimeout(startIdleMode, uiConfig.idleModeTimeout * 1000);
    }
}

function stopIdleMode()
{
    if (!window.gui || !gui.finishedLoading()) return;
    if (!idling) return;

    const idleSeconds = Math.round((Date.now() - idleModeStart) / 1000);
    logger.log("idled for ", idleSeconds + " seconds");

    gui.corePatch().resume();
    // if (idleModal) idleModal.close();
    if (idleModal)
    {
        idleModal.hide();
        gui.restriction.setMessage("idlemode", null);
    }
    // gui.closeModal();
    idling = false;
    clearTimeout(idleTimeout);
    gui.emitEvent("uiIdleEnd", idleSeconds);
    activeModeStart = performance.now();
}

function visibilityChanged(e)
{
    idleTimeout = clearTimeout(idleTimeout);
    if (document.hidden) idleTimeout = setTimeout(startIdleMode, 1000);
    else stopIdleMode();
}

export default function startIdleListeners()
{
    if (gui.isRemoteClient) return;

    window.addEventListener("focus", (event) =>
    {
        idleFocus = true;
        clearTimeout(idleTimeout);
        stopIdleMode();
    });

    window.addEventListener("blur", (event) =>
    {
        idleFocus = false;
        clearTimeout(idleTimeout);
        idleTimeout = setTimeout(startIdleMode, uiConfig.idleModeTimeout * 1000);
    });

    document.addEventListener("keydown", idleInteractivity, false);
    document.addEventListener("pointermove", idleInteractivity);
    document.addEventListener("visibilitychange", visibilityChanged);
    gui.on("userActivity", idleInteractivity);

    idleTimeout = setTimeout(startIdleMode, uiConfig.idleModeTimeout * 1000);
}
