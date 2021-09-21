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

    document.getElementById("progresscontainer").style.display = "block";
    let fileNum = 0;

    currentNum--;
    fileNum--;
    let oldInternalNow = null;
    const frames = [];

    const format = settings.format; //= true;

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
            if (format == "webm")
            {
                document.querySelector(".modalScrollContent").innerHTML = "compiling video...";

                console.log("webm frames", frames.length);
                const video = Whammy.fromImageArray(frames, 30);
                const url = window.URL.createObjectURL(video);
                const anchor = document.createElement("a");

                anchor.setAttribute("download", filename);
                anchor.setAttribute("href", url);
                document.body.appendChild(anchor);
                anchor.click();
            }

            document.getElementById("progresscontainer").style.display = "none";
            document.getElementById("animRendererSettings").style.display = "block";

            document.querySelector(".modalScrollContent").innerHTML = "";
            document.querySelector(".modalScrollContent").innerHTML += "finished!<br/><br/>";
            document.querySelector(".modalScrollContent").innerHTML += "rendered " + (fileNum) + " frames - " + Math.round((window.performance.now() - startTime) / 1000) + " seconds<br/>";
            document.querySelector(".modalScrollContent").innerHTML += Math.round((window.performance.now() - startTime) / (fileNum)) / 1000 + " seconds per frame<br/>";

            const ffmpgCmd = "ffmpeg -y -framerate 30 -f image2 -i \"" + filename + "_%04d.png\"  -b 9999k -vcodec mpeg4 " + filename + ".mp4<br/>";

            document.querySelector(".modalScrollContent").innerHTML += "<br/><br/>ffmpeg command to convert to mp4:<br/><code class=\"selectable\">" + ffmpgCmd + "</code>";
            CABLES.internalNow = oldInternalNow;
            oldInternalNow = null;
            gui.corePatch().pause();
            setTimeout(function ()
            {
                gui.corePatch().resume();
            }, 500);

            return;
        }

        const prog = Math.round(fileNum / (endNum - startNum) * 100);
        document.querySelector("#progresscontainer .progress").style.width = prog + "%";
        if (settings.onProgress) settings.onProgress(prog / 100);

        gui.corePatch().timer.pause();
        gui.corePatch().freeTimer.pause();
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
            if (!settings.leftpad)
            {
                strCurrentNum = "_" + str;
                console.log("not leftpad");
            }
        }

        gui.corePatch().renderOneFrame();

        const left = Math.ceil((Math.round((window.performance.now() - startTime) / 1000) / (currentNum - 1)) * (endNum - currentNum));
        document.querySelector(".modalScrollContent").innerHTML = "frame " + (currentNum - startNum) + " of " + (endNum - startNum) + "<br/>" + left + " seconds left...";

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
                document.getElementById("render_width").value,
                document.getElementById("render_height").value
            );
        }
    }
};
