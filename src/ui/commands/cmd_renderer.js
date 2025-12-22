import { ele } from "cables-shared-client";
import CanvasLens from "../components/canvas/canvaslens.js";
import ModalDialog from "../dialogs/modaldialog.js";
import Gui, { gui } from "../gui.js";

const CABLES_CMD_RENDERER = {};

export { CmdRenderer };

class CmdRenderer
{

    /** @type {import("./commands.js").CommandObject[]} */
    static get commands()
    {

        return [
            {
                "cmd": "save screenshot",
                "category": "canvas",
                "func": CmdRenderer.screenshot,
                "icon": "image"
            },
            {
                "cmd": "maximize canvas",
                "category": "canvas",
                "func": CmdRenderer.maximizeCanvas,
                "icon": "canvas_max",
                "infotext": "renderer_maximize"
            },
            {
                "cmd": "change canvas size",
                "category": "canvas",
                "func": CmdRenderer.changeSize,
                "icon": "resize_canvas"
            },
            {
                "cmd": "reset canvas size",
                "keybindable": true,
                "category": "canvas",
                "func": CmdRenderer.resetSize,
                "icon": "reset_render_size"
            },
            {
                "cmd": "set canvas aspect ratio",
                "category": "canvas",
                "func": CmdRenderer.aspect,
                "icon": "canvas_max"
            },
            {
                "cmd": "scale canvas",
                "category": "canvas",
                "func": CmdRenderer.scaleCanvas,
                "icon": "scale_canvas"
            },
            {
                "cmd": "canvas magnifier",
                "category": "canvas",
                "func": CmdRenderer.canvasMagnifier,
                "icon": "picker"
            },
            {
                "cmd": "canvas window",
                "category": "canvas",
                "func": CmdRenderer.popoutCanvas,
                "icon": "external"
            },
            {
                "cmd": "Simulate Scrolling Page",
                "category": "canvas",
                "func": CmdRenderer.scrollingPage

            },
            {
                "cmd": "Maximize renderer",
                "category": "ui",
                "func": CmdRenderer.maximizeCanvas,
                "icon": "canvas_max",
                "hotkey": "CMD + ENTER"
            }
        ];
    }

    static screenshot()
    {
        gui.canvasManager.currentContext().saveScreenshot();
        gui.corePatch().resume();
    }

    static maximizeCanvas()
    {
        gui.toggleMaximizeCanvas();
    }

    static resetSize()
    {
        gui.rendererWidth = 640;
        gui.rendererHeight = 360;
        gui.setLayout();
    }

    static canvasMagnifier()
    {
        gui.canvasMagnifier = new CanvasLens();
    }

    static scrollingPage()
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
            document.body.scrollTo({
                "top": 0,
                "behavior": "smooth"
            });
            document.body.classList.remove("scrollPage");
            ele.byId("testcontent").innerHTML = "";
        }
    }

    static aspect(a = 0)
    {
        if (!a)
        {
            new ModalDialog({
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
                        CmdRenderer.aspect(s);
                    }
                    else
                    {
                        const s = parseFloat(r);
                        CmdRenderer.aspect(s);
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
    }

    static scaleCanvas()
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
    }

    static changeSize()
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

                    gui.canvasManager.setSize(matches[0], matches[1]);
                    if (gui.canvasManager.mode != gui.canvasManager.CANVASMODE_POPOUT)
                    {

                        gui.rendererWidth = matches[0];
                        gui.rendererHeight = matches[1];

                    }
                    else
                    {
                        gui.canvasManager.subWindow.resizeTo(matches[0], matches[1]);
                    }
                    gui.setLayout();
                }
            }

        });
    }

    static popoutCanvas()
    {
        gui.canvasManager.popOut();
    }

}
