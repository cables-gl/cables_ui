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
        });
};

CABLES.CMD.RENDERER.resetSize = function()
{
    gui.rendererWidth = 640;
    gui.rendererHeight = 360;
    gui.setLayout();

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
        "Change Renderersize",
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
        cmd: "change renderer size",
        category: "renderer",
        func: CABLES.CMD.RENDERER.changeSize,
        icon: 'maximize'
    }, {
        cmd: "reset renderer size",
        category: "renderer",
        func: CABLES.CMD.RENDERER.resetSize,
        icon: 'maximize'
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
        cmd: "scale renderer",
        category: "renderer",
        func: CABLES.CMD.RENDERER.scaleCanvas,
        icon: 'image'
    }
    

);
