var CABLES = CABLES || {};
CABLES.CMD = CABLES.CMD || {};
CABLES.CMD.RENDERER = {};

CABLES.CMD.RENDERER.screenshot = function() {
    gui.patch().scene.cgl.saveScreenshot();
    gui.patch().scene.resume();
};

CABLES.CMD.RENDERER.fullscreen = function() {
    gui.cycleRendererSize();
};

CABLES.CMD.RENDERER.animRenderer = function() {
    CABLES.animRenderer.show();
};

CABLES.CMD.RENDERER.screenshotUpload = function() {
    gui.patch().scene.cgl.saveScreenshot(null,
        function(blob)
        {

            var file = new File([blob], "screenshot.png",{ type: "image/png" });


            // file.type='hund';
            // console.log('filetype',file.type);
            // console.log('blobtype',blob.type);

            var fd = new FormData();
            // fd.append('fname', 'screenshot.png');
            fd.append(0, file);
            $.ajax({
                type: 'POST',
                url:'/api/project/'+gui.patch().getCurrentProject()._id+'/file',
                data: fd,
                processData: false,
                contentType: false
            }).done(
                function(data)
                {
                    console.log('upload DONE!');
                    console.log(data);
                });
                gui.patch().scene.resume();
        },0,0,true);
};

CABLES.CMD.RENDERER.resetSize = function()
{
    gui.rendererWidth = 640;
    gui.rendererHeight = 360;
    gui.setLayout();

};

CABLES.CMD.RENDERER.aspect = function(a)
{
    if(!a)
    {
        CABLES.UI.MODAL.prompt(
            "Change Aspect Ratio of Renderer ",
            "Enter an aspect ratio, e.g.: 16:9 or 0.22",
            gui.patch().scene.cgl.canvasScale,
            function(r)
            {
                if(r.indexOf(":"))
                {
                    var parts=r.split(":");
                    var s=parseInt(parts[0])/parseInt(parts[1]);
                    CABLES.CMD.RENDERER.aspect(s);
                }
                else
                {
                    var s=parseFloat(r);
                    CABLES.CMD.RENDERER.aspect(s);
                }
            });
        return;
    }
    var nh= gui.rendererWidth*1/a;

    if(nh<window.innerHeight*0.6)
    {
        gui.rendererHeight=nh;
    }
    else
    {
        gui.rendererHeight=window.innerHeight*0.6;
        gui.rendererWidth=gui.rendererHeight*a;
    }

    gui.setLayout();
    gui.updateCanvasIconBar();
};

CABLES.CMD.RENDERER.scaleCanvas = function()
{
    CABLES.UI.MODAL.prompt(
        "Change Scale of Renderer ",
        "Enter a new scale",
        gui.patch().scene.cgl.canvasScale,
        function(r)
        {
            var s=parseFloat(r);
            gui.patch().scene.cgl.canvasScale = s;
            gui.setLayout();
        });
};

CABLES.CMD.RENDERER.changeSize = function()
{
    CABLES.UI.MODAL.prompt(
        "Change Canvas size",
        "Enter a new size",
        Math.round(gui.rendererWidth) + ' x ' + Math.round(gui.rendererHeight),
        function(r)
        {
            var matches = r.match(/\d+/g);
            if (matches.length > 0)
            {
                gui.rendererWidth = matches[0];
                gui.rendererHeight = matches[1];
                gui.setLayout();
            }
        });
};


CABLES.CMD.commands.push({
        cmd: "save screenshot",
        category: "renderer",
        func: CABLES.CMD.RENDERER.screenshot,
        icon: 'image'
    }, {
        cmd: "toggle fullscreen",
        category: "renderer",
        func: CABLES.CMD.RENDERER.fullscreen,
        icon: 'monitor'
    }, {
        cmd: "change canvas size",
        category: "renderer",
        func: CABLES.CMD.RENDERER.changeSize,
        icon: 'maximize'
    }, {
        cmd: "reset canvas size",
        category: "renderer",
        func: CABLES.CMD.RENDERER.resetSize,
        icon: 'maximize'
    }, {
        cmd: "set canvas aspect ratio",
        category: "renderer",
        func: CABLES.CMD.RENDERER.aspect,
        icon: 'monitor'
    }, {
        cmd: "animation renderer",
        category: "renderer",
        func: CABLES.CMD.RENDERER.animRenderer,
        icon: 'monitor'
    }, {
        cmd: "upload screenshot file",
        category: "renderer",
        func: CABLES.CMD.RENDERER.screenshotUpload,
        icon: 'image'
    }, {
        cmd: "scale canvas",
        category: "renderer",
        func: CABLES.CMD.RENDERER.scaleCanvas,
        icon: 'image'
    }


);
