import { Logger } from "cables-shared-client";
import { gui } from "../gui.js";
import { platform } from "../platform.js";
import ModalDialog from "../dialogs/modaldialog.js";
import { notify, notifyError } from "../elements/notification.js";

const CABLES_CMD_FILES = {};
const CMD_FILE_COMMANDS = [];

const fileCommands = {
    "commands": CMD_FILE_COMMANDS,
    "functions": CABLES_CMD_FILES
};

export default fileCommands;

CABLES_CMD_FILES.replaceFilePath = function (from = null, to = null)
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
};

CMD_FILE_COMMANDS.push({
    "cmd": "Replace file path",
    "category": "patch",
    "func": CABLES_CMD_FILES.replaceFilePath
});
