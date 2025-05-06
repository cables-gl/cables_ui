import { Events } from "cables-shared-client";

import { Anim, Op, Port } from "cables";
import { GlTimeline } from "./gltimeline.js";
import { glTlKeys } from "./gltlkeys.js";
import { gui } from "../gui.js";
import GlRect from "../gldraw/glrect.js";
import GlText from "../gldraw/gltext.js";
import { GlTlView } from "./gltlview.js";
import { TlTitle } from "./tllinetitle.js";
import { TlValueRuler } from "./tlvalueruler.js";
import opNames from "../opnameutils.js";

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
    // #glRectTitle = null;

    /** @type {GlText} */
    #glTextSideValue = null;

    /** @type {GlTimeline} */
    #glTl = null;

    /** @type {Array<glTlKeys>} */
    #keys = [];

    /** @type {Array<Port>} */
    #ports = [];

    static DEFAULT_HEIGHT = 25;

    width = 222;
    height = glTlAnimLine.DEFAULT_HEIGHT;

    /** @type {Array<Object >} */
    #disposeRects = [];

    #options = {};

    /** @type {TlTitle[]} */
    #titles = [];

    #animChangeListeners = [];

    #disposed = false;

    /** @type {GlTlView} */
    #view = null;

    /** @type {TlValueRuler} */
    #valueRuler = null;

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
        this.#glRectKeysBg = this.#glTl.rects.createRect({ "draggable": false, "interactive": true });
        this.#glRectKeysBg.setSize(this.width, this.height - 2);
        this.#glRectKeysBg.setColor(0.3, 0.3, 0.3);

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

            const lid = anim.on(Anim.EVENT_CHANGE, () =>
            {
                if (!keys.isDragging()) keys.init();
            });

            this.#animChangeListeners.push({ "id": lid, "anim": anim });
        }

        for (let i = 0; i < ports.length; i++)
        {
            let title = "";

            title += "<span class=\"" + opNames.getNamespaceClassName(ports[i].op.objName) + "\">";
            title += ports[i].op.name;
            title += "</span>";

            title += " <span class=\"portname\">" + ports[i].name + "</span>";
            if (ports[i].op.uiAttribs.comment) title += "<span class=\"comment\"> // " + ports[i].op.uiAttribs.comment + "</span>";
            this.setTitle(i, title, ports[i].anim);
        }

        if (this.#glTl.layout == GlTimeline.LAYOUT_GRAPHS)
        {
            this.#valueRuler = new TlValueRuler(glTl, this, this.#glRectKeysBg);
            this.#glTextSideValue = new GlText(this.#glTl.texts, "");
            this.#disposeRects.push(this.#glTextSideValue);

            this.#glRectKeysBg.on(GlRect.EVENT_POINTER_MOVE, (x, y) =>
            {
                if (this.#keys.length < 1) return;
                this.#glTextSideValue.text = String(Math.round(this.pixelToValue(this.height - y + this.#glRectKeysBg.y) * 1000) / 1000);
                this.#glTextSideValue.setPosition(this.width - this.#glTextSideValue.width - 10, y - 20, -0.5);
            });
        }

        this.fitValues();
        this.updateColor();
    }

    get anims()
    {
        return this.#anims;
    }

    isHovering()
    {
        return this.#glRectKeysBg.isHovering();
    }

    /**
     * @param {string} t
     * @param {Anim} anim
     */
    addTitle(t, anim)
    {
        const title = new TlTitle(this.#glTl, this.#glTl.parentElement(), anim);
        title.setTitle(t);
        title.on("titleClicked", (title) =>
        {
            gui.patchView.focusOp(this.#ops[title.index].id);
        });

        this.#titles.push(title);
        this.setTitlePos();
    }

    activateSelectedOps(ops)
    {
        for (let i = 0; i < this.#ports.length; i++)
        {
            this.#ports[i].anim.tlActive = (ops.indexOf(this.#ports[i].op) != -1);
        }
    }

    updateTitles()
    {
        for (let i = 0; i < this.#titles.length; i++)
            this.#titles[i].updateIcons();
    }

    setTitlePos()
    {
        for (let i = 0; i < this.#titles.length; i++)
        {
            this.#titles[i].setPos(3, i * glTlAnimLine.DEFAULT_HEIGHT + this.#glRectKeysBg.y);
            this.#titles[i].index = i;
            this.#titles[i].tlKeys = this.#keys[i];
            this.#titles[i].op = this.#ops[i];
        }
    }

    /**
     * @param {number} idx
     * @param {string} t
     * @param {Anim} [anim]
     */
    setTitle(idx, t, anim)
    {
        while (this.#titles.length <= idx) this.addTitle("title...", anim);
        this.#titles[idx].setTitle(t,);
        this.setTitlePos();
    }

    fitValues()
    {
        for (let j = 0; j < this.#keys.length; j++)
        {
            const anim = this.#keys[j].anim;

            for (let i = 0; i < anim.keys.length; i++)
            {
                this.#view.minVal = Math.min(this.#view.finalMinVal, anim.keys[i].value);
                this.#view.maxVal = Math.max(this.#view.finalMaxVal, anim.keys[i].value + 0.01);
            }
        }
    }

    update()
    {
        if (this.checkDisposed()) return;
        this.updateColor();

        for (let i = 0; i < this.#keys.length; i++) this.#keys[i].update();
        if (this.#valueRuler) this.#valueRuler.update();
    }

    updateColor()
    {
        if (this.checkDisposed()) return;

        for (let i = 0; i < this.#titles.length; i++)
        {
            // this.#titles[i].updateColor();
            this.#titles[i].setHasSelectedKeys(this.#keys[i].hasSelectedKeys());
        }

    }

    /**
     * @param {number} x
     * @param {number} y
     */
    setPosition(x, y)
    {
        if (this.checkDisposed()) return;
        // this.#glRectTitle.setPosition(x, y, -0.5);
        this.#glRectKeysBg.setPosition(0, y);
        this.setTitlePos();
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
        // this.#glRectTitle.setSize(this.#glTl.titleSpace, this.height - 1);
        this.#glRectKeysBg.setSize(this.width, this.height - 2);
    }

    checkDisposed()
    {
        if (this.#disposed)console.log("disposed object...", this);
        return this.#disposed;
    }

    dispose()
    {
        if (this.#disposed) return;
        this.#disposed = true;
        if (this.#valueRuler) this.#valueRuler = this.#valueRuler.dispose();

        for (let i = 0; i < this.#titles.length; i++) this.#titles[i].dispose();

        for (let i = 0; i < this.#animChangeListeners.length; i++)
            this.#animChangeListeners[i].anim.removeEventListener(this.#animChangeListeners[i].id);

        this.#animChangeListeners = [];

        for (let i = 0; i < this.#keys.length; i++) this.#keys[i].dispose();
        this.#keys = [];

        for (let i = 0; i < this.#disposeRects.length; i++) this.#disposeRects[i].dispose();

        this.#disposeRects = [];
        this.removeAllEventListeners();
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

    getDebug()
    {
        const o = {
            "numanims": this.anims.length,
            "anims": [],
            "keys": []
        };
        for (let i = 0; i < this.#anims.length; i++)o.anims.push(this.anims[i].name);
        for (let i = 0; i < this.#keys.length; i++)o.keys.push(this.#keys[i].getDebug());
        return o;
    }

    /**
     * @param {Number} posy
     */
    pixelToValue(posy)
    {
        return CABLES.map(posy, 0, this.height, this.#view.minVal, this.#view.maxVal);
    }

    /**
     * @param {Number} v
     */
    valueToPixel(v)
    {
        if (this.#keys.length == 0) return;
        let y = CABLES.map(v + 0.0000001, this.#view.minVal, this.#view.maxVal, this.#keys[0].sizeKey2, this.#glRectKeysBg.h - this.#keys[0].keyHeight / 2, 0, false);

        // if (y == -Infinity) y = 0;
        // if (y == Infinity)y = 0;
        return this.#glRectKeysBg.h - y - this.#glTl.view.offsetY;
    }

    /**
     * @param {Op[]} selops
     */
    updateSelectedOpColor(selops)
    {
        for (let j = 0; j < this.#ports.length; j++)
        {
            let found = false;
            for (let i = 0; i < selops.length; i++)
            {
                if (this.#ports[j].op == selops[i])
                {
                    found = true;
                    break;
                }
            }

            this.#titles[j].setBorderColor(found, this.#ports[j].op.uiAttribs.color || "transparent");

            this.#titles[j].updateIcons();
        }
    }
}
