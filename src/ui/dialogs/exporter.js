import text from "../text";
import ModalDialog from "./modaldialog";

export default class Exporter
{
    constructor(project, versionId)
    {
        this._versionId = versionId;
        this._project = project;
    }

    show()
    {
        if (!gui.getSavedState())
        {
            new ModalDialog({ "html": text.projectExportNotSaved, "warning": true, "title": "Export", "showOkButton": true });
            return;
        }

        let url = CABLES.sandbox.getCablesUrl() + "/export/" + this._project._id;
        if (this._versionId)
        {
            url += "?version=" + this._versionId;
        }

        const html = "<iframe src=\"" + url + "/\" style=\"width:720px;height:600px;border:0;outline:0\"/>";

        new ModalDialog({ "html": html, "nopadding": true, "persistInIdleMode": true });
    }
}
