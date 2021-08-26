CABLES = CABLES || {};
CABLES.SPLITPANE = {};

CABLES.SPLITPANE.listeners = [];


CABLES.UI.initSplitPanes = function ()
{
    document.getElementById("splitterPatch").addEventListener("mousedown", function (ev)
    {
        ev.preventDefault();
        CABLES.SPLITPANE.bound = true;
        function mm(e)
        {
            gui.pauseProfiling();
            e.preventDefault();

            const pos = (window.innerWidth - e.clientX) * (1 / gui.corePatch().cgl.canvasScale);

            if (gui.rendererWidth != -1) gui.rendererWidth = pos;
            gui.splitpanePatchPos = pos;

            gui.setLayout();
            gui.updateCanvasIconBar();
        }

        document.addEventListener("mousemove", mm);
        CABLES.SPLITPANE.listeners.push(mm);
    });

    document.getElementById("splitterMaintabs").addEventListener("mouseup", function (e)
    {
        $("iframe").each(function () { $("iframe").css("pointer-events", "initial"); });
    });


    function resizeTabs(ev)
    {
        gui.pauseProfiling();
        ev.preventDefault();
        CABLES.SPLITPANE.bound = true;
        function mm(e)
        {
            $("iframe").each(function () { $("iframe").css("pointer-events", "none"); });
            e.preventDefault();
            gui.editorWidth = e.clientX;
            if (gui.editorWidth < 30)gui.editorWidth = 30;
            CABLES.UI.userSettings.set("editorWidth", gui.editorWidth);
            gui.setLayout();
            gui.mainTabs.emitEvent("resize");
        }

        document.addEventListener("mousemove", mm);
        document.addEventListener("touchmove", mm);
        CABLES.SPLITPANE.listeners.push(mm);
    }

    document.getElementById("splitterMaintabs").addEventListener("mousedown", resizeTabs);
    document.getElementById("splitterMaintabs").addEventListener("touchstart", resizeTabs);

    document.getElementById("splitterRenderer").addEventListener("mousedown", function (ev)
    {
        ev.preventDefault();
        CABLES.SPLITPANE.bound = true;
        function mm(e)
        {
            e.preventDefault();
            gui.rendererHeight = e.clientY * (1 / gui.corePatch().cgl.canvasScale);
            gui.setLayout();
            gui.updateCanvasIconBar();
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
            e.preventDefault();
            gui.timingHeight = window.innerHeight - e.clientY;
            gui.setLayout();
        }

        document.addEventListener("mousemove", mm);
        CABLES.SPLITPANE.listeners.push(mm);
    });

    document.getElementById("splitterMeta").addEventListener("mousedown", function (ev)
    {
        ev.preventDefault();
        CABLES.SPLITPANE.bound = true;
        function mm(e)
        {
            e.preventDefault();
            gui.infoHeight = window.innerHeight - e.clientY;
            gui.setLayout();
        }

        document.addEventListener("mousemove", mm);
        CABLES.SPLITPANE.listeners.push(mm);
    });


    function resizeRenderer(ev)
    {
        if (gui.getCanvasMode() == gui.CANVASMODE_PATCHBG) return;

        if (ev.shiftKey)
        {
            if (!CABLES.SPLITPANE.rendererAspect) CABLES.SPLITPANE.rendererAspect = gui.rendererWidth / gui.rendererHeight;
        }
        else CABLES.SPLITPANE.rendererAspect = 0.0;

        ev.preventDefault();
        CABLES.SPLITPANE.bound = true;
        function mm(e)
        {
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
            gui.updateCanvasIconBar();
            document.getElementById("glcanvas").focus();
            e.preventDefault();
        }

        document.addEventListener("mousemove", mm);
        document.addEventListener("touchmove", mm);
        CABLES.SPLITPANE.listeners.push(mm);
    }

    document.getElementById("splitterRendererWH").addEventListener("mousedown", resizeRenderer);
    document.getElementById("splitterRendererWH").addEventListener("touchstart", resizeRenderer);


    function stopSplit(e)
    {
        if (CABLES.SPLITPANE.listeners.length > 0)
        {
            for (let i = 0; i < CABLES.SPLITPANE.listeners.length; i++)
            {
                document.removeEventListener("mousemove", CABLES.SPLITPANE.listeners[i]);
                document.removeEventListener("touchmove", CABLES.SPLITPANE.listeners[i]);
            }

            CABLES.SPLITPANE.listeners.length = 0;
            CABLES.SPLITPANE.bound = false;
            gui.setLayout();
        }
    }

    document.addEventListener("mouseup", stopSplit);
    document.addEventListener("touchend", stopSplit);
};
