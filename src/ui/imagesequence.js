
CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.ImageSequenceExport=function(filename,start,end,fps)
{



    function next()
    {
        currentNum++;
        var time=currentNum*frameDuration;

        if(time>end)
        {
            $('#progresscontainer').hide();
            $('#animRendererSettings').show();
            gui.patch().scene.freeTimer.play();

            $('.modalScrollContent').html('');
            $('.modalScrollContent').append( 'finished!<br/><br/>');
            $('.modalScrollContent').append( 'rendered '+(currentNum-1)+' frames - '+Math.round( (CABLES.now()-startTime)/1000)+' seconds<br/>');
            $('.modalScrollContent').append( Math.round((CABLES.now()-startTime)/(currentNum-1))/1000+' seconds per frame<br/>');

            return;
        }
        render(currentNum);
    }

    function render(num)
    {
        var time=num*frameDuration;
        // console.log('render ',num,time);


        var prog=Math.round(currentNum/endNum*100);
        $('#progresscontainer .progress').css({width:prog+'%'});
        console.log('prog:',prog);

        gui.patch().scene.timer.pause();
        gui.patch().scene.freeTimer.pause();

        gui.patch().scene.timer.setTime(time);
        gui.patch().scene.freeTimer.setTime(time);

        var str = "" + num;
        var pad = "0000";
        num = '_'+pad.substring(0, pad.length - str.length) + str;

        gui.saveScreenshot(filename+num,next);

        var left=Math.ceil((Math.round((CABLES.now()-startTime)/1000)/(currentNum-1))*(endNum-currentNum));
        $('.modalScrollContent').html( 'frame '+currentNum+' of '+endNum +'<br/>'+left+' seconds left...');

    }

    var currentNum=start*fps;
    var endNum=end*fps;
    var frameDuration=1/fps;
    var startTime=CABLES.now();
    render(currentNum);
    $('#progresscontainer').show();
};
