
CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.ImageSequenceExport=function(filename,start,end,fps)
{

    function next()
    {
        currentNum++;
        var time=currentNum*frameDuration;
        // console.log(time);
        if(time>end)
        {
            gui.patch().scene.freeTimer.play();

            console.log('done ! ',currentNum);
            return;
        }
        render(currentNum);
    }

    function render(num)
    {
        var time=num*frameDuration;
        console.log('render ',num,time);

        gui.patch().scene.timer.pause();
        gui.patch().scene.freeTimer.pause();

        gui.patch().scene.timer.setTime(time);
        gui.patch().scene.freeTimer.setTime(time);

        var str = "" + num;
        var pad = "0000";
        num = '_'+pad.substring(0, pad.length - str.length) + str;

        gui.saveScreenshot(filename+num,next);
    }

    var currentNum=start*fps;
    var frameDuration=1/fps;
    render(currentNum);
};
