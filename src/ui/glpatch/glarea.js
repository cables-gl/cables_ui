import { utils } from "cables";
import { userSettings } from "../components/usersettings.js";
import GlRect from "../gldraw/glrect.js";
import GlRectInstancer from "../gldraw/glrectinstancer.js";
import { gui } from "../gui.js";
import GlOp from "./glop.js";

export default class GlArea
{

    /** @type {GlRect} */
    #rectBg = null;

    /** @type {GlRect} */
    #rectResize = null;

    /** @type {GlOp} */
    #glop;
    #id = utils.shortId();

    #instancer;

    /**
     * @param {GlRectInstancer} instancer
     * @param {GlOp} glop
     */
    constructor(instancer, glop)
    {
        this.#instancer = instancer;

        /**
         * @private
         * @type {GlOp}
         */
        this.#glop = glop;

        /**
         * @private
         * @type {Number}
         */
        this._w = 300;

        /**
         * @private
         * @type {Number}
         */
        this._h = 200;

        /**
         * @private
         * @type {Boolean}
         */
        this._visible = true;

        /**
         * @type {GlRect}
         */
        this.#rectBg = this.#instancer.createRect({ "name": "glarea bg", "interactive": false, "draggable": false });
        this.#rectBg.setSize(this._w, this._h);
        this._updateColor();

        /**
         * @type {Number}
         */
        this.resizeCornerSize = 15;

        /**
         * @type {GlRect}
         */
        this.#rectResize = this.#instancer.createRect({ "name": "glarea resize", "interactive": true, "draggable": true });
        this.#rectResize.setShape(GlRect.SHAPE_TRIANGLE_BOTTOM);
        this.#rectResize.setSize(this.resizeCornerSize, this.resizeCornerSize);
        this.#rectResize.setColor(0, 0, 0, 0.2);
        this.#rectResize.setPosition(200 - this.resizeCornerSize, 200 - this.resizeCornerSize);
        this.#rectResize.draggable = true;
        this.#rectResize.draggableMove = true;

        this.#glop.on("drag", () =>
        {
            this.#update();
        });

        this.#rectResize.on("drag", (_e) =>
        {
            this._w = this.#rectResize.x - this.#glop.x + this.#rectResize.w / 2;
            this._h = this.#rectResize.y - this.#glop.y + this.#rectResize.h / 2;

            if (userSettings.get("snapToGrid2"))
            {
                this._w = this.#glop.glPatch.snap.snapX(this._w);
                this._h = this.#glop.glPatch.snap.snapY(this._h);
            }

            gui.savedState.setUnSaved("resizeGlArea", this.#glop.op.getSubPatch());
            this.#update();
        });

        if (this.#glop.op.uiAttribs.area)
        {
            if (this.#glop.op.uiAttribs.area.id) this.#id = this.#glop.op.uiAttribs.area.id;
            this._w = this.#glop.op.uiAttribs.area.w;
            this._h = this.#glop.op.uiAttribs.area.h;
        }

        this.#update();
    }

    /**
     * @param {boolean} v
     */
    set visible(v)
    {
        this._visible = v;
        this.#update();
    }

    /**
     * @private
     */
    #update()
    {
        if (this.#rectBg)
        {
            this.#rectBg.visible = this._visible;
            this.#rectResize.visible = this._visible;

            if (!this._visible) return;
            this.#rectBg.setPosition(
                this.#glop.x,
                this.#glop.y,
                0.1);

            this.#rectBg.setSize(this._w, this._h);

            this.#rectResize.setPosition(
                this.#glop.x + this._w - this.#rectResize.w,
                this.#glop.y + this._h - this.#rectResize.h,
                -0.1
            );
        }

        this.#glop.op.setUiAttrib({ "area": { "w": this._w, "h": this._h, "id": this.#id } });
    }

    /**
     * @private
     */
    _updateColor()
    {
        // if (this._glop.opUiAttribs.color)
        // {
        //     const cols = chroma.hex(this._glop.opUiAttribs.color).gl();
        //     cols[3] = 0.1;
        //     this._rectBg.setColorArray(cols);
        // }
        // else
        this.#rectBg.setColor(0, 0, 0, 0.08);
    }

    dispose()
    {
        this.#rectBg.dispose();
        this.#rectResize.dispose();
        this.#rectBg = null;
        this.#rectResize = null;
        return null;
    }
}
