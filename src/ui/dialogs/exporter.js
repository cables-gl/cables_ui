import text from "../text.js";
import ModalDialog from "./modaldialog.js";

export default class Exporter
{
    constructor(project, versionId, type = null)
    {
        this._versionId = versionId;
        this._project = project;
        this._exportType = type;
    }

    show()
    {
        if (!gui.getSavedState())
        {
            new ModalDialog({ "html": text.projectExportNotSaved, "warning": true, "title": "Export", "showOkButton": true });
            return;
        }

        const projectId = this._project.shortId || this._project._id;

        CABLES.platform.exportPatch(projectId, this._exportType);
    }
}
