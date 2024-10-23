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
        CABLES.editorSession.addListener("editAssetFile",
            (name, data) =>
            {
                this.editAssetTextFile(data.filename, data.syntax, data.patchId);
            }
        );
    }

    editAssetTextFile(filename, syntax, patchId)
    {
        console.log("filename", filename);
        patchId = patchId || gui.project()._id;
        let url = filename;
        if (!filename.startsWith("file:"))
        {
            url = CABLES.platform.getSandboxUrl() + "/assets/" + patchId + "/" + filename;
        }

        if (syntax == "javascript")syntax = "js";
        if (syntax == "shader")syntax = "glsl";

        CABLES.ajax(
            url,
            (err2, _data, xhr2) =>
            {
                const name = filename;

                const editorObj = CABLES.editorSession.rememberOpenEditor("editAssetFile", name, { "filename": filename, "patchId": patchId, "syntax": syntax }, true);

                new EditorTab(
                    {
                        "title": name,
                        "content": _data,
                        "editorObj": editorObj,
                        "syntax": syntax,
                        "onClose": function (which)
                        {
                            CABLES.editorSession.remove(editorObj.type, editorObj.name);
                        },
                        "onSave": function (setStatus, content)
                        {
                            gui.jobs().start({ "id": "saveeditorcontent" + filename, "title": "saving file " + filename });

                            console.log("updatefile save", filename);

                            CABLESUILOADER.talkerAPI.send(
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
