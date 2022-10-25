import ele from "../utils/ele";

export default function setHtmlDefaultListeners()
{
    // show context menu only on input fields/images etc...
    document.body.addEventListener("contextmenu", (e) =>
    {
        if (e.target.currentSrc) return;
        if (e.target.classList.contains("selectable")) return;
        if (e.target.nodeName == "TEXTAREA" || e.target.nodeName == "INPUT") return;

        // if (ele.byId("cablescanvas").contains(e.target)) return;
        e.preventDefault();
    });


    window.addEventListener("error", (e) =>
    {
        setTimeout(function ()
        {
            if (!CABLES.lastError)
            {
                new CABLES.UI.ModalError({ "exception": e });
            }
        }, 100);
    });


    document.body.addEventListener("dragstart", (e) =>
    {
        if (!e.target.draggable || !e.target.classList.contains("draggable") || e.target.nodeName == "TEXTAREA" || e.target.nodeName == "INPUT")
        {
            e.preventDefault();
            return false;
        }
    });

    // const ttObserver = new MutationObserver(function (mutations)
    // {
    //     mutations.forEach(function (mutation)
    //     {
    //         for (let i = 0; i < mutation.addedNodes.length; i++)
    //         {
    //             if (!mutation.addedNodes[i].tagName) continue;

    //             const perf = CABLES.UI.uiProfiler.start("html ele change");
    //             perf.finish();
    //         }
    //     });
    // });
    // ttObserver.observe(document.body, { "attributes": true, "childList": true, "characterData": false, "subtree": true });
}
