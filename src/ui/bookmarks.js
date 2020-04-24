CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.Bookmarks = function ()
{
    var bookmarks = [];

    this.hasBookmarkWithId = function (id)
    {
        for (var i = 0; i < bookmarks.length; i++)
        {
            var bm = bookmarks[i];
            if (bm === id)
            {
                return true;
            }
        }
        return false;
    };

    this.cleanUp = function ()
    {
        var i;

        for (i in bookmarks)
        {
            var op = gui.patch().scene.getOpById(bookmarks[i]);
            if (!op) bookmarks[i] = null;
        }
    };

    this.getHtml = function ()
    {
        var subs = gui.patch().getSubPatches(true);

        var bm = [];
        for (i in bookmarks)
        {
            var op = gui.patch().scene.getOpById(bookmarks[i]);

            if (op)
            {
                bm.push({
                    id: bookmarks[i],
                    name: op.name,
                    objName: op.objName,
                    class: CABLES.UI.uiConfig.getNamespaceClassName(op.objName),
                });
            }
            else
            {
                // console.log("op not found",bookmarks[i]);
            }
        }

        var html = CABLES.UI.getHandleBarHtml("bookmarks", { bookmarks: bm, subPatches: subs });
        // $('#meta_content_bookmarks').html(html);
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
            for (var i in bookmarks)
            {
                if (bookmarks[i] == id) bookmarks[i] = null;
            }
        }

        while (bookmarks.indexOf(null) >= 0) bookmarks.splice(bookmarks.indexOf(null), 1);
    };

    this.add = function (id)
    {
        var ops = gui.patch().getSelectedOps();
        if (!id && ops.length > 0)
        {
            id = ops[0].op.id;
        }

        if (id)
        {
            for (var i in bookmarks)
            {
                if (bookmarks[i] == id)
                {
                    this.remove(id);
                    $(".toggle-bookmark-button")
                        .removeClass("icon-bookmark-filled")
                        .addClass("icon-bookmark");
                    CABLES.UI.notify(CABLES.UI.TEXTS.bookmark_removed);
                    return;
                }
            }

            bookmarks.push(id);
            $(".toggle-bookmark-button")
                .removeClass("icon-bookmark")
                .addClass("icon-bookmark-filled");
            gui.patch().focusOp(id);
            CABLES.UI.notify(CABLES.UI.TEXTS.bookmark_added);
        }
    };

    this.goto = function (id)
    {
        if (gui.keys.shiftKey)
        {
            console.log("YES");
            var op = gui.patch().scene.getOpById(id);
            gui.patch().showOpParams(op);
        }
        else
        {
            gui.patch().setSelectedOpById(id);
            gui.patch().centerViewBoxOps();
            gui.patch().focusOp(id);
        }
    };

    this.getBookmarks = function ()
    {
        var bm = [];
        for (var i = 0; i < bookmarks.length; i++)
        {
            if (bookmarks[i] != null) bm.push(bookmarks[i]);
        }

        return bm;
    };
};
