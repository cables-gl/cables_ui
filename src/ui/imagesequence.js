CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.IMGSEQUENCETIME = 0;

CABLES.UI.ImageSequenceExport = function (filename, start, end, fps, settings)
{
    let currentNum = start * fps;
    const endNum = end * fps;
    const startNum = start * fps;
    const frameDuration = 1 / fps;
    const startTime = window.performance.now();

    $("#progresscontainer").show();
    let fileNum = 0;

    currentNum--;
    fileNum--;
    let oldInternalNow = null;
    const frames = [];

    const format = settings.format;//= true;

    render();

    function render()
    {
        if (!oldInternalNow) oldInternalNow = CABLES.internalNow;

        currentNum++;
        fileNum++;

        gui.corePatch().pause();
        const time = currentNum * frameDuration;

        console.log(currentNum, time, document.getElementById("glcanvas").width, document.getElementById("glcanvas").height);

        if (time > end)
        {
            console.log("FORMAT", format);
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
            if (format == "webm")
            {
                $(".modalScrollContent").html("compiling video...");

                console.log("webm frames", frames.length);
                // var video=new Whammy.Video(30);
                const video = Whammy.fromImageArray(frames, 30);
                const url = window.URL.createObjectURL(video);
                const anchor = document.createElement("a");

                anchor.setAttribute("download", filename);
                anchor.setAttribute("href", url);
                document.body.appendChild(anchor);
                anchor.click();
            }

            $("#progresscontainer").hide();
            $("#animRendererSettings").show();
            // gui.corePatch().freeTimer.play();

            $(".modalScrollContent").html("");
            $(".modalScrollContent").append("finished!<br/><br/>");
            $(".modalScrollContent").append("rendered " + (fileNum) + " frames - " + Math.round((window.performance.now() - startTime) / 1000) + " seconds<br/>");
            $(".modalScrollContent").append(Math.round((window.performance.now() - startTime) / (fileNum)) / 1000 + " seconds per frame<br/>");

            const ffmpgCmd = "ffmpeg -y -framerate 30 -f image2 -i \"" + filename + "_%04d.png\"  -b 9999k -vcodec mpeg4 " + filename + ".mp4<br/>";

            $(".modalScrollContent").append("<br/><br/>ffmpeg command to convert to mp4:<br/><code class=\"selectable\">" + ffmpgCmd + "</code>");
            CABLES.internalNow = oldInternalNow;
            oldInternalNow = null;
            gui.corePatch().pause();
            setTimeout(function ()
            {
                gui.corePatch().resume();
            }, 500);

            return;
        }

        // $('#glcanvas').css({
        //     width:$('#render_width').val(),
        //     height:$('#render_height').val()
        // });
        // gui.corePatch().cgl.updateSize();

        const prog = Math.round(fileNum / (endNum - startNum) * 100);
        $("#progresscontainer .progress").css({
            "width": prog + "%"
        });
        if (settings.onProgress) settings.onProgress(prog / 100);

        gui.corePatch().timer.pause();
        gui.corePatch().freeTimer.pause();
        // console.log('time', time);
        gui.corePatch().timer.setTime(time);
        gui.corePatch().freeTimer.setTime(time);

        CABLES.UI.IMGSEQUENCETIME = time * 1000;
        CABLES.internalNow = function ()
        {
            return CABLES.UI.IMGSEQUENCETIME;
        };

        const str = "" + fileNum;
        const pad = "0000";

        let strCurrentNum = "_" + pad.substring(0, pad.length - str.length) + str;
        if (settings)
        {
            // console.log("has settings",settings);
            if (!settings.leftpad)
            {
                strCurrentNum = "_" + str;
                console.log("not leftpad");
            }
        }

        // if(time==0)gui.corePatch().renderOneFrame();
        gui.corePatch().renderOneFrame();

        const left = Math.ceil((Math.round((window.performance.now() - startTime) / 1000) / (currentNum - 1)) * (endNum - currentNum));
        $(".modalScrollContent").html("frame " + (currentNum - startNum) + " of " + (endNum - startNum) + "<br/>" + left + " seconds left...");

        // setTimeout(function() {
        // gui.corePatch().onOneFrameRendered=function()
        // {
        //     console.log(''+filename + strCurrentNum+' . '+CABLES.now()+'  '+gui.corePatch().timer.getTime() );

        // if(format=='gif')
        // {
        //     console.log("add gif frame...");
        //     // gif.addFrame(ctx, {copy: true});

        //     gif.addFrame(gui.corePatch().cgl.canvas, {delay: 200,copy:true});
        //     render();
        // }

        if (format == "webm" || format == "gif")
        {
            gui.corePatch().renderOneFrame();
            console.log("strCurrentNum", strCurrentNum);
            frames.push(gui.corePatch().cgl.canvas.toDataURL("image/webp", 0.99));
            render();
        }
        else
        {
            gui.corePatch().cgl.saveScreenshot(
                filename + strCurrentNum,
                function ()
                {
                    console.log("...finished" + strCurrentNum);
                    render();
                },
                $("#render_width").val(),
                $("#render_height").val()
            );
        }

        // setTimeout(function()
        // {
        //     render();
        // },100);
        // }.bind(this);
        // , 100);
    }
};
