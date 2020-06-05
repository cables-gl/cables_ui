// import { vec3, mat4 } from "gl-matrix";
// todo: this is optional?

const htmlLine = function (parentElement, color)
{
    let line = null;

    function createLineElement(x, y, length, angle)
{
        line = document.createElement("div");
        let styles = "border: 1px solid " + color + "; " +
                   "width: " + length + "px; " +
                   "height: 0px; " +
                   "-moz-transform: rotate(" + angle + "rad); " +
                   "-webkit-transform: rotate(" + angle + "rad); " +
                   "-o-transform: rotate(" + angle + "rad); " +
                   "-ms-transform: rotate(" + angle + "rad); " +
                   "position: absolute; " +
                   "top: " + y + "px; " +
                   "left: " + x + "px; ";
        line.setAttribute("style", styles);
        line.classList.add("gizmoline");
        return line;
    }

    function setPos(x, y, length, angle)
{
        line.style.width = length + "px";
        line.style.top = y + "px";
        line.style.left = x + "px";
        line.style["-moz-transform"] = "rotate(" + angle + "rad)";
        line.style["-webkit-transform"] = "rotate(" + angle + "rad)";
        line.style["-o-transform"] = "rotate(" + angle + "rad)";
        line.style["-ms-transform"] = "rotate(" + angle + "rad)";
        // line.setAttribute('style');
    }

    this.set = function (x1, y1, x2, y2)
    {
        let a = x1 - x2,
            b = y1 - y2,
            c = Math.sqrt(a * a + b * b);

        let sx = (x1 + x2) / 2,
            sy = (y1 + y2) / 2;

        let x = sx - c / 2,
            y = sy;

        let alpha = Math.PI - Math.atan2(-b, a);

        setPos(x, y, c, alpha);
    };

    this.hide = function ()
    {
        if (line) line.style.display = "none";
    };

    this.show = function ()
    {
        if (line) line.style.display = "block";
    };

    parentElement.appendChild(createLineElement(100, 100, 200, 200));
    this.hide();

    // this._eleCenter = document.createElement('div');
    // this._eleCenter.id="gizmo";
    // this._eleCenter.style.background="#fff";
    // this._eleCenter.style.opacity="0.5";
    // this._eleCenter.classList.add('gizmo');
    // container.appendChild(this._eleCenter);
    // document.body.appendChild(createLineElement(100, 100, 200, 200));
};

CABLES.Gizmo = function (cgl)
{
    this._cgl = cgl;
    this._eleCenter = null;
    this._eleX = null;
    this._eleY = null;

    this._params = null;
    this._origValue = 0;
    this._dragSum = 0;
    this._dir = 1;
};

CABLES.Gizmo.prototype.getDir = function (x2, y2)
{
    let xd = this._params.x - x2;
    let yd = this._params.y - y2;
    let dist = (xd + yd) / 2;

    // console.log('dist',dist);
    if (dist < 0) return 1;
    return -1;
};

CABLES.Gizmo.tempParams = {};

CABLES.Gizmo.prototype.set = function (params)
{
    if (!params) return this.setParams(params);

    let cgl = this._cgl;
    cgl.pushModelMatrix();
    function toScreen(trans)
    {
        let vp = cgl.getViewPort();
        let x = vp[2] - (vp[2] * 0.5 - (trans[0] * vp[2] * 0.5) / trans[2]);
        let y = vp[3] - (vp[3] * 0.5 + (trans[1] * vp[3] * 0.5) / trans[2]);

        return { x, y };
    }

    function distance(x1, y1, x2, y2)
    {
        let xd = x2 - x1;
        let yd = y2 - y1;
        return Math.sqrt(xd * xd + yd * yd);
    }

    let m = mat4.create();
    let pos = vec3.create();
    let trans = vec3.create();
    let transX = vec3.create();
    let transY = vec3.create();
    let transZ = vec3.create();

    mat4.translate(cgl.mvMatrix, cgl.mvMatrix, [params.posX.get(), params.posY.get(), params.posZ.get()]);
    mat4.multiply(m, cgl.vMatrix, cgl.mvMatrix);

    vec3.transformMat4(pos, [0, 0, 0], m);
    vec3.transformMat4(trans, pos, cgl.pMatrix);
    let zero = toScreen(trans);

    // normalize distance to gizmo handles
    vec3.transformMat4(pos, [1, 0, 0], m);
    vec3.transformMat4(transX, pos, cgl.pMatrix);
    let screenDist = toScreen(transX);
    let d1 = distance(zero.x, zero.y, screenDist.x, screenDist.y);

    vec3.transformMat4(pos, [0, 1, 0], m);
    vec3.transformMat4(transX, pos, cgl.pMatrix);
    screenDist = toScreen(transX);
    let d2 = distance(zero.x, zero.y, screenDist.x, screenDist.y);

    vec3.transformMat4(pos, [0, 0, 1], m);
    vec3.transformMat4(transX, pos, cgl.pMatrix);
    screenDist = toScreen(transX);
    let d3 = distance(zero.x, zero.y, screenDist.x, screenDist.y);

    let d = Math.max(d3, Math.max(d1, d2));
    let w = (1 / (d + 0.00000001)) * 50;
    this._multi = w;

    vec3.transformMat4(pos, [w, 0, 0], m);
    vec3.transformMat4(transX, pos, cgl.pMatrix);

    vec3.transformMat4(pos, [0, w, 0], m);
    vec3.transformMat4(transY, pos, cgl.pMatrix);

    vec3.transformMat4(pos, [0, 0, w], m);
    vec3.transformMat4(transZ, pos, cgl.pMatrix);

    let screenX = toScreen(transX);
    let screenY = toScreen(transY);
    let screenZ = toScreen(transZ);

    cgl.popModelMatrix();

    CABLES.Gizmo.tempParams.x = zero.x;
    CABLES.Gizmo.tempParams.y = zero.y;
    CABLES.Gizmo.tempParams.xx = screenX.x;
    CABLES.Gizmo.tempParams.xy = screenX.y;
    CABLES.Gizmo.tempParams.yx = screenY.x;
    CABLES.Gizmo.tempParams.yy = screenY.y;
    CABLES.Gizmo.tempParams.zx = screenZ.x;
    CABLES.Gizmo.tempParams.zy = screenZ.y;

    CABLES.Gizmo.tempParams.coord = trans;
    CABLES.Gizmo.tempParams.coordX = transX;
    CABLES.Gizmo.tempParams.coordY = transY;
    CABLES.Gizmo.tempParams.coordZ = transZ;

    CABLES.Gizmo.tempParams.posX = params.posX;
    CABLES.Gizmo.tempParams.posY = params.posY;
    CABLES.Gizmo.tempParams.posZ = params.posZ;
    CABLES.Gizmo.tempParams.dist = w;

    this.setParams(CABLES.Gizmo.tempParams);
};

CABLES.Gizmo.prototype.setParams = function (params)
{
    this._params = params;

    if (!this._eleCenter)
    {
        let container = this._cgl.canvas.parentElement;

        this._eleCenter = document.createElement("div");
        this._eleCenter.id = "gizmo";

        this._eleCenter.style.background = "#fff";
        this._eleCenter.style.opacity = "0.9";
        // this._eleCenter.style['border-radius']="1130px";
        // this._eleCenter.style.transform='scale(2)';
        this._eleCenter.classList.add("gizmo");
        container.appendChild(this._eleCenter);

        this._eleX = document.createElement("div");
        this._eleX.id = "gizmo";
        this._eleX.style.background = "#f00";
        this._eleX.classList.add("gizmo");
        container.appendChild(this._eleX);

        this._eleY = document.createElement("div");
        this._eleY.id = "gizmo";
        this._eleY.style.background = "#0f0";
        this._eleY.classList.add("gizmo");
        container.appendChild(this._eleY);

        this._eleZ = document.createElement("div");
        this._eleZ.id = "gizmo";
        this._eleZ.style.background = "#00f";
        this._eleZ.classList.add("gizmo");
        container.appendChild(this._eleZ);

        this.lineX = new htmlLine(container, "#f00");
        this.lineY = new htmlLine(container, "#0f0");
        this.lineZ = new htmlLine(container, "#00f");

        this._eleX.addEventListener(
            "mousedown",
            () =>
            {
                if (!this._params) return;
                this._draggingPort = this._params.posX;
                this._origValue = this._params.posX.get();
                this._dragSum = 0;
                this.dragger(this._eleCenter);

                this._dir = this.getDir(this._params.xx, this._params.xy);
            },
        );

        this._eleY.addEventListener(
            "mousedown",
            () =>
            {
                if (!this._params) return;
                this._draggingPort = this._params.posY;
                this._origValue = this._params.posY.get();
                this._dragSum = 0;
                this.dragger(this._eleCenter);

                this._dir = this.getDir(this._params.yx, this._params.yy);
            },
        );

        this._eleZ.addEventListener(
            "mousedown",
            () =>
            {
                if (!this._params) return;
                this._draggingPort = this._params.posZ;
                this._origValue = this._params.posZ.get();
                this._dragSum = 0;
                this.dragger(this._eleCenter);
                this._dir = this.getDir(this._params.zx, this._params.zy);
            },
        );
    }

    if (!params)
    {
        let self = this;
        setTimeout(() =>
        {
            self._eleCenter.style.display = "none";
            self._eleX.style.display = "none";
            self._eleZ.style.display = "none";
            self._eleY.style.display = "none";

            self.lineX.hide();
            self.lineZ.hide();
            self.lineY.hide();
        }, 1);
        return;
    }

    this.lineX.show();
    this.lineZ.show();
    this.lineY.show();

    this._eleCenter.style.display = "block";
    this._eleCenter.style.left = params.x + "px";
    this._eleCenter.style.top = params.y + "px";

    this._eleX.style.display = "block";
    this._eleX.style.left = params.xx + "px";
    this._eleX.style.top = params.xy + "px";

    this._eleY.style.display = "block";
    this._eleY.style.left = params.yx + "px";
    this._eleY.style.top = params.yy + "px";

    this._eleZ.style.display = "block";
    this._eleZ.style.left = params.zx + "px";
    this._eleZ.style.top = params.zy + "px";

    this.lineX.set(params.x, params.y, params.xx, params.xy);
    this.lineY.set(params.x, params.y, params.yx, params.yy);
    this.lineZ.set(params.x, params.y, params.zx, params.zy);
};

CABLES.Gizmo.prototype.dragger = function (el)
{
    let isDown = false;
    let self = this;
    let incMode = 0;

    function keydown(e) {}

    function down(e)
    {
        if (CABLES.UI) gui.setStateUnsaved();
        isDown = true;
        document.addEventListener("pointerlockchange", lockChange, false);
        document.addEventListener("mozpointerlockchange", lockChange, false);
        document.addEventListener("webkitpointerlockchange", lockChange, false);
        document.addEventListener("keydown", keydown, false);
        el.requestPointerLock = el.requestPointerLock || el.mozRequestPointerLock || el.webkitRequestPointerLock;
        if (el.requestPointerLock) el.requestPointerLock();
    }

    function up(e)
    {
        if (CABLES.UI) gui.setStateUnsaved();
        isDown = false;
        document.removeEventListener("pointerlockchange", lockChange, false);
        document.removeEventListener("mozpointerlockchange", lockChange, false);
        document.removeEventListener("webkitpointerlockchange", lockChange, false);
        document.removeEventListener("keydown", keydown, false);

        if (document.exitPointerLock) document.exitPointerLock();

        $(document).unbind("mouseup", up);
        $(document).unbind("mousedown", down);

        document.removeEventListener("mousemove", move, false);

        if (CABLES.UI) gui.opParams.show(self._draggingPort.parent);
    }

    function move(e)
    {
        if (CABLES.UI) gui.setStateUnsaved();
        let v = (e.movementY + e.movementX) * (self._dir * ((self._multi || 1) / 100));
        if (e.shiftKey) v *= 0.025;
        self._dragSum += v;
        self._draggingPort.set(self._origValue + self._dragSum);
    }

    function lockChange(e)
    {
        if (document.pointerLockElement === el || document.mozPointerLockElement === el || document.webkitPointerLockElement === el)
        {
            document.addEventListener("mousemove", move, false);
        }
        else
        {
            // escape clicked...
            self._draggingPort.set(self._origValue);
            up();
        }
    }

    $(document).bind("mouseup", up);
    $(document).bind("mousedown", down);
};

// export { Gizmo, htmlLine };
