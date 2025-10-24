import { gui } from "../gui.js";
import { platform } from "../platform.js";
import { GuiText } from  "../text.js";
import ModalDialog from "./modaldialog.js";

export default class Exporter
{
    constructor(project, versionId, type = null)
    {
        this._project = project;
        this._exportType = type;
    }

    show()
    {
        if (!gui.getSavedState())
        {
            new ModalDialog({ "html": GuiText.projectExportNotSaved, "warning": true, "title": "Export", "showOkButton": true });
            return;
        }

        const projectId = this._project.shortId || this._project._id;

        platform.exportPatch(projectId, this._exportType);
    }
}
