
class GlUiConfig
{
    constructor()
    {
        this.OpTitlePaddingLeftRight = 10;
        this.OpTitlePaddingExtTitle = 1;

        this.OpErrorDotSize = 8;

        this.portWidth = 10;
        this.portHeight = 5;
        this.portPadding = 2;

        this.opHeight = 31;
        this.opWidth = 20;

        this.minZoom = 15;
        this.zoomSmooth = 2;
        this.zoomDefault = 500;

        this.newOpDistanceY = 40;
        this.zPosCableButtonRect = -0.9;
        this.drawBoundingRect = true;
        this.clickMaxDuration = 300;

        this._colors_dark =
        {
            "namespaceColors":
            {
                "unknown": [93 / 255, 192 / 255, 253 / 255], // '#5dc0fd';
                "Ops.Gl": [192 / 255, 224 / 255, 77 / 255], // #c0e04d';
                "Ops.WebAudio": [219 / 255, 136 / 255, 255 / 255], // #db88ff';
                "Ops.Devices": [245 / 255, 146 / 255, 89 / 255], // #f59259';
                // "Ops.Html": [],//#61bbf1';
                "Ops.Math": [68 / 255, 212 / 255, 200 / 255], // #44d4c8';
                "Ops.User": [1, 1, 1]// '#ffffff';
            },

            "transparent": [0, 0, 0, 0],
            "opBgRect": [51 / 255, 51 / 255, 51 / 255, 1],
            "opBgRectSelected": [73 / 255, 73 / 255, 73 / 255, 1],
            "patchComment": [0.8, 0.8, 0.8, 1],

            "opTitleExt": [0.8, 0.8, 0.8, 1.0],
            "opTitleSelected": [1, 1, 1, 1.0],

            "patchSelectionArea": [0, 0.75, 0.7, 0.25],

            "opBoundsRect": [0.26, 0.26, 0.26, 1],
            "background": [0.24, 0.24, 0.24, 1],

            "opError": [1.0, 0.24, 0.1, 1],
            "opErrorWarning": [1.0, 0.7, 0.1, 1],
            "opErrorHint": [0.5, 0.5, 0.5, 1]

        };

        this._colors_bright =
        {
            "namespaceColors":
            {
                "unknown": [1, 1, 1, 1],
            },
            "transparent": [0, 0, 0, 0],
            "opBgRect": [0.2, 0.2, 0.2, 1],
            "opBgRectSelected": [0.5, 0.5, 0.5, 1],
            "patchComment": [0, 0, 0, 1],
            "opTitleExt": [0.9, 0.9, 0.9, 1.0],
            "opTitleSelected": [1, 1, 1, 1.0],
            "patchSelectionArea": [0, 0.75, 0.7, 0.25],

            "opBoundsRect": [1, 1, 1, 1],
            "background": [0.9, 0.9, 0.9, 1],

            "opError": [1.0, 0.24, 0.1, 1],
            "opErrorWarning": [1.0, 0.7, 0.1, 1],
            "opErrorHint": [0.5, 0.5, 0.5, 1]
        };

        this.colors = this._colors_dark;
    }

    setTheme(t)
    {
        if (t) this.colors = this._colors_bright;
        else this.colors = this._colors_dark;
    }
}

export default new GlUiConfig();
