export default class Gizmo
{
    constructor(cgl)
    {
        this._cgl = cgl;
        this._eleCenter = null;
        this._eleX = null;
        this._eleY = null;

        this._params = null;
        this._origValue = 0;
        this._dragSum = 0;
        this._dir = 1;
        this.hidden = true;
    }

    getDir(x2, y2)
    {
        const xd = this._params.x - x2;
        const yd = this._params.y - y2;
        const dist = (xd + yd) / 2;

        if (dist < 0) return 1;
        return -1;
    }

    set(params)
    {
        if (!params) return this.setParams(params);

        const cgl = this._cgl;
        if (!cgl) return;
        cgl.pushModelMatrix();
        function toScreen(trans)
        {
            const vp = cgl.getViewPort();
            const x = vp[2] - (vp[2] * 0.5 - (trans[0] * vp[2] * 0.5) / trans[2]);
            const y = vp[3] - (vp[3] * 0.5 + (trans[1] * vp[3] * 0.5) / trans[2]);

            return { "x": x, "y": y };
        }

        function distance(x1, y1, x2, y2)
        {
            const xd = x2 - x1;
            const yd = y2 - y1;
            return Math.sqrt(xd * xd + yd * yd);
        }

        const m = mat4.create();
        const pos = vec3.create();
        const trans = vec3.create();
        const transX = vec3.create();
        const transY = vec3.create();
        const transZ = vec3.create();
        const identVec = vec3.create();

        mat4.translate(cgl.mvMatrix, cgl.mvMatrix, [params.posX.get(), params.posY.get(), params.posZ.get()]);
        mat4.multiply(m, cgl.vMatrix, cgl.mvMatrix);

        vec3.transformMat4(pos, identVec, m);

        let tempParams = {};

        if (pos[2] > 0)
        {
            tempParams = null;
        }
        else
        {
            vec3.transformMat4(trans, pos, cgl.pMatrix);
            const zero = toScreen(trans);

            // normalize distance to gizmo handles
            vec3.transformMat4(pos, [1, 0, 0], m);
            vec3.transformMat4(transX, pos, cgl.pMatrix);
            let screenDist = toScreen(transX);
            const d1 = distance(zero.x, zero.y, screenDist.x, screenDist.y);

            vec3.transformMat4(pos, [0, 1, 0], m);
            vec3.transformMat4(transX, pos, cgl.pMatrix);
            screenDist = toScreen(transX);
            const d2 = distance(zero.x, zero.y, screenDist.x, screenDist.y);

            vec3.transformMat4(pos, [0, 0, 1], m);
            vec3.transformMat4(transX, pos, cgl.pMatrix);
            screenDist = toScreen(transX);
            const d3 = distance(zero.x, zero.y, screenDist.x, screenDist.y);

            const d = Math.max(d3, Math.max(d1, d2));
            const w = (1 / (d + 0.00000001)) * 50;
            this._multi = w;

            vec3.transformMat4(pos, [w, 0, 0], m);
            vec3.transformMat4(transX, pos, cgl.pMatrix);

            vec3.transformMat4(pos, [0, w, 0], m);
            vec3.transformMat4(transY, pos, cgl.pMatrix);

            vec3.transformMat4(pos, [0, 0, w], m);
            vec3.transformMat4(transZ, pos, cgl.pMatrix);

            const screenX = toScreen(transX);
            const screenY = toScreen(transY);
            const screenZ = toScreen(transZ);

            // console.log(screenZ);


            tempParams.x = zero.x;
            tempParams.y = zero.y;
            tempParams.xx = screenX.x;
            tempParams.xy = screenX.y;
            tempParams.yx = screenY.x;
            tempParams.yy = screenY.y;
            tempParams.zx = screenZ.x;
            tempParams.zy = screenZ.y;

            tempParams.coord = trans;
            tempParams.coordX = transX;
            tempParams.coordY = transY;
            tempParams.coordZ = transZ;

            tempParams.posX = params.posX;
            tempParams.posY = params.posY;
            tempParams.posZ = params.posZ;
            tempParams.dist = w;
        }

        cgl.popModelMatrix();

        this.setParams(tempParams);
    }

    setParams(params)
    {
        this._params = params;
        if (!this._cgl) return;
        if (!this._eleCenter)
        {
            const container = this._cgl.canvas.parentElement;
            if (!container) return;

            this._eleCenter = document.createElement("div");
            this._eleCenter.id = "gizmo";

            this._eleCenter.style.background = "#fff";
            this._eleCenter.style.display = "none";
            this._eleCenter.style.opacity = "0.9";
            // this._eleCenter.style['border-radius']="1130px";
            // this._eleCenter.style.transform='scale(2)';
            this._eleCenter.classList.add("gizmo");
            container.appendChild(this._eleCenter);

            this._eleX = document.createElement("div");
            this._eleX.id = "gizmo";
            this._eleX.style.background = "#f00";
            this._eleX.style.display = "none";
            this._eleX.classList.add("gizmo");
            container.appendChild(this._eleX);

            this._eleY = document.createElement("div");
            this._eleY.id = "gizmo";
            this._eleY.style.background = "#0f0";
            this._eleY.style.display = "none";
            this._eleY.classList.add("gizmo");
            container.appendChild(this._eleY);

            this._eleZ = document.createElement("div");
            this._eleZ.id = "gizmo";
            this._eleZ.style.background = "#00f";
            this._eleZ.style.display = "none";
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
            if (this.hidden) return;
            const self = this;
            setTimeout(() =>
            {
                this.hidden = true;
                this._eleCenter.style.display = "none";
                this._eleX.style.display = "none";
                this._eleZ.style.display = "none";
                this._eleY.style.display = "none";

                this.lineX.hide();
                this.lineZ.hide();
                this.lineY.hide();
            }, 1);
            return;
        }

        this.hidden = false;
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
    }

    dragger(el)
    {
        let isDown = false;
        const self = this;
        const incMode = 0;

        function keydown(e) {}

        function down(e)
        {
            // if (CABLES.UI) gui.setStateUnsaved();
            if (CABLES.UI) gui.savedState.setUnSaved("transformDown");

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
            if (self._draggingPort)
            {
                const undofunc = (function (patch, p1Name, op1Id, oldValue, newValue)
                {
                    const op = patch.getOpById(op1Id);
                    const p = op.getPortByName(p1Name);

                    CABLES.UI.undo.add({
                        "title": "move gizmo " + p.name,
                        undo()
                        {
                            p.set(oldValue);
                            gui.emitEvent("portValueEdited", op, p, oldValue);
                        },
                        redo()
                        {
                            p.set(newValue);
                            gui.emitEvent("portValueEdited", op, p, newValue);
                        }
                    });
                }(
                    self._draggingPort.parent.patch,
                    self._draggingPort.getName(),
                    self._draggingPort.parent.id,
                    self._origValue,
                    self._draggingPort.get()
                ));
            }

            // if (CABLES.UI) gui.setStateUnsaved();
            if (CABLES.UI) gui.savedState.setUnSaved("transformUp");

            isDown = false;
            document.removeEventListener("pointerlockchange", lockChange, false);
            document.removeEventListener("mozpointerlockchange", lockChange, false);
            document.removeEventListener("webkitpointerlockchange", lockChange, false);
            document.removeEventListener("keydown", keydown, false);

            if (document.exitPointerLock) document.exitPointerLock();

            document.removeEventListener("mouseup", up);
            document.removeEventListener("mousedown", down);

            document.removeEventListener("mousemove", move, false);

            if (CABLES.UI) gui.opParams.show(self._draggingPort.parent);
        }

        function move(e)
        {
            // if (CABLES.UI) gui.setStateUnsaved();
            if (CABLES.UI) gui.savedState.setUnSaved("transformMove");

            let v = (e.movementY + e.movementX) * (self._dir * ((self._multi || 1) / 100));
            if (e.shiftKey) v *= 0.025;
            self._dragSum += v;
            const newValue = self._origValue + self._dragSum;
            self._draggingPort.set(newValue);
            if (CABLES.UI) gui.emitEvent("gizmoMove", self._draggingPort.parent.id, self._draggingPort.getName(), newValue);
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

        document.addEventListener("mouseup", up);
        document.addEventListener("mousedown", down);
    }
}


const htmlLine = function (parentElement, color)
{
    let line = null;

    function createLineElement(x, y, length, angle)
    {
        line = document.createElement("div");
        const styles = "border: 1px solid " + color + "; " +
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
        line.style["z-index"] = "9999";
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

        const alpha = Math.PI - Math.atan2(-b, a);

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
};
