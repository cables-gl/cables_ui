import undo from "../../utils/undo";

export default class MetaHistory
{
    constructor(tabs)
    {
        this.html = "";
        this._tab = new CABLES.UI.Tab("History", { "icon": "list", "infotext": "tab_history", "padding": true });
        tabs.addTab(this._tab);

        undo.setCallback(this.update.bind(this));

        this.update();
        this._tab.on("onActivate", () => { this.update(); });
    }

    update()
    {
        if (!this._tab.isVisible()) return;

        this.html = "<h2>Undo History</h2>";

        this.html += "<span onclick=\"CABLES.UI.undo.undo();\" class=\"iconbutton\"><span class=\"icon icon-arrow-left\" ></span></span>";
        this.html += "<span onclick=\"CABLES.UI.undo.redo();\" class=\"iconbutton\"><span class=\"icon icon-arrow-right\"></span></span>";

        const commands = undo.getCommands();

        this.html += "&nbsp;&nbsp;&nbsp;" + (undo.getIndex() + 1) + " / " + (commands.length) + "<br/><br/>";

        let groupSummary = [];
        let lastGroup = null;

        for (let i = -1; i < commands.length; i++)
        {
            let cmd = null;

            if (i == -1) cmd = { "groupName": "Open patch", "group": true };
            else cmd = commands[i];

            let style = "";
            if (!cmd.group || i == 0 || (i > 0 && lastGroup && lastGroup != cmd.group)) style += "margin-top:4px;";

            if (undo.getIndex() == i) style += "border-left:4px solid var(--color-10);background-color:var(--color-04);";
            else if (undo.getIndex() < i) style += "opacity:0.4;border-left:4px solid var(--color-06);background-color:var(--color-03);";
            else style += "border-left:4px solid var(--color-08);background-color:var(--color-03);";

            groupSummary.push(cmd.title);

            if (!cmd.group || cmd.groupName) this.html += "<div style=\"padding:2px;padding-left:7px;" + style + "\">";

            if (!cmd.group)
            {
                this.html += "<b>" + cmd.title + "</b>";
                groupSummary = [];
            }

            if (cmd.groupName)
            {
                if (i != -1 && groupSummary.length > 1)
                {
                    groupSummary.length = Math.min(groupSummary.length, 5);
                    this.html += groupSummary.join(", ");
                    this.html += "...<br/>";
                }

                this.html += "<b>" + cmd.groupName + "</b>";
                lastGroup = cmd.group;
                groupSummary = [];
            }

            this.html += "</div>";
        }

        this._tab.html(this.html);
    }

    show()
    {
        this.update();
    }
}
