import Gui, { gui } from "./gui.js";
import defaultTheme from "./defaulttheme.json";

/**
 * @typedef CablesTheme
 * @property {theme_colors_types} colors_types
 * @property {theme_colors_namespaces} colors_namespaces
 * @property {theme_textedit} textedit
 * @property {theme_colors_timeline} colors_timeline
 * @property {theme_colors_patch} colors_patch
 * @property {theme_colors_html} colors_html
 * @property {theme_patch} patch
 * @property {theme_colors_vizlayer} colors_vizlayer
 */
/**
 * @typedef theme_colors_types
 * @property {Number[]} trigger
 * @property {Number[]} trigger_inactive
 * @property {Number[]} num
 * @property {Number[]} num_inactive
 * @property {Number[]} obj
 * @property {Number[]} obj_inactive
 * @property {Number[]} string
 * @property {Number[]} string_inactive
 * @property {Number[]} array
 * @property {Number[]} array_inactive
 * @property {Number[]} dynamic
 */
/**
 * @typedef theme_colors_namespaces
 * @property {Number[]} unknown
 * @property {Number[]} Ops.Dev
 * @property {Number[]} Ops.Ui
 * @property {Number[]} Ops.Vars
 * @property {Number[]} Ops.Patch
 * @property {Number[]} Ops.Cables
 * @property {Number[]} Ops.Array
 * @property {Number[]} Ops.Arrays
 * @property {Number[]} Ops.Points
 * @property {Number[]} Ops.String
 * @property {Number[]} Ops.Website
 * @property {Number[]} Ops.Math
 * @property {Number[]} Ops.Boolean
 * @property {Number[]} Ops.Date
 * @property {Number[]} Ops.Color
 * @property {Number[]} Ops.Time
 * @property {Number[]} Ops.Anim
 * @property {Number[]} Ops.Number
 * @property {Number[]} Ops.Sidebar
 * @property {Number[]} Ops.Json
 * @property {Number[]} Ops.Html
 * @property {Number[]} Ops.Net
 * @property {Number[]} Ops.WebAudio
 * @property {Number[]} Ops.Gl
 * @property {Number[]} Ops.Trigger
 * @property {Number[]} Ops.Graphics
 */
/**
 * @typedef theme_textedit
 */
/**
 * @typedef theme_colors_timeline
 * @property {Number[]} background
 * @property {Number[]} background_hover
 * @property {Number[]} overview_background
 * @property {Number[]} overview_bar
 * @property {Number[]} cursor
 * @property {Number[]} key_cliparea
 * @property {Number[]} key_bezier
 * @property {Number[]} key
 * @property {Number[]} key_selected
 * @property {Number[]} spline
 * @property {Number[]} spline_hover
 * @property {Number[]} spline_selectedkeys
 * @property {Number[]} spline_outside
 * @property {Number[]} spline_outside_hover
 * @property {Number[]} spline_outside_selectedkeys
 * @property {Number[]} key_readonly
 * @property {Number[]} spline_readonly
 * @property {Number[]} spline_outside_readonly
 * @property {Number[]} ruler_frames
 * @property {Number[]} ruler_background
 * @property {Number[]} ruler_tick
 * @property {Number[]} ruler_text
 */
/**
 * @typedef theme_colors_patch
 * @property {Number[]} opBgRectSelected
 * @property {Number[]} selected
 * @property {Number[]} selectedCable
 * @property {Number[]} patchSelectionArea
 * @property {Number[]} opTitleExt
 * @property {Number[]} background
 * @property {Number[]} opBoundsRect
 * @property {Number[]} opBgRect
 * @property {Number[]} opErrorWarning
 * @property {Number[]} opError
 * @property {Number[]} opErrorHint
 * @property {Number[]} opNotWorkingCross
 * @property {Number[]} patchComment
 */
/**
 * @typedef theme_colors_html
 * @property {Number[]} text-color
 */
/**
 * @typedef theme_patch
 * @property {number} selectedOpBorderX
 * @property {number} selectedOpBorderY
 * @property {number} cablesWidth
 * @property {number} cablesWidthSelected
 * @property {number} cablesCurveY
 * @property {number} cablesSubDivde
 * @property {number} opStateIndicatorSize
 * @property {number} fadeOutDistStart
 * @property {number} fadeOutFadeDist
 * @property {number} fadeOutFadeOpacity
 * @property {number} cableButtonSize
 */
/**
 * @typedef theme_colors_vizlayer
 * @property {Number[]} colorText
 * @property {Number[]} colorBackground
 * @property {Number[]} colorLineNumbers
 */

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
