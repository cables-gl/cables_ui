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

        this.colorMulHover = 1.5;
        this.colorMulActive = 1.3;
        this.colorMulInActive = 1;

        this._defaultTheme =
        {
            "colors":
            {
                "types":
                {
                    "num": [92 / 255, 181 / 255, 158 / 255, 1],
                    "trigger": [240 / 255, 209 / 255, 101 / 255, 1],
                    "obj": [171 / 255, 90 / 255, 148 / 255, 1],
                    "arr": [128 / 255, 132 / 255, 212 / 255, 1],
                    "str": [213 / 255, 114 / 255, 114 / 255, 1],
                    "dynamic": [1, 1, 1, 1],
                },
                "namespaces":
                {
                    "unknown": [93 / 255, 192 / 255, 253 / 255], // '#5dc0fd';
                    "Ops.Gl": [192 / 255, 224 / 255, 77 / 255], // #c0e04d';
                    "Ops.WebAudio": [219 / 255, 136 / 255, 255 / 255], // #db88ff';
                    "Ops.Devices": [245 / 255, 146 / 255, 89 / 255], // #f59259';
                    "Ops.Math": [68 / 255, 212 / 255, 200 / 255], // #44d4c8';
                    "Ops.User": [1, 1, 1],
                    "Ops.Team": [1, 1, 1],
                    "Ops.Patch": [1, 1, 1],
                    "Ops.Ui": [0.75, 0.75, 0.75]
                },
                "patch":
                {
                    "background": [0.26, 0.26, 0.26, 1],
                    "opBgRect": [51 / 255, 51 / 255, 51 / 255, 1],
                    "opBgRectSelected": [73 / 255, 73 / 255, 73 / 255, 1],
                    "opBoundsRect": [0.25, 0.25, 0.25, 1],
                    "opError": [1.0, 0.24, 0.1, 1],
                    "opErrorHint": [0.5, 0.5, 0.5, 1],
                    "opErrorWarning": [1.0, 0.7, 0.1, 1],
                    "opTitleExt": [0.8, 0.8, 0.8, 1.0],
                    "opTitleSelected": [1, 1, 1, 1.0],
                    "patchComment": [0.8, 0.8, 0.8, 1],
                    "patchSelectionArea": [0, 0.75, 0.7, 0.25],
                    "transparent": [0, 0, 0, 0],
                }
            }
        };

        this.theme = JSON.parse(JSON.stringify(this._defaultTheme));
        this.colors = this.theme.colors;
    }

    setTheme(theme)
    {
        this.theme = JSON.parse(JSON.stringify(theme));
        this.colors = theme.colors;
    }

    getDefaultTheme()
    {
        return JSON.parse(JSON.stringify(this._defaultTheme));
    }
}

const c = new GlUiConfig();
export default c;
