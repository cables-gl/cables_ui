CABLES = CABLES || {};

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
    document.getElementById("animRendererSettings").style.display = "none";
    document.getElementById("progresscontainer").style.display = "block";

    console.log(this.filename, this.startTime, this.endTime, this.fps, this.format);
    new CABLES.UI.ImageSequenceExport(this.filename, this.startTime, this.endTime, this.fps, { "leftpad": this.leftpad, "format": this.format });
};

CABLES.AnimRenderer.prototype.update = function ()
{
    this.startTime = parseFloat(document.getElementById("render_start").value);
    this.endTime = parseFloat(document.getElementById("render_end").value);
    this.fps = parseFloat(document.getElementById("render_fps").value);
    this.filename = document.getElementById("render_filename").value;
    this.format = document.getElementById("render_format").value;

    const leftpad = document.getElementById("render_leftpad").checked;

    const frames = (this.endTime - this.startTime) * this.fps;

    document.querySelector(".modalScrollContent").innerHTML = "number of frames: " + frames + "<br/>";

    document.getElementById("glcanvas").style.width = document.getElementById("render_width").value;
    document.getElementById("glcanvas").style.height = document.getElementById("render_height").value;
    gui.corePatch().cgl.updateSize();
};

CABLES.AnimRenderer.prototype.show = function (since)
{
    const html = CABLES.UI.getHandleBarHtml("AnimRenderer", {});

    CABLES.UI.MODAL.show(html, {
        "title": "",
        "nopadding": true,
    });

    document.getElementById("render_fps").value = gui.timeLine().getFPS() || 30;
    document.getElementById("render_end").value = gui.timeLine().getTimeLineLength() || 5;

    document.getElementById("animRendererSettings").style.display = "block";
    document.getElementById("progresscontainer").style.display = "none";

    this.update();
};

CABLES.animRenderer = new CABLES.AnimRenderer();
