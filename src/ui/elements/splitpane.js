CABLES = CABLES || {};
CABLES.SPLITPANE = {};

CABLES.SPLITPANE.listeners = [];

export default initSplitPanes;

function initSplitPanes()
{
    document.getElementById("splitterPatch").addEventListener("mousedown", function (ev)
    {
        gui.pauseProfiling();
        ev.preventDefault();
        CABLES.SPLITPANE.bound = true;
        function mm(e)
        {
            gui.pauseInteractionSplitpanes();

            gui.pauseProfiling();
            e.preventDefault();

            const pos = (window.innerWidth - e.clientX) * (1 / gui.corePatch().cgl.canvasScale);

            if (gui.rendererWidth != -1) gui.rendererWidth = pos;
            gui.splitpanePatchPos = pos;

            gui.setLayout();
            gui.emitEvent("resizecanvas");
            gui.canvasManager.getCanvasUiBar().updateCanvasIconBar();
        }

        document.addEventListener("mousemove", mm);
        CABLES.SPLITPANE.listeners.push(mm);
    });

    document.getElementById("splitterPatch").addEventListener("mouseup", function (e)
    {
        gui.resumeInteractionSplitpanes();
    });

    // ----------------


    document.getElementById("splitterMaintabs").addEventListener("mouseup", function (e)
    {
        gui.resumeInteractionSplitpanes();
    });

    function resizeTabs(ev)
    {
        gui.pauseProfiling();
        ev.preventDefault();
        CABLES.SPLITPANE.bound = true;
        function mm(e)
        {
            gui.pauseInteractionSplitpanes();

            e.preventDefault();
            gui.editorWidth = e.clientX;
            if (gui.editorWidth < 30)gui.editorWidth = 30;
            CABLES.UI.userSettings.set("editorWidth", gui.editorWidth);
            gui.setLayout();
            gui.mainTabs.emitEvent("resize");
        }

        document.addEventListener("mousemove", mm, { "passive": true });
        document.addEventListener("touchmove", mm, { "passive": true });
        CABLES.SPLITPANE.listeners.push(mm);
    }

    document.getElementById("splitterMaintabs").addEventListener("mousedown", resizeTabs, { "passive": true });
    document.getElementById("splitterMaintabs").addEventListener("touchstart", resizeTabs, { "passive": true });

    document.getElementById("splitterRenderer").addEventListener("mousedown", function (ev)
    {
        ev.preventDefault();
        CABLES.SPLITPANE.bound = true;
        function mm(e)
        {
            e.preventDefault();
            gui.rendererHeight = e.clientY * (1 / gui.corePatch().cgl.canvasScale);
            gui.setLayout();
            gui.canvasManager.getCanvasUiBar().updateCanvasIconBar();
        }

        document.addEventListener("mousemove", mm);
        CABLES.SPLITPANE.listeners.push(mm);
    });

    document.getElementById("splitterTimeline").addEventListener("mousedown", function (ev)
    {
        ev.preventDefault();
        CABLES.SPLITPANE.bound = true;
        function mm(e)
        {
            gui.pauseInteractionSplitpanes();
            e.preventDefault();
            gui.timingHeight = window.innerHeight - e.clientY;
            gui.setLayout();
        }

        document.addEventListener("mousemove", mm);
        CABLES.SPLITPANE.listeners.push(mm);
    });


    function resizeRenderer(ev)
    {
        if (gui.canvasManager.mode == gui.canvasManager.CANVASMODE_PATCHBG) return;

        if (ev.shiftKey)
        {
            if (!CABLES.SPLITPANE.rendererAspect) CABLES.SPLITPANE.rendererAspect = gui.rendererWidth / gui.rendererHeight;
        }
        else CABLES.SPLITPANE.rendererAspect = 0.0;

        ev.preventDefault();
        CABLES.SPLITPANE.bound = true;
        function mm(e)
        {
            gui.pauseInteractionSplitpanes();
            let x = e.clientX;
            let y = e.clientY;

            if (x === undefined && e.touches && e.touches.length > 0)
            {
                x = e.touches[0].clientX;
                y = e.touches[0].clientY;
            }

            gui.rendererWidth = (window.innerWidth - x) * (1 / gui.corePatch().cgl.canvasScale) + 3;

            if (CABLES.SPLITPANE.rendererAspect) gui.rendererHeight = 1 / CABLES.SPLITPANE.rendererAspect * gui.rendererWidth;
            else gui.rendererHeight = y * (1 / gui.corePatch().cgl.canvasScale) - 38;


            gui.setLayout();
            gui.canvasManager.getCanvasUiBar().updateCanvasIconBar();
            gui.canvasManager.focus();
            gui.emitEvent("resizecanvas");
            e.preventDefault();

            // gui.canvasManager.getCanvasUiBar().updateSizeDisplay();
        }

        document.addEventListener("mousemove", mm);
        document.addEventListener("touchmove", mm);
        CABLES.SPLITPANE.listeners.push(mm);
    }

    document.getElementById("splitterRendererWH").addEventListener("mousedown", resizeRenderer, { "passive": true });
    document.getElementById("splitterRendererWH").addEventListener("touchstart", resizeRenderer, { "passive": true });


    function stopSplit(e)
    {
        if (CABLES.SPLITPANE.listeners.length > 0)
        {
            for (let i = 0; i < CABLES.SPLITPANE.listeners.length; i++)
            {
                document.removeEventListener("mousemove", CABLES.SPLITPANE.listeners[i]);
                document.removeEventListener("touchmove", CABLES.SPLITPANE.listeners[i]);
            }
            gui.resumeInteractionSplitpanes();


            CABLES.SPLITPANE.listeners.length = 0;
            CABLES.SPLITPANE.bound = false;
            gui.setLayout();
        }
    }

    document.addEventListener("mouseup", stopSplit);
    document.addEventListener("touchend", stopSplit);
}
