CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.Bookmarks = function ()
{
    let bookmarks = [];

    this.hasBookmarkWithId = function (id)
    {
        for (let i = 0; i < bookmarks.length; i++)
        {
            const bm = bookmarks[i];
            if (bm === id)
            {
                return true;
            }
        }
        return false;
    };


    this.cleanUp = function ()
    {
        let i;

        for (i in bookmarks)
        {
            const op = gui.corePatch().getOpById(bookmarks[i]);
            if (!op) bookmarks[i] = null;
        }
    };

    this.getHtml = function ()
    {
        const subs = gui.patchView.getSubPatches(true);

        const bm = [];
        for (const i in bookmarks)
        {
            const op = gui.corePatch().getOpById(bookmarks[i]);

            if (op)
            {
                bm.push({
                    "id": bookmarks[i],
                    "name": op.name,
                    "objName": op.objName,
                    "class": CABLES.UI.uiConfig.getNamespaceClassName(op.objName),
                });
            }
            else
            {
                // console.log("op not found",bookmarks[i]);
            }
        }

        const html = CABLES.UI.getHandleBarHtml("bookmarks", { "bookmarks": bm, "subPatches": subs, "currentSubPatch": gui.patchView.getCurrentSubPatch() });
        return html;
    };

    this.set = function (arr)
    {
        if (arr) bookmarks = arr;
    };

    this.remove = function (id)
    {
        if (id)
        {
            for (const i in bookmarks)
            {
                if (bookmarks[i] == id) bookmarks[i] = null;
            }
        }

        while (bookmarks.indexOf(null) >= 0) bookmarks.splice(bookmarks.indexOf(null), 1);
    };

    this.add = function (id)
    {
        if (id)
        {
            for (const i in bookmarks)
            {
                if (bookmarks[i] == id)
                {
                    this.remove(id);

                    const elements = document.getElementsByClassName("toggle-bookmark-button");
                    for (let eli = 0; eli < elements.length; eli++)
                    {
                        console.log(eli, elements[eli].classList);
                        elements[eli].classList.remove("icon-bookmark-filled");
                        elements[eli].classList.add("icon-bookmark");
                    }
                    CABLES.UI.notify(CABLES.UI.TEXTS.bookmark_removed);
                    return;
                }
            }

            bookmarks.push(id);

            const elements = document.getElementsByClassName("toggle-bookmark-button");
            for (let eli = 0; eli < elements.length; eli++)
            {
                console.log(eli, elements[eli].classList);
                elements[eli].classList.add("icon-bookmark-filled");
                elements[eli].classList.remove("icon-bookmark");
            }

            gui.patchView.centerSelectOp(id);
            CABLES.UI.notify(CABLES.UI.TEXTS.bookmark_added);
        }
    };

    this.goto = function (id)
    {
        if (gui.keys.shiftKey)
        {
            const op = gui.corePatch().getOpById(id);
            gui.opParams.show(op);
        }
        else
        {
            gui.patchView.centerSelectOp(id);
            // gui.patchView.focusOp(id);
            // gui.patch().setSelectedOpById(id);
            // gui.patch().centerViewBoxOps();
            // gui.patchView.centerSelectOp(id);
        }
    };

    this.getBookmarks = function ()
    {
        const bm = [];
        for (let i = 0; i < bookmarks.length; i++)
        {
            if (bookmarks[i] != null) bm.push(bookmarks[i]);
        }

        return bm;
    };
};
