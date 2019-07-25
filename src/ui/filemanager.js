CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.FileManager=function()
{
    this._manager=new CABLES.UI.ItemManager(gui.mainTabs);
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
    if(detailItems.length==0)
    {
        html="no file selected...";
    }
    else
    if(detailItems.length==1)
    {
        CABLES.api.get(
            'project/' + gui.patch().getCurrentProject()._id + '/file/info/' + detailItems[0].id,
            function(r) {
            
                html = CABLES.UI.getHandleBarHtml('tab_filemanager_details', {
                    "projectId": gui.patch().getCurrentProject()._id,
                    "file": r
                });
    
                $('#item_details').html(html);
            });

    }
    else
    {
        html="<center><br/><br/><br/>"+detailItems.length+" files selected"+"</center>";
    }
    document.getElementById("item_details").innerHTML=html;


}