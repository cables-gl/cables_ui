CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.IMGSEQUENCETIME=0;

CABLES.UI.ImageSequenceExport = function(filename, start, end, fps,settings) {
    var currentNum = start * fps;
    var endNum = end * fps;
    var startNum = start * fps;
    var frameDuration = 1 / fps;
    var startTime = window.performance.now();

    $('#progresscontainer').show();
    var fileNum = 0;

    currentNum--;
    fileNum--;
    var oldInternalNow=null

    render();

    function render()
    {

        if(!oldInternalNow) oldInternalNow=CABLES.internalNow;

        currentNum++;
        fileNum++;

        gui.patch().scene.pause();
        var time = currentNum * frameDuration;

        console.log(currentNum,frameDuration);

        if (time > end) {
            $('#progresscontainer').hide();
            $('#animRendererSettings').show();
            // gui.patch().scene.freeTimer.play();

            $('.modalScrollContent').html('');
            $('.modalScrollContent').append('finished!<br/><br/>');
            $('.modalScrollContent').append('rendered ' + (fileNum) + ' frames - ' + Math.round((window.performance.now() - startTime) / 1000) + ' seconds<br/>');
            $('.modalScrollContent').append(Math.round((window.performance.now() - startTime) / (fileNum)) / 1000 + ' seconds per frame<br/>');

            var ffmpgCmd='ffmpeg -y -framerate 30 -f image2 -i "'+filename+'_%04d.png"  -b 9999k -vcodec mpeg4 '+filename+'.mp4<br/>';

            $('.modalScrollContent').append('<br/><br/>ffmpeg command to convert to mp4:<br/><code class="selectable">'+ffmpgCmd+'</code>');
            gui.patch().scene.resume();
            CABLES.internalNow=oldInternalNow;
            oldInternalNow=null;

            return;
        }

        $('#glcanvas').css({
            width:$('#render_width').val(),
            height:$('#render_height').val()
        });
        gui.patch().scene.cgl.updateSize();

        var prog = Math.round(fileNum / (endNum - startNum) * 100);
        $('#progresscontainer .progress').css({
            width: prog + '%'
        });

        gui.patch().scene.timer.pause();
        gui.patch().scene.freeTimer.pause();
        // console.log('time', time);
        gui.patch().scene.timer.setTime(time);
        gui.patch().scene.freeTimer.setTime(time);
        
        CABLES.UI.IMGSEQUENCETIME=time*1000;
        CABLES.internalNow=function()
        {
            return CABLES.UI.IMGSEQUENCETIME;
        }

        var str = "" + fileNum;
        var pad = "0000";
        
        var strCurrentNum = '_' + pad.substring(0, pad.length - str.length) + str;
        if(settings)
        {
            // console.log("has settings",settings);
            if(!settings.leftpad) 
            {
                strCurrentNum = '_' + str;
                console.log("not leftpad");
            }
        }

        gui.patch().scene.renderOneFrame();

        var left = Math.ceil((Math.round((window.performance.now() - startTime) / 1000) / (currentNum - 1)) * (endNum - currentNum));
        $('.modalScrollContent').html('frame ' + (currentNum - startNum) + ' of ' + (endNum - startNum) + '<br/>' + left + ' seconds left...');

        // setTimeout(function() {
        // gui.patch().scene.onOneFrameRendered=function()
        // {

        //     console.log(''+filename + strCurrentNum+' . '+CABLES.now()+'  '+gui.patch().scene.timer.getTime() );

        gui.patch().scene.cgl.saveScreenshot(
            filename + strCurrentNum,
            render.bind(this),
            $('#render_width').val(),
            $('#render_height').val()
        );
        

        // setTimeout(function()
        // {
        //     render();
        // },100);
        // }.bind(this);
        //, 100);



    }

};
