import { Logger } from "cables-shared-client";
import Gui, { gui } from "../gui.js";
import { fileUploader } from "../dialogs/upload.js";

/**
 * handle global html events like uncaught exceptions, contextmenu, resize etc
 *
 * @export
 */
export default function setHtmlDefaultListeners()
{
    const _log = new Logger("errorListener");

    document.addEventListener("paste", (e) =>
    {
        if (gui.getRestriction() < Gui.RESTRICT_MODE_FULL) return;

        let items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (let index in items)
        {
            let item = items[index];
            if (item.kind === "file")
            {
                let blob = item.getAsFile();
                fileUploader.uploadFile(blob, "paste_" + CABLES.shortId() + "_" + blob.name);
                return;
            }
        }

        const aEl = document.activeElement;
        if (aEl.tagName == "TEXTAREA" || aEl.tagName == "INPUT") return;
        else if (gui.patchView._patchRenderer && gui.patchView._patchRenderer.isFocused()) gui.patchView._patchRenderer.paste(e);
        else if (gui.timeLine() && gui.timeLine().isFocused()) gui.timeLine().paste(e);
    });

    document.addEventListener("copy", (e) =>
    {
        if (!gui.patchView._patchRenderer) return;

        const aEl = document.activeElement;

        if (aEl.tagName == "TEXTAREA" || aEl.tagName == "INPUT") return;
        else if (gui.patchView._patchRenderer && gui.patchView._patchRenderer.isFocused()) gui.patchView._patchRenderer.copy(e);
        else if (gui.timeLine() && gui.timeLine().isFocused()) gui.timeLine().copy(e);
    });

    document.addEventListener("cut", (e) =>
    {
        if (gui.patchView._patchRenderer && gui.patchView._patchRenderer.isFocused()) gui.patchView._patchRenderer.cut(e);
        else if (gui.timeLine() && gui.timeLine().isFocused()) gui.timeLine().cut(e);
    });

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

    document.addEventListener("visibilitychange", function ()
    {
        console.log("vischange");
        if (gui && !document.hidden)
        {
            gui.setLayout();
            gui.patchView.store.checkUpdated(null, false, true);
        }
    }, false);

    window.addEventListener("focus", (event) =>
    {
        if (gui && !document.hidden)
        {
            gui.setLayout();
            gui.patchView.store.checkUpdated(null, false, true);
        }
    });
}
