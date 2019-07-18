
CABLES=CABLES||{};
CABLES.SPLITPANE={};

$( document ).ready(function()
{
    $('#splitterPatch').mousedown(function (e)
    {
        e.preventDefault();
        CABLES.SPLITPANE.bound=true;
        $(document).mousemove(function (e)
        {
            e.preventDefault();
            gui.rendererWidth=(window.innerWidth - e.clientX)*(1/gui.patch().scene.cgl.canvasScale);
            gui.setLayout();
            gui.updateCanvasIconBar();
        });
    });

    
    $('#splitterMaintabs').mouseup(function (e)
    {
        $( "iframe" ).each(function() { $('iframe').css("pointer-events","initial"); });
    });


    $('#splitterMaintabs').mousedown(function (e)
    {
        e.preventDefault();
        CABLES.SPLITPANE.bound=true;
        $(document).mousemove(function (e)
        {
            $( "iframe" ).each(function() { $('iframe').css("pointer-events","none"); });
            
            e.preventDefault();
            gui.maintabPanel.width=e.clientX-gui._elIconBar.outerWidth();
            if(gui.maintabPanel.width<30)gui.maintabPanel.width=30;
            CABLES.UI.userSettings.set("editorWidth",gui.maintabPanel.width);
            gui.setLayout();
        });
    });

    $('#splitterEditor').mousedown(function (e)
    {
        e.preventDefault();
        CABLES.SPLITPANE.bound=true;
        $(document).mousemove(function (e)
        {
            e.preventDefault();
            gui.editorWidth=e.clientX-gui._elIconBar.outerWidth();
            if(gui.editorWidth<30)gui.editorWidth=30;
            CABLES.UI.userSettings.set("editorWidth",gui.editorWidth);
            gui.setLayout();
        });
    });

    $('#splitterRenderer').mousedown(function (e)
    {
        e.preventDefault();
        CABLES.SPLITPANE.bound=true;
        $(document).mousemove(function (e)
        {
            e.preventDefault();
            gui.rendererHeight=e.clientY*(1/gui.patch().scene.cgl.canvasScale);
            gui.setLayout();
            gui.updateCanvasIconBar();
        });
    });

    $('#splitterTimeline').mousedown(function (e)
    {
        e.preventDefault();
        CABLES.SPLITPANE.bound=true;
        $(document).mousemove(function (e)
        {
            e.preventDefault();
            gui.timingHeight= window.innerHeight-e.clientY;
            gui.setLayout();
        });
    });

    $('#splitterMeta').mousedown(function (e)
    {
        e.preventDefault();
        CABLES.SPLITPANE.bound=true;
        $(document).mousemove(function (e)
        {
            e.preventDefault();
            gui.infoHeight= window.innerHeight-e.clientY;
            gui.setLayout();
        });
    });

    $('#splitterRendererWH').mousedown(function (e)
    {
        e.preventDefault();
        CABLES.SPLITPANE.bound=true;
        $(document).mousemove(function (e)
        {
            e.preventDefault();

            gui.rendererWidth=(window.innerWidth - e.clientX)*(1/gui.patch().scene.cgl.canvasScale)+3;
            gui.rendererHeight= e.clientY*(1/gui.patch().scene.cgl.canvasScale)-38;
            gui.setLayout();
            $('#glcanvas').focus();
        });
    });

    $(document).mouseup(function (e)
    {
        if(CABLES.SPLITPANE.bound)
        {
            $(document).unbind('mousemove');
            CABLES.SPLITPANE.bound=false;
            gui.setLayout();
        }
    });


});
