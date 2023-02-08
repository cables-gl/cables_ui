
export default class ContextMenu
{
    constructor()
    {
        this._element = null;
        this._modalBg = null;
        this._visible = false;
    }

    close()
    {
        if (this._element) this._element.remove();
        if (this._modalBg) this._modalBg.remove();
        this._element = null;
        this._modalBg = null;
        this._visible = false;
    }

    isVisible()
    {
        return this._visible;
    }

    show(obj, parent)
    {
        if (!this._modalBg)
        {
            this._modalBg = document.createElement("div");
            this._modalBg.classList.add("cables_contextmenu_modal");
            this._modalBg.addEventListener("click",
                function ()
                {
                    CABLES.contextMenu.close();
                });

            document.body.appendChild(this._modalBg);
        }


        if (!this._element)
        {
            this._element = document.createElement("ul");
            this._element.classList.add("cables_contextmenu");
            this._element.classList.add("cablesCssUi");

            document.body.appendChild(this._element);
        }

        const rect = parent.getBoundingClientRect();
        if (rect.x == 0 && rect.y == 0 && rect.width == 0 && rect.height == 0) return;

        if (rect.left > window.innerWidth - 200)
        {
            this._element.style.right = window.innerWidth - rect.left + "px";
            this._element.style.left = "initial";
        }
        else
        {
            this._element.style.right = "initial";
            this._element.style.left = rect.left + 5 + "px";
        }
        this._element.style.top = rect.top + 5 + "px";

        if (obj && obj.items && obj.items.length > 0)
        {
            for (let i = 0; i < obj.items.length; i++)
            {
                const item = document.createElement("li");
                item.classList.add("cm_item");
                item.innerText = obj.items[i].title;

                if (obj.items[i].iconClass)
                {
                    const icon = document.createElement("span");
                    icon.classList.add("cm_icon");
                    const classes = obj.items[i].iconClass.split(" ");
                    for (const ii in classes) icon.classList.add(classes[ii]);

                    icon.style.float = "left";
                    item.appendChild(icon);
                }

                this._element.appendChild(item);
                this._visible = true;

                item.addEventListener("click", function ()
                {
                    if (obj.refresh)
                    {
                        setTimeout(function ()
                        {
                            CABLES.contextMenu.close();
                            obj.refresh(parent);
                        }, 100);
                    }
                    else CABLES.contextMenu.close();

                    setTimeout(this.func.bind(this), 20);
                }.bind(obj.items[i]));
            }
        }
    }
}
