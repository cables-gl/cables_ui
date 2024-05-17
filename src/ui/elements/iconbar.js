import { ele } from "cables-shared-client";
import { getHandleBarHtml } from "../utils/handlebars.js";

export default class IconBar
{
    constructor(which)
    {
        this._items = [];
        this._id = which;
        this._eleContainer = null;
        this.vertical = true;

        this._updateItems();

        if (this._id === "sidebar_bottom" && gui)
        {
            gui.on("canvasModeChange", (mode) =>
            {
                this.refresh();
            });
        }
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
            if (gui && (gui.canvasManager.mode === gui.canvasManager.CANVASMODE_PATCHBG))
            {
                items.push("patch background renderer");
                items.push("hide patchfield");
            }
        }

        if (this._id == "sidebar_left")
        {
            const defaultItems = ["save patch", "add op", "show settings", "maximize canvas"];
            const itemObj = CABLES.UI.userSettings.get(this._id) || {};

            for (let i = 0; i < defaultItems.length; i++)
                if (!itemObj.hasOwnProperty(defaultItems[i]))
                    itemObj[defaultItems[i]] = true;

            CABLES.UI.userSettings.set(this._id, itemObj);

            for (const i in itemObj)
                if (itemObj[i]) items.push(i);
        }

        if (this._id == "sidebar_timeline")
        {
            this.vertical = false;

            items.push("timeline rewind to 0", "timeline rewind", "timeline play", "timeline pause", "timeline forward");
        }


        for (let i = 0; i < items.length; i++)
            for (let j = 0; j < CABLES.CMD.commands.length; j++)
                if (CABLES.CMD.commands[j].cmd == items[i])
                    this.addItem(CABLES.CMD.commands[j]);

        this._buildHtml();
    }

    _buildHtml()
    {
        if (this._eleContainer) this._eleContainer.innerHTML = "";
        else this._eleContainer = document.createElement("div");


        this._eleContainer.id = "iconbar_" + this._id;
        this._eleContainer.classList.add("cbl_iconbarContainer");
        if (!this.vertical) this._eleContainer.classList.add("cbl_iconbar_hor");

        const html = getHandleBarHtml("iconbar", {
            "items": this._items,
            "id": this._id,
            "vertical": this.vertical
        });

        this._eleContainer.innerHTML = html;

        ele.byId("mainContainer").appendChild(this._eleContainer);
    }

    addItem(item)
    {
        this._items.push(item);
    }

    setVisible(b)
    {
        if (!this._eleContainer) return;
        if (b)
        {
            ele.show(this._eleContainer);
        }
        else
        {
            ele.hide(this._eleContainer);
        }
    }
}
