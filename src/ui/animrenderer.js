var CABLES = CABLES || {};

CABLES.AnimRenderer = function ()
{
    this.startTime = 0;
    this.endTime = 0;
    this.fps = 0;
    this.filename = "";
    this.leftpad = true;
};

CABLES.AnimRenderer.prototype.start = function ()
{
    $("#animRendererSettings").hide();
    $("#progresscontainer").show();

    console.log(this.filename, this.startTime, this.endTime, this.fps, this.format);
    new CABLES.UI.ImageSequenceExport(this.filename, this.startTime, this.endTime, this.fps, { leftpad: this.leftpad, format: this.format });
};

CABLES.AnimRenderer.prototype.update = function ()
{
    this.startTime = parseFloat($("#render_start").val());
    this.endTime = parseFloat($("#render_end").val());
    this.fps = parseFloat($("#render_fps").val());
    this.filename = $("#render_filename").val();
    this.format = $("#render_format").val();

    const leftpad = $("#render_leftpad").is(":checked");

    var frames = (this.endTime - this.startTime) * this.fps;

    $(".modalScrollContent").html("number of frames: " + frames + "<br/>");

    $("#glcanvas").css({
        width: $("#render_width").val(),
        height: $("#render_height").val(),
    });
    gui.patch().scene.cgl.updateSize();

    // for(var i in gui.patch().ops)
    // {
    //     if(gui.patch().ops[i].op.objName=='Ops.Anim.Timer' || gui.patch().ops[i].op.objName=='Ops.Anim.RelativeTime ')
    //     {
    //         $('.modalScrollContent').html( 'WARNING: you are using timing Ops that are not bound to the timeline (e.g. Ops.Anim.Timer or Ops.Anim.RelativeTime ). To render an animation, you should only use time from Ops.TimeLineTime ');
    //     }
    // }
};

CABLES.AnimRenderer.prototype.show = function (since)
{
    var html = CABLES.UI.getHandleBarHtml("AnimRenderer", {});

    CABLES.UI.MODAL.show(html, {
        title: "",
        nopadding: true,
    });

    $("#render_fps").val(gui.timeLine().getFPS() || 30);
    $("#render_end").val(gui.timeLine().getTimeLineLength() || 5);

    $("#animRendererSettings").show();
    $("#progresscontainer").hide();

    this.update();
};

CABLES.animRenderer = new CABLES.AnimRenderer();
