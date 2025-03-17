import { Events } from "cables-shared-client";
import Tab from "../../elements/tabpanel/tab.js";
import { getHandleBarHtml } from "../../utils/handlebars.js";

export default class ItemManager extends Events
{
    constructor(title, tabs)
    {
        super();
        this.listHtmlOptions = {};
        this._display = "icons";
        this._tab = new Tab(title, {
            "icon": "folder",
            "singleton": "true",
            "padding": true,
        });
        tabs.addTab(this._tab);

        this._tab.addEventListener(
            "close",
            () =>
            {
                this.emitEvent("close");
            },
        );

        this._items = [];
        this.updateHtml();
    }

    clear()
    {
        this._items.length = 0;
    }

    setDisplay(t)
    {
        this._display = t;
        this.updateHtml();
    }

    getDisplay(t)
    {
        return this._display;
    }

    removeItem(id)
    {
        let nextId = null;
        for (let i = 1; i < this._items.length; i++) if (id === this._items[i - 1].id) nextId = this._items[i].id;

        let idx = -1;
        for (let i = 0; i < this._items.length; i++)
        {
            if (this._items[i].id == id) idx = i;
        }
        if (idx == -1) return;

        this._items.splice(idx, 1);

        const ele = document.getElementById("item" + id);
        const eleRow = document.getElementById("itemrow" + id);

        if (eleRow)
        {
            eleRow.remove();
        }
        if (ele)
        {
            ele.remove();
            if (nextId) this.selectItemById(nextId);
        }
        this.updateDetailHtml();
    }

    updateHtml()
    {
        let html = "";
        const options = { "items": this._items };
        for (const i in this.listHtmlOptions) options[i] = this.listHtmlOptions[i];

        if (this._display === "icons") html = getHandleBarHtml("tab_itemmanager", options);
        else html = getHandleBarHtml("tab_itemmanager_list", options);

        this._tab.html("<div id=\"item_manager\" class=\"item_manager\">" + html + "</div>");
    }

    getItemByTitleContains(t)
    {
        for (let i = 0; i < this._items.length; i++)
        {
            if (t.indexOf(this._items[i].title) > -1)
            {
                return this._items[i];
            }
        }
    }

    getItemById(id)
    {
        for (let i = 0; i < this._items.length; i++) if (id === this._items[i].id) return this._items[i];
    }

    getSelectedItems()
    {
        const selectedItems = [];
        for (let i = 0; i < this._items.length; i++) if (this._items[i].selected) selectedItems.push(this._items[i]);
        return selectedItems;
    }

    updateSelectionHtml()
    {
        for (let i = 0; i < this._items.length; i++)
        {
            const item = this._items[i];
            const ele = document.getElementById("item" + item.id);
            if (ele)
            {
                if (item.selected) ele.classList.add("selected");
                else ele.classList.remove("selected");
            }
        }
    }

    unselectAll()
    {
        for (let i = 0; i < this._items.length; i++) this._items[i].selected = false;
        this.updateSelectionHtml();
    }

    toggleSelection(id)
    {
        const item = this.getItemById(id);
        if (item) item.selected = !item.selected;
        this.updateSelectionHtml();
    }

    selectItemById(id)
    {
        const item = this.getItemById(id);
        if (item) item.selected = true;
        this.updateSelectionHtml();
    }

    updateDetailHtml(items)
    {
        const detailItems = [];
        for (let i = 0; i < this._items.length; i++) if (this._items[i].selected) detailItems.push(this._items[i]);

        this.emitEvent("onItemsSelected", detailItems);
    }

    setTitleFilter(f)
    {
        this.titleFilter = String(f).toLowerCase();
        this.filterItems();
    }

    filterItems()
    {
        const els = document.getElementsByClassName("fileFilterable");
        let i = 0;
        if (this.titleFilter)
        {
            for (i = 0; i < els.length; i++)
            {
                if (els[i].dataset.searchable.toLowerCase().indexOf(this.titleFilter) == -1) els[i].style.display = "none";
                else els[i].style.display = "";
            }
        }
        else
        {
            for (i = 0; i < els.length; i++) els[i].style.display = "";
        }
    }

    setItems(items)
    {
        if (!items) items = this._items;
        this._items = items;
        this.updateHtml();

        for (let i = 0; i < this._items.length; i++)
        {
            const id = this._items[i].id;
            const item = this._items[i];
            const ele = document.getElementById("item" + id);

            if (ele)
            {
                ele.addEventListener(
                    "click",
                    function (e)
                    {
                        if (!e.shiftKey)
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
                    }.bind(this),
                );
            }
        }
        this.filterItems();
    }
}
