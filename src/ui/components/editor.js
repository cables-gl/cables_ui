import EditorTabAce from "./tabs/tab_editor_ace.js";
import EditorTabCmHx from "./tabs/tab_editor_cmhelix.js";
import EditorTabTextArea from "./tabs/tab_editor_textarea.js";
import { userSettings } from "./usersettings.js";

export function createEditor(options)
{
    if (userSettings.get("texteditor") == "textarea") return new EditorTabTextArea(options);
    else if (userSettings.get("texteditor") == "cmhx") return new EditorTabCmHx(options);
    else return new EditorTabAce(options);

}
