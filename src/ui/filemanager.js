CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.FileManager=function(cb)
{
    this._manager=new CABLES.UI.ItemManager("Files",gui.mainTabs);

    this._filePortEle=null;

    gui.maintabPanel.show();

    var which='projectfiles';

    if (which == 'projectfiles') {
        assetPath = '/assets/' + gui.patch().getCurrentProject()._id;
        apiPath = 'project/' + gui.patch().getCurrentProject()._id + '/files/';
    }
    if (which == 'library') {
        assetPath = '/assets/library/';
        apiPath = 'library/';
    }

    this._manager.addEventListener("onItemsSelected",function(items)
    {
        this.setDetail(items);
    }.bind(this));

    CABLES.api.get(apiPath, 
        function(files)
        {
            var items=[];

            for(var i=0;i<files.length;i++)
            {
                var file=files[i];
                var item={
                    "title":file.name,
                    "id":file._id,
                    "p":file.p
                };

                item.icon="file";
                
                if(file.t=='SVG') item.preview=file.p;
                else if(file.t=='image') item.preview=file.p;
                else if(file.t=='3d json') item.icon="cube";
                else if(file.t=='video') item.icon="film";
                else if(file.t=='audio') item.icon="headphones";
                
                // if(Math.random()>0.5)item.selected=true;
                items.push(item);
                
            }

            this._manager.setItems(items);
            if(cb)cb();

        }.bind(this));



};

CABLES.UI.FileManager.prototype.show=function()
{
    gui.maintabPanel.show();
}

CABLES.UI.FileManager.prototype.setFilePort=function(portEle,op)
{
    if(!portEle)
    {
        this._filePortEle=null;
        this._filePortOp=null;
        this.updateHeader();
        return;
    }
    this._filePortEle=portEle;
    this._filePortOp=op;
    this.updateHeader();
}

CABLES.UI.FileManager.prototype.selectFile=function(filename)
{
    this._manager.unselectAll();
    var item=this._manager.getItemByTitleContains(filename);
    if(!item)return;
    this._manager.selectItemById(item.id);
    document.getElementById("item"+item.id).scrollIntoView();
}

CABLES.UI.FileManager.prototype.updateHeader=function(detailItems)
{
    
    const html = CABLES.UI.getHandleBarHtml('filemanager_header', {
        "fileSelectOp": this._filePortOp
    });
    $('#itemmanager_header').html(html);

}

CABLES.UI.FileManager.prototype.setDetail=function(detailItems)
{
    var html = "";
    document.getElementById("item_details").innerHTML='';
    
    if(detailItems.length==1)
    {
        const itemId=detailItems[0].id;
        CABLES.api.get(
            'project/' + gui.patch().getCurrentProject()._id + '/file/info/' + itemId,
            function(r) {

                html = CABLES.UI.getHandleBarHtml('filemanager_details', {
                    "projectId": gui.patch().getCurrentProject()._id,
                    "file": r
                });
                
                $('#item_details').html(html);

                document.getElementById("filedelete"+itemId).addEventListener("click",function(e)
                {
                    CABLES.api.delete('project/'+gui.patch().getCurrentProject()._id+'/file/'+r.fileDb._id,null,
                    function(r)
                    {
                        if(r.success)
                        {
                            this._manager.removeItem(itemId);
                        }
                        else
                        {
                            CABLES.UI.notifyError("error: could not delete file");
                        }
                    }.bind(this));
                }.bind(this));
            }.bind(this));


        if(this._filePortEle)
        {
            console.log("SET port");
            this._filePortEle.value=detailItems[0].p;
            var event = document.createEvent('Event');
            event.initEvent('input', true, true);
            this._filePortEle.dispatchEvent(event);
            gui.patch().showOpParams(this._filePortOp);
        }

        // var highlightBg = "#fff";
        // var originalBg = $(_id).css("background-color");
        // $(_id).stop().css("opacity", 0);
        // $(_id).animate({
        //     "opacity": 1
        // }, 1000);

        // if (this.currentOpid) {
        //     gui.patch().showOpParams(gui.scene().getOpById(this.currentOpid));
        // }

        // CABLES.UI.fileSelect.showPreview(_url, fileid);
        
    }
    
    else if(detailItems.length>1)
    {
        html='<center><br/><br/>'+detailItems.length+' files selected<br/><br/><br/><a class="button" id="filesdeletmulti">delete '+detailItems.length+' files</a></center>';
        document.getElementById("item_details").innerHTML=html;

        document.getElementById("filesdeletmulti").addEventListener("click",function(e)
        {
            console.log(detailItems);
            
            this._manager.unselectAll();

            for(var i=0;i<detailItems.length;i++)
            {
                const detailItem=detailItems[i];
                CABLES.api.delete('project/'+gui.patch().getCurrentProject()._id+'/file/'+detailItem.id,null,
                    function(r)
                    {
                        if(r.success) this._manager.removeItem(detailItem.id);
                            else CABLES.UI.notifyError("error: could not delete file");

                        this._manager.unselectAll();
                    }.bind(this)
                    ,function(r)
                    {
                        console.log("api err",r);
                    });
            }
        }.bind(this));
    }


}