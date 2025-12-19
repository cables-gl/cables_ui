import { gui } from "./gui.js";
import { Platform } from "./platform.js";

/**
 * platform implementation for community (https://cables.gl)
 *
 * @export
 * @class PlatformCommunity
 * @extends {Platform}
 */
export default class PlatformCommunity extends Platform
{
    constructor(cfg)
    {
        super(cfg);

        this.frontendOptions.showStartUpLog = this.isDevEnv();

        this.frontendOptions.hasCommunity = // favs/comments/activity feed etc.
        this.frontendOptions.uploadFiles =
        this.frontendOptions.showAssetExternalLink =
        this.frontendOptions.showAssetUpload =
        this.frontendOptions.showPatchSettings =
        this.frontendOptions.showPatchBackups =
        this.frontendOptions.showPatchViewPage =
        this.frontendOptions.showExport =
        this.frontendOptions.showMyLinks =
        this.frontendOptions.needsInternet =
        this.frontendOptions.showRemoteViewer =
        this.frontendOptions.showChangeLogLink =
        this.frontendOptions.sendErrorReports =
        this.frontendOptions.showFormatCodeButton =
        this.frontendOptions.opDependencies =
        this.frontendOptions.showOpScreenshots =
        this.frontendOptions.showSetProjectTitle = true;
    }

    getCablesDocsUrl()
    {
        return this.getCablesUrl();
    }

    getCablesVersion()
    {
        return "Community build";
    }

    currentUserIsPatchOwner()
    {
        return gui.project().userId === gui.user.id;
    }
}
