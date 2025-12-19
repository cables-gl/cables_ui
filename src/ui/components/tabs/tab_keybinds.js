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
import CMD from "../../commands/commands.js";

/**
 * @typedef KeyBindObject
 * @property  {String} [cmd]
 * @property  {string} [action]
 */
export default class TabKeybindings
{

    static TABSESSION_NAME = "Keybindings";
    lastCount = 0;

    /**
     * @param {TabPanel} tabs
     */
    constructor(tabs)
    {

        this._tab = new Tab(TabKeybindings.TABSESSION_NAME, { "icon": "list", "singleton": true, "infotext": "tab_keybindings", "padding": true });
        tabs.addTab(this._tab, true);

        editorSession.rememberOpenEditor(TabKeybindings.TABSESSION_NAME, "debugger", { }, true);
        let html = getHandleBarHtml("tab_keybindings");
        this._tab.html(html);
        this.update();

        ele.clickable(ele.byId("keybind_add"), (o) =>
        {
            this.editBinding({});
        });

        this._tab.on("close", () =>
        {
            editorSession.remove(TabKeybindings.TABSESSION_NAME, TabKeybindings.TABSESSION_NAME);
        });
    }

    update()
    {

        gui.corePatch().tempData.continueStepDebugLog = gui.corePatch().tempData.continueStepDebugLog || [];
        if (this.lastCount == gui.corePatch().tempData.continueStepDebugLog.length) return;

        this.lastCount = gui.corePatch().tempData.continueStepDebugLog.length;

        let html = "hallo";

        ele.byId("debugger_log").innerHTML = html;
    }

    editBinding(bind)
    {
        let html = "";

        const mouseActions = [
            "right click",
            "middle click",
            "left double click",
            "middle double click",
            "right double click",
        ];

        html += "Action:";
        html += "<select>";
        for (let i = 0; i < mouseActions.length; i++)
        {
            html += "<option value=\"\">" + mouseActions[i] + "</option>";
        }
        html += "</select>";

        html += "<br/>";
        html += "<br/>";
        html += "Command:";
        html += "<select>";
        const cmds = CMD.getKeyBindableCommands();
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
