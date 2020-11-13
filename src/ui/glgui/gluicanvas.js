CABLES = CABLES || {};
CABLES.GLGUI = CABLES.GLGUI || {};


CABLES.GLGUI.GlGuiFull = function (tabs)
{
    const views = document.getElementById("patchviews");
    const ele = document.createElement("div");

    views.appendChild(ele);
    const id = "glpatch" + views.children.length;
    ele.id = id;
    ele.classList.add("glpatchcontainer");

    const a = new CABLES.GLGUI.GlUiCanvas(CABLES.patch, ele);

    gui.patchView.setPatchRenderer(id, a.glPatch);
    gui.patchView.switch(ele.id);

    a.parentResized();

    gui.on("setLayout", () =>
    {
        a.parentResized();
    });
};


CABLES.GLGUI.GlGuiTab = function (tabs)
{
    this._tab = new CABLES.UI.Tab("GlGui", { "icon": "cube", "infotext": "tab_glgui" });
    tabs.addTab(this._tab, true);
    gui.maintabPanel.show();
    this._tab.contentEle.innerHTML = "";
    const a = new CABLES.GLGUI.GlUiCanvas(CABLES.patch, this._tab.contentEle);
    a.parentResized();

    this._tab.on("resize", () =>
    {
        a.parentResized();
    });
};

// ---------------------------------------------------------------------


CABLES.GLGUI.GlUiCanvas = class
{
    constructor(_patch, parentEle)
    {
        this._moveover = true;
        this._firstTime = true;
        this._lastTime = 0;
        this.width = 0;
        this.height = 0;
        this._mouseX = 0;
        this._mouseY = 0;
        this.loaded = false;
        this._inited = false;

        document.body.style["touch-action"] = "none";
        // this._zoom = CABLES.GLGUI.VISUALCONFIG.zoomDefault;
        // this._smoothedZoom = new CABLES.UI.ValueSmoother(this._zoom, CABLES.GLGUI.VISUALCONFIG.zoomSmooth);


        this.canvas = document.createElement("canvas");
        this.canvas.id = "glGuiCanvas-" + CABLES.uuid();
        // this.canvas.style.display='block';
        // this.canvas.style.position='absolute';
        this.canvas.style.border = "0px solid white";
        this.canvas.style.outline = "0";

        // this.canvas.style.cursor='none';
        // this.canvas.style['z-index']=9999999991;
        this.canvas.setAttribute("tabindex", 10);


        this._parentEle = parentEle;

        if (parentEle)parentEle.appendChild(this.canvas);
        else document.body.appendChild(this.canvas);

        this.patch = new CABLES.Patch(
            {
                "glCanvasId": this.canvas.id,
                "glCanvasResizeToParent": false,
                "glCanvasResizeToWindow": false
            });


        this.glPatch = new CABLES.GLGUI.GlPatch(this.patch.cgl);
        this.patchApi = new CABLES.GLGUI.GlPatchAPI(_patch, this.glPatch);
        this.patchApi.reset();


        this.patch.cgl.pixelDensity = window.devicePixelRatio;
        this.patch.cgl.updateSize();

        this.setSize(100, 100);

        this.canvas.addEventListener("mousemove", (e) =>
        {
            this.activityHigh();

            this._mouseX = e.offsetX;
            this._mouseY = e.offsetY;
            this.glPatch.needsRedraw = true;
        });

        this.canvas.addEventListener("mousedown", (e) =>
        {
            this.activityHigh();

            this.glPatch.needsRedraw = true;
            // this._mouseButton = e.buttons;
        });

        this.canvas.addEventListener("mouseup", (e) =>
        {
            this.activityHigh();
            this.glPatch.needsRedraw = true;
            // this._mouseButton = -1;
        });

        this.canvas.addEventListener("mouseleave", (e) =>
        {
            this.activityMedium();
        });

        this.canvas.addEventListener("mouseenter", (e) =>
        {
            this.activityHigh();
        });


        this.canvas.addEventListener("wheel", (event) =>
        {
            this.activityHigh();
            event.preventDefault();
            // const wheelMultiplier = CABLES.UI.userSettings.get("wheelmultiplier") || 1;

            // let delta = CGL.getWheelSpeed(event);
            // event = CABLES.mouseEvent(event);
            // delta *= wheelMultiplier;

            // if (event.altKey) this._scrollY -= delta;
            // else if (event.shiftKey) this._scrollX -= delta;
            // else this._zoom += delta * (this._zoom / 155);

            // this._zoom = Math.max(CABLES.GLGUI.VISUALCONFIG.minZoom, this._zoom);
            // this._smoothedZoom.set(this._zoom);

            // if (event.ctrlKey || event.altKey) // disable chrome pinch/zoom gesture
            // {
            //     event.preventDefault();
            //     event.stopImmediatePropagation();
            // }
        });


        this.parentResized();
        this.activityHigh();
        this.patch.addEventListener("onRenderFrame", this.render.bind(this));
    }

    get element()
    {
        return this.canvas;
    }

    parentResized()
    {
        this.setSize(this._parentEle.clientWidth, this._parentEle.clientHeight);
        this.glPatch.needsRedraw = true;
    }

    setSize(w, h)
    {
        this.width = w;
        this.height = h;
        this.canvas.style.width = w + "px";
        this.canvas.style.height = h + "px";
        this.canvas.width = w;
        this.canvas.height = h;
        this.patch.cgl.setSize(w, h);
    }

    dispose()
    {
        this.patch.removeEventListener("onRenderFrame", this.render.bind(this));
        this.patch.pause();
        this.patch.dispose();
        this.canvas.remove();
    }

    activityIdle()
    {
        this._targetFps = 10;
    }

    activityHigh()
    {
        this._targetFps = 0;
        clearTimeout(this._activityTimeout);
        this._activityTimeout = setTimeout(() => { this.activityMedium(); }, 40000);
    }

    activityMedium()
    {
        this._targetFps = 30;
        if (!this.glPatch.mouseOverCanvas) this._targetFps = 0;
        clearTimeout(this._activityTimeout);
        this._activityTimeout = setTimeout(() => { this.activityIdle(); }, 30000);
    }

    render()
    {
        if (this._targetFps != 0 && !this.glPatch.mouseOverCanvas && performance.now() - this._lastTime < 1000 / this._targetFps)
        {
            return;
        }
        const cgl = this.patch.cgl;


        cgl.gl.clearColor(0, 0, 0, 1);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);


        if (CGL.MESH.lastMesh)CGL.MESH.lastMesh.unBind();


        if (this._oldTargetFps != this._targetFps)
        {
            // console.log("target fps:",this._targetFps)
            this._oldTargetFps = this._targetFps;
        }


        cgl.renderStart(cgl);


        if (!this._inited)
        {
            for (let i = 0; i <= 8; i++) this.patch.cgl.setTexture(i, CGL.Texture.getEmptyTexture(this.patch.cgl).tex);
            this._inited = true;
        }

        if (this._firstTime)
        {
            this._firstTime = false;
        }

        cgl.gl.clearColor(
            CABLES.GLGUI.VISUALCONFIG.colors.background[0],
            CABLES.GLGUI.VISUALCONFIG.colors.background[1],
            CABLES.GLGUI.VISUALCONFIG.colors.background[2],
            CABLES.GLGUI.VISUALCONFIG.colors.background[3]);

        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);

        this.glPatch.debugData.targetFps = this._targetFps;

        this.glPatch.render(
            this.width, this.height,
            0, 0, // scroll
            0,
            0, 0, // mouse
            this._mouseButton // mouse button
        );
        if (this.glPatch.isAnimated)
        {
            this.activityHigh();
            // this._targetFps = 0;
        }

        cgl.renderEnd(cgl);
        this._lastTime = performance.now();
    }
};
