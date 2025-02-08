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
    gui.maintabPanel.show(true);

    const paramsListener = new ParamsListener(panelid);
    paramsListener.init({ "portsIn": ports });
};

CABLES_CMD_TIMELINE.TimelinePlay = function ()
{
    gui.corePatch().timer.play();
    gui.emitEvent("timelineControl", "setPlay", true, gui.corePatch().timer.getTime());
};

CABLES_CMD_TIMELINE.setLength = function ()
{
    gui.timeLine().setProjectLength();
};

CABLES_CMD_TIMELINE.TimelineForward = function ()
{
    gui.corePatch().timer.setTime(gui.corePatch().timer.getTime() + 2);
};

CABLES_CMD_TIMELINE.TimelineRewind = function ()
{
    gui.corePatch().timer.setTime(gui.corePatch().timer.getTime() - 2);
};

CABLES_CMD_TIMELINE.TimelineRewindStart = function ()
{
    gui.corePatch().timer.setTime(0);
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
    gui.glTimeline = new GlTimelineTab(gui.bottomTabs);

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
        "cmd": "set timeline length",
        "category": "timeline",
        "func": CABLES_CMD_TIMELINE.setLength
    },
    {
        "cmd": "show all animated ports",
        "category": "timeline",
        "func": CABLES_CMD_TIMELINE.ListAnimatedPorts
    }

);
