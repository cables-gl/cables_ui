
const CABLES_CMD_TIMELINE = {};


const timelineCommands =
{
    "commands": [],
    "functions": CABLES_CMD_TIMELINE
};

export default timelineCommands;


CABLES_CMD_TIMELINE.TimelinePlay = function ()
{
    gui.corePatch().timer.play();
    gui.emitEvent("timelineControl", "setPlay", true);
};

CABLES_CMD_TIMELINE.setLength = function ()
{
    gui.timeLine().setProjectLength();
};

CABLES_CMD_TIMELINE.TimelineForward = function ()
{
    gui.timeLine().gotoOffset(2);
    gui.emitEvent("timelineControl", "goto", 2);
};

CABLES_CMD_TIMELINE.TimelineRewind = function ()
{
    gui.timeLine().gotoOffset(-2);
    gui.emitEvent("timelineControl", "goto", -2);
};

CABLES_CMD_TIMELINE.TimelineRewindStart = function ()
{
    gui.timeLine().gotoZero();
    gui.emitEvent("timelineControl", "goto", 0);
};

CABLES_CMD_TIMELINE.TimelinePause = function ()
{
    gui.corePatch().timer.pause();
    gui.emitEvent("timelineControl", "setPlay", false);
};

CABLES_CMD_TIMELINE.togglePlay = function ()
{
    gui.timeLine().togglePlay();
    gui.emitEvent("timelineControl", "setPlay", gui.scene().timer.isPlaying());
};

CABLES_CMD_TIMELINE.toggleTimeline = function ()
{
    gui.toggleTiming();
};

CABLES_CMD_TIMELINE.hideTimeline = function ()
{
    gui.hideTiming();
};

CABLES_CMD_TIMELINE.showTimeline = function ()
{
    gui.showTiming();
};

timelineCommands.commands.push(
    {
        "cmd": "toggle timeline",
        "category": "ui",
        "func": CABLES_CMD_TIMELINE.toggleTimeline,
        "icon": "timeline"
    },
    {
        "cmd": "show timeline",
        "category": "ui",
        "func": CABLES_CMD_TIMELINE.showTimeline,
        "icon": "timeline"
    },
    {
        "cmd": "hide timeline",
        "category": "ui",
        "func": CABLES_CMD_TIMELINE.hideTimeline,
        "icon": "timeline"
    },
    {
        "cmd": "timeline play",
        "category": "ui",
        "func": CABLES_CMD_TIMELINE.TimelinePlay,
        "icon": "play"
    },
    {
        "cmd": "timeline pause",
        "category": "ui",
        "func": CABLES_CMD_TIMELINE.TimelinePause,
        "icon": "pause"
    },
    {
        "cmd": "timeline rewind",
        "category": "ui",
        "func": CABLES_CMD_TIMELINE.TimelineRewind,
        "icon": "rewind"
    },
    {
        "cmd": "timeline forward",
        "category": "ui",
        "func": CABLES_CMD_TIMELINE.TimelineForward,
        "icon": "fast-forward"
    },
    {
        "cmd": "timeline rewind to 0",
        "category": "ui",
        "func": CABLES_CMD_TIMELINE.TimelineRewindStart,
        "icon": "skip-back"
    },
    {
        "cmd": "set timeline length",
        "category": "timeline",
        "func": CABLES_CMD_TIMELINE.setLength
    },

);
