import { ele } from "cables-shared-client";
import { userSettings } from "../components/usersettings.js";
import Gui, { gui } from "../gui.js";

const splitpane = {};
window.splitpane = splitpane;
splitpane.listeners = [];

export default initSplitPanes;

function initSplitPanes()
{
    ele.byId("splitterPatch").addEventListener("pointerdown", function (ev)
    {
        gui.pauseProfiling();
        ev.preventDefault();
        splitpane.bound = true;
        function mm(e)
        {
            gui.pauseInteractionSplitpanes();

            gui.pauseProfiling();
            e.preventDefault();

            let pos = (window.innerWidth - e.clientX) * (1 / gui.corePatch().cgl.canvasScale);
            pos = Math.max(200, pos);

            gui.userSettings.set("rightpanelWidth", pos);
            // if (gui.rendererWidth != -1) gui.rendererWidth = pos;
            gui.splitpaneRightPos = pos;

            gui.setLayout();
            gui.emitEvent(Gui.EVENT_RESIZE_CANVAS);
            gui.canvasManager.getCanvasUiBar().updateCanvasIconBar();
        }

        document.addEventListener("pointermove", mm);
        splitpane.listeners.push(mm);
    });

    ele.byId("splitterPatch").addEventListener("pointerup", function (_e)
    {
        gui.resumeInteractionSplitpanes();
    });

    ele.byId("splitterMaintabs").addEventListener("pointerup", function (_e)
    {
        gui.resumeInteractionSplitpanes();
    });

    function resizeTabs(_ev)
    {
        gui.pauseProfiling();
        splitpane.bound = true;
        function mm(e)
        {
            gui.pauseInteractionSplitpanes();

            gui.editorWidth = e.clientX;
            if (gui.editorWidth < 30)gui.editorWidth = 30;
            userSettings.set("editorWidth", gui.editorWidth);
            gui.setLayout();
            gui.mainTabs.emitEvent("resize");
        }

        document.addEventListener("pointermove", mm, { "passive": false });
        splitpane.listeners.push(mm);
    }

    ele.byId("splitterMaintabs").addEventListener("pointerdown", resizeTabs, { "passive": false });

    ele.byId("splitterRenderer").addEventListener("pointerdown", function (ev)
    {
        ev.preventDefault();
        splitpane.bound = true;
        function mm(e)
        {
            e.preventDefault();
            gui.rendererHeight = e.clientY * (1 / gui.corePatch().cgl.canvasScale);
            gui.setLayout();
            gui.canvasManager.getCanvasUiBar().updateCanvasIconBar();
        }

        document.addEventListener("pointermove", mm);
        splitpane.listeners.push(mm);
    });

    ele.byId("splitterBottomTabs").addEventListener("pointerdown",
        function (ev)
        {
            ev.preventDefault();
            splitpane.bound = true;
            function mm(e)
            {
                gui.pauseInteractionSplitpanes();
                e.preventDefault();
                gui.bottomTabPanel.setHeight(window.innerHeight - e.clientY);
                gui.setLayout();
            }

            document.addEventListener("pointermove", mm);
            splitpane.listeners.push(mm);
        });

    function resizeRenderer(ev)
    {
        if (gui.canvasManager.mode == gui.canvasManager.CANVASMODE_PATCHBG) return;

        if (ev.shiftKey)
        {
            if (!splitpane.rendererAspect) splitpane.rendererAspect = gui.rendererWidth / gui.rendererHeight;
        }
        else splitpane.rendererAspect = 0.0;

        ev.preventDefault();
        splitpane.bound = true;
        function mm(e)
        {
            gui.pauseInteractionSplitpanes();
            let x = e.clientX - 10;
            let y = e.clientY + 20;

            if (x === undefined && e.touches && e.touches.length > 0)
            {
                x = e.touches[0].clientX;
                y = e.touches[0].clientY;
            }

            gui.rendererWidth = (window.innerWidth - x) * (1 / gui.corePatch().cgl.canvasScale) + 3;

            if (splitpane.rendererAspect) gui.rendererHeight = 1 / splitpane.rendererAspect * gui.rendererWidth;
            else gui.rendererHeight = y * (1 / gui.corePatch().cgl.canvasScale) - 38;

            gui.setLayout();
            gui.canvasManager.getCanvasUiBar().updateCanvasIconBar();
            gui.canvasManager.focus();
            gui.emitEvent(Gui.EVENT_RESIZE_CANVAS);
            e.preventDefault();
        }

        document.addEventListener("pointermove", mm);
        splitpane.listeners.push(mm);
    }

    ele.byId("splitterRendererWH").addEventListener("pointerdown", resizeRenderer, { "passive": false });

    function stopSplit(_e)
    {
        if (splitpane.listeners.length > 0)
        {
            for (let i = 0; i < splitpane.listeners.length; i++)
                document.removeEventListener("pointermove", splitpane.listeners[i]);

            gui.resumeInteractionSplitpanes();

            splitpane.listeners.length = 0;
            splitpane.bound = false;
            gui.setLayout();
        }
    }

    document.addEventListener("pointerup", stopSplit);
}
