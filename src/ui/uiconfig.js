/**
 * general settings for the user interface
 *
 * @class
 */
class UiConfig
{
    constructor()
    {
        this.snapX = 12;
        this.snapY = 20;

        this.idleModeTimeout = 120;

        this.timingPanelHeight = 250;
        this.rendererDefaultWidth = 640;
        this.rendererDefaultHeight = 320;

        this.watchValuesInterval = 50; // 33
        this.rendererSizes = [{ "w": 640, "h": 360 }, { "w": 1024, "h": 768 }, { "w": 1280, "h": 720 }, { "w": 0, "h": 0 }];

        this.infoAreaHeight = 29;
        this.commentColors = ["#FFFFFF", "#666666", "#07F78C", "#F0D165", "#f59259", "#dc5751", "#db88ff", "#5dc0fd"];
    }
}

export default new UiConfig();
