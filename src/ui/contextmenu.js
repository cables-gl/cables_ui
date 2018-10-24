var CABLES=CABLES||{};

CABLES.ContextMenu=function()
{
    this._element=null;
    this._modalBg=null;
};

CABLES.ContextMenu.prototype.close=function()
{
    if(this._element)this._element.remove();
    if(this._modalBg)this._modalBg.remove();
    this._element=null;
    this._modalBg=null;
};

CABLES.ContextMenu.prototype.show=function(obj,parent)
{
    if(!this._modalBg)
    {
        this._modalBg = document.createElement('div');
        this._modalBg.classList.add("contextmenu_modal");
        this._modalBg.addEventListener("click", 
        function()
        {
            CABLES.contextMenu.close();
        });

        document.body.appendChild(this._modalBg);
    }

    var rect = parent.getBoundingClientRect();

    if(!this._element)
    {
        this._element = document.createElement('ul');
        this._element.classList.add("contextmenu");
        document.body.appendChild(this._element);
    }

    this._element.style.left=rect.left+5;
    this._element.style.top=rect.top+5;

    if(obj && obj.items && obj.items.length>0)
    {
        for(var i=0;i<obj.items.length;i++)
        {
            var item = document.createElement('li');
            item.classList.add("cm_item");
            item.innerText=obj.items[i].title;

            if(obj.items[i].iconClass)
            {
                var icon = document.createElement('span');
                // icon.classList.add("fa");
                icon.classList.add("cm_icon");
                var classes=obj.items[i].iconClass.split(' ');
                for(var ii in classes) icon.classList.add(classes[ii]);
                
                icon.style.float="left";
                item.appendChild(icon);
            }


            this._element.appendChild(item);
            item.addEventListener("click", function()
            {
                CABLES.contextMenu.close();
                setTimeout(this.func.bind(this),20);
            }.bind(obj.items[i]));
        }
    }
}

CABLES.contextMenu=new CABLES.ContextMenu();