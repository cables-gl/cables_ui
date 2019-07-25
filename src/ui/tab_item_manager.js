CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.ItemManager=function(tabs)
{

    CABLES.EventTarget.apply(this);

    this._tab=new CABLES.UI.Tab("item manager",
        {
            "icon":"file",
            "infotext":"tab_profiler",
            "padding":true});
    tabs.addTab(this._tab);

    this._items=[];
    this.updateHtml();

    // this._tab.addEventListener("onActivate",function()
    // {
    //     this.show();
    // }.bind(this));

};

CABLES.UI.ItemManager.prototype.updateHtml=function()
{
    var html = CABLES.UI.getHandleBarHtml('tab_itemmanager',{"items":this._items});
    this._tab.html('<div id="item_manager" class="item_manager">'+html+'</div>');
}

CABLES.UI.ItemManager.prototype.getItemById=function(id)
{
    for(var i=0;i<this._items.length;i++)
        if(id===this._items[i].id)
            return this._items[i];
}

CABLES.UI.ItemManager.prototype.updateSelectionHtml=function()
{
    for(var i=0;i<this._items.length;i++)
    {
        const item=this._items[i];
        if(item.selected) document.getElementById("item"+item.id).classList.add("selected");
            else document.getElementById("item"+item.id).classList.remove("selected");
    }
}

CABLES.UI.ItemManager.prototype.unselectAll=function()
{
    for(var i=0;i<this._items.length;i++) 
        this._items[i].selected=false;
    this.updateSelectionHtml();
}


CABLES.UI.ItemManager.prototype.toggleSelection=function(id)
{
    var item=this.getItemById(id);
    if(item)item.selected=!item.selected;
    this.updateSelectionHtml();
}

CABLES.UI.ItemManager.prototype.selectFile=function(id)
{
    var item=this.getItemById(id);
    if(item)item.selected=true;
    this.updateSelectionHtml();
}

CABLES.UI.ItemManager.prototype.updateDetailHtml=function(items)
{
    var detailItems=[];
        for(var i=0;i<this._items.length;i++) 
            if(this._items[i].selected)detailItems.push(this._items[i]);

    this.emitEvent("onItemsSelected",detailItems);

    
}


CABLES.UI.ItemManager.prototype.setItems=function(items)
{
    this._items=items;
    this.updateHtml();

    for(var i=0;i<this._items.length;i++)
    {
        const id=this._items[i].id;
        const item=this._items[i];

        document.getElementById("item"+id).addEventListener("click",
            function(e)
            {
                if(!e.shiftKey)
                {
                    this.unselectAll();
                    this.selectFile(item.id);
                }
                else 
                {
                    this.toggleSelection(item.id);
                }

                
                this.updateSelectionHtml();
                this.updateDetailHtml();
                
            }.bind(this));
    }

};
