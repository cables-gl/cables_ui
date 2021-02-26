
CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.WatchVarTab = class extends CABLES.EventTarget
{
    constructor(tabs, patch)
    {
        super();
        this._tabs = tabs;
        this._patch = patch || gui.corePatch();

        this._patch.addEventListener("variablesChanged", this._html.bind(this));
        this._patch.addEventListener("variableRename", this._html.bind(this));


        this._tab = new CABLES.UI.Tab("Variables", { "icon": "align-justify", "infotext": "tab_watchvars", "padding": true, "singleton": "false", });

        this._tab.on("close", () =>
        {
            console.log("tab close");
            this.port.off(this.portListenerId);
        });

        this._tabs.addTab(this._tab, true);

        this._id = "spread" + CABLES.uuid();
        this._tab.html("<div id='" + this._id + "'></div>");
        this._ele = document.getElementById(this._id);
        this._ele.classList.add("editor_spreadsheet");

        this._eleIconbar = ele.create("div");
        this._ele.appendChild(this._eleIconbar);

        this._eleInfo = ele.create("div");
        this._ele.appendChild(this._eleInfo);

        // this._eleIconMinus = ele.create("a");
        // this._eleIconMinus.innerHTML = "-";
        // this._eleIconMinus.classList.add("button");
        // this._eleIconMinus.addEventListener("click", () => { this._changeColumns(-1); });
        // this._eleIconbar.appendChild(this._eleIconMinus);


        // this._eleIconPlus = ele.create("a");
        // this._eleIconPlus.innerHTML = "+";
        // this._eleIconPlus.classList.add("button");
        // this._eleIconPlus.addEventListener("click", () => { this._changeColumns(1); });
        // this._eleIconbar.appendChild(this._eleIconPlus);

        this._eleTable = ele.create("table");
        this._ele.appendChild(this._eleTable);

        this._html();
    }


    _html()
    {
        const vars = this._patch.getVars();

        const table = this._eleTable;

        const trHead = ele.create("tr");
        for (let x = 0; x < 3; x++)
        {
            const tdr = ele.create("td");
            if (x == 0)tdr.innerHTML = "name";
            if (x == 1)tdr.innerHTML = "value";
            if (x == 2)tdr.innerHTML = "type";
            tdr.classList.add("colname");
            trHead.appendChild(tdr);
        }
        table.appendChild(trHead);

        console.log("vars!", vars.length, vars);
        for (let y in vars)
        {
            const tr = ele.create("tr");
            table.appendChild(tr);

            const tdName = ele.create("td");
            tdName.innerHTML = "#" + y;
            tdName.classList.add("rownumleft");
            tr.appendChild(tdName);

            const tdVal = ele.create("td");
            tdVal.innerHTML = "<span>" + vars[y]._v + "</span>";
            tr.appendChild(tdVal);

            const tdType = ele.create("td");
            tdType.innerHTML = vars[y].type;
            tdType.classList.add("rownumleft");
            tr.appendChild(tdType);
        }
    }

    show()
    {
    }
};
