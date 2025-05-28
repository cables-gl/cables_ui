import { utils } from "cables";
import { PortHtmlGenerator } from "../components/opparampanel/op_params_htmlgen.js";
import ParamsListener from "../components/opparampanel/params_listener.js";
import GlTimelineTab from "../components/tabs/tab_gltimeline.js";
import { gui } from "../gui.js";

const CABLES_CMD_TIMELINE = {};

const timelineCommands =
{
    "commands": [],
    "functions": CABLES_CMD_TIMELINE
};

export default timelineCommands;
export { CABLES_CMD_TIMELINE as CmdTimeline };

CABLES_CMD_TIMELINE.TimelineSnapTimes = function ()
{
    gui.glTimeline.snapSelectedKeyTimes();
};

CABLES_CMD_TIMELINE.TimelineCreateKeyAtCursor = function ()
{

    gui.glTimeline.createKeyAtCursor();
};

CABLES_CMD_TIMELINE.TimelinePlay = function ()
{
    gui.corePatch().timer.play();
    gui.emitEvent("timelineControl", "setPlay", true, gui.corePatch().timer.getTime());
};

CABLES_CMD_TIMELINE.TimelineForward = function ()
{
    gui.corePatch().timer.setTime(gui.corePatch().timer.getTime() + 2);
    gui.timeLine().view.centerCursor();
};

CABLES_CMD_TIMELINE.TimelineRewind = function ()
{
    gui.corePatch().timer.setTime(gui.corePatch().timer.getTime() - 2);
    gui.timeLine().view.centerCursor();
};

CABLES_CMD_TIMELINE.TimelineRewindStart = function ()
{
    gui.corePatch().timer.setTime(0);
    gui.timeLine().view.centerCursor();
};

CABLES_CMD_TIMELINE.TimelinePause = function ()
{
    gui.corePatch().timer.pause();
    gui.emitEvent("timelineControl", "setPlay", false, gui.corePatch().timer.getTime());
};

CABLES_CMD_TIMELINE.togglePlay = function ()
{
    if (gui.corePatch().timer.isPlaying())gui.corePatch().timer.pause();
    else gui.corePatch().timer.play();
};

CABLES_CMD_TIMELINE.openGlTimeline = function ()
{
    gui.glTimeLineTab = new GlTimelineTab(gui.bottomTabs);
};

CABLES_CMD_TIMELINE.toggleTimeline = function ()
{
    gui.toggleTimeline();
};

CABLES_CMD_TIMELINE.hideTimeline = function ()
{
    gui.hideTimeline();
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
        "func": CABLES_CMD_TIMELINE.openGlTimeline,
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
        "cmd": "add new keyframe at cursor",
        "category": "timeline",
        "func": CABLES_CMD_TIMELINE.TimelineCreateKeyAtCursor
    },
    {
        "cmd": "snap selected keys times to fps",
        "category": "timeline",
        "func": CABLES_CMD_TIMELINE.TimelineSnapTimes
    }

);
