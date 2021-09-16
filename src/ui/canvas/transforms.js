
var CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.TransformsIcon = class
{
    constructor(cgl, id)
    {
        this._cgl = cgl;
        this._pos = vec3.create();
        this._screenPos = vec2.create();
        this._id = id;
        this.lastUpdate = performance.now();

        const container = cgl.canvas.parentElement;

        this._eleCenter = document.createElement("div");

        // this._eleCenter.style.background = "#f00";
        // this._eleCenter.style.opacity = "0.9";
        // this._eleCenter.innerHTML="X";

        this._eleCenter.classList.add("transformSpot");
        container.appendChild(this._eleCenter);

        this._eleCenter.addEventListener("click", () =>
        {
            const op = gui.corePatch().getOpById(id);
            if (!op) return;
            gui.patch().setCurrentSubPatch(op.uiAttribs.subPatch || 0);
            gui.patchView.centerSelectOp(id);
            gui.patch().getViewBox().center(op.uiAttribs.translate.x, op.uiAttribs.translate.y);
            gui.patch().setSelectedOpById(id);

            gui.patchView.focus();
        });
    }

    update()
    {
        this.lastUpdate = performance.now();
        this._updateScreenPos();
        this._eleCenter.style.left = this._screenPos[0] + "px";
        this._eleCenter.style.top = this._screenPos[1] + "px";
    }

    setPos(x, y, z)
    {
        vec3.set(this._pos, x, y, z);
        this.update();
    }

    _updateScreenPos()
    {
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
        this._eleCenter.remove();
    }
};

CABLES.UI.TransformsOverlay = class
{
    constructor()
    {
        this._transforms = {};
        this._lastCheck = 0;
    }

    add(cgl, id, x, y, z)
    {
        this._transforms[id] = this._transforms[id] || new CABLES.UI.TransformsIcon(cgl, id);
        this._transforms[id].setPos(x, y, z);

        if (performance.now() - this._lastCheck > 50)
        {
            for (const i in this._transforms)
            {
                if (performance.now() - this._transforms[i].lastUpdate > 100)
                {
                    this._transforms[i].dispose();
                    delete this._transforms[i];
                }
            }

            this._lastCheck = performance.now();
        }
    }

    setVisible(b)
    {
        if (!b)
            for (const i in this._transforms)
            {
                this._transforms[i].dispose();
                delete this._transforms[i];
            }
    }
};
