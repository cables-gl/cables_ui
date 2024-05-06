import Platform from "./platform.js";

export default class PlatformStandalone extends Platform
{
    constructor(cfg)
    {
        super(cfg);

        // this.frontendOptions.npm = true;
        this.frontendOptions.openLocalFiles =
        this.frontendOptions.dragDropLocalFiles =
        this.frontendOptions.showLocalAssetDirOpen =
        this.frontendOptions.showLocalOpDirButton =
        this.frontendOptions.chooseOpDir =
        this.frontendOptions.saveScreenshotInPatchJson =
        this.frontendOptions.showBuildInfoMenuLink = true;
    }

    getCablesDocsUrl()
    {
        return "https://cables.gl";
    }

    getIssueTrackerUrl()
    {
        return "https://github.com/cables-gl/cables_electron/issues";
    }

    getCablesStaticUrl()
    {
        return "file://";
    }
}
