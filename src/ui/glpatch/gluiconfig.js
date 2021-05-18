CABLES = CABLES || {};
CABLES.GLGUI = CABLES.GLGUI || {};

CABLES.GLGUI.VISUALCONFIG =
{
    "OpTitlePaddingLeftRight": 10,
    "OpTitlePaddingExtTitle": 1,

    "OpErrorDotSize": 8,


    "portWidth": 10,
    "portHeight": 5,
    "portPadding": 2,

    // "snapX": 12,
    // "snapY": 20,

    "opHeight": 31,
    "opWidth": 20,

    "minZoom": 15,
    "zoomSmooth": 2,
    "zoomDefault": 500,

    "zPosCableButtonRect": -0.9, // -0.02,

    "drawBoundingRect": true,

    "clickMaxDuration": 300,

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
    "colors":
    {
        "transparent": [0, 0, 0, 0],
        "opBgRect": [51 / 255, 51 / 255, 51 / 255, 1],
        "opBgRectSelected": [73 / 255, 73 / 255, 73 / 255, 1],
        "patchComment": [0.8, 0.8, 0.8, 1],
        "opTitleExt": [0.8, 0.8, 0.8, 1.0],
        "patchSelectionArea": [0, 0.5, 0.7, 0.25],

        "opBoundsRect": [0.26, 0.26, 0.26, 1],
        "background": [0.24, 0.24, 0.24, 1],
        "opError": [1.0, 0.24, 0.1, 1],
        "opErrorWarning": [1.0, 0.7, 0.1, 1],
        "opErrorHint": [0.5, 0.5, 0.5, 1]


    }
};
