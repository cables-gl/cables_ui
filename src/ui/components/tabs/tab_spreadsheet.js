import { Port, utils } from "cables";
import { ele, Events, Logger } from "cables-shared-client";
import TabPanel from "../../elements/tabpanel/tabpanel.js";
import Tab from "../../elements/tabpanel/tab.js";
import { gui } from "../../gui.js";
import { editorSession } from "../../elements/tabpanel/editor_session.js";

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
    static TABSESSION_NAME = "spreadsheet";

    #log = new Logger("SpreadSheetTab");
    #cellMate = null;
    #port = null;
    #options = null;
    #tab = null;

    /** @type {TabPanel} */
    #tabs = null;
    #currentId;

    /**
     * @param {TabPanel} tabs
     * @param {Port} port
     * @param {SpreadSheetOptions} [options]
     */
    constructor(tabs, port, options)
    {
        super();
        if (!port)
        {
            console.log("spreadsheettab missing args");
            return;
        }

        this.#tabs = tabs;
        this.#currentId = port.op.id + "_" + port.name;

        options = options || {};

        if (options.colNames && !options.numColumns)options.numColumns = options.colNames.length;

        this.#port = port;
        this.#options = options;

        this.#tab = new Tab(options.title || port.op.getTitle(), {
            "icon": "spreadsheet",
            "infotext": "tab_spreadsheet",
            "padding": true,
            "singleton": false });

        this.#tabs.addTab(this.#tab, true);

        this.#tab.on("close", () =>
        {
            editorSession.remove(SpreadSheetTab.TABSESSION_NAME, this.#currentId);
        });

        this.#tab.on(Tab.EVENT_RESIZE, () =>
        {
            console.log("resize tabbbbbbbbb");
            this.#cellMate.resize();
        });

        this.#tab.on(Tab.EVENT_ACTIVATE, () =>
        {
            this.#cellMate.resize();
        });

        this.#tab.addButton("export csv", () =>
        {
            this.#cellMate.download("cables.csv", this.#cellMate.toCsv());

        });

        editorSession.rememberOpenEditor(SpreadSheetTab.TABSESSION_NAME, this.#currentId, {
            "portname": port.name,
            "opid": port.op.id,
        }, true);
        this.show();
        gui.maintabPanel.show(true);
    }

    show()
    {

        let html = "<div></div>";
        this.#tab.html(html);

        this.#cellMate = new CellMate(this.#tab.contentEle,
            {
                "onChange": this.onChange.bind(this)

            });
        this.#cellMate.fromObj(this.#port.get());
    }

    onChange()
    {
        console.log(this.#cellMate.toObj());

        this.#port.setRef(this.#cellMate.toObj());

    }
}

editorSession.addListener(SpreadSheetTab.TABSESSION_NAME, (id, data) =>
{
    console.log("dataaa", data);
    const op = gui.corePatch().getOpById(data.opid);
    if (!op) return console.log("no spread op found..");
    new SpreadSheetTab(gui.mainTabs, op.getPortByName(data.portname));
});
