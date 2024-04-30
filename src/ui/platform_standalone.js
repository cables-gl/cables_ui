import Platform from "./platform.js";

export default class PlatformStandalone extends Platform
{
    constructor(cfg)
    {
        super(cfg);

        // this.frontendOptions.npm = true;
        this.frontendOptions.openLocalFiles = true;
        this.frontendOptions.uploadFiles = false;
        this.frontendOptions.showLocalAssetDirOpen = true;
        this.frontendOptions.showLocalOpDirButton = true;
        this.frontendOptions.chooseOpDir = true;
        this.frontendOptions.showBuildInfoMenuLink = true;
    }

    getCablesDocsUrl()
    {
        return "https://cables.gl";
    }
}
