CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.Bookmarks=function()
{
    var bookmarks=[];

    this.show=function()
    {
        var subs=gui.patch().getSubPatches();

        var bm=[];
        for(var i in bookmarks)
        {
            var op=gui.patch().scene.getOpById(bookmarks[i]);



            if(op)
            {
                bm.push(
                    {
                        id:bookmarks[i],
                        name:op.name,
                        class:CABLES.UI.uiConfig.getNamespaceClassName(op.objName)
                    });
            }
            else
            {
                console.log("op not found",bookmarks[i]);
                bookmarks[i]=null;

            }
        }

        var html = CABLES.UI.getHandleBarHtml('bookmarks', { "bookmarks":bm,"subPatches":subs });
        $('#meta_content_bookmarks').html(html);
    };

    this.set=function(arr)
    {
        if(arr)
        {
            bookmarks=arr;
            for(var i in bookmarks) console.log(bookmarks[i]);
        }
    };

    this.remove=function(id)
    {
        if(id)
        {
            for(var i in bookmarks)
            {
                if(bookmarks[i]==id)bookmarks[i]=null;
            }
        }

        while(bookmarks.indexOf(null)>=0)
            bookmarks.splice(bookmarks.indexOf(null),1);

        this.show();
    };

    this.add=function(id)
    {

        var ops=gui.patch().getSelectedOps();
        if(!id && ops.length>0)
        {
            id=ops[0].op.id;
        }

        if(id)
        {
            for(var i in bookmarks) if(bookmarks[i]==id)return;

            console.log(id);
            bookmarks.push(id);
            this.show();
            gui.patch().focusOp(id);
            CABLES.UI.notify("Bookmark added!");
        }

    };

    this.goto=function(id)
    {
        gui.patch().setSelectedOpById(id);
        gui.patch().centerViewBoxOps();
        gui.patch().focusOp(id);

    };

    this.getBookmarks=function()
    {
        return bookmarks;
    };
};
