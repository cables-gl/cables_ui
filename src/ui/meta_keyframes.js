CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.MetaKeyframes = function (tabs)
{
    this.anim = null;
    this._tab = new CABLES.UI.Tab("keyframes", { "icon": "clock", "infotext": "tab_keyframes", "showTitle": false, "hideToolbar": true, "padding": true });
    tabs.addTab(this._tab);
    this._tab.addEventListener("onActivate", function ()
    {
        this.show();
    }.bind(this));
};

CABLES.UI.MetaKeyframes.prototype.update =
CABLES.UI.MetaKeyframes.prototype.show = function ()
{
    const anims = [];
    let i = 0;

    if (CABLES.UI && window.gui)
    {
        const ops = gui.patch().scene.ops;
        for (i = 0; i < ops.length; i++)
        {
            // console.log(gui.patch().scene.ops[i].name);
            for (let j = 0; j < ops[i].portsIn.length; j++)
            {
                const p = ops[i].portsIn[j];

                if (p.isAnimated())anims.push(
                    {
                        "opname": ops[i].name,
                        "opid": ops[i].id,
                        "portname": p.name,
                        "colorClass": "op_color_" + CABLES.UI.uiConfig.getNamespaceClassName(ops[i].objName)
                    });
            }
        }
    }

    if (self.anim)
    {
        for (i = 0; i < self.anim.keys.length; i++)
        {
            self.anim.keys[i].frame = self.anim.keys[i].time * gui.timeLine().getFPS();
        }
    }

    const html = CABLES.UI.getHandleBarHtml("meta_keyframes",
        {
            "anim": self.anim,
            anims
        });

    this._tab.html(html);
};

CABLES.UI.MetaKeyframes.prototype.showAnim = function (opid, portname)
{
    CABLES.CMD.UI.showTimeline();
    gui.patch().focusOp(opid, true);
    const op = gui.patch().scene.getOpById(opid);
    const p = op.getPort(portname);
    console.log(p);
    if (p.anim)
    {
        gui.patch().timeLine.setAnim(p.anim);
    }
};


CABLES.UI.MetaKeyframes.prototype.addKey = function ()
{
    const v = prompt("New Keyframe [frame value]");
    if (v === null) return;

    const values = v.split(" ");

    gui.timeLine().getAnim().setValue(values[0] / gui.timeLine().getFPS(), values[1] || 0);
    gui.timeLine().refresh();
    this.update();
};

CABLES.UI.MetaKeyframes.prototype.setAnim = function (anim)
{
    if (CABLES.UI.userSettings.get("metatab") == "keyframes")
    {
        self.anim = anim;
        this.show();
    }
};
