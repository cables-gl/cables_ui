CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.PatchViewBox = function (patch, paper)
{
    this._paperPatch = paper;
    this._paperMap = null;
    this.touchpadMode = false;

    this._viewBox = { "x": 0, "y": 0, "w": 0, "h": 0 };
    this._viewBoxMiniMap = { "x": 0, "y": 0, "w": 0, "h": 0 };
    this._miniMapRect = null;
    this._patch = patch;
    this._zoom = null;
    this._elePatch = document.getElementById("patch");

    this._viewBoxAnim = { "start": 0, "x": new CABLES.Anim(), "y": new CABLES.Anim(), "w": new CABLES.Anim(), "h": new CABLES.Anim() };

    this._eleNavHelper = document.getElementById("patchnavhelper");
    this._showingNavHelper = false;

    this._eleNavHelperEmpty = document.getElementById("patchnavhelperEmpty");
    this._showingNavHelperEmpty = false;

    this._isFirefox = navigator.userAgent.toLowerCase().indexOf("firefox") != -1;
    this._isWindows = window.navigator.userAgent.indexOf("Windows") != -1;
    this._isLinux = window.navigator.userAgent.indexOf("Linux") !== -1;

    this._lastUpdate = 0;

    this._init();
    this.update();
};

CABLES.UI.PatchViewBox.prototype._init = function ()
{
    if (CABLES.UI.userSettings.get("showMinimap"))
    {
        this._paperMap = Raphael("minimap", CABLES.UI.uiConfig.miniMapWidth, CABLES.UI.uiConfig.miniMapHeight);
        this._paperMap.setViewBox(-500, -500, 4000, 4000);

        this._miniMapRect = this._paperMap.rect(0, 0, 10, 10).attr({
            "stroke": "#666",
            "fill": "#1a1a1a",
            "stroke-width": 1
        });

        $("#minimap svg").on("mousemove touchmove", this._dragMiniMap.bind(this));
        $("#minimap svg").on("mousedown", this._dragMiniMap.bind(this));
    }
};

CABLES.UI.PatchViewBox.prototype.getX = function ()
{
    return this._viewBox.x;
};
CABLES.UI.PatchViewBox.prototype.getY = function ()
{
    return this._viewBox.y;
};

CABLES.UI.PatchViewBox.prototype.getCenterX = function ()
{
    return this._viewBox.x + this._viewBox.w / 2;
};

CABLES.UI.PatchViewBox.prototype.getCenterY = function ()
{
    return this._viewBox.y + this._viewBox.h / 2;
};

CABLES.UI.PatchViewBox.prototype.setXY = function (x, y)
{
    this._viewBox.x = x;
    this._viewBox.y = y;
    this.update();
};

CABLES.UI.PatchViewBox.prototype.set = function (x, y, w, h)
{
    this._viewBox.x = x;
    this._viewBox.y = y;
    this._viewBox.w = w;
    this._viewBox.h = h;
    this.update();
};

CABLES.UI.PatchViewBox.prototype.getMiniMapPaper = function ()
{
    return this._paperMap;
};

CABLES.UI.PatchViewBox.prototype._fixAspectRatio = function (vb)
{
    vb = vb || this._viewBox;

    if (this._elePatch.offsetWidth != 0)
        if (vb.w / vb.h != this._elePatch.offsetWidth / this._elePatch.offsetHeight)
            if (vb.w > vb.h) vb.h = vb.w * (this._elePatch.offsetHeight / this._elePatch.offsetWidth);
            else vb.w = vb.h * (this._elePatch.offsetWidth / this._elePatch.offsetHeight);

    return vb;
};

CABLES.UI.PatchViewBox.prototype._setDefaultViewbox = function ()
{
    if (!this._showingNavHelperEmpty)
    {
        this._showingNavHelperEmpty = true;
        this._eleNavHelperEmpty.style.display = "block";
        this.set(-200, -200, 400, 400);
    }
};

CABLES.UI.PatchViewBox.prototype._updateNavHelper = function ()
{
    const perf = CABLES.uiperf.start("PatchViewBox._updateNavHelper");

    if (this._patch.getNumOps() == 0)
    {
        this._setDefaultViewbox();
        setTimeout(function ()
        {
            gui.patch().updateViewBox();
        }, 500);

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

    if (gui.patch().currentPatchBounds)
    {
        let showHelper = false;
        if (this._viewBox.x < gui.patch().currentPatchBounds.x - this._viewBox.w) showHelper = true;
        else if (this._viewBox.x > gui.patch().currentPatchBounds.x + gui.patch().currentPatchBounds.w) showHelper = true;
        else if (this._viewBox.y > gui.patch().currentPatchBounds.y + gui.patch().currentPatchBounds.h) showHelper = true;
        else if (this._viewBox.y < gui.patch().currentPatchBounds.y - this._viewBox.h) showHelper = true;

        if (showHelper || this._viewBox.w > 20000 || this._viewBox.w < 30)
        {
            this._eleNavHelper.style.display = "block";
            this._showingNavHelper = true;
        }
        else
        {
            if (this._showingNavHelper)
            {
                this._eleNavHelper.style.display = "none";
            }
        }
    }

    perf.finish();
};

CABLES.UI.PatchViewBox.prototype._update = function ()
{
    this._isUpdating = true;
    setTimeout(() =>
    {
        const perf = CABLES.uiperf.start("PatchViewBox.update");

        if (isNaN(this._viewBox.x)) console.warn("viewbox x NaN");
        if (isNaN(this._viewBox.y)) console.warn("viewbox y NaN");
        if (isNaN(this._viewBox.w)) console.warn("viewbox w NaN");
        if (isNaN(this._viewBox.h)) console.warn("viewbox h NaN");

        this._paperPatch.setViewBox(this._viewBox.x, this._viewBox.y, this._viewBox.w, this._viewBox.h);

        this._updateNavHelper();

        if (this._miniMapRect)
        {
            this._miniMapRect.attr("x", this._viewBox.x);
            this._miniMapRect.attr("y", this._viewBox.y);
            this._miniMapRect.attr("width", this._viewBox.w);
            this._miniMapRect.attr("height", this._viewBox.h);
        }

        this._lastUpdate = performance.now();
        this._updateTimeout = null;
        this._isUpdating = false;
        perf.finish();
    }, 2);
};

CABLES.UI.PatchViewBox.prototype.update = function ()
{
    const diff = performance.now() - this._lastUpdate;

    const delay = 50;
    // if(this._isUpdating)console.log("is still updating");

    if (diff < delay || this._isUpdating)
    {
        // console.log("update delayed...")
        if (!this._updateTimeout) this._updateTimeout = setTimeout(this._update.bind(this), delay / 2);
        return;
    }

    this._update();
};

CABLES.UI.PatchViewBox.prototype.centerSelectedOps = function ()
{
    const bounds = this._patch.getSelectionBounds();
    this.animate(bounds.x, bounds.y, bounds.w, bounds.h);
};

CABLES.UI.PatchViewBox.prototype.centerAllOps = function ()
{
    if (this._patch.getNumOps() == 0)
    {
        this._setDefaultViewbox();
        return;
    }

    const bounds = this._patch.getSubPatchBounds();
    this.animate(bounds.x, bounds.y, bounds.w, bounds.h);
};

CABLES.UI.PatchViewBox.prototype.bindWheel = function (ele)
{
    ele[0].addEventListener("wheel", (event) =>
    {
        if (!event)
        {
            console.log("mousewheel no event problem 2");
            return;
        }

        gui.pauseProfiling();

        const wm = CABLES.UI.userSettings.get("wheelmode");
        if (!wm)
        {
            if (this._isFirefox && event.deltaMode != undefined) // firefox !!
            {
                this.touchpadMode = !event.deltaMode;
            }
            else if (event.deltaY % 1 === 0)
            {
                this.touchpadMode = true;
            }
            else
            {
                this.touchpadMode = false;
            }

            if (this._isWindows || this._isLinux)
            {
                this.touchpadMode = false;
            }
        }
        else if (wm == 1) this.touchpadMode = false;
        else this.touchpadMode = true;


        let wheelMultiplier = CABLES.UI.userSettings.get("wheelmultiplier") || 1;

        if (this.touchpadMode && !event.metaKey && !event.altKey && !event.ctrlKey)
        {
            if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) event.deltaY *= 0.5;
            else event.deltaX *= 0.5;

            this._viewBox.x += event.deltaX;
            this._viewBox.y += event.deltaY;
            this.update();

            event.preventDefault();
            event.stopImmediatePropagation();

            return;
        }

        let delta = event.deltaY;
        if (!event.ctrlKey) delta = CGL.getWheelSpeed(event);

        event = CABLES.mouseEvent(event);
        if (!event) console.log("mousewheel event problem");

        wheelMultiplier *= -1;
        if (event.ctrlKey) wheelMultiplier *= 0.1; // pinch zoom gesture!!

        if (event.altKey)
        {
            this.set(
                this._viewBox.x,
                this._viewBox.y - delta,
                this._viewBox.w,
                this._viewBox.h,
            );
        }
        else if (event.shiftKey)
        {
            delta *= wheelMultiplier;

            this.set(
                this._viewBox.x - delta,
                this._viewBox.y,
                this._viewBox.w,
                this._viewBox.h,
            );
        }
        else
        {
            if (delta < 0) delta = 1.0 - 0.2 * wheelMultiplier;
            else delta = 1 + 0.2 * wheelMultiplier;

            this.zoom(delta);
        }
        if (event.ctrlKey || event.altKey || event.metaKey) // disable chrome pinch/zoom gesture
        {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    });
};

CABLES.UI.PatchViewBox.prototype.zoom = function (delta)
{
    if (delta == 0) return;

    const patchWidth = this._elePatch.offsetWidth;
    const patchHeight = this._elePatch.offsetHeight;

    if (this._zoom == null)
    {
        this._zoom = patchWidth / this._viewBox.w;
        this._viewBox.h = this._viewBox.w * (this._elePatch.offsetHeight / this._elePatch.offsetWidth);
    }

    const oldx = (event.clientX - this._elePatch.offsetLeft);
    const oldy = (event.clientY - this._elePatch.offsetTop);
    const x = (this._viewBox.x) + Number(oldx / this._zoom);
    const y = (this._viewBox.y) + Number(oldy / this._zoom);

    this._zoom = ((this._zoom || 1) * delta) || 1;

    this.set(
        x - (oldx / this._zoom),
        y - (oldy / this._zoom),
        patchWidth / this._zoom,
        patchHeight / this._zoom
    );
};


CABLES.UI.PatchViewBox.prototype.zoomStep = function (dir)
{
    const amount = dir * 80;

    this.animate(
        this._viewBox.x - amount,
        this._viewBox.y - amount,
        this._viewBox.w + amount * 2,
        this._viewBox.h + amount * 2
    );
};

CABLES.UI.PatchViewBox.prototype._dragMiniMap = function (e)
{
    e = CABLES.mouseEvent(e);

    if (e.buttons == CABLES.UI.MOUSE_BUTTON_LEFT)
    {
        const px = e.offsetX / CABLES.UI.uiConfig.miniMapWidth;
        const py = e.offsetY / CABLES.UI.uiConfig.miniMapHeight;

        this._viewBox.x = (px * this._viewBoxMiniMap.w);
        this._viewBox.y = (py * this._viewBoxMiniMap.h);

        this.update();
    }
};

CABLES.UI.PatchViewBox.prototype.setMinimapBounds = function ()
{
    if (!this._paperMap) return;

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
    this.set(this._viewBoxAnim.x.getValue(t), this._viewBoxAnim.y.getValue(t), this._viewBoxAnim.w.getValue(t), this._viewBoxAnim.h.getValue(t));

    if (!this._viewBoxAnim.x.isFinished(t)) setTimeout(this._animViewBox.bind(this), 30);
};

CABLES.UI.PatchViewBox.prototype.animate = function (x, y, w, h)
{
    const duration = 0.25;

    this._zoom = null;
    this._viewBoxAnim.start = performance.now();
    this._viewBoxAnim.x.defaultEasing = this._viewBoxAnim.y.defaultEasing = this._viewBoxAnim.w.defaultEasing = this._viewBoxAnim.h.defaultEasing = CABLES.EASING_CUBIC_OUT;

    this._viewBoxAnim.x.clear();
    this._viewBoxAnim.y.clear();
    this._viewBoxAnim.w.clear();
    this._viewBoxAnim.h.clear();

    this._viewBoxAnim.x.setValue(0, this._viewBox.x);
    this._viewBoxAnim.y.setValue(0, this._viewBox.y);
    this._viewBoxAnim.w.setValue(0, this._viewBox.w);
    this._viewBoxAnim.h.setValue(0, this._viewBox.h);

    let newvb = { x, y, w, h };

    newvb = this._fixAspectRatio(newvb);

    this._viewBoxAnim.x.setValue(duration, newvb.x);
    this._viewBoxAnim.y.setValue(duration, newvb.y);
    this._viewBoxAnim.w.setValue(duration, newvb.w);
    this._viewBoxAnim.h.setValue(duration, newvb.h);

    this._animViewBox();
};

CABLES.UI.PatchViewBox.prototype.center = function (x, y)
{
    const p = document.getElementById("splitterMaintabs").getBoundingClientRect().left / document.getElementById("patch").getBoundingClientRect().width;

    // console.log(
    //     document.getElementById("splitterMaintabs").getBoundingClientRect().left,
    //     document.getElementById("patch").getBoundingClientRect().width);

    const offX = p * this._viewBox.w / 2;

    this.animate(x - this._viewBox.w / 2 - offX, y - this._viewBox.h / 2, this._viewBox.w, this._viewBox.h);
};

CABLES.UI.PatchViewBox.prototype.centerIfNotVisible = function (opui)
{
    if (
        opui.getPosX() < this._viewBox.x ||
        opui.getPosX() + opui.getWidth() > this._viewBox.x + this._viewBox.w ||
        opui.getPosY() < this._viewBox.y ||
        opui.getPosY() + opui.getHeight() > this._viewBox.y + this._viewBox.h
    )
    {
        this.center(opui.getPosX(), opui.getPosY());
    }
};


CABLES.UI.PatchViewBox.prototype.deSerialize = function (o)
{
    this.set(o.x, o.y, o.w, o.h);
};

CABLES.UI.PatchViewBox.prototype.serialize = function ()
{
    return {
        "x": this._viewBox.x,
        "y": this._viewBox.y,
        "w": this._viewBox.w,
        "h": this._viewBox.h
    };
};
