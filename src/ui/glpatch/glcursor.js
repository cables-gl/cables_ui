import { Events } from "cables-shared-client";
import platform from "platform";
import { gui } from "../gui.js";

export default class GlCursor extends Events
{
    constructor(glPatch, instancer, clientId)
    {
        super();

        this.isAnimated = clientId !== undefined;
        this._animX = new CABLES.Anim();
        this._animY = new CABLES.Anim();

        this._animX.defaultEasing = this._animY.defaultEasing = CABLES.ANIM.EASING_CUBIC_OUT;

        this._glPatch = glPatch;
        this._instancer = instancer;
        this._cursorRect = this._instancer.createRect();
        this._cursorRect.setSize(10, 10);
        this._cursorRect.setShape(5);
        this._lastMovement = performance.now();

        this._subPatch = 0;
        this._clientId = clientId;
        this._userId = null;

        this._avatarEle = document.createElement("div");
        this._avatarEle.classList.add("cursorAvatar");

        this._avatarEle.style.display = "none";
        this._avatarEle.style["background-size"] = "100%";

        document.body.appendChild(this._avatarEle);

        this._cursorRect.setColor(1, 1, 1, 1);

        gui.on("multiUserSubpatchChanged", (_clientId, _subPatch) =>
        {
            this._subPatch = _subPatch;

            if (_clientId == this._clientId)
            {
                this.updateAnim();
            }
        });
    }

    setSubpatch(_subPatch)
    {
        this._subPatch = _subPatch;
        this.updateAnim();
    }

    updateAnim()
    {
        if (this.isAnimated)
        {
            let x = this._animX.getValue(this._glPatch.time);
            let y = this._animY.getValue(this._glPatch.time);

            this._cursorRect.setPosition(x, y);

            const coord = this._glPatch.viewBox.patchToScreenCoords(x, y);

            if (!this._userId || coord[0] < 0 || coord[1] < 0 || coord[0] > this._glPatch.viewBox.width || coord[1] > this._glPatch.viewBox.height) this._avatarEle.style.display = "none";

            this._avatarEle.style.top = (coord[1] + 4) + "px";
            this._avatarEle.style.left = (coord[0] + 15) + "px";
        }

        if (performance.now() - this._lastMovement > 10000 || gui.patchView.getCurrentSubPatch() != this._subPatch)
        {
            this._avatarEle.style.display = "none";
            this._cursorRect.visible = false;
        }
        else
        {
            if (this._userId) this._avatarEle.style.display = "block";
            this._cursorRect.visible = true;
        }
    }

    setColor(r, g, b, a) { this._cursorRect.setColor(1, 1, 1, 1); }

    get visible() { return this._cursorRect.visible; }

    set visible(v) { this._cursorRect.visible = v; }

    setSize(w, h) { this._cursorRect.setSize(w, h); }

    setPosition(x, y)
    {
        this._lastMovement = performance.now();
        if (!this.isAnimated) this._cursorRect.setPosition(x, y);
        else
        {
            this._animX.clear(this._glPatch.time);
            this._animY.clear(this._glPatch.time);
            const netCursorDelay = gui.socket ? gui.socket.netMouseCursorDelay / 1000 : 0;
            this._animX.setValue(this._glPatch.time + netCursorDelay, x);
            this._animY.setValue(this._glPatch.time + netCursorDelay, y);
            this.updateAnim();
        }

        if (gui.socket && !this._userId)
        {
            this._userId = gui.socket.state.getUserId(this._clientId);
            if (this._userId) this._avatarEle.style["background-image"] = "url(" + platform.getCablesUrl() + "/api/avatar/" + this._userId + ")";
        }
    }

    dispose()
    {
        if (this._cursorRect) this._cursorRect.dispose();
        if (this._avatarEle) this._avatarEle.remove();
    }
}
