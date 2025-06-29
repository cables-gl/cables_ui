import { utils } from "cables";
import { gui } from "../gui.js";

let lastNotify = "";
let lastText = "";

let lastNotifyErr = "";
let lastTextErr = "";

let lastNotifyWarn = "";
let lastTextWarn = "";

/**
 * configuration object for loading a patch
 * @typedef {Object} NotificationDisplayOptions
 * @hideconstructor
 * @property {Number|Boolean} [timeout=2000] fade out notification after x ms, `false` to disable
 * @property {Boolean} [closeable=false] show closing button on notification
 * @property {Boolean} [force=false] force showing of notification even if last one was the same
 */

/**
 * notifyError displays an error as a toast-notification
 *
 *
 * @param title
 * @param text
 * @param {NotificationDisplayOptions} options The option object.
 * @example
 * notifyError("error", "something broke",
 * {
 *     "timeout": false,
 *     "closeable": true,
 * });
 */
export function notifyError(title, text, options = {})
{
    const timeout = options.hasOwnProperty("timeout") ? options.timeout : 2000;
    const closeable = options.closeable || false;
    const force = options.force;

    if (!force)
    {
        if (title === lastNotifyErr && text === lastTextErr)
        {
            setTimeout(function ()
            {
                lastNotifyErr = "";
                lastTextErr = "";
            }, 1000);
            return;
        }
    }

    lastNotifyErr = title;
    lastTextErr = text;

    const toastId = utils.uuid();

    iziToast.error(
        {
            "id": toastId,
            "position": "bottomRight", // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter, center
            "theme": "dark",
            "title": title,
            "message": text || "",
            "progressBar": false,
            "animateInside": false,
            "close": closeable,
            "timeout": timeout
        });

    return toastId;
}

export function notifyWarn(title, text = "", options = {})
{
    const timeout = options.hasOwnProperty("timeout") ? options.timeout : 2000;
    const closeable = options.closeable || false;
    const force = options.hasOwnProperty("force") ? options.force : true;

    if (!force)
    {
        if (title === lastNotifyWarn && text === lastTextWarn)
        {
            setTimeout(function ()
            {
                lastNotifyWarn = "";
                lastTextWarn = "";
            }, 1000);
            return;
        }
    }

    lastNotifyWarn = title;
    lastTextWarn = text;

    const toastId = utils.uuid();

    iziToast.warning(
        {
            "id": toastId,
            "position": "bottomRight", // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter, center
            "theme": "dark",
            "title": title,
            "message": text || "",
            "progressBar": false,
            "animateInside": false,
            "close": closeable,
            "timeout": timeout
        });

    return toastId;
}

/**
 * notify displays a toast-notification
 *
 *
 * @param title
 * @param text
 * @param {NotificationDisplayOptions} options The option object.
 * @example
 * notify("update", "cables has been updated",
 * {
 *     "timeout": 1000,
 *     "closeable": false
 * });
 */
export function notify(title, text = "", options = {})
{
    if (gui.isRemoteClient) return;

    const timeout = options.timeout || 2000;
    const closeable = options.closeable || false;
    const force = options.force || true;

    if (!force)
    {
        if (title == lastNotify && text == lastText)
        {
            setTimeout(function ()
            {
                lastNotify = "";
                lastText = "";
            }, 1000);
            return;
        }
    }

    lastNotify = title;
    lastText = text;

    const toastId = utils.uuid();

    iziToast.show(
        {
            "id": toastId,
            "position": "bottomRight", // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter, center
            "theme": "dark",
            "title": title,
            "message": text || "",
            "progressBar": false,
            "animateInside": false,
            "close": closeable,
            "timeout": timeout,
            "buttons": options.buttons || []
        });
    return toastId;
}

export function hideNotificaton(toastId)
{
    let toast = document.getElementById(toastId);
    if (toast) iziToast.hide({}, toast);
}
