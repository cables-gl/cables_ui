import { helper } from "cables-shared-client";
import GlTimelineTab from "../components/tabs/tab_gltimeline.js";
import ModalDialog from "../dialogs/modaldialog.js";
import { gui } from "../gui.js";

export { CmdTimeline };

class CmdTimeline
{

    /** @type {import("./commands.js").CommandObject[]} */
    static get commands()
    {
        return [
            {
                "cmd": "Toggle timeline",
                "category": "timeline",
                "func": CmdTimeline.toggleTimeline,
                "keybindable": true,
                "icon": "timeline"
            },
            {
                "cmd": "Show timeline",
                "category": "timeline",
                "func": CmdTimeline.openGlTimeline,
                "keybindable": true,
                "icon": "timeline"
            },
            {
                "cmd": "Hide timeline",
                "category": "timeline",
                "func": CmdTimeline.hideTimeline,
                "keybindable": true,
                "icon": "timeline"
            },
            {
                "cmd": "Timeline play",
                "category": "timeline",
                "func": CmdTimeline.TimelinePlay,
                "keybindable": true,
                "icon": "play"
            },
            {
                "cmd": "Timeline pause",
                "category": "timeline",
                "func": CmdTimeline.TimelinePause,
                "keybindable": true,
                "icon": "pause"
            },
            {
                "cmd": "Timeline rewind",
                "category": "timeline",
                "func": CmdTimeline.TimelineRewind,
                "keybindable": true,
                "icon": "rewind"
            },
            {
                "cmd": "Timeline forward",
                "category": "timeline",
                "func": CmdTimeline.TimelineForward,
                "keybindable": true,
                "icon": "fast-forward"
            },
            {
                "cmd": "Timeline rewind to 0",
                "category": "timeline",
                "func": CmdTimeline.TimelineRewindStart,
                "keybindable": true,
                "icon": "skip-back"
            },
            {
                "cmd": "Add new keyframe at cursor",
                "keybindable": true,
                "category": "timeline",
                "func": CmdTimeline.TimelineCreateKeyAtCursor
            },
            {
                "cmd": "Snap selected keys times to fps",
                "keybindable": true,
                "category": "timeline",
                "func": CmdTimeline.TimelineSnapTimes
            },
            {
                "cmd": "Timeline toggle line/graph layout",
                "keybindable": true,
                "category": "timeline",
                "icon": "chart-spline",
                "func": CmdTimeline.toggleGraph
            },
            {
                "cmd": "Timeline set time",
                "keybindable": true,
                "category": "timeline",
                "icon": "chart-spline",
                "func": CmdTimeline.setTime
            },
            {
                "cmd": "Timeline set frame",
                "keybindable": true,
                "category": "timeline",
                "icon": "chart-spline",
                "func": CmdTimeline.setFrame
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
        if (gui.corePatch().timer.isPlaying()) gui.corePatch().timer.pause();
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

    static setTime()
    {
        new ModalDialog({
            "prompt": true,
            "title": "Timeline - set time",
            "promptValue": String(gui.corePatch().timer.getTime()),
            "promptOk": (v) =>
            {
                if (v && helper.isNumeric(v))
                {
                    const time = parseFloat(v);
                    gui.corePatch().timer.setTime(time);
                }
            }
        });
    }

    static setFrame()
    {
        const time = gui.corePatch().timer.getTime();
        const fps = CABLES.timelineConfig?.fps || 30;
        new ModalDialog({
            "prompt": true,
            "title": "Timeline - set frame",
            "promptValue": time ? String(Math.round(time * fps)) : "0",
            "promptOk": (v) =>
            {
                if (v && helper.isNumeric(v) && fps !== 0)
                {
                    const frame = parseInt(v);
                    gui.corePatch().timer.setTime(frame / parseInt(fps));
                }
            }
        });
    }

}
