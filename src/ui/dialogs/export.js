CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.Exporter = function (project, versionId)
{
    this.show = function ()
    {
        if (!gui.getSavedState())
        {
            CABLES.UI.MODAL.show(CABLES.UI.TEXTS.projectExportNotSaved);
            return;
        }

        let url = CABLES.sandbox.getCablesUrl() + "/export/" + project._id;
        if (versionId)
        {
            url += "?version=" + versionId;
        }
        console.log("GUI EXPORT", url);
        const html = "<iframe src=\"" + url + "/\" style=\"width:720px;height:600px;border:0;outline:0\"/>";

        CABLES.UI.MODAL.show(html, { "title": "", "nopadding": true });
    };
};
