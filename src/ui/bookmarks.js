CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.Bookmarks=function(projectId)
{
    var bookmarks=[];
    this.show=function()
    {
        var bm=[];
        for(var i in bookmarks)
        {
            var op=gui.patch().scene.getOpById(bookmarks[i]);

            if(op)
            {
                bm.push(
                    {
                        id:bookmarks[i],
                        name:op.name
                    });
            }
            else
            {
                bookmarks[i]=null;
            }
        }

        var html = CABLES.UI.getHandleBarHtml('bookmarks', { "bookmarks":bm });
        $('#meta_content_bookmarks').html(html);
    };

    this.set=function(arr)
    {

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
        {
            bookmarks.splice(bookmarks.indexOf(null),1);
        }
        this.show();

    };

    this.add=function()
    {
        var ops=gui.patch().getSelectedOps();
        if(ops.length>0)
        {
            var id=ops[0].op.id;

            for(var i in bookmarks) if(bookmarks[i]==id)return;

            console.log(id);
            bookmarks.push(id);
            this.show();
        }
    };

    this.goto=function(id)
    {
        gui.patch().setSelectedOpById(id);
        gui.patch().centerViewBoxOps();

    };

};
