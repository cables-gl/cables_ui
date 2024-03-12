/**
 * general settings for the user interface
 *
 * @class
 */
class UiConfig
{
    constructor()
    {
        // this.portSize = 10;
        // this.portHeight = 6;
        // this.portPadding = 2;

        this.snapX = 12;
        this.snapY = 20;

        this.idleModeTimeout = 120;

        this.timingPanelHeight = 250;
        this.rendererDefaultWidth = 640;
        this.rendererDefaultHeight = 320;
        // this.opWidth= 20;
        // this.opWidthSmall= 40;

        // "colorBackground": "#1a1a1a",
        // "colorLink": "#888",
        // "colorLinkHover": "#fff",
        // "colorLinkInvalid": "#666",
        // "colorOpText": "#eee",
        // "colorOpBgSelected": "#444",
        // "colorPort": "#6c9fde",
        // "colorRubberBand": "#52FDE1",
        // "colorPortHover": "#f00",

        // "highlight": "#52FDE1",

        this.watchValuesInterval = 50; // 33
        this.rendererSizes = [{ "w": 640, "h": 360 }, { "w": 1024, "h": 768 }, { "w": 1280, "h": 720 }, { "w": 0, "h": 0 }];

        this.infoAreaHeight = 29;
    }
}

export default new UiConfig();
