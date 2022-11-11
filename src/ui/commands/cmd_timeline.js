import { PortHtmlGenerator } from "../components/opparampanel/op_params_htmlgen";
import ParamsListener from "../components/opparampanel/params_listener";

const CABLES_CMD_TIMELINE = {};

const timelineCommands =
{
    "commands": [],
    "functions": CABLES_CMD_TIMELINE
};

export default timelineCommands;

CABLES_CMD_TIMELINE.ListAnimatedPorts = function ()
{
    const panelid = CABLES.uuid();
    const ops = gui.corePatch().ops;
    const ports = [];

    for (let i = 0; i < ops.length; i++)
    {
        const inputs = ops[i].portsIn;
        for (let j = 0; j < inputs.length; j++)
            if (inputs[j].isAnimated())
                ports.push(inputs[j]);
    }


    const htmlgen = new PortHtmlGenerator(panelid);

    let html = "<div class=\"panel params\" ><table>";

    html += htmlgen.getHtmlInputPorts(ports);
    html += "</table></div>";
    const tab = new CABLES.UI.Tab("Animated Ports", { "icon": "clock", "infotext": "tab_timeline", "padding": true, "singleton": true });
    gui.mainTabs.addTab(tab, true);
    tab.html(html);

    const paramsListener = new ParamsListener(panelid);
    paramsListener.init({ "portsIn": ports });
};


CABLES_CMD_TIMELINE.TimelinePlay = function ()
{
    gui.corePatch().timer.play();
    gui.emitEvent("timelineControl", "setPlay", true, gui.scene().timer.getTime());
};

CABLES_CMD_TIMELINE.setLength = function ()
{
    gui.timeLine().setProjectLength();
};

CABLES_CMD_TIMELINE.TimelineForward = function ()
{
    gui.timeLine().gotoOffset(2);
    gui.emitEvent("timelineControl", "setTime", gui.scene().timer.getTime());
};

CABLES_CMD_TIMELINE.TimelineRewind = function ()
{
    gui.timeLine().gotoOffset(-2);
    gui.emitEvent("timelineControl", "setTime", gui.scene().timer.getTime());
};

CABLES_CMD_TIMELINE.TimelineRewindStart = function ()
{
    gui.timeLine().gotoZero();
    gui.emitEvent("timelineControl", "setTime", 0);
};

CABLES_CMD_TIMELINE.TimelinePause = function ()
{
    gui.corePatch().timer.pause();
    gui.emitEvent("timelineControl", "setPlay", false, gui.scene().timer.getTime());
};

CABLES_CMD_TIMELINE.togglePlay = function ()
{
    gui.timeLine().togglePlay();
    gui.emitEvent("timelineControl", "setPlay", gui.scene().timer.isPlaying(), gui.scene().timer.getTime());
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
    {
        "cmd": "show all animated ports",
        "category": "timeline",
        "func": CABLES_CMD_TIMELINE.ListAnimatedPorts
    },


);
