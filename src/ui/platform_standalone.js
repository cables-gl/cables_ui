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
        this.frontendOptions.sendErrorReports = false;
    }

    getCablesDocsUrl()
    {
        return "https://cables.gl";
    }

    getIssueTrackerUrl()
    {
        return "https://github.com/cables-gl/cables_electron/issues";
    }
}
