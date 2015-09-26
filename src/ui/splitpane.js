var min = 300;
var max = 3600;
var mainmin = 200;

$( document ).ready(function() 
{


    $('#splitterPatch').mousedown(function (e)
    {
        e.preventDefault();
        $(document).mousemove(function (e)
        {
            e.preventDefault();

            gui.rendererWidth=window.innerWidth - e.clientX;
            gui.setLayout();
        });
    });

    $('#splitterRenderer').mousedown(function (e)
    {
        e.preventDefault();
        $(document).mousemove(function (e)
        {
            e.preventDefault();

            gui.rendererHeight= e.clientY;
            gui.setLayout();
        });
    });


    $('#splitterTimeline').mousedown(function (e)
    {
        e.preventDefault();
        $(document).mousemove(function (e)
        {
            e.preventDefault();

            gui.timingHeight= window.innerHeight-e.clientY;

            console.log('gui.timingHeight',gui.timingHeight);
            
            

            gui.setLayout();
        });
    });

    $('#splitterRendererWH').mousedown(function (e)
    {
        e.preventDefault();
        $(document).mousemove(function (e)
        {
            e.preventDefault();

            gui.rendererWidth=window.innerWidth - e.clientX;
            gui.rendererHeight= e.clientY;
            gui.setLayout();
        });
    });


    $(document).mouseup(function (e) {
        $(document).unbind('mousemove');
    });


});