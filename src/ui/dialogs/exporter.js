
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
            CABLES.UI.MODAL.show(CABLES.UI.TEXTS.projectExportNotSaved);
            return;
        }

        let url = CABLES.sandbox.getCablesUrl() + "/export/" + this._project._id;
        if (this._versionId)
        {
            url += "?version=" + this._versionId;
        }

        const html = "<iframe src=\"" + url + "/\" style=\"width:720px;height:600px;border:0;outline:0\"/>";

        CABLES.UI.MODAL.show(html, { "title": "", "nopadding": true });
    }
}
