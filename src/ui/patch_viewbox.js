var CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.PatchViewBox=function(patch,paper)
{
    this._paperPatch=paper;
    this._paperMap=null;

    this._viewBox={x:0,y:0,w:0,h:0};
    this._viewBoxMiniMap={x:0,y:0,w:0,h:0};
    this._miniMapRect = null;
    this._patch=patch;
    this._zoom=null;
    this._elePatch = document.getElementById("patch");

    this._viewBoxAnim = { start:0, x: new CABLES.Anim(),y: new CABLES.Anim(),w: new CABLES.Anim(),h: new CABLES.Anim() };

    this._eleNavHelper = document.getElementById("patchnavhelper");
    this._showingNavHelper=false;

    this._eleNavHelperEmpty = document.getElementById("patchnavhelperEmpty");
    this._showingNavHelperEmpty = false;


    this._init();
    this.update();
}

CABLES.UI.PatchViewBox.prototype._init=function()
{
    if (CABLES.UI.userSettings.get("showMinimap")) {
        this._paperMap = Raphael("minimap", CABLES.UI.uiConfig.miniMapWidth, CABLES.UI.uiConfig.miniMapHeight);
        this._paperMap.setViewBox(-500, -500, 4000, 4000);

        this._miniMapRect = this._paperMap.rect(0, 0, 10, 10).attr({
            "stroke": "#666",
            "fill": "#1a1a1a",
            "stroke-width": 1
        });

        $('#minimap svg').on("mousemove touchmove", this._dragMiniMap.bind(this));
        $('#minimap svg').on("mousedown", this._dragMiniMap.bind(this));
    }
}

CABLES.UI.PatchViewBox.prototype.getX = function () {
    return this._viewBox.x;
}
CABLES.UI.PatchViewBox.prototype.getY = function () {
    return this._viewBox.y;
}

CABLES.UI.PatchViewBox.prototype.getCenterX = function () {
    return this._viewBox.x + this._viewBox.w / 2;
}

CABLES.UI.PatchViewBox.prototype.getCenterY = function () {
    return this._viewBox.y + this._viewBox.h / 2;
}

CABLES.UI.PatchViewBox.prototype.setXY = function (x, y) {
    this._viewBox.x = x;
    this._viewBox.y = y;
    this.update();
}

CABLES.UI.PatchViewBox.prototype.set= function (x, y, w, h)
{
    this._viewBox.x = x;
    this._viewBox.y = y;
    this._viewBox.w = w;
    this._viewBox.h = h;
    this.update();
}

CABLES.UI.PatchViewBox.prototype.getMiniMapPaper = function ()
{
    return this._paperMap;
}

CABLES.UI.PatchViewBox.prototype._fixAspectRatio = function (vb)
{
    vb=vb||this._viewBox;

    if (this._elePatch.offsetWidth != 0)
        if (vb.w / vb.h != this._elePatch.offsetWidth / this._elePatch.offsetHeight)
            if (vb.w > vb.h) vb.h = vb.w * (this._elePatch.offsetHeight / this._elePatch.offsetWidth);
                else vb.w = vb.h * (this._elePatch.offsetWidth / this._elePatch.offsetHeight);

    return vb;
}

CABLES.UI.PatchViewBox.prototype._updateNavHelper = function ()
{

    if (this._patch.getNumOps() == 0)
    {
        if (!this._showingNavHelperEmpty)
        {
            this._showingNavHelperEmpty = true;
            this._eleNavHelperEmpty.style.display = "block";
            this.set(-200, -200, 400, 400);
        }

        setTimeout(function()
        {
            gui.patch().updateViewBox();
        },500);

        return;
    }
    else
    {
        if (this._showingNavHelperEmpty)
        {
            this._showingNavHelperEmpty = false;
            this._eleNavHelperEmpty.style.display = "none";
        }
    }
    
    if (gui.patch().currentPatchBounds) {
        var showHelper = false;
        if (this._viewBox.x < gui.patch().currentPatchBounds.x - this._viewBox.w) showHelper = true;
            else if (this._viewBox.x > gui.patch().currentPatchBounds.x + gui.patch().currentPatchBounds.w) showHelper = true;
            else if (this._viewBox.y > gui.patch().currentPatchBounds.y + gui.patch().currentPatchBounds.h) showHelper = true;
            else if (this._viewBox.y < gui.patch().currentPatchBounds.y - this._viewBox.h) showHelper = true;

        if (showHelper || this._viewBox.w > 20000 || this._viewBox.w < 30) {
            this._eleNavHelper.style.display = "block";
            this._showingNavHelper = true;
        }
        else {
            if (this._showingNavHelper) {
                this._eleNavHelper.style.display = "none";
            }
        }
    }
}

CABLES.UI.PatchViewBox.prototype.update = function ()
{
    var perf = CABLES.uiperf.start('PatchViewBox.update');

    if (isNaN(this._viewBox.x)) console.warn("viewbox x NaN");
    if (isNaN(this._viewBox.y)) console.warn("viewbox y NaN");
    if (isNaN(this._viewBox.w)) console.warn("viewbox w NaN");
    if (isNaN(this._viewBox.h)) console.warn("viewbox h NaN");

    this._fixAspectRatio();

    this._paperPatch.setViewBox(this._viewBox.x, this._viewBox.y, this._viewBox.w, this._viewBox.h);

    this._updateNavHelper();

    if (this._miniMapRect)
    {
        this._miniMapRect.attr("x", this._viewBox.x);
        this._miniMapRect.attr("y", this._viewBox.y);
        this._miniMapRect.attr("width", this._viewBox.w);
        this._miniMapRect.attr("height", this._viewBox.h);
    }
    
    perf.finish();
};

CABLES.UI.PatchViewBox.prototype.centerSelectedOps = function ()
{
    var bounds = this._patch.getSelectionBounds();
    this.animate(bounds.x, bounds.y, bounds.w, bounds.h);
}



CABLES.UI.PatchViewBox.prototype.centerAllOps = function ()
{
    var bounds = this._patch.getSubPatchBounds();
    this.animate(bounds.x, bounds.y, bounds.w, bounds.h);
}

CABLES.UI.PatchViewBox.prototype.bindWheel = function (ele)
{
    ele.bind("mousewheel", function (event, delta, nbr)
    {
        var touchpadMode = CABLES.UI.userSettings.get("touchpadmode");
        if (!event.metaKey && !event.altKey && !event.ctrlKey && touchpadMode) {
            if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) event.deltaY *= 0.5;
                else event.deltaX *= 0.5;

            this._viewBox.x += event.deltaX;
            this._viewBox.y += -1 * event.deltaY;
            this.update();

            event.preventDefault();
            event.stopImmediatePropagation();

            return;
        }

        delta = CGL.getWheelSpeed(event);

        if (delta < 0) delta = 0.8;
            else delta = 1.2;

        
        var patchWidth = this._elePatch.offsetWidth;
        var patchHeight = this._elePatch.offsetHeight;

        if (this._zoom == null)
        {
            this._zoom = patchWidth / this._viewBox.w;
            this._viewBox.h = this._viewBox.w * (this._elePatch.offsetHeight / this._elePatch.offsetWidth);
        }

        event = mouseEvent(event);

        var oldx = (event.clientX - this._elePatch.offsetLeft);
        var oldy = (event.clientY - this._elePatch.offsetTop);
        var x = (this._viewBox.x) + Number(oldx / this._zoom);
        var y = (this._viewBox.y) + Number(oldy / this._zoom);

        this._zoom = ((this._zoom || 1) * delta) || 1;

        this.set(
            x - (oldx / this._zoom),
            y - (oldy / this._zoom),
            patchWidth / this._zoom,
            patchHeight / this._zoom
            );

        if (event.ctrlKey) // disable chrome pinch/zoom gesture
        {
            event.preventDefault();
            event.stopImmediatePropagation();
            return;
        }

    }.bind(this));
}

CABLES.UI.PatchViewBox.prototype._dragMiniMap = function (e)
{
    // if (mouseRubberBandPos) return;
    e = mouseEvent(e);

    if (e.buttons == CABLES.UI.MOUSE_BUTTON_LEFT)
    {
        var px = e.offsetX / CABLES.UI.uiConfig.miniMapWidth;
        var py = e.offsetY / CABLES.UI.uiConfig.miniMapHeight;

        this._viewBox.x = (px * this._viewBoxMiniMap.w);
        this._viewBox.y = (py * this._viewBoxMiniMap.h);

        this.update();
    }
}

CABLES.UI.PatchViewBox.prototype.setMinimapBounds = function ()
{
    if (!this._paperMap)return;

    this._viewBoxMiniMap = this._patch.getSubPatchBounds();

    this._paperMap.setViewBox(
        this._viewBoxMiniMap.x,
        this._viewBoxMiniMap.y,
        this._viewBoxMiniMap.w,
        this._viewBoxMiniMap.h
    );
};


CABLES.UI.PatchViewBox.prototype._animViewBox = function ()
{
    const t = (performance.now() - this._viewBoxAnim.start) / 1000;
    this.set(this._viewBoxAnim.x.getValue(t),this._viewBoxAnim.y.getValue(t),this._viewBoxAnim.w.getValue(t),this._viewBoxAnim.h.getValue(t));

    if (this._viewBoxAnim.x.isFinished(t)) return;
        else setTimeout(this._animViewBox.bind(this), 30);
};

CABLES.UI.PatchViewBox.prototype.animate = function (x, y, w, h)
{
    const duration=0.25;

    this._zoom = null;
    this._viewBoxAnim.start = performance.now();
    this._viewBoxAnim.x.defaultEasing = this._viewBoxAnim.y.defaultEasing = this._viewBoxAnim.w.defaultEasing = this._viewBoxAnim.h.defaultEasing = CABLES.TL.EASING_CUBIC_OUT;

    this._viewBoxAnim.x.clear();
    this._viewBoxAnim.y.clear();
    this._viewBoxAnim.w.clear();
    this._viewBoxAnim.h.clear();

    this._viewBoxAnim.x.setValue(0, this._viewBox.x);
    this._viewBoxAnim.y.setValue(0, this._viewBox.y);
    this._viewBoxAnim.w.setValue(0, this._viewBox.w);
    this._viewBoxAnim.h.setValue(0, this._viewBox.h);

    var newvb={x:x,y:y,w:w,h:h};

    newvb=this._fixAspectRatio(newvb);


    this._viewBoxAnim.x.setValue(duration, newvb.x);
    this._viewBoxAnim.y.setValue(duration, newvb.y);
    this._viewBoxAnim.w.setValue(duration, newvb.w);
    this._viewBoxAnim.h.setValue(duration, newvb.h);

    this._animViewBox();
};

CABLES.UI.PatchViewBox.prototype.center = function (x, y) {
    console.log("viuewbox center!");
    this.animate(x - this._viewBox.w / 2, y - this._viewBox.h / 2, this._viewBox.w, this._viewBox.h);
}

CABLES.UI.PatchViewBox.prototype.deSerialize = function (o) {
    this.set(o.x, o.y, o.w, o.h);
}

CABLES.UI.PatchViewBox.prototype.serialize = function () {
    return {
        x: this._viewBox.x,
        y: this._viewBox.y,
        w: this._viewBox.w,
        h: this._viewBox.h
    }
}
