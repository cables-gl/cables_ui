CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.ItemManager=function(title,tabs)
{
    CABLES.EventTarget.apply(this);
    this.listHtmlOptions={};
    this._display="icons";
    this._tab=new CABLES.UI.Tab(title,
        {
            "icon":"folder",
            "singleton":"true",
            "padding":true
        });
    tabs.addTab(this._tab);

    this._tab.addEventListener("onClose",function()
    {
        this.emitEvent("onClose");
    }.bind(this));

    this._items=[];
    this.updateHtml();
};

CABLES.UI.ItemManager.prototype.clear=function()
{
    this._items.length=0;
}


CABLES.UI.ItemManager.prototype.setDisplay=function(t)
{
    this._display=t;
    this.updateHtml();
}

CABLES.UI.ItemManager.prototype.getDisplay=function(t)
{
    return this._display;
}

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
        if(nextId) this.selectItemById(nextId);
    }
    this.updateDetailHtml();
};

CABLES.UI.ItemManager.prototype.updateHtml=function()
{
    var html = '';
    var options={"items":this._items};
    for(var i in this.listHtmlOptions)
        options[i]=this.listHtmlOptions[i];

    if(this._display=='icons')
    {
        html=CABLES.UI.getHandleBarHtml('tab_itemmanager',options);
    }
        else html=CABLES.UI.getHandleBarHtml('tab_itemmanager_list',options);


    this._tab.html('<div id="item_manager" class="item_manager">'+html+'</div>');
}

CABLES.UI.ItemManager.prototype.getItemByTitleContains=function(t)
{
    for(var i=0;i<this._items.length;i++)
    {
        if(t.indexOf(this._items[i].title)>-1)
        {
            return this._items[i];
        }
    }
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

CABLES.UI.ItemManager.prototype.selectItemById=function(id)
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
    if(!items)items=this._items;
    this._items=items;
    this.updateHtml();

    for(var i=0;i<this._items.length;i++)
    {
        const id=this._items[i].id;
        const item=this._items[i];
        const ele=document.getElementById("item"+id);

        if(ele) ele.addEventListener("click",
            function(e)
            {
                if(!e.shiftKey)
                {
                    this.unselectAll();
                    this.selectItemById(item.id);
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
