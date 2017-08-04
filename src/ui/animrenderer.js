
var CABLES=CABLES||{};

CABLES.AnimRenderer=function()
{
    var startTime0;
    var endTime=0;
    var fps=0;
    var filename='';

};

CABLES.AnimRenderer.prototype.start=function()
{

    $('#animRendererSettings').hide();
    $('#progresscontainer').show();

    new CABLES.UI.ImageSequenceExport(filename,startTime,endTime,fps);
};


CABLES.AnimRenderer.prototype.update=function()
{
    startTime=parseFloat($('#render_start').val());
    endTime=parseFloat($('#render_end').val());
    fps=parseFloat($('#render_fps').val());
    filename=$('#filename').val();

    var frames=(endTime-startTime)*fps;

    $('.modalScrollContent').html(
        'number of frames: '+frames+'<br/>'
    );

};

CABLES.AnimRenderer.prototype.show=function(since)
{
    var html = CABLES.UI.getHandleBarHtml('AnimRenderer',{});

    CABLES.UI.MODAL.show(html,{title:'',nopadding:true});

    $('#animRendererSettings').show();
    $('#progresscontainer').hide();
    this.update();
};

CABLES.animRenderer=new CABLES.AnimRenderer();
