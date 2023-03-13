
import ModalBackground from "../dialogs/modalbg";
import ModalDialog from "../dialogs/modaldialog";
import Logger from "../utils/logger";

// let idleTime = 180;
let idling = false;
let idleTimeout = null;
let idleModeStart = 0;
let idleFocus = false;
let idleModal = null;
let activeModeStart = performance.now();

const logger = new Logger("idlemode");

function startIdleMode()
{
    if (gui.getCanvasMode() == gui.CANVASMODE_FULLSCREEN) return;
    if (gui.patchView.hasFocus() && idleFocus) return;

    if (!CABLES.UI.loaded || !window.gui) return;
    if (idling) return;
    if (CABLES.UI.userSettings.get("noidlemode")) return;
    if (gui.socket && gui.socket.inMultiplayerSession) return;

    const wasActiveSeconds = (performance.now() - activeModeStart) / 1000;
    if (window.gui && !(gui.currentModal && gui.currentModal.persistInIdleMode()))
    {
        // idleModal = new ModalDialog({ "html": "<center><b>Cables is paused!</b><br/><br/>Click to resume<br/></center>" });
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
        idleTimeout = setTimeout(startIdleMode, CABLES.UI.uiConfig.idleModeTimeout * 1000);
    }
}

function stopIdleMode()
{
    if (!CABLES.UI.loaded || !window.gui) return;
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
        idleTimeout = setTimeout(startIdleMode, CABLES.UI.uiConfig.idleModeTimeout * 1000);
    });

    document.addEventListener("keydown", idleInteractivity, false);
    document.addEventListener("pointermove", idleInteractivity);
    document.addEventListener("visibilitychange", visibilityChanged);
    gui.on("userActivity", idleInteractivity);

    idleTimeout = setTimeout(startIdleMode, CABLES.UI.uiConfig.idleModeTimeout * 1000);
}
