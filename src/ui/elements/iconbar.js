import { ele } from "cables-shared-client";
import { uuid } from "cables/src/core/utils.js";
import { getHandleBarHtml } from "../utils/handlebars.js";
import { gui } from "../gui.js";
import { userSettings } from "../components/usersettings.js";
import { Commands } from "../commands/commands.js";

export default class IconBar
{

    /** @type {import("../commands/commands.js").CommandObject[]} */
    #items = [];
    #eleContainer = null;
    #id = uuid();

    /**
     * @param {string} which
     */
    constructor(which)
    {
        this.#id = which;
        this.vertical = true;
        this.#updateItems();

        if (this.#id === "sidebar_bottom" && gui)
        {
            gui.on("canvasModeChange", (_mode) =>
            {
                this.refresh();
            });
        }
    }

    refresh()
    {
        this.#updateItems();
    }

    #updateItems()
    {
        this.#items = [];
        const items = [];

        if (this.#id == "sidebar_bottom")
        {
            this.vertical = false;
            items.push("Center patch", "Zoom out", "Zoom in");
            if (gui && (gui.canvasManager.mode === gui.canvasManager.CANVASMODE_PATCHBG))
            {
                items.push("Patch background renderer");
                items.push("Hide patchfield");
            }
        }

        if (this.#id == "sidebar_left")
        {
            const defaultItems = ["Save patch", "Add op", "Show settings", "Maximize canvas"];
            const itemObj = userSettings.get(this.#id) || {};

            for (let i = 0; i < defaultItems.length; i++)
                if (!itemObj.hasOwnProperty(defaultItems[i]))
                    itemObj[defaultItems[i]] = true;

            userSettings.set(this.#id, itemObj);

            for (const i in itemObj)
                if (itemObj[i]) items.push(i);
        }

        if (this.#id == "sidebar_timeline")
        {
            this.vertical = false;

            items.push("timeline rewind to 0", "timeline rewind", "timeline play", "timeline pause", "timeline forward", "toggle timeline");
        }

        for (let i = 0; i < items.length; i++)
            for (let j = 0; j < Commands.commands.length; j++)
                if (Commands.commands[j].cmd == items[i])
                    this.addItem(Commands.commands[j]);

        this._buildHtml();
    }

    _buildHtml()
    {
        if (this.#eleContainer) this.#eleContainer.innerHTML = "";
        else this.#eleContainer = document.createElement("div");

        this.#eleContainer.id = "iconbar_" + this.#id;
        this.#eleContainer.classList.add("cbl_iconbarContainer");
        if (!this.vertical) this.#eleContainer.classList.add("cbl_iconbar_hor");

        const html = getHandleBarHtml("iconbar", {
            "items": this.#items,
            "id": this.#id,
            "vertical": this.vertical
        });

        this.#eleContainer.innerHTML = html;

        ele.byId("mainContainer").appendChild(this.#eleContainer);
    }

    /**
     * @param {import("../commands/commands.js").CommandObject} item
     */
    addItem(item)
    {
        this.#items.push(item);
    }

    /**
     * @param {boolean} b
     */
    setVisible(b)
    {
        if (!this.#eleContainer) return;
        if (b) ele.show(this.#eleContainer);
        else ele.hide(this.#eleContainer);
    }
}
