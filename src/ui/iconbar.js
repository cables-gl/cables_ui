
CABLES.IconBar = class
{
    constructor(which)
    {
        this._items = [];
        this._id = which;
        this._eleContainer = null;
        this.vertical = true;

        this._updateItems();
    }

    refresh()
    {
        this._updateItems();
    }

    _updateItems()
    {
        this._items = [];
        const items = [];

        if (this._id == "sidebar_bottom")
        {
            this.vertical = false;

            items.push("center patch", "zoom out", "zoom in");
        }

        if (this._id == "sidebar_left")
        {
            const defaultItems = ["save patch", "add op", "show settings", "toggle fullscreen"];
            const itemObj = CABLES.UI.userSettings.get(this._id) || {};

            for (let i = 0; i < defaultItems.length; i++)
                if (!itemObj.hasOwnProperty(defaultItems[i]))
                    itemObj[defaultItems[i]] = true;

            CABLES.UI.userSettings.set(this._id, itemObj);

            for (const i in itemObj)
            {
                if (itemObj[i]) items.push(i);
            }
        }


        for (let i = 0; i < items.length; i++)
        {
            for (let j = 0; j < CABLES.CMD.commands.length; j++)
            {
                if (CABLES.CMD.commands[j].cmd == items[i])
                {
                    this.addItem(CABLES.CMD.commands[j]);
                    console.log(items[i], CABLES.CMD.commands[j]);
                }
            }
        }

        this._buildHtml();
    }

    _buildHtml()
    {
        if (this._eleContainer) this._eleContainer.innerHTML = "";
        else this._eleContainer = document.createElement("div");


        this._eleContainer.id = "iconbar_" + this._id;
        this._eleContainer.classList.add("cbl_iconbarContainer");
        if (!this.vertical) this._eleContainer.classList.add("cbl_iconbar_hor");

        const html = CABLES.UI.getHandleBarHtml("iconbar", {
            "items": this._items,
            "id": this._id
        });

        this._eleContainer.innerHTML = html;

        // this._eleContainer.style.top = 100 + "px";
        // this._eleContainer.style.left = 10 + "px";

        document.body.appendChild(this._eleContainer);
    }

    addItem(item)
    {
        this._items.push(item);
    }
};
