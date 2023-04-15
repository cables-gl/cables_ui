import defaultops from "../../defaultops";
import { getHandleBarHtml } from "../../utils/handlebars";
import userSettings from "../usersettings";

CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

export default class MetaKeyframes
{
    constructor(tabs)
    {
        this.anim = null;
        this._tab = new CABLES.UI.Tab("keyframes", { "icon": "clock", "infotext": "tab_keyframes", "showTitle": false, "hideToolbar": true, "padding": true });
        tabs.addTab(this._tab);
        this._tab.addEventListener("onActivate", function ()
        {
            this.show();
        }.bind(this));
    }

    update()
    {
        this.show();
    }

    show()
    {
        const anims = [];

        if (CABLES.UI && window.gui)
        {
            const ops = gui.corePatch().ops;
            for (let i = 0; i < ops.length; i++)
            {
                for (let j = 0; j < ops[i].portsIn.length; j++)
                {
                    const p = ops[i].portsIn[j];

                    if (p.isAnimated())anims.push(
                        {
                            "opname": ops[i].name,
                            "opid": ops[i].id,
                            "portname": p.name,
                            "colorClass": "op_color_" + defaultops.getNamespaceClassName(ops[i].objName)
                        });
                }
            }
        }

        if (this.anim)
        {
            for (let i = 0; i < this.anim.keys.length; i++)
            {
                this.anim.keys[i].frame = this.anim.keys[i].time * gui.timeLine().getFPS();
            }
        }

        console.log("this anim", this.anim);

        const html = getHandleBarHtml("meta_keyframes",
            {
                "anim": this.anim,
                "anims": anims
            });

        this._tab.html(html);
    }

    showAnim(opid, portname)
    {
        CABLES.CMD.TIMELINE.showTimeline();
        gui.patchView.centerSelectOp(opid, true);
        const op = gui.corePatch().getOpById(opid);
        const p = op.getPort(portname);

        if (p.anim) gui.timeLine().setAnim(p.anim);
        this.show();
    }


    addKey()
    {
        const v = prompt("New Keyframe [frame value]");
        if (v === null) return;

        const values = v.split(" ");

        gui.timeLine().getAnim().setValue(values[0] / gui.timeLine().getFPS(), values[1] || 0);
        gui.timeLine().refresh();
        this.update();
    }

    setAnim(anim)
    {
        if (!anim) return;
        this.anim = anim;
        if (userSettings.get("metatab") == "keyframes")
        {
            this.show();
        }
    }
}
