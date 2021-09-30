
export default function setHtmlDefaultListeners()
{
    // show context menu only on input fields/images etc...
    document.body.addEventListener("contextmenu", (e) =>
    {
        if (e.target.currentSrc) return;
        if (e.target.classList.contains("selectable")) return;
        if (e.target.nodeName == "TEXTAREA" || e.target.nodeName == "INPUT") return;

        e.preventDefault();
    });


    window.addEventListener("error", (e) =>
    {
        setTimeout(function ()
        {
            if (!CABLES.lastError)
            {
                CABLES.UI.MODAL.showException(e);
            }
        }, 100);
    });


    document.body.addEventListener("dragstart", (e) =>
    {
        if (e.target.nodeName == "TEXTAREA" || e.target.nodeName == "INPUT")
        {
            e.preventDefault();
            return false;
        }
    });
}
