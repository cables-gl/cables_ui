import { ele } from "cables-shared-client";
import defaultOps from "../../defaultops.js";
import Tab from "../../elements/tabpanel/tab.js";
import TabPanel from "../../elements/tabpanel/tabpanel.js";
import { gui } from "../../gui.js";
import { getHandleBarHtml } from "../../utils/handlebars.js";
import { editorSession } from "../../elements/tabpanel/editor_session.js";
import opNames from "../../opnameutils.js";
import { PortDir, portType } from "../../core_constants.js";
import ModalDialog from "../../dialogs/modaldialog.js";
import { Commands } from "../../commands/commands.js";
import { InputBindings } from "../../inputbindings.js";

export default class TabInputBindings
{
    static TABSESSION_NAME = "InputBindings";
    lastCount = 0;
    #timeOut = null;
    #tab;

    /**
     * @param {TabPanel} [tabs]
     */
    constructor(tabs)
    {
        tabs ||= gui.mainTabs;
        this.#tab = new Tab(TabInputBindings.TABSESSION_NAME, { "icon": "list", "singleton": true, "infotext": "tab_keybindings", "padding": true });
        tabs.addTab(this.#tab, true);

        editorSession.rememberOpenEditor(TabInputBindings.TABSESSION_NAME, TabInputBindings.TABSESSION_NAME, { }, true);
        let html = getHandleBarHtml("tab_keybindings");

        this.#tab.html(html);
        this.update();
        gui.maintabPanel.show(true);

        ele.clickable(ele.byId("keybind_add"), (o) =>
        {
            this.editBinding({});
        });

        this.#tab.on("close", () =>
        {
            clearInterval(this.#timeOut);
            editorSession.remove(TabInputBindings.TABSESSION_NAME, TabInputBindings.TABSESSION_NAME);
        });
    }

    update()
    {
        gui.corePatch().tempData.continueStepDebugLog = gui.corePatch().tempData.continueStepDebugLog || [];

        let html = "";

        html += "<table class=\"editor_spreadsheet\" style=\"width:100%\">";

        html += "<tr>";
        html += "<td class=\"colname\">Category</td>";
        html += "<td class=\"colname\">Action</td>";
        html += "<td class=\"colname\">Command</td>";
        html += "<td class=\"colname\"> </td>";
        html += "<tr>";

        for (let i = 0; i < InputBindings.ACTIONS.length; i++)
        {
            let cmd = Commands.getCommandByFunction(InputBindings.ACTIONS[i].func);

            const cmdTitle = cmd?.cmd || "none";

            html += "<tr>";
            html += "<td>";
            html += InputBindings.ACTIONS[i].category;
            html += "</td>";
            html += "<td>";
            html += InputBindings.ACTIONS[i].title;
            html += "</td>";
            html += "<td>" + cmdTitle;
            html += "</td>";
            html += "</td>";
            html += "<td>";
            html += "<a id=\"inpbind" + i + "\" class=\"button-small\" >edit</a>";
            html += "</td>";
            html += "</tr>";
        }
        html += "</table>";

        ele.byId("debugger_log").innerHTML = html;

        for (let i = 0; i < InputBindings.ACTIONS.length; i++)
        {
            const action = InputBindings.ACTIONS[i].id;
            ele.clickable(ele.byId("inpbind" + i), () =>
            {

                this.editBinding(action);
            });

        }
    }

    editBinding(actionId)
    {
        let html = "";

        html += "Command:";
        html += "<select id=\"cmdselect\">";
        html += "<option value=\"default\">default</option>";

        const cmds = Commands.getKeyBindableCommands();

        for (let i = 0; i < cmds.length; i++)
        {
            html += "<option value=\"" + cmds[i].cmd + "\"";

            if (cmds[i].func == gui.inputBindings.getBind(actionId).func) html += " selected=\"selected\" ";

            html += ">";
            html += cmds[i].category + ": " + cmds[i].cmd + "</option>";
        }
        html += "</select>";

        const dialog = new ModalDialog({
            "title": "New Binding",
            "text": "",
            "html": html,
            "showOkButton": true,
            "okButton": {
                "callback": () =>
                {
                    const cmdname = ele.byId("cmdselect").value;
                    let cmd;
                    if (cmdname == "default")
                    {
                        const bi = gui.inputBindings.getBind(actionId);
                        console.log("bi", bi);
                        cmd = Commands.getCommandByFunction(bi.default);
                        if (!cmd)cmd = {};
                    }
                    else
                        cmd = Commands.getCommandByName(cmdname);

                    gui.inputBindings.setBindingFunc(actionId, cmd.func, true);
                    this.update();
                }
            }
        });

    }
}

editorSession.addListener(TabInputBindings.TABSESSION_NAME, (id, data) =>
{
    new TabInputBindings(gui.mainTabs);
});
