import text from "../text.js";
import ModalDialog from "./modaldialog.js";

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

        const projectId = this._project.shortId || this._project._id;

        if (CABLES.platform.isStandalone())
        {
            CABLESUILOADER.talkerAPI.send("exportPatch", {}, () =>
            {
                console.log("EXPORTED");
            });
        }
        else
        {
            let gotoUrl = CABLES.platform.getCablesUrl() + "/export/" + projectId;
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
        }
    }
}
