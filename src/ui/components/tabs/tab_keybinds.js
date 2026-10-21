import { ele } from "cables-shared-client";
import Tab from "../../elements/tabpanel/tab.js";
import TabPanel from "../../elements/tabpanel/tabpanel.js";
import { gui } from "../../gui.js";
import { getHandleBarHtml } from "../../utils/handlebars.js";
import { editorSession } from "../../elements/tabpanel/editor_session.js";
import ModalDialog from "../../dialogs/modaldialog.js";
import { Commands } from "../../commands/commands.js";
import { InputBindings } from "../../inputbindings.js";

export default class TabInputBindings
{
    static TABSESSION_NAME = "InputBindings";
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
        this.#tab.html(getHandleBarHtml("tab_keybindings"));
        this.update();
        gui.maintabPanel.show(true);

        ele.clickable(ele.byId("keybind_add"), () =>
        {
            this.editKeyOverride(null);
        });

        this.#tab.on("close", () =>
        {
            editorSession.remove(TabInputBindings.TABSESSION_NAME, TabInputBindings.TABSESSION_NAME);
        });
    }

    update()
    {
        this.#updateKeyOverrides();
        this.#updateMouseBindings();
    }

    #updateKeyOverrides()
    {
        const overrides = gui.inputBindings.getKeyOverrides();

        if (overrides.length == 0)
        {
            ele.byId("keybind_overrides").innerHTML = "No custom key bindings.";
            return;
        }

        let html = "<table class=\"editor_spreadsheet\" style=\"width:100%\">";
        html += "<tr>";
        html += "<td class=\"colname\">Key</td>";
        html += "<td class=\"colname\">Context</td>";
        html += "<td class=\"colname\">Command</td>";
        html += "<td class=\"colname\">Replaces</td>";
        html += "<td class=\"colname\"> </td>";
        html += "</tr>";

        for (let i = 0; i < overrides.length; i++)
        {
            const o = overrides[i];
            html += "<tr>";
            html += "<td>" + InputBindings.comboToString(o) + "</td>";
            html += "<td>" + o.context + "</td>";
            html += "<td>" + (o.cmd || "(disabled)") + "</td>";
            html += "<td>" + gui.keys.getBuiltinTitles(o, o.context).join(", ") + "</td>";
            html += "<td>";
            html += "<a id=\"keyoverride_edit" + i + "\" class=\"button-small\">edit</a> ";
            html += "<a id=\"keyoverride_remove" + i + "\" class=\"button-small\">remove</a>";
            html += "</td>";
            html += "</tr>";
        }
        html += "</table>";

        ele.byId("keybind_overrides").innerHTML = html;

        for (let i = 0; i < overrides.length; i++)
        {
            const o = overrides[i];
            ele.clickable(ele.byId("keyoverride_edit" + i), () => { this.editKeyOverride(o); });
            ele.clickable(ele.byId("keyoverride_remove" + i), () =>
            {
                gui.inputBindings.removeKeyOverride(o);
                this.update();
            });
        }
    }

    #updateMouseBindings()
    {
        let html = "<table class=\"editor_spreadsheet\" style=\"width:100%\">";
        html += "<tr>";
        html += "<td class=\"colname\">Category</td>";
        html += "<td class=\"colname\">Action</td>";
        html += "<td class=\"colname\">Command</td>";
        html += "<td class=\"colname\"> </td>";
        html += "</tr>";

        for (let i = 0; i < InputBindings.ACTIONS.length; i++)
        {
            const cmd = Commands.getCommandByFunction(InputBindings.ACTIONS[i].func);
            const cmdTitle = cmd?.cmd || "none";

            html += "<tr>";
            html += "<td>" + InputBindings.ACTIONS[i].category + "</td>";
            html += "<td>" + InputBindings.ACTIONS[i].title + "</td>";
            html += "<td>" + cmdTitle + "</td>";
            html += "<td><a id=\"inpbind" + i + "\" class=\"button-small\">edit</a></td>";
            html += "</tr>";
        }
        html += "</table>";

        ele.byId("keybind_mouse").innerHTML = html;

        for (let i = 0; i < InputBindings.ACTIONS.length; i++)
        {
            const action = InputBindings.ACTIONS[i].id;
            ele.clickable(ele.byId("inpbind" + i), () => { this.editBinding(action); });
        }
    }

    /**
     * @param {string} selectedCmd
     * @param {boolean} allowDisable
     */
    #commandOptionsHtml(selectedCmd, allowDisable)
    {
        let html = "";
        if (allowDisable)
        {
            html += "<option value=\"\"";
            if (!selectedCmd) html += " selected=\"selected\"";
            html += ">(disable key)</option>";
        }

        const cmds = Commands.commands.slice();
        cmds.sort((a, b) => { return (a.category + " " + a.cmd).localeCompare(b.category + " " + b.cmd); });

        for (let i = 0; i < cmds.length; i++)
        {
            if (!cmds[i].func) continue;
            html += "<option value=\"" + cmds[i].cmd + "\"";
            if (cmds[i].cmd == selectedCmd) html += " selected=\"selected\"";
            html += ">" + cmds[i].category + ": " + cmds[i].cmd + "</option>";
        }
        return html;
    }

    /**
     * @param {import("../../inputbindings.js").KeyOverride} existing
     */
    editKeyOverride(existing)
    {
        let combo = null;
        let recording = false;
        let swallowKeyUp = false;
        if (existing) combo = { "key": existing.key, "cmdCtrl": existing.cmdCtrl, "shift": existing.shift, "alt": existing.alt };

        let html = "";
        html += "<table>";
        html += "<tr><td>Key:</td><td><a id=\"keybind_record\" class=\"button-small\">record</a> <b id=\"keybind_combo\"></b></td></tr>";

        html += "<tr><td>Context:</td><td><select id=\"keybind_context\">";
        for (let i = 0; i < InputBindings.CONTEXTS.length; i++)
        {
            const context = InputBindings.CONTEXTS[i];
            html += "<option value=\"" + context + "\"";
            if (existing && existing.context == context) html += " selected=\"selected\"";
            html += ">" + context + "</option>";
        }
        html += "</select></td></tr>";

        html += "<tr><td>Command:</td><td><select id=\"keybind_cmd\">";
        html += this.#commandOptionsHtml(existing ? existing.cmd : null, true);
        html += "</select></td></tr>";

        html += "<tr><td>Replaces:</td><td id=\"keybind_replaces\"></td></tr>";
        html += "</table>";

        const dialog = new ModalDialog({
            "title": existing ? "Edit Key Binding" : "New Key Binding",
            "html": html,
            "showOkButton": true,
            "okButton": {
                "callback": (done) =>
                {
                    if (!combo) return;

                    if (existing) gui.inputBindings.removeKeyOverride(existing);
                    gui.inputBindings.setKeyOverride({
                        "context": /** @type {HTMLSelectElement} */ (ele.byId("keybind_context")).value,
                        "key": combo.key,
                        "cmdCtrl": combo.cmdCtrl,
                        "shift": combo.shift,
                        "alt": combo.alt,
                        "cmd": /** @type {HTMLSelectElement} */ (ele.byId("keybind_cmd")).value
                    });
                    this.update();
                    done();
                }
            }
        });

        const eleContext = /** @type {HTMLSelectElement} */ (ele.byId("keybind_context"));

        const updateInfo = () =>
        {
            if (recording) ele.byId("keybind_combo").innerHTML = "press a key...";
            else if (combo) ele.byId("keybind_combo").innerHTML = InputBindings.comboToString(combo);
            else ele.byId("keybind_combo").innerHTML = "none";

            if (combo) ele.byId("keybind_replaces").innerHTML = gui.keys.getBuiltinTitles(combo, eleContext.value).join(", ") || "-";
            else ele.byId("keybind_replaces").innerHTML = "-";
        };

        /**
         * @param {KeyboardEvent} e
         */
        const onRecordKey = (e) =>
        {
            e.preventDefault();
            e.stopImmediatePropagation();
            if (e.type != "keydown") return;

            const key = (e.key + "").toLowerCase();
            if (InputBindings.isModifierKey(key)) return;

            combo = InputBindings.comboFromEvent(e);
            recording = false;
            swallowKeyUp = true;
            window.removeEventListener("keydown", onRecordKey, true);
            updateInfo();
        };

        /**
         * @param {KeyboardEvent} e
         */
        const onRecordKeyUp = (e) =>
        {
            if (!recording && !swallowKeyUp) return;
            e.preventDefault();
            e.stopImmediatePropagation();
            if (!InputBindings.isModifierKey((e.key + "").toLowerCase())) swallowKeyUp = false;
        };

        ele.clickable(ele.byId("keybind_record"), () =>
        {
            recording = true;
            window.addEventListener("keydown", onRecordKey, true);
            updateInfo();
        });

        window.addEventListener("keyup", onRecordKeyUp, true);
        eleContext.addEventListener("change", updateInfo);

        dialog.on("onClose", () =>
        {
            window.removeEventListener("keydown", onRecordKey, true);
            window.removeEventListener("keyup", onRecordKeyUp, true);
        });

        updateInfo();
    }

    /**
     * @param {string} actionId
     */
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

        new ModalDialog({
            "title": "Mouse Binding",
            "text": "",
            "html": html,
            "showOkButton": true,
            "okButton": {
                "callback": (done) =>
                {
                    const cmdname = /** @type {HTMLSelectElement} */ (ele.byId("cmdselect")).value;
                    let cmd;
                    if (cmdname == "default")
                    {
                        const bi = gui.inputBindings.getBind(actionId);
                        cmd = Commands.getCommandByFunction(bi.default);
                        if (!cmd) cmd = {};
                    }
                    else
                        cmd = Commands.getCommandByName(cmdname);

                    gui.inputBindings.setBindingFunc(actionId, cmd.func, true);
                    this.update();
                    done();
                }
            }
        });
    }
}

window.addEventListener(CABLES.UI_EVENT_EDITORSESSION_INIT, () =>
{
    editorSession.addListener(TabInputBindings.TABSESSION_NAME, (id, data) =>
    {
        new TabInputBindings(gui.mainTabs);
    });
});
