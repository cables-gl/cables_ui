
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

        this._tab = new CABLES.UI.Tab("Variables", {
            "icon": "align-justify",
            "infotext": "tab_watchvars",
            "padding": true,
            "singleton": "false", });

        this._tab.on("close", () =>
        {
            const vars = this._patch.getVars();
            for (const y in vars)
                vars[y].removeListener(this._updateVar.bind(this));

            console.log("tab close");
        });

        this._tabs.addTab(this._tab, true);

        this._id = "spread" + CABLES.uuid();
        this._tab.html("<div id='" + this._id + "'></div>");
        this._ele = document.getElementById(this._id);
        this._ele.classList.add("editor_spreadsheet");
        this._ele.classList.add("tabcontent-scroll");

        this._eleIconbar = ele.create("div");
        this._ele.appendChild(this._eleIconbar);

        this._eleInfo = ele.create("div");
        this._ele.appendChild(this._eleInfo);
        this._eleInfo.innerHTML = "<h2>Variables</h2><input id=\"varfilter\" class=\"medium info\" type=\"search\"/><br/><br/>";

        this._eleTable = ele.create("table");
        this._ele.appendChild(this._eleTable);

        this._html();

        ele.byId("varfilter").addEventListener("input", this._html.bind(this));
        ele.byId("varfilter").focus();
    }


    _html()
    {
        this._eleTable.innerHTML = "";

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


        const filter = ele.byId("varfilter").value;

        for (let y in vars)
        {
            const theVar = vars[y];

            if (!filter || y.indexOf(filter) > -1 || theVar._v.indexOf(filter) > -1)
            {
                const tr = ele.create("tr");
                table.appendChild(tr);

                const tdName = ele.create("td");
                tdName.innerHTML = "#" + y;
                tdName.classList.add("rownumleft");
                tr.appendChild(tdName);

                const tdVal = ele.create("td");
                tdVal.innerHTML = "<span id=\"var" + y + "\">" + theVar._v + "</span>";
                tr.appendChild(tdVal);

                const tdType = ele.create("td");
                tdType.innerHTML = theVar.type;
                tdType.classList.add("rownumleft");
                tr.appendChild(tdType);

                theVar.addListener(this._updateVar.bind(this));
            }
        }
    }

    _updateVar(v, vrbl)
    {
        if (!vrbl) return console.log("[varwatcher] no variable");
        const ele = document.getElementById("var" + vrbl._name);

        if (!ele) return console.log("[varwatcher] var element not found!");
        ele.innerHTML = v;
    }

    show()
    {
    }
};
