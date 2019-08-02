CABLES=CABLES||{};
CABLES.SPLITPANE={};

CABLES.SPLITPANE.listeners=[];

$( document ).ready(function()
{
    document.getElementById('splitterPatch').addEventListener("mousedown",function (e)
    {
        e.preventDefault();
        CABLES.SPLITPANE.bound=true;
        function mm(e)
        {
            e.preventDefault();
            gui.rendererWidth=(window.innerWidth - e.clientX)*(1/gui.patch().scene.cgl.canvasScale);
            gui.setLayout();
            gui.updateCanvasIconBar();
        }
        document.addEventListener("mousemove",mm);
        CABLES.SPLITPANE.listeners.push(mm);
    });
    
    document.getElementById('splitterMaintabs').addEventListener('mouseup',function (e)
    {
        $( "iframe" ).each(function() { $('iframe').css("pointer-events","initial"); });
    });


    document.getElementById('splitterMaintabs').addEventListener("mousedown",function (e)
    {
        e.preventDefault();
        CABLES.SPLITPANE.bound=true;
        function mm(e)
        {
            $( "iframe" ).each(function() { $('iframe').css("pointer-events","none"); });
            e.preventDefault();
            gui.editorWidth=e.clientX-gui._elIconBar.outerWidth();
            if(gui.editorWidth<30)gui.editorWidth=30;
            CABLES.UI.userSettings.set("editorWidth",gui.editorWidth);
            gui.setLayout();
        }
        document.addEventListener("mousemove",mm);
        CABLES.SPLITPANE.listeners.push(mm);
    });

    document.getElementById('splitterEditor').addEventListener("mousedown",function (e)
    {
        e.preventDefault();
        CABLES.SPLITPANE.bound=true;
        function mm(e)
        {
            e.preventDefault();
            gui.editorWidth=e.clientX-gui._elIconBar.outerWidth();
            if(gui.editorWidth<30)gui.editorWidth=30;
            CABLES.UI.userSettings.set("editorWidth",gui.editorWidth);
            gui.setLayout();
        }
        document.addEventListener("mousemove",mm);
        CABLES.SPLITPANE.listeners.push(mm);
    });

    document.getElementById('splitterRenderer').addEventListener("mousedown",function (e)
    {
        e.preventDefault();
        CABLES.SPLITPANE.bound=true;
        function mm(e)
        {
            e.preventDefault();
            gui.rendererHeight=e.clientY*(1/gui.patch().scene.cgl.canvasScale);
            gui.setLayout();
            gui.updateCanvasIconBar();
        }
        document.addEventListener("mousemove",mm);
        CABLES.SPLITPANE.listeners.push(mm);
    });

    document.getElementById('splitterTimeline').addEventListener("mousedown",function (e)
    {
        e.preventDefault();
        CABLES.SPLITPANE.bound=true;
        function mm(e)
        {
            e.preventDefault();
            gui.timingHeight= window.innerHeight-e.clientY;
            gui.setLayout();
        }
        document.addEventListener("mousemove",mm);
        CABLES.SPLITPANE.listeners.push(mm);
    });

    document.getElementById('splitterMeta').addEventListener("mousedown",function (e)
    {
        e.preventDefault();
        CABLES.SPLITPANE.bound=true;
        function mm(e)
        {
            e.preventDefault();
            gui.infoHeight= window.innerHeight-e.clientY;
            gui.setLayout();
        }
        document.addEventListener("mousemove",mm);
        CABLES.SPLITPANE.listeners.push(mm);
    });

    function resizeRenderer(e)
    {
        e.preventDefault();
        CABLES.SPLITPANE.bound=true;
        function mm(e)
        {
            var x=e.clientX;
            var y=e.clientY;

            if(x===undefined && e.touches && e.touches.length>0)
            {
                x=e.touches[0].clientX;
                y=e.touches[0].clientY;
            }

            gui.rendererWidth=(window.innerWidth - x)*(1/gui.patch().scene.cgl.canvasScale)+3;
            gui.rendererHeight= y*(1/gui.patch().scene.cgl.canvasScale)-38;
            gui.setLayout();
            gui.updateCanvasIconBar();
            document.getElementById('glcanvas').focus();
            e.preventDefault();
        }
        document.addEventListener("mousemove",mm);
        document.addEventListener("touchmove",mm);
        CABLES.SPLITPANE.listeners.push(mm);
    }
    document.getElementById('splitterRendererWH').addEventListener("mousedown",resizeRenderer);
    document.getElementById('splitterRendererWH').addEventListener("touchstart",resizeRenderer);


    function stopSplit(e)
    {
        console.log("stop split...");
        if(CABLES.SPLITPANE.listeners.length>0)
        {
            for(var i=0;i<CABLES.SPLITPANE.listeners.length;i++)
            {
                document.removeEventListener("mousemove",CABLES.SPLITPANE.listeners[i]);
                document.removeEventListener("touchmove",CABLES.SPLITPANE.listeners[i]);
            }

            CABLES.SPLITPANE.listeners.length=0;
            CABLES.SPLITPANE.bound=false;
            gui.setLayout();
        }
    }

    document.addEventListener('mouseup',stopSplit);
    document.addEventListener('touchend',stopSplit);


});
