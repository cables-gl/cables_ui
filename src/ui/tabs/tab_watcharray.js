
CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.WatchArrayTab = class extends CABLES.EventTarget
{
    constructor(tabs, op, port, options)
    {
        super();
        this._tabs = tabs;

        this._numCols = 1;
        if (op.name.indexOf("Array3") > -1 || op.name.indexOf("Points") > -1) this._numCols = 3;

        this._rows = 40;

        this.cells = [];
        this._inputs = [];
        this._options = options;
        this.colNames = [];

        this.port = port;
        this.data = null;

        this.data = port.get();


        port.on("change", () =>
        {
            this._updatePortValue();
        });
        // else
        // {
        //     for (let i = 0; i < this._numCols; i++) this.getColName(i);
        // }

        this._tab = new CABLES.UI.Tab(options.title || "", { "icon": "edit", "infotext": "tab_spreadsheet", "padding": true, "singleton": "false", });
        this._tabs.addTab(this._tab, true);

        this._id = "spread" + CABLES.uuid();
        this._tab.html("<div id='" + this._id + "'></div>");
        this._ele = document.getElementById(this._id);
        this._ele.classList.add("editor_spreadsheet");

        this._eleIconbar = ele.create("div");
        this._ele.appendChild(this._eleIconbar);

        this._eleInfo = ele.create("div");
        this._ele.appendChild(this._eleInfo);

        this._eleIconMinus = ele.create("a");
        this._eleIconMinus.innerHTML = "-";
        this._eleIconMinus.classList.add("button");
        this._eleIconMinus.addEventListener("click", () => { this._changeColumns(-1); });
        this._eleIconbar.appendChild(this._eleIconMinus);


        this._eleIconPlus = ele.create("a");
        this._eleIconPlus.innerHTML = "+";
        this._eleIconPlus.classList.add("button");
        this._eleIconPlus.addEventListener("click", () => { this._changeColumns(1); });
        this._eleIconbar.appendChild(this._eleIconPlus);


        // this._eleIconbar.innerHTML='<a href="http://localhost:5711/op/Ops.Array.RandomNumbersArray3_v2" class="button ">+</a>';

        this._eleTable = ele.create("table");
        this._ele.appendChild(this._eleTable);


        // if (!this.cells)
        //     for (let y = 0; y < this._rows; y++)
        //         for (let x = 0; x < this._numCols; x++)
        //             this.set(x, y, "");

        this._html();
    }


    getColName(_c)
    {
        return _c;
    }

    _changeColumns(n)
    {
        this._numCols += n;
        this._updatePortValue();
    }

    _updatePortValue()
    {
        if (!this.port.get()) return;
        this.data = this.port.get();

        this._eleTable.remove();
        this._eleTable = ele.create("table");
        this._ele.appendChild(this._eleTable);

        this._html();
    }

    _html()
    {
        for (let i = 0; i < this._inputs.length; i++) this._inputs[i].remove();

        this._inputs.length = 0;
        const table = this._eleTable;

        for (let y = 0; y < this._rows; y++)
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

                const input = ele.create("span");
                input.style.fontFamily = "Monospace";
                input.dataset.x = x;
                input.dataset.y = y;
                this._inputs[x + y * this._numCols] = input;

                let str = String(this.get(x, y));
                if (str.indexOf("-") == -1)str = "&nbsp;" + str;
                input.innerHTML = str || "";

                td.appendChild(input);
            }
        }

        this._eleInfo.innerHTML = "showing " + this._rows * this._numCols + " / " + this.data.length + " values ";
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


    get(x, y)
    {
        if (!this.data) return "???";
        if (this.data[x + y * this._numCols] === undefined) return "-";
        return this.data[x + y * this._numCols];
    }


    show()
    {
    }
};
