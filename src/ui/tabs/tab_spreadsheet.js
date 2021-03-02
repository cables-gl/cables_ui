CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.SpreadSheetTab = class extends CABLES.EventTarget
{
    constructor(tabs, port, data, options)
    {
        super();
        this._tabs = tabs;

        options = options || {};

        this._numCols = options.numColumns || 3;
        this._rows = 30;

        this._port = port;
        this.cells = [];
        this._inputs = [];
        this._options = options;
        this.colNames = [];

        port.on("onUiAttrChange", this._updateUiAttribs.bind(this));

        this.data = { "cells": this.cells, "colNames": this.colNames };

        if (data) this.initData(data);
        else
        {
            for (let i = 0; i < this._numCols; i++) this.getColName(i);
        }

        this._tab = new CABLES.UI.Tab(options.title || "", { "icon": "edit", "infotext": "tab_spreadsheet", "padding": true, "singleton": "false", });
        this._tabs.addTab(this._tab, true);

        this._id = "spread" + CABLES.uuid();
        // this.rebuildHtml();
        this._updateUiAttribs();
    }

    _updateUiAttribs()
    {
        this._numCols = this._port.uiAttribs.spread_numColumns || 1;
        this.rebuildHtml();
    }

    rebuildHtml()
    {
        this._tab.html("<div id='" + this._id + "'></div>");
        this._ele = document.getElementById(this._id);
        this._ele.classList.add("editor_spreadsheet");
        this._eleTable = ele.create("table");
        this._ele.appendChild(this._eleTable);

        this.cells.length = this._rows;

        // if (!this.cells)
        //     for (let y = 0; y < this._rows; y++)
        //         for (let x = 0; x < this._numCols; x++)
        //             this.set(x, y, "");

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

        console.log("colname", c, str);
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


                input.addEventListener("change", this._change.bind(this));
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
                inp.select();
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
        // else console.log(e.keyCode);
    }


    initData(data)
    {
        this.cells = data.cells || [];
        this.colNames = data.colNames || [];
        // for (let y = 0; y < data.cells.length; y++)
        // {
        //     if (y == 0)
        //     {
        //         this.colNames = Object.keys(data.cells[y]);
        //     }
        //     this.cells[y] = [];

        //     console.log(data.cells[y]);

        //     for (const i in data.cells[y])
        //     {
        //         this.cells[y][this.colNames.indexOf("" + i)] = data.cells[y][i];
        //     }
        // }
        console.log(this.cells);
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
            console.log("set colname", x, v);
            this.colNames[x] = v;
            return;
        }

        this.cells[y] = this.cells[y] || [];
        this.cells[y][x] = v;
    }

    _change(e)
    {
        console.log(e.target.dataset.x, e.target.dataset.y);
        const x = e.target.dataset.x;
        const y = e.target.dataset.y;

        this.set(x, y, e.target.value);

        // for (let i = 0; i < this._numCols; i++) this.getColName(i);

        this.data.cols = this._numCols;
        this.data.cells = this.cells;
        this.data.colNames = this.colNames;

        this.data.colNames.length = this._numCols;

        console.log("colnames", this.colNames);
        this._options.onchange(null);
        if (this._options.onchange) this._options.onchange(this.data);
    }


    show()
    {
    }
};
