import { Events } from "cables-shared-client";

import { Anim, Op, Port } from "cables";
import { GlTimeline } from "./gltimeline.js";
import { glTlKeys } from "./gltlkeys.js";
import { gui } from "../gui.js";
import GlRect from "../gldraw/glrect.js";
import GlText from "../gldraw/gltext.js";

/**
 * gltimeline anim
 *
 * @export
 * @class glTlAnim
 * @extends {Events}
 */
export class glTlAnimLine extends Events
{

    /** @type {Array<Anim>} */
    #anims = [];

    /** @type {Array<Op>} */
    #ops = [];

    /** @type {GlRect} */
    #glRectKeysBg = null;

    /** @type {GlRect} */
    #glRectTitle = null;

    /** @type {GlText} */
    #glTitle = null;

    /** @type {GlText} */
    #glTextSideValue = null;

    /** @type {GlTimeline} */
    #glTl = null;

    /** @type {Array<glTlKeys>} */
    #keys = [];

    /** @type {Array<Port>} */
    #ports = [];

    width = 222;
    height = 25;

    /** @type {Array<Object >} */
    #disposeRects = [];

    #options = {};

    #animChangeListeners = [];

    #disposed = false;

    #view = null;

    /**
     * @param {GlTimeline} glTl
     * @param {Array<Port>} ports
     * @param {Object} options
    */
    constructor(glTl, ports, options = {})
    {
        super();

        this.#options = options;
        this.#glTl = glTl;
        this.#view = glTl.view;
        this.#glRectKeysBg = this.#glTl.rects.createRect({ "draggable": false });
        this.#glRectKeysBg.setSize(this.width, this.height - 2);

        if (ports.length > 1)
        {
            this.#glTextSideValue = new GlText(this.#glTl.texts, "");
            this.#glTextSideValue.setParentRect(this.#glRectTitle);
            this.#disposeRects.push(this.#glTextSideValue);

            this.#glRectKeysBg.on(GlRect.EVENT_POINTER_MOVE, (x, y) =>
            {
                this.#glTextSideValue.text = String(Math.round(CABLES.map(y / this.height, 0, 1, this.#view.minVal, this.#view.maxVal) * 1000) / 1000);
                this.#glTextSideValue.setPosition(this.width - this.#glTextSideValue.width - 10, y, -0.5);
            });
        }

        this.#disposeRects.push(this.#glRectKeysBg);

        for (let i = 0; i < ports.length; i++)
        {
            this.#anims[i] = ports[i].anim;
            this.#ops[i] = ports[i].op;
            this.#ports[i] = ports[i];
            if (this.#keys[i]) this.#keys[i].dispose();
            this.#keys[i] = new glTlKeys(glTl, this, this.#ports[i].anim, this.#glRectKeysBg, this.#ports[i], this.#options);

            const keys = this.#keys[i];
            const anim = ports[i].anim;

            const lid = anim.on("onChange", () =>
            {
                if (!keys.isDragging()) keys.init();
            });

            this.#animChangeListeners.push({ "id": lid, "anim": anim });
        }
        this.#glRectTitle = this.#glTl.rects.createRect({ "draggable": false, "interactive": true });
        this.#glRectTitle.setColor(0, 0, 0);
        this.#glRectTitle.on(GlRect.EVENT_POINTER_DOWN, () =>
        {
            if (this.#ops.length > 0)gui.patchView.focusOp(this.#ops[0].id);
        });
        this.#disposeRects.push(this.#glRectTitle);

        let title = "???";
        if (ports[0]) title = ports[0].op.name + " - " + ports[0].name;
        if (ports.length > 1)title = ports.length + " anims";

        const padding = 10;
        this.#glTitle = new GlText(this.#glTl.texts, title || "unknown anim");

        this.#glTl.setMaxTitleSpace(this.#glTitle.width + (padding * 2));

        this.#glTitle.setPosition(padding, 0);
        this.#glTitle.setParentRect(this.#glRectTitle);

        this.#disposeRects.push(this.#glTitle);
        this.fitValues();
        this.updateColor();
    }

    get anims()
    {
        return this.#anims;
    }

    fitValues()
    {

        for (let j = 0; j < this.#keys.length; j++)
        {
            const anim = this.#keys[j].anim;

            for (let i = 0; i < anim.keys.length; i++)
            {
                this.#view.minVal = Math.min(this.#view.finalMinVal, anim.keys[i].value);
                this.#view.maxVal = Math.max(this.#view.finalMaxVal, anim.keys[i].value);
            }
        }
    }

    update()
    {
        if (this.checkDisposed()) return;
        this.updateColor();

        for (let i = 0; i < this.#keys.length; i++)
            this.#keys[i].update();
    }

    updateColor()
    {
        if (this.checkDisposed()) return;
        this.#glTitle.setColor(0.7, 0.7, 0.7, 1);
        this.#glRectKeysBg.setColor(0.3, 0.3, 0.3);

        if (gui.patchView.isCurrentOp(this.#ops[0]))
        {
            this.#glTitle.setColorArray(this.#glTl.getColorSpecial());
            this.#glRectKeysBg.setColor(0.35, 0.35, 0.35);
        }
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    setPosition(x, y)
    {
        if (this.checkDisposed()) return;
        this.#glRectTitle.setPosition(x, y, -0.5);
        this.#glRectKeysBg.setPosition(this.#glTl.titleSpace, y + 1);
    }

    /**
     * @param {number} h
     */
    setHeight(h)
    {
        if (this.checkDisposed()) return;
        this.height = h;
        this.setWidth(this.width);
        this.update();
    }

    /**
     * @param {number} w
     */
    setWidth(w)
    {
        if (this.checkDisposed()) return;
        this.width = w;
        this.#glRectTitle.setSize(this.#glTl.titleSpace, this.height - 1);
        this.#glRectKeysBg.setSize(this.width, this.height - 2);
    }

    checkDisposed()
    {
        if (this.#disposed)console.log("disposed object...", this);
        return this.#disposed;
    }

    dispose()
    {
        this.#disposed = true;

        for (let i = 0; i < this.#animChangeListeners.length; i++)
            this.#animChangeListeners[i].anim.removeEventListener(this.#animChangeListeners[i].id);

        this.#animChangeListeners = [];

        for (let i = 0; i < this.#keys.length; i++) this.#keys[i].dispose();
        this.#keys = [];

        for (let i = 0; i < this.#disposeRects.length; i++) this.#disposeRects[i].dispose();
        this.#disposeRects = [];
    }

    /**
     * @param {string} id
     * @returns {Anim}
     */
    getAnimById(id)
    {
        for (let i = 0; i < this.#anims.length; i++)
        {
            if (id == this.#anims[i].id) return this.#anims[i];
        }
        return null;
    }

    /**
     * @param {string} animName
     * @returns {Anim}
     */
    getAnimByName(animName)
    {
        for (let i = 0; i < this.#anims.length; i++)
        {
            if (animName == this.#anims[i].name) return this.#anims[i];
        }
        return null;
    }

}
