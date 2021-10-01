
let lastNotify = "";
let lastText = "";

export function notifyError(title, text)
{
    iziToast.error(
        {
            "position": "topRight", // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter, center
            "theme": "dark",
            title,
            "message": text || "",
            "progressBar": false,
            "animateInside": false,
            "close": false,
            "timeout": 2000
        });
}

export function notify(title, text)
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

    lastNotify = title;
    lastText = text;

    iziToast.show(
        {
            "position": "topRight", // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter, center
            "theme": "dark",
            title,
            "message": text || "",
            "progressBar": false,
            "animateInside": false,
            "close": false,
            "timeout": 2000
        });
}
