CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.FileManager=function()
{
    this._manager=new CABLES.UI.ItemManager("Files",gui.mainTabs);
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
                    "id":file._id
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

        }.bind(this));



};


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

                html = CABLES.UI.getHandleBarHtml('tab_filemanager_details', {
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