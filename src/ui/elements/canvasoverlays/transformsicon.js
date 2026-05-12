import { gui } from "../../gui.js";

export default class TransformsIcon
{
    #eleText = null;
    #eleCenter = null;
    #container = null;

    constructor(cgl, id)
    {
        this._cgl = cgl;
        this._pos = vec3.create();
        this._screenPos = vec2.create();
        this._id = id;
        this.lastUpdate = performance.now();

        if (!cgl || !cgl.canvas) return;
        this.#container = cgl.canvas.parentElement;
        this.#eleCenter = document.createElement("div");

        this.#eleCenter.classList.add("transformSpot");
        this.#container.appendChild(this.#eleCenter);

        this.#eleCenter.addEventListener("click", () =>
        {
            gui.transformOverlay.click(this._screenPos);
        });
    }

    get id()
    {
        return this._id;
    }

    get screenPos()
    {
        return this._screenPos;
    }

    update()
    {
        this.lastUpdate = performance.now();
        this._updateScreenPos();
        if (this.#eleCenter)
        {
            this.#eleCenter.style.left = this._screenPos[0] + "px";
            this.#eleCenter.style.top = this._screenPos[1] + "px";
        }
        if (this.#eleText)
        {
            this.#eleText.style.left = this._screenPos[0] + "px";
            this.#eleText.style.top = this._screenPos[1] + "px";
            this.#eleText.style.position = "absolute";
        }
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    setPos(x, y, z)
    {
        vec3.set(this._pos, x, y, z);
        this.update();
    }

    /**
     * @param {string} txt
     */
    setText(txt)
    {
        if (!this.#eleText)
        {
            this.#eleText = document.createElement("div");
            this.#container.appendChild(this.#eleText);
        }
        this.#eleText.innerHTML = txt;
    }

    _updateScreenPos()
    {
        if (!this._cgl) return;
        this._cgl.pushModelMatrix();

        const m = mat4.create();
        const pos = vec3.create();
        const emptyvec3 = vec3.create();
        const trans = vec3.create();

        mat4.translate(this._cgl.mvMatrix, this._cgl.mMatrix, this._pos);
        mat4.multiply(m, this._cgl.vMatrix, this._cgl.mMatrix);

        vec3.transformMat4(pos, emptyvec3, m);
        vec3.transformMat4(trans, pos, this._cgl.pMatrix);

        this._cgl.popModelMatrix();

        if (pos[2] > 0)
        {
            this._screenPos[0] = -3000;
        }
        else
        {
            const vp = this._cgl.getViewPort();
            const x = vp[2] - (vp[2] * 0.5 - (trans[0] * vp[2] * 0.5) / trans[2]);
            const y = vp[3] - (vp[3] * 0.5 + (trans[1] * vp[3] * 0.5) / trans[2]);

            this._screenPos[0] = x / this._cgl.pixelDensity;
            this._screenPos[1] = y / this._cgl.pixelDensity;
        }
    }

    dispose()
    {
        if (this.#eleCenter) this.#eleCenter.remove();
        if (this.#eleText) this.#eleText.remove();
    }
}
