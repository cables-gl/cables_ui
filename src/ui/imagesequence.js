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
    var oldInternalNow=null;
    var frames=[];

    var format=settings.format;//=true;

    render();

    function render()
    {
        if(!oldInternalNow) oldInternalNow=CABLES.internalNow;

        currentNum++;
        fileNum++;

        gui.patch().scene.pause();
        var time = currentNum * frameDuration;

        console.log(currentNum,time,document.getElementById("glcanvas").width,document.getElementById("glcanvas").height);

        if (time > end)
        {
            console.log("FORMAT",format);
            // if(format=='gif')
            // {
            //     $('.modalScrollContent').append('encoding gif...<br/>');
            //     var gif = new GIF({
            //         workers: 2,
            //         quality: 10
            //       });

            //     for(var i=0;i<frames.length;i++)
            //     {
            //         gif.addFrame(frames[i]);
            //     }

            //     gif.on('finished', function(blob) {
            //         console.log("FINISHED GIFFFF");
            //         var url=URL.createObjectURL(blob);
            //         // window.open(url);
            //         $('.modalScrollContent').append('finished gif...<br/>');

            //         var anchor = document.createElement('a');

            //         anchor.setAttribute('download', filename);
            //         anchor.setAttribute('href', url);
            //         document.body.appendChild(anchor);
            //         anchor.click();
            //         });
            //     gif.render();
            // }
            // else
            if(format=='webm')
            {
                $('.modalScrollContent').html('compiling video...');

                console.log("webm frames",frames.length);
                // var video=new Whammy.Video(30);
                var video = Whammy.fromImageArray( frames, 30 )
                var url = window.URL.createObjectURL(video);
                var anchor = document.createElement('a');

                anchor.setAttribute('download', filename);
                anchor.setAttribute('href', url);
                document.body.appendChild(anchor);
                anchor.click();
            }

            $('#progresscontainer').hide();
            $('#animRendererSettings').show();
            // gui.patch().scene.freeTimer.play();

            $('.modalScrollContent').html('');
            $('.modalScrollContent').append('finished!<br/><br/>');
            $('.modalScrollContent').append('rendered ' + (fileNum) + ' frames - ' + Math.round((window.performance.now() - startTime) / 1000) + ' seconds<br/>');
            $('.modalScrollContent').append(Math.round((window.performance.now() - startTime) / (fileNum)) / 1000 + ' seconds per frame<br/>');

            var ffmpgCmd='ffmpeg -y -framerate 30 -f image2 -i "'+filename+'_%04d.png"  -b 9999k -vcodec mpeg4 '+filename+'.mp4<br/>';

            $('.modalScrollContent').append('<br/><br/>ffmpeg command to convert to mp4:<br/><code class="selectable">'+ffmpgCmd+'</code>');
            CABLES.internalNow=oldInternalNow;
            oldInternalNow=null;
            gui.patch().scene.pause();
            setTimeout(function()
            {
                gui.patch().scene.resume();
            },500);

            return;
        }

        // $('#glcanvas').css({
        //     width:$('#render_width').val(),
        //     height:$('#render_height').val()
        // });
        // gui.patch().scene.cgl.updateSize();

        var prog = Math.round(fileNum / (endNum - startNum) * 100);
        $('#progresscontainer .progress').css({
            width: prog + '%'
        });
        if(settings.onProgress) settings.onProgress(prog/100);

        gui.patch().scene.timer.pause();
        gui.patch().scene.freeTimer.pause();
        // console.log('time', time);
        gui.patch().scene.timer.setTime(time);
        gui.patch().scene.freeTimer.setTime(time);

        CABLES.UI.IMGSEQUENCETIME=time*1000;
        CABLES.internalNow=function()
        {
            return CABLES.UI.IMGSEQUENCETIME;
        };

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

        // if(time==0)gui.patch().scene.renderOneFrame();
        gui.patch().scene.renderOneFrame();

        var left = Math.ceil((Math.round((window.performance.now() - startTime) / 1000) / (currentNum - 1)) * (endNum - currentNum));
        $('.modalScrollContent').html('frame ' + (currentNum - startNum) + ' of ' + (endNum - startNum) + '<br/>' + left + ' seconds left...');

        // setTimeout(function() {
        // gui.patch().scene.onOneFrameRendered=function()
        // {
        //     console.log(''+filename + strCurrentNum+' . '+CABLES.now()+'  '+gui.patch().scene.timer.getTime() );

        // if(format=='gif')
        // {
        //     console.log("add gif frame...");
        //     // gif.addFrame(ctx, {copy: true});

        //     gif.addFrame(gui.patch().scene.cgl.canvas, {delay: 200,copy:true});
        //     render();
        // }

        if(format=='webm' || format=='gif')
        {
            gui.patch().scene.renderOneFrame();
            console.log('strCurrentNum',strCurrentNum);
            frames.push( gui.patch().scene.cgl.canvas.toDataURL('image/webp', 0.99) );
            render();
        }
        else
        {
            gui.patch().scene.cgl.saveScreenshot(
                filename + strCurrentNum,
                function()
                {
                    console.log('...finished'+strCurrentNum);
                    render();
                }.bind(this),
                $('#render_width').val(),
                $('#render_height').val()
            );
        }

        // setTimeout(function()
        // {
        //     render();
        // },100);
        // }.bind(this);
        //, 100);
    }
};
