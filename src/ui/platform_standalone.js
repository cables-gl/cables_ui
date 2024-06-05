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
        this.frontendOptions.showWelcome = true;
        this.frontendOptions.showBuildInfoMenuLink = true;
        this.frontendOptions.showOpenPatch = true;
    }

    getCablesVersion()
    {
        let version = "Electron Standalone";

        if (CABLESUILOADER && CABLESUILOADER.buildInfo && CABLESUILOADER.buildInfo.api && CABLESUILOADER.buildInfo.api.version) version += " v" + CABLESUILOADER.buildInfo.api.version;
        else version += " development version";
        return version;
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

    noCacheUrl(url)
    {
        let separator = "?";
        if (url.includes("?")) separator = "&";
        return url + separator + "nc=" + (Date.now() + "").substr(-6);
    }

    showFileSelect(inputId, filterType, opId, previewId)
    {
        let value = null;
        let inputEle = null;
        if (inputId)
        {
            inputEle = ele.byQuery(inputId);
            if (inputEle) value = inputEle.value;
        }
        CABLESUILOADER.talkerAPI.send("selectFile", { "url": value, "filter": filterType, "opId": opId }, (_err, file) =>
        {
            if (file)
            {
                if (inputEle)
                {
                    gui.savedState.setUnSaved("filemanager");
                    inputEle.value = file;
                    const event = document.createEvent("Event");
                    event.initEvent("input", true, true);
                    inputEle.dispatchEvent(event);
                    gui.opParams.show(opId);
                }
            }
        });
    }
}
