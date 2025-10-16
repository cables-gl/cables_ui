import { Port, utils } from "cables";
import { ele, Events, Logger } from "cables-shared-client";
import TabPanel from "../../elements/tabpanel/tabpanel.js";

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

    /**
     * @param {TabPanel} tabs
     * @param {Port} port
     * @param {any} data
     * @param {SpreadSheetOptions} options
     */
    constructor(tabs, port, data, options)
    {
        super();
        this._tabs = tabs;
        this._log = new Logger("SpreadSheetTab");

        options = options || {};

        if (options.colNames && !options.numColumns)options.numColumns = options.colNames.length;
        this._numCols = options.numColumns || 3;
        this._rows = 25;

        this._port = port;
        this.cells = [];
        this._inputs = [];
        this._options = options;
        this.colNames = [];

        this._tab = new CABLES.UI.Tab(options.title || "", { "icon": "edit", "infotext": "tab_spreadsheet", "padding": true, "singleton": false });
        this._tabs.addTab(this._tab, true);

        // if (port)port.on("onUiAttrChange", this._updateUiAttribs.bind(this));

        // this.data = { "cells": this.cells, "colNames": this.colNames };

        // if (data) this.initData(data);
        // else
        // {
        //     for (let i = 0; i < this._numCols; i++) this.getColName(i);
        // }

        // this._id = "spread" + utils.uuid();
        // this._updateUiAttribs();
    }

    show()
    {
    }
}
