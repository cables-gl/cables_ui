import { Logger } from "cables-shared-client";
import { gui } from "../gui.js";
import { platform } from "../platform.js";
import ModalDialog from "../dialogs/modaldialog.js";
import { notify, notifyError } from "../elements/notification.js";

export { CmdFiles };

class CmdFiles
{

    static get commands()
    {

        /** @type {import("./commands.js").commandObject[]} */
        return [
            {
                "cmd": "Replace file path",
                "category": "patch",
                "func": CmdFiles.replaceFilePath
            }];
    }

    static replaceFilePath(from = null, to = null)
    {
        new ModalDialog({
            "prompt": true,
            "title": "Replace String Values",
            "text": "Search for...",
            "promptValue": from || "/assets/",
            "promptOk": (search) =>
            {
                new ModalDialog({
                    "prompt": true,
                    "title": "Replace String Values",
                    "text": "...replace with",
                    "promptValue": to || "/assets/" + gui.project()._id,
                    "promptOk": (replace) =>
                    {
                        gui.fileManager.replaceAssetPorts(search, replace);
                    }
                });
            }
        });
    }
}
