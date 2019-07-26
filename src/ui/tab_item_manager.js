CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.ItemManager=function(title,tabs)
{

    CABLES.EventTarget.apply(this);

    this._tab=new CABLES.UI.Tab(title,
        {
            "icon":"folder",
            "infotext":"tab_profiler",
            "singleton":"true",
            "padding":true});
    tabs.addTab(this._tab);

    this._items=[];
    this.updateHtml();

    // this._tab.addEventListener("onActivate",function()
    // {
    //     this.show();
    // }.bind(this));

};

CABLES.UI.ItemManager.prototype.removeItem=function(id)
{
    var nextId=null;
    for(var i=1;i<this._items.length;i++)
        if(id===this._items[i-1].id)nextId=this._items[i].id;

    var idx=-1;
    for(var i=0;i<this._items.length;i++)
    {
        if(this._items[i].id==id) idx=i;
    }
    if(idx==-1)return;

    this._items.splice(idx,1);

    var ele=document.getElementById("item"+id);
    if(ele) 
    {
        ele.remove();
        if(nextId) this.selectFile(nextId);
    }
    this.updateDetailHtml();
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
        const ele=document.getElementById("item"+item.id);
        if(ele)
            if(item.selected) ele.classList.add("selected");
                else ele.classList.remove("selected");
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
