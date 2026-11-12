import { gui } from "../gui.js";
import GlPatch from "./glpatch.js";

/**
 * jump mode: shows a label on every op on screen
 */
export class KeyNavJump
{
    static CHARS = "asdfghklqwertyuiopzxcvbnm";

    /** @type {GlPatch} */
    #glPatch;

    /** @type {(op:import("cables/src/core/core_op.js").Op<any>)=>void} */
    #onJump;

    /** @type {{label:string, op:import("cables/src/core/core_op.js").Op<any>, ele:HTMLElement}[]} */
    #targets = [];

    #typed = "";

    /** @type {HTMLElement} */
    #container = null;

    #onKeyDownBound = this.#onKeyDown.bind(this);

    /**
     * @param {GlPatch} glPatch
     * @param {(op:import("cables/src/core/core_op.js").Op<any>)=>void} onJump
     */
    constructor(glPatch, onJump)
    {
        this.#glPatch = glPatch;
        this.#onJump = onJump;
    }

    get active()
    {
        return this.#targets.length > 0;
    }

    /**
     * @param {number} x patch coords, closest ops get the shortest labels
     * @param {number} y
     */
    start(x, y)
    {
        this.stop();

        // area of the canvas not covered by panels
        const vb = this.#glPatch.viewBox;
        const minX = gui.getLeftPanelsMaxWidth();
        const maxX = vb.viewWidth - gui.getRightPanelsMaxWidth();
        let maxY = vb.viewHeight;
        if (gui.bottomTabPanel.isVisible()) maxY -= gui.bottomTabPanel.height;

        const glOps = [];
        for (const i in this.#glPatch._glOpz)
        {
            const glop = this.#glPatch._glOpz[i];
            if (!glop.isOnScreen() || !glop.op.portsIn.concat(glop.op.portsOut).some((p) => { return glop.getGlPort(p.name); })) continue;

            const coords = vb.patchToScreenCoords(glop.x, glop.y);
            if (coords[0] < minX || coords[0] > maxX || coords[1] < 0 || coords[1] > maxY) continue;

            glOps.push(glop);
        }
        if (glOps.length == 0) return;

        const dist = (glop) => { return Math.hypot(glop.x - x, glop.y - y); };
        glOps.sort((a, b) => { return dist(a) - dist(b); });

        this.#container = document.createElement("div");
        this.#container.classList.add("cablesCssUi");
        document.body.appendChild(this.#container);

        const chars = KeyNavJump.CHARS;
        const twoChars = glOps.length > chars.length;
        const count = Math.min(glOps.length, chars.length * chars.length);

        for (let i = 0; i < count; i++)
        {
            const glop = glOps[i];
            let label = chars[i];
            if (twoChars) label = chars[Math.floor(i / chars.length)] + chars[i % chars.length];

            const coords = this.#glPatch.viewBox.patchToScreenCoords(glop.x, glop.y);
            const ele = document.createElement("div");
            ele.classList.add("keynavJumpLabel");
            ele.innerText = label;
            ele.style.left = (coords[0] + gui.patchView.boundingRect.left) + "px";
            ele.style.top = (coords[1] + gui.patchView.boundingRect.top) + "px";
            this.#container.appendChild(ele);

            this.#targets.push({ "label": label, "op": glop.op, "ele": ele });
        }

        this.#typed = "";
        window.addEventListener("keydown", this.#onKeyDownBound, true);
    }

    stop()
    {
        if (this.#container) this.#container.remove();
        this.#container = null;
        this.#targets = [];
        window.removeEventListener("keydown", this.#onKeyDownBound, true);
    }

    /**
     * @param {KeyboardEvent} e
     */
    #onKeyDown(e)
    {
        e.preventDefault();
        e.stopImmediatePropagation();

        if (e.key == "Escape") return this.stop();

        if (e.key == "Backspace") this.#typed = this.#typed.slice(0, -1);
        else if (e.key.length == 1) this.#typed += e.key.toLowerCase();
        else return;

        const matching = this.#targets.filter((t) => { return t.label.startsWith(this.#typed); });
        if (matching.length == 0) return this.stop();

        const hit = matching.find((t) => { return t.label == this.#typed; });
        if (hit)
        {
            this.stop();
            this.#onJump(hit.op);
            return;
        }

        for (const t of this.#targets)
        {
            const match = t.label.startsWith(this.#typed);
            t.ele.style.display = match ? "block" : "none";
            if (match) t.ele.innerHTML = "<span class=\"keynavJumpTyped\">" + this.#typed + "</span>" + t.label.substring(this.#typed.length);
        }
    }
}
