import Platform from "./platform.js";

export default class PlatformCommunity extends Platform
{
    constructor(cfg)
    {
        super(cfg);

        this.frontendOptions.uploadFiles = true;
        this.frontendOptions.showFavs = true;
        this.frontendOptions.showPatchSettings = true;
        this.frontendOptions.showPatchUrlLink = true;
        this.frontendOptions.showAssetExternalLink = true;
        this.frontendOptions.showAssetUpload = true;
    }

    getCablesDocsUrl()
    {
        return this.getCablesUrl();
    }
}
