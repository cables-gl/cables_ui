import { notify } from "../elements/notification.js";
import { gui } from "../gui.js";
import opNames from "../opnameutils.js";
import text from "../text.js";
import { getHandleBarHtml } from "../utils/handlebars.js";

/**
 * Managing bookmarks of a patch. bookmarks will be displayed in the param panel when no op is selected
 *
 * @export
 * @class Bookmarks
 */
export default class Bookmarks
{
    constructor()
    {
        this._bookmarks = [];
        this._dynCmds = [];
        this.needRefreshSubs = true;
        this._subs = null;
        // this._subpatchOps = {};
    }

    hasBookmarkWithId(id)
    {
        for (let i = 0; i < this._bookmarks.length; i++)
            if (this._bookmarks[i] === id) return true;

        return false;
    }

    cleanUp()
    {
        for (let i in this._bookmarks)
        {
            const op = gui.corePatch().getOpById(this._bookmarks[i]);
            if (!op) this._bookmarks[i] = null;
        }
    }

    getHtml()
    {
        // if (this.needRefreshSubs)
        // {
        //     const subs = gui.patchView.getSubPatches(true);
        //     const perf = gui.uiProfiler.start("bookmark panel subpatches");

        //     this.needRefreshSubs = false;
        //     for (let i = 0; i < subs.length; i++)
        //     {
        //         const subPatchId = subs[i].id;

        //         subs[i].path = gui.patchView.getSubpatchPathArray(subPatchId, null, true);
        //         let sortname = "";

        //         for (let j = 0; j < subs[i].path.length; j++)
        //             sortname = subs[i].path[j].name + "+" + sortname;

        //         subs[i].sortname = sortname;
        //     }

        //     subs.sort(function (a, b) { return a.sortname.localeCompare(b.sortname); });

        //     for (let i = 0; i < subs.length; i++)
        //     {
        //         subs[i].indent = "";
        //         for (let j = 0; j < subs[i].path.length; j++)
        //         {
        //             subs[i].indent += "&nbsp;&nbsp;&nbsp;&nbsp;";
        //         }
        //     }
        //     this._subs = subs;

        //     perf.finish();
        // }

        const perf = gui.uiProfiler.start("bookmarks");

        const bm = [];
        for (const i in this._bookmarks)
        {
            const op = gui.corePatch().getOpById(this._bookmarks[i]);

            if (op)
            {
                bm.push(
                    {
                        "id": this._bookmarks[i],
                        "name": op.name,
                        "objName": op.objName,
                        "class": opNames.getNamespaceClassName(op.objName),
                    });
            }
        }
        bm.sort(function (a, b) { return a.name.localeCompare(b.name); });

        perf.finish();

        const perf2 = gui.uiProfiler.start("bookmarks handlebars");
        let html = getHandleBarHtml("bookmarks", { "bookmarks": bm, "subPatches": this._subs, "currentSubPatch": gui.patchView.getCurrentSubPatch() });
        perf2.finish();

        // const perf3 = gui.uiProfiler.start("update dynamic commands");
        // this.updateDynamicCommands();
        // perf3.finish();

        return html;
    }

    set(arr)
    {
        for (let i = 0; i < this._bookmarks.length; i++) this.setBoookmarkUiAttr(this._bookmarks[i], false);

        if (arr) this._bookmarks = arr;

        this.updateDynamicCommands();
    }

    setBoookmarkUiAttr(id, bookmarked)
    {
        const op = gui.corePatch().getOpById(id);
        if (op)op.setUiAttrib({ "bookmarked": bookmarked });
    }

    remove(id)
    {
        if (id)
        {
            this.setBoookmarkUiAttr(id, false);
            for (const i in this._bookmarks)
            {
                if (this._bookmarks[i] == id) this._bookmarks[i] = null;
            }
        }

        while (this._bookmarks.indexOf(null) >= 0) this._bookmarks.splice(this._bookmarks.indexOf(null), 1);
        gui.corePatch().emitEvent("bookmarkschanged");
    }

    add(id)
    {
        if (id)
        {
            this.setBoookmarkUiAttr(id, true);
            for (const i in this._bookmarks)
            {
                if (this._bookmarks[i] == id)
                {
                    this.remove(id);

                    const elements = document.getElementsByClassName("toggle-bookmark-button");
                    for (let eli = 0; eli < elements.length; eli++)
                    {
                        elements[eli].classList.remove("icon-bookmark-filled");
                        elements[eli].classList.add("icon-bookmark");
                    }
                    notify(text.bookmark_removed);
                    return;
                }
            }

            this._bookmarks.push(id);

            const elements = document.getElementsByClassName("toggle-bookmark-button");
            for (let eli = 0; eli < elements.length; eli++)
            {
                elements[eli].classList.add("icon-bookmark-filled");
                elements[eli].classList.remove("icon-bookmark");
            }

            gui.patchView.centerSelectOp(id);
            notify(text.bookmark_added);
            gui.corePatch().emitEvent("bookmarkschanged");
        }

        this.updateDynamicCommands();
    }

    goto(id)
    {
        if (!gui.keys.shiftKey)
        {
            const op = gui.corePatch().getOpById(id);
            gui.opParams.show(op);
        }
        else
        {
            gui.patchView.centerSelectOp(id);
        }
    }

    getBookmarks()
    {
        const bm = [];
        for (let i = 0; i < this._bookmarks.length; i++)
        {
            if (this._bookmarks[i] != null) bm.push(this._bookmarks[i]);
        }

        return bm;
    }

    updateDynamicCommands()
    {
        for (let i = 0; i < this._bookmarks.length; i++) this.setBoookmarkUiAttr(this._bookmarks[i], true);

        for (let i = 0; i < this._dynCmds.length; i++)
            gui.cmdPalette.removeDynamic(this._dynCmds[i]);

        for (let i = 0; i < this._bookmarks.length; i++)
        {
            const op = gui.corePatch().getOpById(this._bookmarks[i]);

            if (!op) continue;
            const cmd = gui.cmdPalette.addDynamic("bookmark", "" + op.getTitle(), () =>
            {
                gui.patchView.centerSelectOp(op.id);
            }, "bookmark");

            this._dynCmds.push(cmd);
        }

        const subs = gui.patchView.getSubPatches(false);
        for (let i = 0; i < subs.length; i++)
        {
            const sub = subs[i];

            const cmd = gui.cmdPalette.addDynamic("subpatch", "" + sub.name, () =>
            {
                gui.patchView.setCurrentSubPatch(sub.id);
                CABLES.CMD.UI.centerPatchOps();
            }, "subpatch");

            this._dynCmds.push(cmd);
        }
    }
}
