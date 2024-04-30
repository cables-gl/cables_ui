import Platform from "./platform.js";

export default class PlatformCommunity extends Platform
{
    constructor(cfg)
    {
        super(cfg);

        this.frontendOptions.hasCommunity = // facvs/comments/activity feed etc.
        this.frontendOptions.uploadFiles =
        this.frontendOptions.showAssetExternalLink =
        this.frontendOptions.showAssetUpload =
        this.frontendOptions.showPatchSettings =
        this.frontendOptions.showPatchBackups =
        this.frontendOptions.showPatchViewPage =
        this.frontendOptions.showExport =
        this.frontendOptions.showMyLinks =
        this.frontendOptions.showChangeLogLink = true;
    }

    getCablesDocsUrl()
    {
        return this.getCablesUrl();
    }
}
