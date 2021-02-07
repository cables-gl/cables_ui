CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.SpreadSheetTab = class extends CABLES.EventTarget
{
    constructor(tabs, data, options)
    {
        super();
        this._tabs = tabs;

        this._cols = 3;
        this._rows = 30;

        this.data = [];
        this._inputs = [];
        this._options = options;
        this.colNames = ["a", "b", "c", "d"];

        if (data) this.initData(data);

        this._tab = new CABLES.UI.Tab("spreadsheet", { "icon": "edit", "infotext": "tab_spreadsheet", "padding": true, "singleton": "false", });
        this._tabs.addTab(this._tab, true);

        this._id = "spread" + CABLES.uuid();
        this._tab.html("<div id='" + this._id + "'></div>");
        this._ele = document.getElementById(this._id);
        this._ele.classList.add("editor_spreadsheet");
        this._eleTable = ele.create("table");
        this._ele.appendChild(this._eleTable);

        this.data.length = this._rows;

        if (!data)
            for (let y = 0; y < this._rows; y++)
                for (let x = 0; x < this._cols; x++)
                    this.set(x, y, "");

        this._html();
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

            for (let x = 0; x < this._cols; x++)
            {
                const td = ele.create("td");
                tr.appendChild(td);

                const input = ele.create("input");
                input.dataset.y = y;
                input.dataset.x = x;

                if (y == -1) input.classList.add("colname");

                input.value = this.get(x, y) || "";

                td.appendChild(input);

                input.addEventListener("change", this._change.bind(this));
            }
        }
    }

    initData(data)
    {
        for (let y = 0; y < data.length; y++)
        {
            if (y == 0)
            {
                this.colNames = Object.keys(data[y]);
            }
            this.data[y] = [];

            console.log(data[y]);

            for (const i in data[y])
            {
                this.data[y][this.colNames.indexOf("" + i)] = data[y][i];
            }
        }
        console.log(this.data);
    }

    get(x, y)
    {
        if (y == -1) return this.colNames[x];
        if (!this.data) return undefined;
        if (!this.data[y]) return undefined;
        return this.data[y][x];
    }

    set(x, y, v)
    {
        if (y == -1)
        {
            this.colNames[x] = v;
            return;
        }

        this.data[y] = this.data[y] || [];
        this.data[y][x] = v;
    }

    _change(e)
    {
        console.log(e.target.dataset.x, e.target.dataset.y);
        const x = e.target.dataset.x;
        const y = e.target.dataset.y;

        this.set(x, y, e.target.value);

        if (this._options.onchange) this._options.onchange(this.asObjectArray());
    }

    asObjectArray()
    {
        const arr = [];
        arr.length = this._rows;
        let lastRow = 0;
        for (let y = 0; y < this._rows; y++)
        {
            const o = {};
            arr[y] = o;

            for (let x = 0; x < this._cols; x++)
            {
                let v = this.get(x, y);
                if (CABLES.UTILS.isNumeric(v)) v = parseFloat(v);
                if (v != "") lastRow = y;

                o[this.colNames[x]] = v;
            }
        }
        arr.length = lastRow;

        return arr;
    }


    show()
    {
    }
};
