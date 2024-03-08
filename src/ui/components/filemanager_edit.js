import ele from "../utils/ele";
import Logger from "../utils/logger";
import ItemManager from "./tabs/tab_item_manager";
import { getHandleBarHtml } from "../utils/handlebars";
import ModalDialog from "../dialogs/modaldialog";
import text from "../text";
import userSettings from "./usersettings";
import ModalLoading from "../dialogs/modalloading";
import EditorTab from "./tabs/tab_editor";

export default class FileManagerEditor
{
    constructor()
    {
        CABLES.editorSession.addListener("editAssetFile",
            (name, data) =>
            {
                this.editAssetTextFile(data.filename, data.syntax);
            }
        );
    }



    editAssetTextFile(filename, syntax)
    {
        let url = "";
        url = "/assets/" + gui.project()._id + "/" + filename;


        CABLES.ajax(
            url,
            (err2, _data, xhr2) =>
            {
                const name = "edit " + filename;

                const editorObj = CABLES.editorSession.rememberOpenEditor("editAssetFile", name, { "filename": filename, "syntax": syntax }, true);


                new EditorTab(
                    {
                        "title": name,
                        "content": _data,
                        "editorObj": editorObj,
                        "syntax": syntax,
                        "onClose": function (which)
                        {
                        },
                        "onSave": function (setStatus, content)
                        {
                            gui.jobs().start({ "id": "saveeditorcontent" + filename, "title": "saving file " + filename });

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
