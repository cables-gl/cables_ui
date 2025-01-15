import { ele, Events, Logger } from "cables-shared-client";

export default class SpreadSheetTab extends Events
{
    constructor(tabs, port, data, options)
    {
        super();
        this._tabs = tabs;
        this._log = new Logger("SpreadSheetTab");

        options = options || {};

        this._numCols = options.numColumns || 3;
        this._rows = 25;

        this._port = port;
        this.cells = [];
        this._inputs = [];
        this._options = options;
        this.colNames = [];

        this._tab = new CABLES.UI.Tab(options.title || "", { "icon": "edit", "infotext": "tab_spreadsheet", "padding": true, "singleton": "false", });
        this._tabs.addTab(this._tab, true);

        port.on("onUiAttrChange", this._updateUiAttribs.bind(this));

        this.data = { "cells": this.cells, "colNames": this.colNames };

        if (data) this.initData(data);
        else
        {
            for (let i = 0; i < this._numCols; i++) this.getColName(i);
        }


        this._id = "spread" + CABLES.uuid();
        this._updateUiAttribs();
    }

    _updateUiAttribs()
    {
        this._numCols = this._port.uiAttribs.spread_numColumns || 1;
        this.rebuildHtml();
    }

    rebuildHtml()
    {
        this._tab.html("<div id='" + this._id + "' ></div>");
        this._ele = document.getElementById(this._id);
        if (!this._ele) return;
        this._ele.classList.add("editor_spreadsheet");
        this._ele.classList.add("tabcontent-scroll");

        this._eleTable = ele.create("table");
        this._ele.appendChild(this._eleTable);

        this.cells.length = this._rows;

        this._html();
    }

    getColName(_c)
    {
        _c = parseFloat(_c);

        if (this.colNames.length > _c && this.colNames[_c])
        {
            return this.colNames[_c];
        }

        let str = "";
        let c = parseFloat(_c);

        if (c < 0) throw new Error("col invalid");

        while (c >= 0)
        {
            str = "abcdefghijklmnopqrstuvwxyz"[c % 26] + str;
            c = Math.floor(c / 26) - 1;
        }

        this.colNames[_c] = str;

        return str;
    }


    _html()
    {
        for (let i = 0; i < this._inputs.length; i++) this._inputs[i].remove();

        this._inputs.length = 0;
        const table = this._eleTable;

        for (let y = -1; y < this._rows; y++)
        {
            const tr = ele.create("tr");
            table.appendChild(tr);

            const tdr = ele.create("td");
            if (y >= 0)
            {
                tdr.innerHTML = y;
                tdr.classList.add("rownum");
            }
            tr.appendChild(tdr);

            for (let x = 0; x < this._numCols; x++)
            {
                const td = ele.create("td");
                tr.appendChild(td);

                const input = ele.create("input");
                input.dataset.x = x;
                input.dataset.y = y;
                this._inputs[x + y * this._numCols] = input;

                if (y == -1)
                {
                    input.classList.add("colname");
                    input.value = this.getColName(x);
                }
                else
                {
                    input.value = this.get(x, y) || "";
                }

                td.appendChild(input);


                input.addEventListener("change", this._checkNumRows.bind(this));
                input.addEventListener("input", this._onInputChange.bind(this));
                input.addEventListener("keydown", this._onKey.bind(this), false);
            }
        }
    }

    _focusCell(x, y)
    {
        const inp = this._inputs[(y * this._numCols) + x];

        if (inp)
        {
            inp.focus();

            setTimeout(() =>
            {
                // inp.select();
            }, 50);
        }
    }


    _onKey(e)
    {
        const x = parseFloat(e.target.dataset.x);
        const y = parseFloat(e.target.dataset.y);

        if (e.keyCode == 38)
        {
            this._focusCell(x, y - 1);
        }
        else if (e.keyCode == 40)
        {
            this._focusCell(x, y + 1);
        }
        else if (e.keyCode == 37)
        {
            this._focusCell(x - 1, y);
        }
        else if (e.keyCode == 39)
        {
            this._focusCell(x + 1, y);
        }
        else this._onInputChange(e);
    }

    _checkNumRows()
    {
        this._log.log(this.cells);


        let lastLine = this.cells.length - 1;
        for (let i = this.cells.length - 1; i > 0; i--)
        {
            if (this.cells[i])
            {
                let foundContent = false;
                for (let x = 0; x < this._numCols; x++)
                    if (this.cells[i][x] && this.cells[i][x].length > 0)
                    {
                        this._log.log(i, this.cells[i]);
                        foundContent = true;
                        lastLine = i;
                    }

                if (foundContent) break;
            }


            // for (let x = 0; x < this._numCols; x++)
            // {
            //     this._log.log(this.cells[x]);
            // }
        }

        this._log.log("lastLine", lastLine);

        lastLine += 10;
        if (this._rows != lastLine)
        {
            this._rows = lastLine;
            this.rebuildHtml();
        }

        this._log.log("lastline", lastLine);

        // const newRows = lastLine + 10;
        // if (this._rows != newRows)
        // {
        //     this._rows = this.cells.length + 10;
        //     this.rebuildHtml();
        // }
        // if()

        // if (this.cells.length >= this._rows)
        // {
        // }
    }

    initData(data)
    {
        this.cells = data.cells || [];
        this.colNames = data.colNames || [];
        this._checkNumRows();
    }

    get(x, y)
    {
        if (y == -1) return this.getColName(x);
        if (!this.cells) return undefined;
        if (!this.cells[y]) return [];
        return this.cells[y][x];
    }

    set(x, y, v)
    {
        if (y == -1)
        {
            this._log.log("set colname", x, v);
            this.colNames[x] = v;
            return;
        }

        this.cells[y] = this.cells[y] || [];
        this.cells[y][x] = v;
        this._sendChange();
    }

    _sendChange()
    {
        this.data.cols = this._numCols;
        this.data.cells = this.cells;
        this.data.colNames = this.colNames;
        this.data.colNames.length = this._numCols;
        this._options.onchange(null);
        if (this._options.onchange) this._options.onchange(this.data);
    }

    _onInputChange(e)
    {
        this._log.log("onchange...", e.target.value);
        const x = e.target.dataset.x;
        const y = e.target.dataset.y;

        this.set(x, y, e.target.value);
        // for (let i = 0; i < this._numCols; i++) this.getColName(i);
    }

    show()
    {
    }
}
