var CABLES = CABLES || {};

CABLES.AnimRenderer = function() {
    var startTime0;
    var endTime = 0;
    var fps = 0;
    var filename = '';
    var leftpad=true;

};

CABLES.AnimRenderer.prototype.start = function() {
    $('#animRendererSettings').hide();
    $('#progresscontainer').show();

    console.log(filename, startTime, endTime, fps);

    new CABLES.UI.ImageSequenceExport(filename, startTime, endTime, fps,{leftpad:leftpad});
};


CABLES.AnimRenderer.prototype.update = function()
{
    startTime = parseFloat($('#render_start').val());
    endTime = parseFloat($('#render_end').val());
    fps = parseFloat($('#render_fps').val());
    filename = $('#render_filename').val();
    leftpad = $('#render_leftpad').is(':checked');

    var frames = (endTime - startTime) * fps;

    $('.modalScrollContent').html(
        'number of frames: ' + frames + '<br/>'
    );

    // for(var i in gui.patch().ops)
    // {
    //     if(gui.patch().ops[i].op.objName=='Ops.Anim.Timer' || gui.patch().ops[i].op.objName=='Ops.Anim.RelativeTime ')
    //     {
    //         $('.modalScrollContent').html( 'WARNING: you are using timing Ops that are not bound to the timeline (e.g. Ops.Anim.Timer or Ops.Anim.RelativeTime ). To render an animation, you should only use time from Ops.TimeLineTime ');
    //     }
    // }

};

CABLES.AnimRenderer.prototype.show = function(since) {
    var html = CABLES.UI.getHandleBarHtml('AnimRenderer', {});

    CABLES.UI.MODAL.show(html, {
        title: '',
        nopadding: true
    });

    $('#render_fps').val( gui.timeLine().getFPS()||30 ) ;
    $('#render_end').val( (gui.timeLine().getTimeLineLength()||5 )*(gui.timeLine().getFPS()||30));
    

    $('#animRendererSettings').show();
    $('#progresscontainer').hide();

    this.update();
};

CABLES.animRenderer = new CABLES.AnimRenderer();
