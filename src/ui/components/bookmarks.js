import defaultops from "../defaultops";

export default class Bookmarks
{
    constructor()
    {
        this._bookmarks = [];
    }

    hasBookmarkWithId(id)
    {
        for (let i = 0; i < this._bookmarks.length; i++)
        {
            const bm = this._bookmarks[i];
            if (bm === id)
            {
                return true;
            }
        }
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
        const subs = gui.patchView.getSubPatches(true);

        const bm = [];
        for (const i in this._bookmarks)
        {
            const op = gui.corePatch().getOpById(this._bookmarks[i]);

            if (op)
            {
                bm.push({
                    "id": this._bookmarks[i],
                    "name": op.name,
                    "objName": op.objName,
                    "class": defaultops.getNamespaceClassName(op.objName),
                });
            }
            else
            {
            }
        }

        const html = CABLES.UI.getHandleBarHtml("bookmarks", { "bookmarks": bm, "subPatches": subs, "currentSubPatch": gui.patchView.getCurrentSubPatch() });
        return html;
    }

    set(arr)
    {
        if (arr) this._bookmarks = arr;
    }

    remove(id)
    {
        if (id)
        {
            for (const i in this._bookmarks)
            {
                if (this._bookmarks[i] == id) this._bookmarks[i] = null;
            }
        }

        while (this._bookmarks.indexOf(null) >= 0) this._bookmarks.splice(this._bookmarks.indexOf(null), 1);
    }

    add(id)
    {
        if (id)
        {
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
                    CABLES.UI.notify(CABLES.UI.TEXTS.bookmark_removed);
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
            CABLES.UI.notify(CABLES.UI.TEXTS.bookmark_added);
        }
    }

    goto(id)
    {
        if (gui.keys.shiftKey)
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
}
