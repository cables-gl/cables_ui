import { CGL, Texture } from "cables-corelibs";
import { CglContext } from "cables-corelibs/cgl/cgl_state.js";
import GlRectInstancer from "./glrectinstancer.js";

/**
 * @typedef {Object} GlTextWriterOptions
 * @property {String} [name]
 * @property {Number} [initNum]
 */

/**
 * draw text using msdf font texture, using {@link GlRectInstancer}
 *
 * @export
 * @class GlTextWriter
 */
export default class GlTextWriter
{
    #fontTex = null;
    #cgl = null;
    #rectDrawer = null;
    #name = "unknown";

    /**
     * @param {CglContext} cgl
     * @param {GlTextWriterOptions} options
     */
    constructor(cgl, options)
    {
        this.#cgl = cgl;
        options = options || {};
        if (options.name) this.#name = options.name;
        if (!cgl) throw new Error("[gltextwriter] no cgl");

        this.#rectDrawer = new GlRectInstancer(cgl, { "initNum": options.initNum, "name": "textrects_" + this.#name });
    }

    get rectDrawer() { return this.#rectDrawer; }

    /**
     * @param {Number} resX
     * @param {Number} resY
     * @param {Number} scrollX
     * @param {Number} scrollY
     * @param {Number} zoom
     */
    render(resX, resY, scrollX, scrollY, zoom)
    {
        if (!this.#fontTex)
        {
            this.#fontTex = Texture.load(this.#cgl, "img/worksans-regular.png", (err, tex) =>
            {
                // this.#rectDrawer.setTexture(0, this.#fontTex, true);
            }, { "flip": false, "filter": Texture.FILTER_LINEAR });
        }
        this.#rectDrawer.setTexture(0, this.#fontTex, true);

        this.#rectDrawer.render(resX, resY, scrollX, scrollY, zoom);
    }

    getFontTexture()
    {
        return this.#fontTex;
    }

    setDebugRenderer(i)
    {
        this.#rectDrawer.setDebugRenderer(i);
    }
}
