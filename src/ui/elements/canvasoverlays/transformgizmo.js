import { vec3, mat4, vec2 } from "gl-matrix";
import { Port } from "cables";
import { CglContext } from "cables-corelibs/cgl/cgl_state.js";
import { gui } from "../../gui.js";
import undo from "../../utils/undo.js";

/**
 * @typedef GizmoParams
 * @property {Port} posX
 * @property {Port} posY
 * @property {Port} posZ
 */

export default class Gizmo
{

    #params = null;
    #eleCenter = null;
    #eleX = null;
    #eleY = null;
    #eleZ = null;
    #eleXZ = null;
    #eleXY = null;
    #eleYZ = null;
    lineX = null;
    lineY = null;
    lineZ = null;

    #origValue = 0;
    #dragSum = 0;
    #dragSumY = 0;
    #dir = 1;
    hidden = true;

    static EVENT_GUI_GIZMO_MOVE = "gizmoMove";

    /**
     * @param {CglContext} cgl
     */
    constructor(cgl)
    {
        this._cgl = cgl;
    }

    dispose()
    {
        this.hidden = true;
        if (this.#eleCenter) this.#eleCenter.remove();
        if (this.#eleX) this.#eleX.remove();
        if (this.#eleY) this.#eleY.remove();
        if (this.#eleZ) this.#eleZ.remove();
        if (this.#eleXZ) this.#eleXZ.remove();
        if (this.#eleXY) this.#eleXY.remove();
        if (this.#eleYZ) this.#eleYZ.remove();
        if (this.lineX) this.lineX.remove();
        if (this.lineY) this.lineY.remove();
        if (this.lineZ) this.lineZ.remove();
    }

    /**
     * @param {number} x2
     * @param {number} y2
     */
    getDir(x2, y2)
    {
        const xd = this.#params.x - x2;
        const yd = this.#params.y - y2;
        const dist = (xd + yd) / 2;

        if (dist < 0) return 1;
        return -1;
    }

    /**
     * @param {GizmoParams} params
     */
    set(params)
    {
        if (!params) return this.setParams(params);

        const cgl = this._cgl;
        if (!cgl) return;
        cgl.pushModelMatrix();
        function toScreen(trans)
        {
            const vp = cgl.getViewPort();
            let x = vp[2] - (vp[2] * 0.5 - (trans[0] * vp[2] * 0.5) / trans[2]);
            let y = vp[3] - (vp[3] * 0.5 + (trans[1] * vp[3] * 0.5) / trans[2]);

            if (cgl.canvas.styleMarginLeft) x += cgl.canvas.styleMarginLeft;
            if (cgl.canvas.styleMarginTop) y += cgl.canvas.styleMarginTop;

            x /= cgl.pixelDensity;
            y /= cgl.pixelDensity;
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
        this.#params = params;
        if (!this._cgl) return;
        if (!this.#eleCenter)
        {
            const container = this._cgl.canvas.parentElement;
            if (!container) return;

            this.#eleCenter = document.createElement("div");
            this.#eleCenter.id = "gizmo";

            this.#eleCenter.style.background = "#fff";
            this.#eleCenter.style.display = "none";
            this.#eleCenter.style.opacity = "0.9";
            this.#eleCenter.style.pointerEvents = "none";
            // this._eleCenter.style['border-radius']="1130px";
            // this._eleCenter.style.transform='scale(2)';
            this.#eleCenter.classList.add("gizmo");
            container.appendChild(this.#eleCenter);

            this.#eleX = document.createElement("div");
            this.#eleX.id = "gizmoX";
            this.#eleX.style.background = "#f00";
            this.#eleX.style.display = "none";
            this.#eleX.classList.add("gizmo");
            container.appendChild(this.#eleX);

            this.#eleXZ = document.createElement("div");
            this.#eleXZ.id = "gizmoXZ";
            this.#eleXZ.style.background = "#f0f";
            this.#eleXZ.style.display = "none";
            this.#eleXZ.style.opacity = "0.5";
            this.#eleXZ.style.borderRadius = "0";
            this.#eleXZ.classList.add("gizmo");
            container.appendChild(this.#eleXZ);

            this.#eleXY = document.createElement("div");
            this.#eleXY.id = "gizmoXY";
            this.#eleXY.style.background = "#ff0";
            this.#eleXY.style.display = "none";
            this.#eleXY.style.opacity = "0.5";
            this.#eleXY.style.borderRadius = "0";
            this.#eleXY.classList.add("gizmo");
            container.appendChild(this.#eleXY);

            this.#eleYZ = document.createElement("div");
            this.#eleYZ.id = "gizmoYZ";
            this.#eleYZ.style.background = "#0ff";
            this.#eleYZ.style.display = "none";
            this.#eleYZ.style.opacity = "0.5";
            this.#eleYZ.style.borderRadius = "0";
            this.#eleYZ.classList.add("gizmo");
            container.appendChild(this.#eleYZ);

            this.#eleY = document.createElement("div");
            this.#eleY.id = "gizmoY";
            this.#eleY.style.background = "#0f0";
            this.#eleY.style.display = "none";
            this.#eleY.classList.add("gizmo");
            container.appendChild(this.#eleY);

            this.#eleZ = document.createElement("div");
            this.#eleZ.id = "gizmoZ";
            this.#eleZ.style.background = "#00f";
            this.#eleZ.style.display = "none";

            this.#eleZ.classList.add("gizmo");
            container.appendChild(this.#eleZ);

            this.lineX = new htmlLine(container, "#f00");
            this.lineY = new htmlLine(container, "#0f0");
            this.lineZ = new htmlLine(container, "#00f");

            this.#eleX.addEventListener(
                "pointerdown",
                () =>
                {
                    if (!this.#params) return;
                    this._draggingPort = this.#params.posX;
                    this._draggingPortY = null;
                    this.#origValue = this.#params.posX.get();
                    this.#dragSum = 0;
                    this.dragger(this.#eleCenter);

                    this.#dir = this.getDir(this.#params.xx, this.#params.xy);
                },
            );

            this.#eleY.addEventListener(
                "pointerdown",
                () =>
                {
                    if (!this.#params) return;
                    this._draggingPort = this.#params.posY;
                    this._draggingPortY = null;
                    this.#origValue = this.#params.posY.get();
                    this.#dragSum = 0;
                    this.dragger(this.#eleCenter);

                    this.#dir = this.getDir(this.#params.yx, this.#params.yy);
                },
            );

            this.#eleZ.addEventListener(
                "pointerdown",
                () =>
                {
                    if (!this.#params) return;
                    this._draggingPort = this.#params.posZ;
                    this._draggingPortY = null;
                    this.#origValue = this.#params.posZ.get();
                    this.#dragSum = 0;
                    this.dragger(this.#eleCenter);
                    this.#dir = this.getDir(this.#params.zx, this.#params.zy);
                },
            );

            this.#eleXZ.addEventListener(
                "pointerdown",
                () =>
                {
                    if (!this.#params) return;
                    this._draggingPort = this.#params.posX;
                    this._draggingPortY = this.#params.posZ;

                    this.#origValue = this.#params.posX.get();
                    this._origValueY = this.#params.posZ.get();
                    this.#dragSum = 0;
                    this.#dragSumY = 0;
                    this.dragger(this.#eleCenter);
                },
            );

            this.#eleXY.addEventListener(
                "pointerdown",
                () =>
                {
                    if (!this.#params) return;
                    this._draggingPort = this.#params.posX;
                    this._draggingPortY = this.#params.posY;

                    this.#origValue = this.#params.posX.get();
                    this._origValueY = this.#params.posY.get();

                    this.#dragSum = 0;
                    this.#dragSumY = 0;

                    // this.flipX = true;
                    this.flipY = true;

                    this.dragger(this.#eleCenter);
                },
            );
            this.#eleYZ.addEventListener(
                "pointerdown",
                () =>
                {
                    if (!this.#params) return;
                    this._draggingPort = this.#params.posZ;
                    this._draggingPortY = this.#params.posY;

                    this.#origValue = this.#params.posZ.get();
                    this._origValueY = this.#params.posY.get();
                    this.#dragSum = 0;
                    this.#dragSumY = 0;

                    this.flipY = true;
                    this.flipX = true;

                    this.dragger(this.#eleCenter);
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
                this.#eleCenter.style.display = "none";
                this.#eleXZ.style.display = "none";
                this.#eleXY.style.display = "none";
                this.#eleYZ.style.display = "none";
                this.#eleX.style.display = "none";
                this.#eleZ.style.display = "none";
                this.#eleY.style.display = "none";

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

        this.#eleCenter.style.display = "block";
        this.#eleCenter.style.left = params.x + "px";
        this.#eleCenter.style.top = params.y + "px";

        this.#eleXZ.style.display = "block";
        this.#eleXZ.style.left = (params.xx + params.zx) / 2 + "px";
        this.#eleXZ.style.top = (params.xy + params.zy) / 2 + "px";

        this.#eleXY.style.display = "block";
        this.#eleXY.style.left = (params.xx + params.yx) / 2 + "px";
        this.#eleXY.style.top = (params.xy + params.yy) / 2 + "px";

        this.#eleYZ.style.display = "block";
        this.#eleYZ.style.left = (params.zx + params.yx) / 2 + "px";
        this.#eleYZ.style.top = (params.zy + params.yy) / 2 + "px";

        this.#eleX.style.display = "block";
        this.#eleX.style.left = params.xx + "px";
        this.#eleX.style.top = params.xy + "px";

        this.#eleY.style.display = "block";
        this.#eleY.style.left = params.yx + "px";
        this.#eleY.style.top = params.yy + "px";

        this.#eleZ.style.display = "block";
        this.#eleZ.style.left = params.zx + "px";
        this.#eleZ.style.top = params.zy + "px";

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

        const down = (e) =>
        {
            if (CABLES.UI) gui.savedState.setUnSaved("transformDown", this.#params.posX.op.getSubPatch());

            isDown = true;
            document.addEventListener("pointerlockchange", lockChange, false);
            document.addEventListener("mozpointerlockchange", lockChange, false);
            document.addEventListener("webkitpointerlockchange", lockChange, false);
            document.addEventListener("keydown", keydown, false);
            el.requestPointerLock = el.requestPointerLock || el.mozRequestPointerLock || el.webkitRequestPointerLock;
            if (el.requestPointerLock) el.requestPointerLock();
        };

        const up = (e) =>
        {
            self.flipY = false;
            self.flipX = false;
            if (self._draggingPort)
            {
                const undofunc = (function (patch, p1Name, op1Id, oldValue, newValue)
                {
                    const op = patch.getOpById(op1Id);
                    const p = op.getPortByName(p1Name);

                    undo.add({
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
                    self._draggingPort.op.patch,
                    self._draggingPort.getName(),
                    self._draggingPort.op.id,
                    self.#origValue,
                    self._draggingPort.get()
                ));
            }

            if (CABLES.UI && this.#params) gui.savedState.setUnSaved("transformUp", this.#params.posX.op.getSubPatch());

            isDown = false;
            document.removeEventListener("pointerlockchange", lockChange, false);
            document.removeEventListener("mozpointerlockchange", lockChange, false);
            document.removeEventListener("webkitpointerlockchange", lockChange, false);
            document.removeEventListener("keydown", keydown, false);

            if (document.exitPointerLock) document.exitPointerLock();

            document.removeEventListener("mouseup", up);
            document.removeEventListener("pointerdown", down);

            document.removeEventListener("pointermove", move, false);

            if (CABLES.UI && self._draggingPort) gui.opParams.show(self._draggingPort.op);
        };

        const move = (e) =>
        {
            if (CABLES.UI && this.#params) gui.savedState.setUnSaved("transformMove", this.#params.posX.op.getSubPatch());

            if (self._draggingPortY)
            {
                let vX = e.movementX * ((self._multi || 1) / 100);
                let vY = e.movementY * ((self._multi || 1) / 100);

                let p = [vX, vY];
                vec2.rotate(p, p, [0, 0], -self.lineX.angle);
                vX = p[0];
                vY = p[1];

                if (self.flipY) vY *= -1;
                if (self.flipX) vX *= -1;

                if (e.shiftKey) vX *= 0.025;
                if (e.shiftKey) vY *= 0.025;
                self.#dragSum += vX;
                self.#dragSumY += vY;
                const newValue = self.#origValue + self.#dragSum;
                const newValueY = self._origValueY + self.#dragSumY;
                self._draggingPort.set(newValue);
                self._draggingPortY.set(newValueY);
                if (CABLES.UI) gui.emitEvent(Gizmo.EVENT_GUI_GIZMO_MOVE, self._draggingPort.op.id, self._draggingPort.getName(), newValue);
                if (CABLES.UI) gui.emitEvent(Gizmo.EVENT_GUI_GIZMO_MOVE, self._draggingPortY.op.id, self._draggingPortY.getName(), newValueY);
            }
            else
            {
                // one axis...
                let v = (e.movementY + e.movementX) * (self.#dir * ((self._multi || 1) / 100));
                if (e.shiftKey) v *= 0.025;
                self.#dragSum += v;
                const newValue = self.#origValue + self.#dragSum;
                self._draggingPort.set(newValue);
                if (CABLES.UI) gui.emitEvent(Gizmo.EVENT_GUI_GIZMO_MOVE, self._draggingPort.op.id, self._draggingPort.getName(), newValue);
            }
        };

        function lockChange(e)
        {
            if (document.pointerLockElement === el || document.mozPointerLockElement === el || document.webkitPointerLockElement === el)
            {
                document.addEventListener("pointermove", move, false);
            }
            else
            {
                // escape clicked...
                self._draggingPort.set(self.#origValue);
                up();
            }
        }

        document.addEventListener("mouseup", up);
        document.addEventListener("pointerdown", down);
    }
}

const htmlLine = function (parentElement, color)
{
    let line = null;
    this.angle = 0;

    function createLineElement(x, y, length, angle)
    {
        line = document.createElement("div");
        const styles = "border: 1px solid " + color + "; " +
                   "width: " + length + "px; " +
                   "height: 0px; " +
                   "transform: rotate(" + angle + "rad); " +
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
        line.style.transform = "rotate(" + angle + "rad)";
        line.style["z-index"] = "9999";
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
        this.angle = alpha;

        setPos(x, y, c, alpha);
    };

    this.remove = function ()
    {
        line.remove();
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
