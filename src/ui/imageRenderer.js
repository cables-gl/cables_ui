
CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.ImageSequenceExport=function(filename,start,end,fps)
{

    function next()
    {
        currentNum++;
        var time=currentNum*frame;
        // console.log(time);
        if(time>=end)
        {
            console.log('done ! ',currentNum);
            return;
        }
        render(currentNum);
    }

    function render(num)
    {
        console.log('render ',num);
        var time=num*frame;
        gui.patch().scene.timer.setTime(time);

        var str = "" + num;
        var pad = "0000";
        num = '_'+pad.substring(0, pad.length - str.length) + str;

        gui.saveScreenshot(filename+num,next);

    }


    var currentNum=start*fps;
    var frame=1/fps;
    render(currentNum);

};
