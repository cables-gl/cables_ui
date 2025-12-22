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

export default class TabKeybindings
{
    static TABSESSION_NAME = "Keybindings";
    lastCount = 0;
    #timeOut = null;
    #tab;

    /**
     * @param {TabPanel} tabs
     */
    constructor(tabs)
    {
        this.#tab = new Tab(TabKeybindings.TABSESSION_NAME, { "icon": "list", "singleton": true, "infotext": "tab_keybindings", "padding": true });
        tabs.addTab(this.#tab, true);

        editorSession.rememberOpenEditor(TabKeybindings.TABSESSION_NAME, TabKeybindings.TABSESSION_NAME, { }, true);
        let html = getHandleBarHtml("tab_keybindings");

        this.#tab.html(html);
        this.update();

        ele.clickable(ele.byId("keybind_add"), (o) =>
        {
            this.editBinding({});
        });

        this.#tab.on("close", () =>
        {
            clearInterval(this.#timeOut);
            editorSession.remove(TabKeybindings.TABSESSION_NAME, TabKeybindings.TABSESSION_NAME);
        });
    }

    update()
    {

        console.log("upldate", JSON.stringify(InputBindings.MOUSE_ACTIONS), InputBindings.MOUSE_ACTIONS.length);

        gui.corePatch().tempData.continueStepDebugLog = gui.corePatch().tempData.continueStepDebugLog || [];

        let html = "";

        html += "<table class=\"editor_spreadsheet\" style=\"width:100%\">";

        html += "<tr>";
        html += "<td class=\"colname\">Action</td>";
        html += "<td class=\"colname\">Command</td>";
        html += "<tr>";

        for (let i = 0; i < InputBindings.MOUSE_ACTIONS.length; i++)
        {
            let cmd = Commands.getCommandByFunction(InputBindings.MOUSE_ACTIONS[i].func);

            let cmdTitle = "none";
            if (cmd)cmdTitle = cmd.cmd;

            html += "<tr>";
            html += "<td>";
            html += InputBindings.MOUSE_ACTIONS[i].title;
            html += "</td>";
            html += "<td>" + cmdTitle;
            html += "</td>";
            html += "</tr>";
        }
        html += "</table>";

        ele.byId("debugger_log").innerHTML = html;
    }

    editBinding(bind)
    {
        let html = "";

        html += "Action:";
        html += "<select>";
        for (let i = 0; i < InputBindings.MOUSE_ACTIONS.length; i++)
        {
            html += "<option value=\"" + InputBindings.MOUSE_ACTIONS[i].id + "\">" + InputBindings.MOUSE_ACTIONS[i].title + "</option>";
        }
        html += "</select>";

        html += "<br/>";
        html += "<br/>";
        html += "Command:";
        html += "<select>";
        const cmds = Commands.getKeyBindableCommands();
        for (let i = 0; i < cmds.length; i++)
        {
            html += "<option value=\"\">" + cmds[i].category + ": " + cmds[i].cmd + "</option>";
        }
        html += "</select>";

        new ModalDialog({
            "title": "New Binding",
            "text": "",
            "html": html,
            "showOkButton": true,
            "okButton": {
                "callback": () =>
                {

                    console.log("jajajaja");
                }
            }
        });

    }
}

editorSession.addListener(TabKeybindings.TABSESSION_NAME, (id, data) =>
{
    new TabKeybindings(gui.mainTabs);
});
