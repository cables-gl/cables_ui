import EditorTabAce from "./tabs/tab_editor_ace.js";
import EditorTabCodemirror from "./tabs/tab_editor_codemirror.js";
import EditorTabTextArea from "./tabs/tab_editor_textarea.js";
import { userSettings } from "./usersettings.js";

export function createEditor(options)
{
    if (userSettings.get("texteditor") == "textarea") return new EditorTabTextArea(options);
    else if (userSettings.get("texteditor") == "cm") return new EditorTabCodemirror(options);
    else if (userSettings.get("texteditor") == "cmhx") return new EditorTabCodemirror(options, true);
    else return new EditorTabAce(options);

}
