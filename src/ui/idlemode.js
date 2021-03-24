CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.idleTime = 10;// 180;
CABLES.UI.idling = false;
CABLES.UI.idleTimeout = null;
CABLES.UI.idleModeStart = 0;
CABLES.UI.idleFocus = false;

CABLES.UI.startIdleMode = function ()
{
    if (!CABLES.UI.loaded || !window.gui) return;
    if (CABLES.UI.idling) return;
    if (CABLES.UI.userSettings.get("noidlemode")) return;

    CABLES.UI.MODAL.show("<center><b>cables is paused!</b><br/><br/>Click to resume<br/></center>");

    if (gui.patch()) gui.patch().stopFlowVis();
    gui.corePatch().pause();
    gui.emitEvent("uiIdleStart");
    CABLES.UI.idling = true;
    clearTimeout(CABLES.UI.idleTimeout);
    CABLES.UI.idleModeStart = Date.now();
};

CABLES.UI.idleInteractivity = function ()
{
    CABLES.UI.idleFocus = true;

    if (CABLES.UI.idling) CABLES.UI.stopIdleMode();
    if (!document.hidden)
    {
        clearTimeout(CABLES.UI.idleTimeout);
        CABLES.UI.idleTimeout = setTimeout(CABLES.UI.startIdleMode, CABLES.UI.idleTime * 1000);
    }
};

CABLES.UI.stopIdleMode = function ()
{
    if (!CABLES.UI.loaded || !window.gui) return;
    if (!CABLES.UI.idling) return;

    console.log("idled for ", Math.round((Date.now() - CABLES.UI.idleModeStart) / 1000) + " seconds");

    gui.corePatch().resume();
    CABLES.UI.MODAL.hide();
    CABLES.UI.idling = false;
    clearTimeout(CABLES.UI.idleTimeout);
    gui.emitEvent("uiIdleEnd");
};

CABLES.UI.visibilityChanged = function (e)
{
    CABLES.UI.idleTimeout = clearTimeout(CABLES.UI.idleTimeout);
    if (document.hidden) CABLES.UI.idleTimeout = setTimeout(CABLES.UI.startIdleMode, 1000);
    else CABLES.UI.stopIdleMode();
};

CABLES.UI.startIdleListeners = function ()
{
    if (gui.isRemoteClient) return;
    console.log("idle listeners started!");

    window.addEventListener("focus", (event) =>
    {
        CABLES.UI.idleFocus = true;
        clearTimeout(CABLES.UI.idleTimeout);
        CABLES.UI.stopIdleMode();
    });

    window.addEventListener("blur", (event) =>
    {
        CABLES.UI.idleFocus = false;
        clearTimeout(CABLES.UI.idleTimeout);
        CABLES.UI.idleTimeout = setTimeout(CABLES.UI.startIdleMode, CABLES.UI.idleTime * 1000);
    });

    document.addEventListener("keydown", CABLES.UI.idleInteractivity, false);
    document.addEventListener("mousemove", CABLES.UI.idleInteractivity);
    document.addEventListener("visibilitychange", CABLES.UI.visibilityChanged);

    CABLES.UI.idleTimeout = setTimeout(CABLES.UI.startIdleMode, CABLES.UI.idleTime * 1000);
};
