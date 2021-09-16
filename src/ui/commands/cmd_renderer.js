CABLES = CABLES || {};
CABLES.CMD = CABLES.CMD || {};
CABLES.CMD.RENDERER = {};

CABLES.CMD.RENDERER.screenshot = function ()
{
    gui.corePatch().cgl.saveScreenshot();
    gui.corePatch().resume();
};

CABLES.CMD.RENDERER.fullscreen = function ()
{
    gui.cycleFullscreen();
};

CABLES.CMD.RENDERER.animRenderer = function ()
{
    CABLES.animRenderer.show();
};


CABLES.CMD.RENDERER.resetSize = function ()
{
    gui.rendererWidth = 640;
    gui.rendererHeight = 360;
    gui.setLayout();
};

CABLES.CMD.RENDERER.aspect = function (a)
{
    if (!a)
    {
        CABLES.UI.MODAL.prompt(
            "Change Aspect Ratio of Renderer ",
            "Enter an aspect ratio, e.g.: 16:9 or 0.22",
            gui.corePatch().cgl.canvasScale,
            function (r)
            {
                if (r.indexOf(":") >= 0)
                {
                    const parts = r.split(":");
                    const s = parseInt(parts[0]) / parseInt(parts[1]);
                    CABLES.CMD.RENDERER.aspect(s);
                }
                else
                {
                    const s = parseFloat(r);
                    console.log("set to", r);
                    CABLES.CMD.RENDERER.aspect(s);
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

    gui.setLayout();
    gui.updateCanvasIconBar();
};

CABLES.CMD.RENDERER.scaleCanvas = function ()
{
    CABLES.UI.MODAL.prompt(
        "Change Scale of Renderer ",
        "Enter a new scale",
        gui.corePatch().cgl.canvasScale,
        function (r)
        {
            const s = parseFloat(r);
            gui.corePatch().cgl.canvasScale = s;
            gui.setLayout();
        });
};

CABLES.CMD.RENDERER.changeSize = function ()
{
    CABLES.UI.MODAL.prompt(
        "Change Canvas size",
        "Enter a new size",
        Math.round(gui.rendererWidth) + " x " + Math.round(gui.rendererHeight),
        function (r)
        {
            const matches = r.match(/\d+/g);
            if (matches.length > 0)
            {
                gui.rendererWidth = matches[0];
                gui.rendererHeight = matches[1];
                gui.setLayout();
            }
        });
};


CABLES.CMD.commands.push({
    "cmd": "save screenshot",
    "category": "renderer",
    "func": CABLES.CMD.RENDERER.screenshot,
    "icon": "image"
}, {
    "cmd": "toggle fullscreen",
    "category": "renderer",
    "func": CABLES.CMD.RENDERER.fullscreen,
    "icon": "canvas_max",
    "infotext": "renderer_maximize"
}, {
    "cmd": "change canvas size",
    "category": "renderer",
    "func": CABLES.CMD.RENDERER.changeSize,
    "icon": "canvas_max"
}, {
    "cmd": "reset canvas size",
    "category": "renderer",
    "func": CABLES.CMD.RENDERER.resetSize,
    "icon": "canvas_max"
}, {
    "cmd": "set canvas aspect ratio",
    "category": "renderer",
    "func": CABLES.CMD.RENDERER.aspect,
    "icon": "canvas_max"
}, {
    "cmd": "animation renderer",
    "category": "renderer",
    "func": CABLES.CMD.RENDERER.animRenderer,
    "icon": "monitor"
}, {
    "cmd": "scale canvas",
    "category": "renderer",
    "func": CABLES.CMD.RENDERER.scaleCanvas,
    "icon": "canvas_max"
}


);
