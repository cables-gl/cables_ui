import Gui, { gui } from "./gui.js";
import defaultTheme from "./defaulttheme.json";

export class CssClassNames
{
    static BUTTON_SMALL = "button-small";
    static BUTTON = "cblbutton";
    static HIDDEN = "hidden";
}

export class DomEvents
{
    static POINTER_CLICK = "click";
    static POINTER_DBL_CLICK = "dblclick";
    static POINTER_ENTER = "pointerenter";
    static POINTER_LEAVE = "pointerleave";
    static POINTER_MOVE = "pointermove";
    static POINTER_DOWN = "pointerdown";
    static POINTER_UP = "pointerup";
    static POINTER_WHEEL = "wheel";
}

/**
 * @typedef cbltheme_colors_patch
 * @property {number[]} opBgRectSelected
 * @property {number[]} selected
 * @property {number[]} selectedCable
 * @property {number[]} patchSelectionArea
 * @property {number[]} opTitleExt
 * @property {number[]} background
 * @property {number[]} opBoundsRect
 * @property {number[]} opBgRect
 * @property {number[]} opErrorWarning
 * @property {number[]} opError
 * @property {number[]} opErrorHint
 * @property {number[]} opNotWorkingCross
 * @property {number[]} patchComment
 */

/**
 * @typedef cbltheme_colors_vizlayer
 * @property {number[]} colorText
 * @property {number[]} colorBackground
 * @property {number[]} colorLineNumbers
 */

/**
 * @typedef CablesTheme
 * @property {cbltheme_colors_patch} [colors_patch]
 * @property {cbltheme_colors_vizlayer} [colors_patch]
 * @property {object} [colors]
 * @property {object} [colors_patch]
 * @property {object} [colors_textedit]
 * @property {object} [colors_html]
 * @property {object} [colors_vizlayer]
 * @property {object} [colors_timeline]
 * @property {colors_types} [colors_types]
 * @property {object} [colors_namespaces]
 * @property {object} [patch]
 */
/**
 * @typedef colors_types
 * @property {array} [num]
 * @property {array} [string]
 * @property {array} [array]
 * @property {array} [trigger]
 * @property {array} [obj]
 */

/** @param {CablesTheme} theme */
export function setUpTheme(theme = {})
{
    if (!theme) return;

    theme = JSON.parse(JSON.stringify(theme));
    theme.colors = theme.colors || {};

    const missing = {};

    /**
     * @param {Array<Number>} rgb
     */
    function rgbtohex(rgb)
    {
        return "#" + ((rgb[2] * 255 | (rgb[1] * 255) << 8 | (rgb[0] * 255) << 16) | 1 << 24).toString(16).slice(1);
    }

    const topics = Object.keys(defaultTheme);

    for (let i = 0; i < topics.length; i++)
    {
        const topic = topics[i];
        theme[topic] = theme[topic] || {};
        missing[topic] = {};

        for (let j in defaultTheme[topic])
        {
            if (!theme[topic].hasOwnProperty(j))
                missing[topic][j] = theme[topic][j] = defaultTheme[topic][j];
        }
    }

    for (let i in theme.colors_html)
    {
        document.documentElement.style.setProperty("--" + i, rgbtohex(theme.colors_html[i] || [1, 1, 1, 1]));
    }

    for (let i in theme.colors_textedit)
    {
        document.documentElement.style.setProperty("--" + i, rgbtohex(theme.colors_textedit[i] || [1, 1, 1, 1]));
    }
    for (let i in theme.colors_timeline)
    {
        document.documentElement.style.setProperty("--timeline_" + i, rgbtohex(theme.colors_timeline[i] || [1, 1, 1, 1]));
    }

    theme.colors_vizlayer = theme.colors_vizlayer || {};
    for (let i in theme.colors_vizlayer)
    {
        theme.colors_vizlayer[i] = rgbtohex(theme.colors_vizlayer[i] || [1, 1, 1, 1]);
    }

    document.documentElement.style.setProperty("--color_port_function", rgbtohex(theme.colors_types.trigger || [1, 1, 1, 1]));
    document.documentElement.style.setProperty("--color_port_value", rgbtohex(theme.colors_types.num || [1, 1, 1, 1]));
    document.documentElement.style.setProperty("--color_port_object", rgbtohex(theme.colors_types.obj || [1, 1, 1, 1]));
    document.documentElement.style.setProperty("--color_port_string", rgbtohex(theme.colors_types.string || [1, 1, 1, 1]));
    document.documentElement.style.setProperty("--color_port_array", rgbtohex(theme.colors_types.array || [1, 1, 1, 1]));

    gui.theme = theme;

    const nsColors = document.createElement("style");
    document.body.appendChild(nsColors);

    let strNsCss = "";

    for (let i in theme.colors_namespaces)
    {
        let ns = i;
        ns = ns.replaceAll(".", "_");
        strNsCss += ".nsColor_" + ns + "{color:" + rgbtohex(theme.colors_namespaces[i]) + " !important;}\n";
    }

    nsColors.textContent = strNsCss;

    gui.emitEvent(Gui.EVENT_THEMECHANGED);
    return missing;
}
