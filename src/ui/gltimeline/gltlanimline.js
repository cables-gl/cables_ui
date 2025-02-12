import { Events } from "cables-shared-client";
import { Types } from "cables-shared-types";
import GlText from "../gldraw/gltext.js";
import glTlKeys from "./gltlkeys.js";
import GlTimeline from "./gltimeline.js";
import GlRect from "../gldraw/glrect.js";
import { gui } from "../gui.js";

/**
 * gltimeline anim
 *
 * @export
 * @class glTlAnim
 * @extends {Events}
 */
export default class glTlAnimLine extends Events
{

    /** @type {Array<Types.Anim>} */
    #anims = [];

    /** @type {Array<Types.Op>} */
    #ops = [];

    /** @type {GlRect} */
    #glRectKeysBg = null;

    /** @type {GlRect} */
    #glRectTitle = null;

    /** @type {GlText} */
    #glTitle = null;

    /** @type {GlText} */
    #glTitleValue = null;

    /** @type {GlTimeline} */
    #glTl = null;

    /** @type {Array<glTlKeys>} */
    #keys = [];

    /** @type {Array<Types.Port>} */
    #ports = [];

    width = 222;
    height = 25;

    /** @type {Array<Object >} */
    #disposeRects = [];

    #options = {};

    #animChangeListeners = [];

    #disposed = false;

    #minVal = -1;
    #maxVal = 1;

    /**
     * @param {GlTimeline} glTl
     * @param {Array<Types.Port>} ports
     * @param {Object} options
    */
    constructor(glTl, ports, options = {})
    {
        super();

        this.#options = options;
        this.#glTl = glTl;
        this.#glRectKeysBg = this.#glTl.rects.createRect({ "draggable": false });
        this.#glRectKeysBg.setSize(this.width, this.height - 2);

        if (ports.length > 1)
        {
            this.#glTitleValue = new GlText(this.#glTl.texts, "");
            this.#glTitleValue.setParentRect(this.#glRectTitle);
            this.#disposeRects.push(this.#glTitleValue);

            this.#glRectKeysBg.on("pointerMove", (x, y) =>
            {
                this.#glTitleValue.text = String(Math.round(CABLES.map(y / this.height, 0, 1, this.#minVal, this.#maxVal) * 1000) / 1000);
                this.#glTitleValue.setPosition(this.width - this.#glTitleValue.width - 10, y, -0.5);
                // console.log("xyyy", , y / this.height, this.#minVal, this.#maxVal);
            });
        }

        this.#disposeRects.push(this.#glRectKeysBg);

        for (let i = 0; i < ports.length; i++)
        {
            this.#anims[i] = ports[i].anim;
            this.#ops[i] = ports[i].op;
            this.#ports[i] = ports[i];
            if (this.#keys[i]) this.#keys[i].dispose();
            this.#keys[i] = new glTlKeys(glTl, this.#ports[i].anim, this.#glRectKeysBg, this.#ports[i], this.#options);

            const keys = this.#keys[i];
            const anim = ports[i].anim;

            const lid = anim.addEventListener("onChange", () =>
            {
                if (!keys.isDragging()) keys.init();
            });

            this.#animChangeListeners.push({ "id": lid, "anim": anim });
        }
        this.#glRectTitle = this.#glTl.rects.createRect({ "draggable": false, "interactive": true });
        this.#glRectTitle.setColor(0, 0, 0);
        this.#glRectTitle.on("mousedown", () =>
        {
            gui.patchView.focusOp(this.#ops[0].id);
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

        this.updateColor();
    }

    get anims()
    {
        return this.#anims;
    }

    update()
    {
        if (this.checkDisposed()) return;
        this.updateColor();

        this.#minVal = -1;
        this.#maxVal = 1;

        for (let j = 0; j < this.#keys.length; j++)
        {
            const anim = this.#keys[j].anim;

            for (let i = 0; i < anim.keys.length; i++)
            {
                this.#minVal = Math.min(this.#minVal, anim.keys[i].value);
                this.#maxVal = Math.max(this.#maxVal, anim.keys[i].value);
            }
        }

        this.#minVal -= Math.abs(this.#minVal * 0.5);
        this.#maxVal += Math.abs(this.#maxVal * 0.5);

        for (let i = 0; i < this.#keys.length; i++)
            this.#keys[i].update(this.#minVal, this.#maxVal);
    }

    updateColor()
    {
        if (this.checkDisposed()) return;
        this.#glTitle.setColor(0.7, 0.7, 0.7, 1);
        this.#glRectKeysBg.setColor(0.3, 0.3, 0.3);

        if (gui.patchView.isCurrentOp(this.#ops[0]))
        {
            this.#glTitle.setColor(this.#glTl.getColorSpecial());
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
     * @returns {Types.Anim}
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
     * @returns {Types.Anim}
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
