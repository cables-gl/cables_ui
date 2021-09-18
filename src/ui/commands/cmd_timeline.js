CABLES = CABLES || {};
CABLES.CMD = CABLES.CMD || {};
CABLES.CMD.UI = CABLES.CMD.UI || {};
CABLES.CMD.commands = CABLES.CMD.commands || [];

CABLES.CMD.UI.TimelinePlay = function ()
{
    gui.corePatch().timer.play();
};

CABLES.CMD.UI.TimelineForward = function ()
{
    gui.timeLine().gotoOffset(2);
};
CABLES.CMD.UI.TimelineRewind = function ()
{
    gui.timeLine().gotoOffset(-2);
};
CABLES.CMD.UI.TimelineRewindStart = function ()
{
    gui.timeLine().gotoZero();
};

CABLES.CMD.UI.TimelinePause = function ()
{
    gui.corePatch().timer.pause();
};


CABLES.CMD.UI.toggleTimeline = function ()
{
    gui.toggleTiming();
};

CABLES.CMD.UI.hideTimeline = function ()
{
    gui.hideTiming();
};

CABLES.CMD.UI.showTimeline = function ()
{
    gui.showTiming();
};

CABLES.CMD.commands.push(
    {
        "cmd": "toggle timeline",
        "category": "ui",
        "func": CABLES.CMD.UI.toggleTimeline,
        "icon": "timeline"
    },
    {
        "cmd": "show timeline",
        "category": "ui",
        "func": CABLES.CMD.UI.showTimeline,
        "icon": "timeline"
    },
    {
        "cmd": "hide timeline",
        "category": "ui",
        "func": CABLES.CMD.UI.hideTimeline,
        "icon": "timeline"
    },
    {
        "cmd": "timeline play",
        "category": "ui",
        "func": CABLES.CMD.UI.TimelinePlay,
        "icon": "play"
    },
    {
        "cmd": "timeline pause",
        "category": "ui",
        "func": CABLES.CMD.UI.TimelinePause,
        "icon": "pause"
    },
    {
        "cmd": "timeline rewind",
        "category": "ui",
        "func": CABLES.CMD.UI.TimelineRewind,
        "icon": "rewind"
    },
    {
        "cmd": "timeline forward",
        "category": "ui",
        "func": CABLES.CMD.UI.TimelineForward,
        "icon": "fast-forward"
    },
    {
        "cmd": "timeline rewind to 0",
        "category": "ui",
        "func": CABLES.CMD.UI.TimelineRewindStart,
        "icon": "skip-back"
    }
);
