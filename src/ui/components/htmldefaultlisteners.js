import { Logger } from "cables-shared-client";
import { gui } from "../gui.js";

/**
 * handle global html events like uncaught exceptions, contextmenu, resize etc
 *
 * @export
 */
export default function setHtmlDefaultListeners()
{
    const _log = new Logger("errorListener");

    // const observer = new PerformanceObserver((list) =>
    // {

    //     let entries = list.getEntries();
    //     for (let i = 0; i < entries.length; i++)
    //     {
    //         console.log(entries[i]);
    //     }
    //     // longestBlockingLoAFs = longestBlockingLoAFs.concat(list.getEntries()).sort(
    //     //   (a, b) => b.blockingDuration - a.blockingDuration
    //     // ).slice(0, MAX_LOAFS_TO_CONSIDER);
    // });
    // observer.observe({ "type": "long-animation-frame", "buffered": true });

    // show context menu only on input fields/images etc...
    document.body.addEventListener("contextmenu",

        /**
         * @param {Event} e
         */
        (e) =>
        {
            if (e.target.currentSrc) return;
            if (e.target.classList.contains("selectable")) return;
            if (e.target.nodeName == "TEXTAREA" || e.target.nodeName == "INPUT") return;

            // if (ele.byId("cablescanvas").contains(e.target)) return;
            e.preventDefault();
        });

    window.addEventListener("unhandledrejection", function (e)
    {
        if (e.reason && e.reason.message && e.reason.message == "The user has exited the lock before this request was completed.") return true; // ignore this......

        _log.error(e);
    });

    window.addEventListener("error", (e) =>
    {
        if (e && e.message && e.message.indexOf("/js/ace/worker-javascript.") > -1)
        {
            _log.log("yay! suppressed nonsense ace editor exception... ");
            return;
        }

        if (e && e.exception && String(e.exception.stack).indexOf("file:blob:") == 0)
        {
            _log.log("ignore file blob exception...");
            return;
        }

        if (!CABLES.lastError != e)
        {
            _log.error(e);
            CABLES.lastError = e;
        }
    });

    document.body.addEventListener("dragstart", (e) =>
    {
        if (!e.target.draggable || !e.target.classList.contains("draggable") || e.target.nodeName == "TEXTAREA" || e.target.nodeName == "INPUT")
        {
            e.preventDefault();
            return false;
        }
    });

    window.addEventListener("resize", () =>
    {
        if (window.gui) gui.onResize();

    }, false);

    window.addEventListener("message", (event) =>
    {
        if (CABLESUILOADER.cfg && (event.origin !== CABLESUILOADER.cfg.urlCables)) return;
        if (event.data && event.data.type === "hashchange")
        {
            window.location.hash = event.data.data;
        }
    }, false);
}
