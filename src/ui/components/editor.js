import EditorTab from "./tabs/tab_editor_ace.js";
import EditorTabTextArea from "./tabs/tab_editor_textarea.js";

export function createEditor(options)
{
    return new EditorTab(options);
    // return new EditorTabTextArea(options);

}
