CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.ImageSequenceExport = function(filename, start, end, fps) {
    var currentNum = start * fps;
    var endNum = end * fps;
    var startNum = start * fps;
    var frameDuration = 1 / fps;
    var startTime = CABLES.now();
    $('#progresscontainer').show();



    var fileNum = 0;

    currentNum--;
    fileNum--;


    render();

    function render() {
        currentNum++;
        fileNum++;

        var time = currentNum * frameDuration;

        console.log(currentNum);

        if (time > end) {
            $('#progresscontainer').hide();
            $('#animRendererSettings').show();
            gui.patch().scene.freeTimer.play();

            $('.modalScrollContent').html('');
            $('.modalScrollContent').append('finished!<br/><br/>');
            $('.modalScrollContent').append('rendered ' + (fileNum) + ' frames - ' + Math.round((CABLES.now() - startTime) / 1000) + ' seconds<br/>');
            $('.modalScrollContent').append(Math.round((CABLES.now() - startTime) / (fileNum)) / 1000 + ' seconds per frame<br/>');

            return;
        }


        var prog = Math.round(fileNum / (endNum - startNum) * 100);
        $('#progresscontainer .progress').css({
            width: prog + '%'
        });

        gui.patch().scene.timer.pause();
        gui.patch().scene.freeTimer.pause();
        console.log('time', time);
        gui.patch().scene.timer.setTime(time);
        gui.patch().scene.freeTimer.setTime(time);

        var str = "" + fileNum;
        var pad = "0000";
        var strCurrentNum = '_' + pad.substring(0, pad.length - str.length) + str;

        var left = Math.ceil((Math.round((CABLES.now() - startTime) / 1000) / (currentNum - 1)) * (endNum - currentNum));
        $('.modalScrollContent').html('frame ' + (currentNum - startNum) + ' of ' + (endNum - startNum) + '<br/>' + left + ' seconds left...');

        setTimeout(function() {
            console.log('delayed');
            gui.saveScreenshot(
                filename + strCurrentNum,
                render.bind(this),
                $('#render_width').val(),
                $('#render_height').val()
            );
        }.bind(this), 100);



    }

};
