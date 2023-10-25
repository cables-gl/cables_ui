
let lastNotify = "";
let lastText = "";

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
 * @class
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
    const force = options.force || false;

    if (!force)
    {
        if (title === lastNotify && text === lastText)
        {
            return;
        }
    }

    lastNotify = title;
    lastText = text;

    const toastId = CABLES.uuid();

    iziToast.error(
        {
            "id": toastId,
            "position": "topRight", // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter, center
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


export function notifyWarn(title, text, options = {})
{
    const timeout = options.hasOwnProperty("timeout") ? options.timeout : 2000;
    const closeable = options.closeable || false;
    const force = options.force || false;

    if (!force)
    {
        if (title === lastNotify && text === lastText)
        {
            return;
        }
    }

    lastNotify = title;
    lastText = text;

    const toastId = CABLES.uuid();

    iziToast.warning(
        {
            "id": toastId,
            "position": "topRight", // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter, center
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
 * @class
 * @example
 * notify("update", "cables has been updated",
 * {
 *     "timeout": 1000,
 *     "closeable": false
 * });
 */
export function notify(title, text, options = {})
{
    if (gui.isRemoteClient) return;

    const timeout = options.timeout || 2000;
    const closeable = options.closeable || false;
    const force = options.force || false;

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

    const toastId = CABLES.uuid();

    iziToast.show(
        {
            "id": toastId,
            "position": "topRight", // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter, center
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
