import { Events } from "cables-shared-client";
import { Anim, Op, Port } from "cables";
import { EventListener } from "cables-shared-client/src/eventlistener.js";
import { glTlKeys } from "./gltlkeys.js";
import { gui } from "../gui.js";
import GlRect from "../gldraw/glrect.js";
import GlText from "../gldraw/gltext.js";
import { GlTlView } from "./gltlview.js";
import { TlTitle } from "./tllinetitle.js";
import { TlValueRuler } from "./tlvalueruler.js";
import { GlTimeline } from "./gltimeline.js";

/**
 * @typedef AnimLineOptions
 * @property {boolean} [keyYpos]
 * @property {boolean} [multiAnims]
 * @property {HTMLElement} [parentEle]
 */

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

    static DEFAULT_HEIGHT = 30;

    width = 222;
    height = glTlAnimLine.DEFAULT_HEIGHT;

    /** @type {Array<Object >} */
    #disposeRects = [];

    #options = {};

    /** @type {TlTitle[]} */
    #titles = [];

    /** @type {EventListener[]} */
    #listeners = [];

    #disposed = false;

    /** @type {GlTlView} */
    #view = null;

    /** @type {TlValueRuler} */
    #valueRuler = null;

    /** @type {boolean} */
    #hidden = false;

    /** @type {glTlAnimLine[]} */
    childLines = [];

    /** @type {glTlAnimLine} */
    parentLine = null;

    /**
     * @param {GlTimeline} glTl
     * @param {Array<Port>} ports
     * @param {AnimLineOptions} options
    */
    constructor(glTl, ports, options = {})
    {
        super();

        this.#options = options;
        this.#glTl = glTl;
        this.#view = glTl.view;
        this.width = glTl.width;
        this.#glRectKeysBg = this.#glTl.rects.createRect({ "draggable": false, "interactive": true, "name": "keysBg" });
        this.#glRectKeysBg.setSize(this.width, this.height - 2);
        this.#glRectKeysBg.setColorArray(gui.theme.colors_patch.opBgRect);

        this.#glRectKeysBg.on(GlRect.EVENT_POINTER_HOVER, () =>
        {
            if (!this.isGraphLayout())
                for (let i = 0; i < this.#titles.length; i++)
                    this.#titles[i].hover();
            this.updateColor();

        });
        this.#glRectKeysBg.on(GlRect.EVENT_POINTER_UNHOVER, () =>
        {
            if (!this.isGraphLayout())
                for (let i = 0; i < this.#titles.length; i++)
                    this.#titles[i].unhover();
            this.updateColor();

        });

        // this.height = Math.random() * 80 + 22;
        this.#disposeRects.push(this.#glRectKeysBg);
        for (let i = 0; i < ports.length; i++)
        {
            if (!ports[i]) continue;
            this.#anims[i] = ports[i].anim;
            this.#ops[i] = ports[i].op;
            this.#ports[i] = ports[i];
            if (this.#keys[i]) this.#keys[i].dispose();
            this.#keys[i] = new glTlKeys(glTl, this, this.#ports[i].anim, this.#glRectKeysBg, this.#ports[i], this.#options, i);

            const keys = this.#keys[i];
            const anim = ports[i].anim;

            this.#listeners.push(
                anim.on(Anim.EVENT_CHANGE, () =>
                {
                    if (!keys.isDragging()) keys.init();
                }));

            this.#listeners.push(
                ports[i].on("animLineUpdate", () =>
                {
                    this.updateColor();
                    keys.updateColors();
                    this.update();
                }));

            if (ports.length == 1)
                this.#listeners.push(
                    anim.on(Anim.EVENT_UIATTRIB_CHANGE, () =>
                    {
                        this.height = Math.random() * 80 + 22;
                    }));
        }

        for (let i = 0; i < ports.length; i++)
            if (ports[i])
                this.setTitle(i, ports[i], ports[i].anim, options.parentEle || this.#glTl.tlTimeScrollContainer);

        if (this.isGraphLayout())
        {
            this.#valueRuler = new TlValueRuler(glTl, this, this.#glRectKeysBg);
            this.#glTextSideValue = new GlText(this.#glTl.texts, "");
            this.#disposeRects.push(this.#glTextSideValue);

            this.#glRectKeysBg.on(GlRect.EVENT_POINTER_MOVE, (_x, y) =>
            {
                if (this.#keys.length < 1) return;
                this.#glTextSideValue.text = String(Math.round(this.pixelToValue(this.height - y + this.#glRectKeysBg.y) * 1000) / 1000);
                this.#glTextSideValue.setPosition(this.width - this.#glTextSideValue.width - 10, y - 20, -0.5);
            });
        }
        else
        {
            // if (ports.length == 0) this.addFolder("folder" + (options.title || "unknown"));
            // console.log("no folderanymore......");
        }

        if (this.#options.title)
        {
            console.log("addtitle", this.#options.title);
            this.addTitle(null, null, options.parentEle || this.#glTl.tlTimeScrollContainer);
        }

        this.fitValues();
        this.updateColor();
    }

    get anims()
    {
        return this.#anims;
    }

    getActiveAnims()
    {
        const arr = [];
        for (let i = 0; i < this.#titles.length; i++)
        {
            const a = this.#titles[i].getAnim();
            if (a.tlActive)arr.push(a);
        }

        return arr;
    }

    isHovering()
    {
        let anyhovering = false;
        for (let i = 0; i < this.#titles.length; i++)
            if (this.#titles[i].isHovering)anyhovering = true;

        return this.#glRectKeysBg.isHovering() || anyhovering;
    }

    /**
     * @param {number} idx
     * @param {Port} p
     * @param {Anim} [anim]
     * @param {HTMLElement} [parentEle]
     */
    setTitle(idx, p, anim, parentEle)
    {
        while (this.#titles.length <= idx) this.addTitle(anim, p, parentEle);
        // this.#titles[idx].setPort(p);
        this.setTitlePos();
    }

    /**
     * @param {string | number} idx
     * @returns {TlTitle}
     */
    getTitle(idx)
    {
        return this.#titles[idx];
    }

    /**
     * @param {Anim} anim
     * @param {Port} [p]
     * @param {HTMLElement} [parent]
     */
    addTitle(anim, p, parent)
    {

        const title = new TlTitle(this.#glTl, parent || this.#glTl.tlTimeScrollContainer, anim, { "port": p, "animLine": this, "title": this.#options.title });

        title.on(TlTitle.EVENT_TITLECLICKED, (title, e) =>
        {
            if (!e.shiftKey) gui.patchView.unselectAllOps();
            if (this.#ops[title.index])
            {
                gui.patchView.selectOpId(this.#ops[title.index].id);
                gui.patchView.focusOp(this.#ops[title.index].id);
                gui.patchView.centerSelectOp(this.#ops[title.index].id);
            }
            this.updateTitles();
        });
        title.on("hoverchange", this.updateColor.bind(this));

        this.#titles.push(title);
        this.setTitlePos();
        this.updateTitles();
    }

    // addFolder(text)
    // {
    //     const title = new TlTitle(this.#glTl, this.#glTl.tlTimeScrollContainer, null, { "port": null, "collapsable": true, "title": text });
    //     title.setHeight(this.height - 2);
    //     title.on(TlTitle.EVENT_TITLECLICKED, (title, e) =>
    //     {
    //         console.log("folder...");
    //     });

    //     this.#titles.push(title);
    //     this.setTitlePos();
    // }

    /**
     * @param {Op[]} ops
     */
    activateSelectedOps(ops)
    {
        for (let i = 0; i < this.#ports.length; i++)
            this.#ports[i].anim.tlActive = (ops.indexOf(this.#ports[i].op) != -1);
    }

    posY()
    {
        return this.#glRectKeysBg.y;
    }

    fitValues()
    {
        for (let j = 0; j < this.#keys.length; j++)
        {
            const anim = this.#keys[j].anim;

            for (let i = 0; i < anim.keys.length; i++)
            {
                this.#view.setMinVal(Math.min(this.#view.finalMinVal, anim.keys[i].value));
                this.#view.setMaxVal(Math.max(this.#view.finalMaxVal, anim.keys[i].value + 0.01));
            }
        }
    }

    hide()
    {
        this.#hidden = true;
        // for (let j = 0; j < this.#keys.length; j++)
        //     this.#keys[j].hidden = this.#hidden;
        this.update();
        this.updateColor();
        this.updateTitles();

        for (let i = 0; i < this.#keys.length; i++)
            this.#keys[i].setKeyPositions("collapse");

    }

    show()
    {
        this.#hidden = false;
        // for (let j = 0; j < this.#keys.length; j++)
        //     this.#keys[j].hidden = this.#hidden;
        this.update();
        this.updateTitles();

        for (let i = 0; i < this.#keys.length; i++)
            this.#keys[i].setKeyPositions("collapse");
    }

    get isHidden()
    {
        return this.#hidden;
    }

    get isVisible()
    {
        return !this.#hidden;
    }

    getKeyYPos()
    {
        if (this.isHidden && this.parentLine) return this.parentLine.getKeyYPos();
        return this.#glRectKeysBg.h / 2;
    }

    updateTitles()
    {
        for (let i = 0; i < this.#titles.length; i++)
            this.#titles[i].updateIcons();

        if (this.isHidden)
        {
            this.#titles[0].setHeight(0);
        }
        else
        if (this.isGraphLayout())
        {
            for (let i = 0; i < this.#titles.length; i++)
            {
                this.#titles[i].setHeight(glTlAnimLine.DEFAULT_HEIGHT);
            }
        }
        else
        {
            this.#titles[0].setHeight(this.height - 2);
        }

        if (this.collapsed)
        {
            for (let i = 0; i < this.childLines.length; i++)
            {
                this.childLines[i].hide();
            }
        }
        else
        {
            for (let i = 0; i < this.childLines.length; i++)
            {
                this.childLines[i].show();
            }
        }
        this.#glTl.setPositions();
    }

    setTitlePos()
    {
        for (let i = 0; i < this.#titles.length; i++)
        {
            this.#titles[i].setPos(3, this.posY() - this.#glTl.getFirstLinePosy());
            this.#titles[i].index = i;
            this.#titles[i].tlKeys = this.#keys[i];
        }
    }

    updateGlPos()
    {
        if (!this.isGraphLayout())
        {
            if (this.#titles[0])
            {
                const rc = this.#glTl.tlTimeScrollContainer.getBoundingClientRect();
                const r = this.#titles[0].getClientRect();
                if (this.isHidden)
                {
                    this.setHeight(0);
                    // this.#glRectKeysBg.setSize(0, 0);
                }
                else
                {
                    this.setPosition(this.#glRectKeysBg.x, (r.top - rc.top + this.#glTl.tlTimeScrollContainer.scrollTop) + this.#glTl.getFirstLinePosy());
                    // this.setHeight(r.height - 10);
                    this.#glRectKeysBg.setSize(this.width, r.height - 2);
                }

            }
        }
        else
        {
            this.setPosition(this.#glRectKeysBg.x, this.#glTl.getFirstLinePosy());
            this.height = this.#glTl.height;
            this.#glRectKeysBg.setSize(this.width, this.height - 2);
        }
    }

    update()
    {
        if (this.checkDisposed()) return;
        this.updateColor();

        let h = this.height - 2;

        if (this.#hidden) this.#glRectKeysBg.setSize(0, 0);
        else this.#glRectKeysBg.setSize(this.width, h);

        for (let i = 0; i < this.#keys.length; i++) this.#keys[i].update();
        if (this.#valueRuler) this.#valueRuler.update();
        this.updateGlPos();
    }

    updateColor()
    {
        if (this.checkDisposed()) return;
        if (this.isHovering() && !this.isGraphLayout())
            this.#glRectKeysBg.setColor(0.15, 0.15, 0.15, 1);
        else
            this.#glRectKeysBg.setColorArray(gui.theme.colors_patch.opBgRect);

        for (let i = 0; i < this.#titles.length; i++)
        {

            if (this.#keys[i])
            {
                // this.#keys[i].hidden = this.#hidden;
                this.#titles[i].setHasSelectedKeys(this.#keys[i].hasSelectedKeys());

            }
        }
    }

    /**
     * @param {number} _x
     * @param {number} y
     */
    setPosition(_x, y)
    {
        y = Math.floor(y);
        if (this.checkDisposed()) return;
        this.#glRectKeysBg.setPosition(0, y);
        this.setTitlePos();
    }

    /**
     * @param {number} h
     */
    setHeight(h)
    {
        if (this.height == h) return;
        if (this.checkDisposed()) return;

        for (let i = 0; i < this.#keys.length; i++)
            this.#keys[i].setKeyPositions("collapse");
        // this.height = h;
        // this.setWidth(this.width);
        // this.update();
        // this should be removed instead, call update....
    }

    /**
     * @param {number} w
     */
    setWidth(w)
    {
        if (this.checkDisposed()) return;
        this.width = w;

        // let h = this.height - 2;
        // if (this.#hidden)h = 0;
        // this.#glRectKeysBg.setSize(this.width, h);
        this.update();

        for (let i = 0; i < this.#keys.length; i++) this.#keys[i].reset();
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

        for (let i = 0; i < this.#listeners.length; i++) this.#listeners[i].remove();

        this.#listeners = [];

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
     * @returns {Number}
     */
    valueToPixel(v)
    {
        if (this.#keys.length == 0) return 1;
        let y = CABLES.map(v + 0.0000001, this.#view.minVal, this.#view.maxVal, this.#keys[0].getKeyHeight(), this.#glRectKeysBg.h - this.#keys[0].getKeyHeight() / 2, 0, false);

        // if (y == -Infinity) y = 0;
        // if (y == Infinity)y = 0;
        return this.#glRectKeysBg.h - y - this.#glTl.view.offsetY;
    }

    /**
     * @param {number} v
     */
    valueToPixelRel(v)
    {
        if (this.#keys.length == 0) return 1;
        let y = CABLES.map(v + 0.0000001, this.#view.minVal, this.#view.maxVal, this.#keys[0].getKeyHeight(), this.#glRectKeysBg.h - this.#keys[0].getKeyHeight() / 2, 0, false);
        return y;
    }

    getPortTitles()
    {
        let str = "";
        for (let i = 0; i < this.#ports.length; i++)
        {
            // if (i > 0)
            str += ", ";
            str += this.#ports[i].getTitle();
        }
        return str;

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

    /**
     * @param {number} t
     */
    createKeyAtCursor(t)
    {
        if (this.isGraphLayout)
        {
            for (let j = 0; j < this.#ports.length; j++)
            {

                if (this.#anims[j].tlActive)
                {
                    let val = this.#anims[j].getValue(t);
                    if (!this.#glTl.keyframeAutoCreate) val = this.#ports[j].get();

                    this.#glTl.createKey(this.#anims[j], t, val);
                }
            }
        }
        else
        {
            for (let j = 0; j < this.#ports.length; j++)
            {
                if (this.#ports[j].op.uiAttribs.selected)
                {
                    let val = this.#anims[j].getValue(t);
                    if (!this.#glTl.keyframeAutoCreate) val = this.#ports[j].get();

                    this.#glTl.createKey(this.#anims[j], t, val);
                }
            }
        }
    }

    /**
     * @param {Anim} anim
     */
    getGlKeysForAnim(anim)
    {
        for (let j = 0; j < this.#anims.length; j++)
        {
            if (anim == this.#anims[j])
                return this.#keys[j];
        }

    }

    render()
    {
        for (let j = 0; j < this.#keys.length; j++)
            this.#keys[j].render();
    }

    testSelected()
    {
        if (glTlKeys.dragStarted) return;
        if (!this.#glTl.isSelecting()) return;
        for (let j = 0; j < this.#keys.length; j++) this.#keys[j].testSelected();
    }

    isGraphLayout()
    {
        return this.#glTl.layout == GlTimeline.LAYOUT_GRAPHS;
    }

    /**
     * @param {glTlAnimLine} c
     */
    addFolderChild(c)
    {
        c.parentLine = this;
        this.childLines.push(c);
        this.#titles[0].updateIcons();
    }

    toggleFolder()
    {
        if (this.collapsed) this.expandFolder();
        else this.collapseFolder();
    }

    collapseFolder()
    {
        for (let i = 0; i < this.childLines.length; i++)
        {
            this.childLines[i].hide();
            this.childLines[i].moveKeysToParent();
        }

        this.collapsed = true;
        this.#titles[0].updateIcons();
        this.updateTitles();
    }

    moveKeysToParent()
    {
        this.#glRectKeysBg.setPosition(this.#glRectKeysBg.x, this.parentLine.getYPos(), 0.04);

    }

    getYPos()
    {
        return this.#glRectKeysBg.y;
    }

    expandFolder()
    {
        for (let i = 0; i < this.childLines.length; i++)
        {
            this.childLines[i].show();
        }
        this.collapsed = false;
        this.#titles[0].updateIcons();
        this.updateTitles();
    }

}
