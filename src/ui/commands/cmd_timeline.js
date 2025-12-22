import { utils } from "cables";
import { PortHtmlGenerator } from "../components/opparampanel/op_params_htmlgen.js";
import ParamsListener from "../components/opparampanel/params_listener.js";
import GlTimelineTab from "../components/tabs/tab_gltimeline.js";
import { gui } from "../gui.js";

export { CmdTimeline };

class CmdTimeline
{

    /** @type {import("./commands.js").CommandObject[]} */
    static get commands()
    {
        return [

            {
                "cmd": "toggle timeline",
                "category": "ui",
                "func": CmdTimeline.toggleTimeline,
                "icon": "timeline"
            },
            {
                "cmd": "show timeline",
                "category": "ui",
                "func": CmdTimeline.openGlTimeline,
                "icon": "timeline"
            },
            {
                "cmd": "hide timeline",
                "category": "ui",
                "func": CmdTimeline.hideTimeline,
                "icon": "timeline"
            },
            {
                "cmd": "timeline play",
                "category": "ui",
                "func": CmdTimeline.TimelinePlay,
                "icon": "play"
            },
            {
                "cmd": "timeline pause",
                "category": "ui",
                "func": CmdTimeline.TimelinePause,
                "icon": "pause"
            },
            {
                "cmd": "timeline rewind",
                "category": "ui",
                "func": CmdTimeline.TimelineRewind,
                "icon": "rewind"
            },
            {
                "cmd": "timeline forward",
                "category": "ui",
                "func": CmdTimeline.TimelineForward,
                "icon": "fast-forward"
            },
            {
                "cmd": "timeline rewind to 0",
                "category": "ui",
                "func": CmdTimeline.TimelineRewindStart,
                "icon": "skip-back"
            },
            {
                "cmd": "add new keyframe at cursor",
                "category": "timeline",
                "func": CmdTimeline.TimelineCreateKeyAtCursor
            },
            {
                "cmd": "snap selected keys times to fps",
                "category": "timeline",
                "func": CmdTimeline.TimelineSnapTimes
            },
            {
                "cmd": "timeline toggle line/graph layout",
                "category": "timeline",
                "icon": "chart-spline",
                "func": CmdTimeline.toggleGraph
            }

        ];
    }

    static TimelineSnapTimes()
    {
        gui.glTimeline.snapSelectedKeyTimes();
    }

    static TimelineCreateKeyAtCursor()
    {
        gui.glTimeline.createKeyAtCursor();
    }

    static TimelinePlay()
    {
        gui.corePatch().timer.play();
        gui.emitEvent("timelineControl", "setPlay", true, gui.corePatch().timer.getTime());
    }

    static TimelineForward()
    {
        gui.corePatch().timer.setTime(gui.corePatch().timer.getTime() + 2);
    }

    static TimelineRewind()
    {
        gui.corePatch().timer.setTime(gui.corePatch().timer.getTime() - 2);
    }

    static TimelineRewindStart()
    {
        gui.corePatch().timer.setTime(0);
    }

    static TimelinePause()
    {
        gui.corePatch().timer.pause();
        gui.emitEvent("timelineControl", "setPlay", false, gui.corePatch().timer.getTime());
    }

    static togglePlay()
    {
        if (gui.corePatch().timer.isPlaying())gui.corePatch().timer.pause();
        else gui.corePatch().timer.play();
    }

    static toggleGraph()
    {
        gui.glTimeline?.toggleGraphLayout();
    }

    static openGlTimeline()
    {
        gui.glTimeLineTab = new GlTimelineTab(gui.bottomTabs);
    }

    static toggleTimeline()
    {
        gui.toggleTimeline();
    }

    static hideTimeline()
    {
        gui.hideTimeline();
    }

    static showTimeline()
    {
        gui.showTiming();
    }

}
