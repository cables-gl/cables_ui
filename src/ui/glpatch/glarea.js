import { userSettings } from "../components/usersettings.js";
import GlRect from "../gldraw/glrect.js";
import GlRectInstancer from "../gldraw/glrectinstancer.js";
import { gui } from "../gui.js";
import GlOp from "./glop.js";

export default class GlArea
{

    /**
     * @param {GlRectInstancer} instancer
     * @param {GlOp} glop
     */
    constructor(instancer, glop)
    {
        this._instancer = instancer;

        /**
         * @private
         * @type {GlOp}
         */
        this._glop = glop;
        this._id = CABLES.shortId();

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
        this._rectBg = this._instancer.createRect({ "draggable": false });
        this._rectBg.setSize(this._w, this._h);
        this._updateColor();

        /**
         * @type {Number}
         */
        this.resizeCornerSize = 15;

        /**
         * @type {GlRect}
         */
        this._rectResize = this._instancer.createRect({ "draggable": true });
        this._rectResize.setShape(2);
        this._rectResize.setSize(this.resizeCornerSize, this.resizeCornerSize);
        this._rectResize.setColor(0, 0, 0, 0.2);
        this._rectResize.setPosition(200 - this.resizeCornerSize, 200 - this.resizeCornerSize);
        this._rectResize.draggable = true;
        this._rectResize.draggableMove = true;

        this._glop.on("drag", () =>
        {
            this._update();
        });

        this._rectResize.on("drag", (_e) =>
        {
            this._w = this._rectResize.x - this._glop.x + this._rectResize.w / 2;
            this._h = this._rectResize.y - this._glop.y + this._rectResize.h / 2;

            if (userSettings.get("snapToGrid2"))
            {
                this._w = this._glop.glPatch.snap.snapX(this._w);
                this._h = this._glop.glPatch.snap.snapY(this._h);
            }

            gui.savedState.setUnSaved("resizeGlArea", this._glop.op.getSubPatch());
            this._update();
        });

        if (this._glop.op.uiAttribs.area)
        {
            if (this._glop.op.uiAttribs.area.id) this._id = this._glop.op.uiAttribs.area.id;
            this._w = this._glop.op.uiAttribs.area.w;
            this._h = this._glop.op.uiAttribs.area.h;
        }

        this._update();
    }

    /**
     * @param {boolean} v
     */
    set visible(v)
    {
        this._visible = v;
        this._update();
    }

    /**
     * @private
     */
    _update()
    {
        if (this._rectBg)
        {
            this._rectBg.visible = this._visible;
            this._rectResize.visible = this._visible;

            if (!this._visible) return;
            this._rectBg.setPosition(
                this._glop.x,
                this._glop.y,
                0.1);

            this._rectBg.setSize(this._w, this._h);

            this._rectResize.setPosition(
                this._glop.x + this._w - this._rectResize.w,
                this._glop.y + this._h - this._rectResize.h,
                -0.1
            );
        }

        this._glop.op.setUiAttrib({ "area": { "w": this._w, "h": this._h, "id": this._id } });
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
        this._rectBg.setColor(0, 0, 0, 0.08);
    }

    dispose()
    {
        this._rectBg.dispose();
        this._rectResize.dispose();
        this._rectBg = null;
        this._rectResize = null;
        return null;
    }
}
