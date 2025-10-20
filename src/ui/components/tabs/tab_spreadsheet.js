import { Port, utils } from "cables";
import { ele, Events, Logger } from "cables-shared-client";
import TabPanel from "../../elements/tabpanel/tabpanel.js";
import Tab from "../../elements/tabpanel/tab.js";
import { gui } from "../../gui.js";

/**
 * @typedef SpreadSheetOptions
 * @property {string} [title]
 * @property {number} [numColumns]
 * @property {function} [onchange]
 * @property {string[]} [colNames]
 * @property {[string[]]} [cells]
 */
export default class SpreadSheetTab extends Events
{
    #log = new Logger("SpreadSheetTab");
    #cellMate = null;
    #port = null;
    #options = null;
    #tab = null;

    /** @type {TabPanel} */
    #tabs = null;

    /**
     * @param {TabPanel} tabs
     * @param {Port} port
     * @param {any} data
     * @param {SpreadSheetOptions} options
     */
    constructor(tabs, port, data, options)
    {
        super();
        this.#tabs = tabs;

        options = options || {};

        if (options.colNames && !options.numColumns)options.numColumns = options.colNames.length;

        this.#port = port;
        this.#options = options;

        this.#tab = new Tab(options.title || "", { "icon": "edit", "infotext": "tab_spreadsheet", "padding": true, "singleton": false });
        this.#tabs.addTab(this.#tab, true);

        this.#tab.on(Tab.EVENT_RESIZE, () =>
        {
            this.#cellMate.resize();
        });

        this.#tab.on(Tab.EVENT_ACTIVATE, () =>
        {
            this.#cellMate.resize();
        });

        this.show();
        gui.maintabPanel.show();
        this.#tab.addButton("export csv", () =>
        {
            this.#cellMate.download("cables.csv", this.#cellMate.toCsv());

        });
    }

    show()
    {

        let html = "<div></div>";
        this.#tab.html(html);

        this.#cellMate = new CellMate(this.#tab.contentEle);
    }
}
