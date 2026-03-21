import { contextMenu } from "../elements/contextmenu.js";
import { gui } from "../gui.js";
import { platform } from "../platform.js";
import { GuiText } from "../text.js";
import EditorTabAce from "./tabs/tab_editor_ace.js";
import EditorTabCodemirror from "./tabs/tab_editor_codemirror.js";
import EditorTabTextArea from "./tabs/tab_editor_textarea.js";
import ManageOp from "./tabs/tab_manage_op.js";
import { userSettings } from "./usersettings.js";

export function createEditor(options)
{
    if (userSettings.get("texteditor") == "textarea") return new EditorTabTextArea(options);
    else if (userSettings.get("texteditor") == "cmhx") return new EditorTabCodemirror(options, true);
    else if (userSettings.get("texteditor") == "ace") return new EditorTabAce(options);
    else return new EditorTabCodemirror(options);

}

export function isFocusOnEditor()
{
    const isEdit = document.activeElement.classList.contains("ace_text-input") ||
                   document.activeElement.classList.contains("cm-textfield") ||
                   document.activeElement.classList.contains("cm-content");
    return isEdit;
}

export function createOpDocButton(tab, editor)
{

    if (editor._options.allowEdit)
    {
        if (editor._options.onSave || editor._options.showSaveButton)
            tab.addButton(GuiText.editorSaveButton, () =>
            {
                editor.save();
            });

        let hideFormatButton = !!editor._options.hideFormatButton;
        if (!hideFormatButton && editor._options.syntax && editor._options.syntax === "js") hideFormatButton = false;
        else hideFormatButton = true;

        if (!platform.frontendOptions.showFormatCodeButton)hideFormatButton = true;

        if (editor.format && editor._options.allowEdit && !hideFormatButton)
            tab.addButton(GuiText.editorFormatButton, () => { editor.format(); });
    }

    let opname = null;
    editor._options.editorObj = editor._options.editorObj || {};
    if (editor._options.editorObj.type === "op") opname = editor._options.editorObj.name;
    if (editor._options.editorObj.data && editor._options.editorObj.data.opname) opname = editor._options.editorObj.data.opname;

    if (!opname)
    {
        const d = gui.opDocs.getOpDocById(editor._options.name);
        if (d)opname = d.name;
    }

    let opId = null;
    if (opname)
    {
        const opdoc = gui.opDocs.getOpDocByName(opname);
        if (opdoc)
        {
            opId = opdoc.id;
        }
        else
        {
            this._log.warn("could not get opdoc:" + opname);
        }

        tab.addButton("<span class=\"icon icon-op\"></span> Manage Op", () => { new ManageOp(gui.mainTabs, opId); });

        if (opdoc && opdoc.attachmentFiles && opdoc.attachmentFiles.length)
        {
            const el = tab.addButton("<span class=\"icon icon-chevron-down\"></span>Op Files", () =>
            {
                const items = [];

                items.push({
                    "title": opdoc.name + ".js",
                    "func": () =>
                    {
                        gui.serverOps.edit(opdoc.name, false, null, true);
                    }
                });

                for (let i = 0; i < opdoc.attachmentFiles.length; i++)
                {
                    const fn = opdoc.attachmentFiles[i];
                    items.push({
                        "title": opdoc.attachmentFiles[i],
                        "func": () =>
                        {
                            gui.serverOps.editAttachment(opname, fn);
                        }
                    });
                }

                contextMenu.show({ "items": items }, el);
            });
        }

        tab.addButton("Op Docs", () => { window.open(platform.getCablesDocsUrl() + "/op/" + opname); });

    }
    if (platform.isDevEnv() && document.location.href.indexOf("local") > -1)
        tab.addButton("<span class=\"info nomargin icon icon-1_25x icon-copy\"  ></span>", () =>
        {
            let path = opname + "/" + opname + ".js";
            console.log("op path", path);
            navigator.clipboard.writeText(path);
        });

    if (platform.frontendOptions.openLocalFiles && editor._options.allowEdit)
    {
        tab.addButton("<span class=\"info nomargin icon icon-1_25x icon-folder\" data-info=\"electron_openfolder\" ></span>",
            (e) =>
            {
                if (e.ctrlKey || e.metaKey) CABLES.CMD.ELECTRON.copyOpDirToClipboard(opId);
                else CABLES.CMD.ELECTRON.openOpDir(opId, opname);
            });
    }
}
