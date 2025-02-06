import { ele } from "cables-shared-client";
import CanvasLens from "../components/canvas/canvaslens.js";
import ModalDialog from "../dialogs/modaldialog.js";
import Gui, { gui } from "../gui.js";

const CABLES_CMD_RENDERER = {};

const rendererCommands =
{
    "commands": [],
    "functions": CABLES_CMD_RENDERER
};

export default rendererCommands;

CABLES_CMD_RENDERER.screenshot = function ()
{

    gui.canvasManager.currentContext().saveScreenshot();
    gui.corePatch().resume();
};

CABLES_CMD_RENDERER.maximizeCanvas = function ()
{
    gui.cycleFullscreen();
};

CABLES_CMD_RENDERER.resetSize = function ()
{
    gui.rendererWidth = 640;
    gui.rendererHeight = 360;
    gui.setLayout();
};

CABLES_CMD_RENDERER.canvasMagnifier = function ()
{
    gui.canvasMagnifier = new CanvasLens();
};

CABLES_CMD_RENDERER.scrollingPage = function ()
{
    if (ele.byId("testcontent").innerHTML == "")
    {
        document.body.classList.add("scrollPage");

        let str = "";
        for (let i = 0; i < 1000; i++)
        {
            str += "- long page...<br/>";
        }

        str += "<div style=\"position:fixed;bottom:50px;z-index:99999;border-radius:10px;left:40%;cursor:pointer;background-color:#07F78C;color:#000;padding:20px;\" class=\"button-small\" onclick=\"CABLES.CMD.RENDERER.scrollingPage();\">exit scrollmode<div>";
        ele.byId("testcontent").innerHTML = str;
    }
    else
    {
        document.body.scrollTo({ "top": 0, "behaviour": "smooth" });
        document.body.classList.remove("scrollPage");
        ele.byId("testcontent").innerHTML = "";
    }
};

CABLES_CMD_RENDERER.aspect = function (a)
{
    if (!a)
    {
        const p = new ModalDialog({
            "prompt": true,
            "title": "Change Aspect Ratio of Renderer",
            "text": "Enter an aspect ratio, e.g.: 16:9 or 0.22",
            "promptValue": gui.corePatch().cgl.canvasScale,
            "promptOk": (r) =>
            {
                if (r.indexOf(":") >= 0)
                {
                    const parts = r.split(":");
                    const s = parseInt(parts[0]) / parseInt(parts[1]);
                    CABLES_CMD_RENDERER.aspect(s);
                }
                else
                {
                    const s = parseFloat(r);
                    CABLES_CMD_RENDERER.aspect(s);
                }
            }
        });

        return;
    }
    const nh = gui.rendererWidth * 1 / a;

    if (nh < window.innerHeight * 0.6)
    {
        gui.rendererHeight = nh;
    }
    else
    {
        gui.rendererHeight = window.innerHeight * 0.6;
        gui.rendererWidth = gui.rendererHeight * a;
    }

    gui.emitEvent(Gui.EVENT_RESIZE_CANVAS);
    gui.setLayout();
    gui.canvasManager.getCanvasUiBar().updateCanvasIconBar();
};

CABLES_CMD_RENDERER.scaleCanvas = function ()
{
    const p = new ModalDialog({
        "prompt": true,
        "title": "Change Scale of Renderer",
        "text": "Enter a new scale",
        "promptValue": gui.corePatch().cgl.canvasScale || 1,
        "promptOk": (r) =>
        {
            const s = parseFloat(r);
            gui.corePatch().cgl.canvasScale = s;
            gui.setLayout();
        }

    });
};

CABLES_CMD_RENDERER.changeSize = function ()
{
    let str = "Enter a new size:";

    if (gui.canvasManager.getCanvasUiBar())
        gui.canvasManager.getCanvasUiBar().showCanvasModal(false);

    const p = new ModalDialog({
        "prompt": true,
        "title": "Change Canvas size",
        "text": str,
        "promptValue": Math.round(gui.rendererWidth) + " x " + Math.round(gui.rendererHeight),
        "promptOk": (r) =>
        {
            const matches = r.match(/\d+/g);
            if (matches.length > 0)
            {
                gui.rendererWidth = matches[0];
                gui.rendererHeight = matches[1];
                gui.setLayout();
            }
        }

    });
};

CABLES_CMD_RENDERER.popoutCanvas = function ()
{
    gui.canvasManager.popOut();
};

rendererCommands.commands.push({
    "cmd": "save screenshot",
    "category": "canvas",
    "func": CABLES_CMD_RENDERER.screenshot,
    "icon": "image"
}, {
    "cmd": "maximize canvas",
    "category": "canvas",
    "func": CABLES_CMD_RENDERER.maximizeCanvas,
    "icon": "canvas_max",
    "infotext": "renderer_maximize"
}, {
    "cmd": "change canvas size",
    "category": "canvas",
    "func": CABLES_CMD_RENDERER.changeSize,
    "icon": "resize_canvas"
}, {
    "cmd": "reset canvas size",
    "category": "canvas",
    "func": CABLES_CMD_RENDERER.resetSize,
    "icon": "reset_render_size"
}, {
    "cmd": "set canvas aspect ratio",
    "category": "canvas",
    "func": CABLES_CMD_RENDERER.aspect,
    "icon": "canvas_max"
}, {
    "cmd": "scale canvas",
    "category": "canvas",
    "func": CABLES_CMD_RENDERER.scaleCanvas,
    "icon": "scale_canvas"
}, {
    "cmd": "canvas magnifier",
    "category": "canvas",
    "func": CABLES_CMD_RENDERER.canvasMagnifier,
    "icon": "picker"
}, {
    "cmd": "canvas window",
    "category": "canvas",
    "func": CABLES_CMD_RENDERER.popoutCanvas,
    "icon": "external"
}, {
    "cmd": "Simulate Scrolling Page",
    "category": "canvas",
    "func": CABLES_CMD_RENDERER.scrollingPage

}
);
