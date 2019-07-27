CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.FileManager=function(cb)
{
    this._manager=new CABLES.UI.ItemManager("Files",gui.mainTabs);
    this._filePortEle=null;
    this._firstTimeOpening=true;

    gui.maintabPanel.show();
    CABLES.UI.userSettings.set("fileManagerOpened",true);

    this.reload(cb);

    this._manager.addEventListener("onItemsSelected",function(items)
    {
        this.setDetail(items);
    }.bind(this));

    this._manager.addEventListener("onClose",function()
    {
        CABLES.UI.userSettings.set("fileManagerOpened",false);
        gui.fileManager=null;
        console.log("filemanager close!!");
    });

};

CABLES.UI.FileManager.prototype.show=function()
{
    gui.maintabPanel.show();
}

CABLES.UI.FileManager.prototype.refresh=function()
{
    this.setSource("patch");
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


CABLES.UI.FileManager.prototype.reload=function(cb)
{
    function createItem(items,file)
    {
        var item={
            "title":file.n,
            "id":file._id||'lib'+CABLES.uuid(),
            "p":file.p
        };

        item.icon="file";
        
        if(file.t=='SVG') item.preview=file.p;
        else if(file.t=='image') item.preview=file.p;
        else if(file.t=='3d json') item.icon="cube";
        else if(file.t=='video') item.icon="film";
        else if(file.t=='audio') item.icon="headphones";
        else if(file.t=='dir') item.divider=file.n;
        
        // if(Math.random()>0.5)item.selected=true;
        items.push(item);
        if(file.c) for(var i=0;i<file.c.length;i++) createItem(items,file.c[i]);
    }


    this._manager.clear();
    var assetPath = '/assets/library/';
    var apiPath = 'library/';

    if(this._firstTimeOpening)this._fileSource = 'patch';

    if (this._fileSource == 'patch')
    {
        assetPath = '/assets/' + gui.patch().getCurrentProject()._id;
        apiPath = 'project/' + gui.patch().getCurrentProject()._id + '/files/';
    }

    CABLES.api.get(apiPath, 
        function(files)
        {
            if(this._firstTimeOpening && files.length==0)
            {
                this._firstTimeOpening=false;
                this._fileSource = 'lib';
                this.reload();
                return;
            }

            this._firstTimeOpening=false;

            var items=[];

            for(var i=0;i<files.length;i++)
            {
                var file=files[i];

                createItem(items,file);
            }

            this._manager.setItems(items);
            this.updateHeader();
            if(cb)cb();

        }.bind(this));
}


CABLES.UI.FileManager.prototype.setSource=function(s,cb)
{
    this._fileSource=s;
    this.reload(cb);
    this.updateHeader();
}

CABLES.UI.FileManager.prototype._selectFile=function(filename)
{
    this._manager.unselectAll();
    const item=this._manager.getItemByTitleContains(filename);
    if(!item)return;
    this._manager.selectItemById(item.id);
    const el=document.getElementById("item"+item.id)
    if(el)el.scrollIntoView();

}

CABLES.UI.FileManager.prototype.selectFile=function(filename)
{
    console.log('--------------------',filename.indexOf(gui.patch().getCurrentProject()._id) );

    if(this._fileSource!="patch") 
    {
        if(filename.indexOf(gui.patch().getCurrentProject()._id)>-1)
            this.setSource("patch",function()
            {
                this._selectFile(filename);
            }.bind(this));
    }
    else 
    {
        console.log("egal");
        this._selectFile(filename);
    }
}


CABLES.UI.FileManager.prototype.setDisplay=function(type)
{
    this._manager.setDisplay(type);
}


CABLES.UI.FileManager.prototype.updateHeader=function(detailItems)
{
    
    const html = CABLES.UI.getHandleBarHtml('filemanager_header', {
        "fileSelectOp": this._filePortOp,
        "source":this._fileSource
    });
    $('#itemmanager_header').html(html);

    const elSwitchIcons=document.getElementById("switch-display-icons");
    const elSwitchList=document.getElementById("switch-display-list");
    

    if(elSwitchIcons) elSwitchIcons.addEventListener("click",function()
    {
        elSwitchIcons.classList.add("switch-active");
        elSwitchList.classList.remove("switch-active");
        this.setDisplay("icons");
    }.bind(this));
    if(elSwitchList) elSwitchList.addEventListener("click",function()
    {
        elSwitchList.classList.add("switch-active");
        elSwitchIcons.classList.remove("switch-active");
        this.setDisplay("list");
    }.bind(this));
    

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
                        if(r.success) this._manager.removeItem(itemId);
                            else CABLES.UI.notifyError("error: could not delete file");

                    }.bind(this));
                }.bind(this));
            }.bind(this));


        if(this._filePortEle)
        {
            // console.log("SET port");
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
        html='<center><br/><br/>'+detailItems.length+' files selected<br/><br/><br/>';
        if(this._fileSource=="patch") html+='<a class="button" id="filesdeletmulti">delete '+detailItems.length+' files</a>';
        html+='</center>';


        document.getElementById("item_details").innerHTML=html;

        const elDelMulti=document.getElementById("filesdeletmulti");
        if(elDelMulti) elDelMulti.addEventListener("click",function(e)
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