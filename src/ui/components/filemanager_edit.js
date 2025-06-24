import { utils } from "cables";
import { editorSession } from "../elements/tabpanel/editor_session.js";
import { gui } from "../gui.js";
import { platform } from "../platform.js";
import EditorTab from "./tabs/tab_editor.js";

/**
 * edit text files directly from the filemanager
 *
 * @export
 * @class FileManagerEditor
 */
export default class FileManagerEditor
{
    constructor()
    {
        editorSession.addListener("editAssetFile",
            (name, data) =>
            {
                this.editAssetTextFile(data.filename, data.syntax, data.patchId);
            }
        );
    }

    editAssetTextFile(filename, syntax, patchId)
    {
        patchId = patchId || gui.project()._id;
        let url = filename;
        if (!filename.startsWith("file:"))
        {
            url = platform.getSandboxUrl() + "/assets/" + patchId + "/" + filename;
        }

        if (!syntax) syntax = "text";
        if (syntax == "javascript")syntax = "js";
        if (syntax == "shader")syntax = "glsl";

        utils.ajax(
            url,
            (err2, _data, xhr2) =>
            {
                const name = filename;

                let editorObj = editorSession.rememberOpenEditor("editAssetFile", name, { "filename": filename, "patchId": patchId, "syntax": syntax }, true);

                new EditorTab(
                    {
                        "title": name,
                        "content": _data,
                        "editorObj": editorObj,
                        "syntax": syntax.toLowerCase(),
                        "singleton": true,
                        "onClose": (which) =>
                        {
                            if (editorSession)
                            {
                                if (which && which.editorObj) editorObj = which.editorObj;
                                editorSession.remove(editorObj.type, editorObj.name);
                            }
                        },
                        "onSave": function (setStatus, content)
                        {
                            gui.jobs().start({ "id": "saveeditorcontent" + filename, "title": "saving file " + filename });

                            platform.talkerAPI.send(
                                "updateFile",
                                {
                                    "fileName": filename,
                                    "content": content,
                                },
                                (err3, res3) =>
                                {
                                    gui.savedState.setSaved("editorOnChangeFile");
                                    gui.jobs().finish("saveeditorcontent" + filename);
                                    setStatus("saved");
                                }
                            );
                        },
                        "onChange": function (ev)
                        {
                            gui.savedState.setUnSaved("editorOnChangeFile");
                        },
                        "onFinished": () =>
                        {
                            // gui.mainTabs.activateTabByName(name);
                        }
                    });
            });
    }
}
