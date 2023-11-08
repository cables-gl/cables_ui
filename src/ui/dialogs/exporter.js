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

        let gotoUrl = CABLES.sandbox.getCablesUrl() + "/export/" + this._project._id;
        if (this._versionId)
        {
            gotoUrl += "?version=" + this._versionId;
        }

        const iframeParam = this._versionId ? "&iframe=true" : "?iframe=true";
        const url = gotoUrl + iframeParam;

        gui.mainTabs.addIframeTab(
            "Export Patch ",
            url,
            {
                "icon": "settings",
                "closable": true,
                "singleton": false,
                "gotoUrl": gotoUrl
            },
            true);

        // const html = "<iframe src=\"" + url + "/\" style=\"width:720px;height:600px;border:0;outline:0\"/>";
        // new ModalDialog({ "html": html, "nopadding": true, "persistInIdleMode": true });
    }
}
