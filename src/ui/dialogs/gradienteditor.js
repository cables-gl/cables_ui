
var CABLES = CABLES || {};

CABLES.GradientEditor = function (opid, portname)
{
    this._opId = opid;
    this._portName = portname;

    this._keyWidth = 15;
    this._keyHeight = 25;
    this._dragDownDeleteThreshold = 40;
    this._width = 500;

    this._keys = [];
    this._paper = null;

    this._movingkey = false;
    this._callback = null;
    this._ctx = null;

    this._previousContent = "";
};

CABLES.GradientEditor.prototype.updateCanvas = function ()
{
    if (!this._ctx)
    {
        let canvas = document.getElementById("gradientEditorCanvas");
        if (!canvas)
        {
            console.log("[gradienteditor] no canvas found");
            return;
        }
        this._ctx = canvas.getContext("2d");
    }

    let imageData = this._ctx.createImageData(500, 1);
    let keys = [{ "pos": 0, "r": this._keys[0].r, "g": this._keys[0].g, "b": this._keys[0].b }].concat(this._keys);
    let last = keys[keys.length - 1];
    keys.push({ "pos": 1, "r": last.r, "g": last.g, "b": last.b });

    for (var i = 0; i < keys.length - 1; i++)
    {
        if (keys[i].rect)keys[i].rect.attr({ "fill": "rgba(" + Math.round(keys[i].r * 255) + "," + Math.round(keys[i].g * 255) + "," + Math.round(keys[i].b * 255) + ",1)" });

        let keyA = keys[i];
        let keyB = keys[i + 1];

        for (let x = keyA.pos * this._width; x < keyB.pos * this._width; x++)
        {
            let p = CABLES.map(x, keyA.pos * this._width, keyB.pos * this._width, 0, 1);

            p = CABLES.smoothStep(p);

            imageData.data[x * 4 + 0] = ((p * keyB.r) + (1.0 - p) * (keyA.r)) * 255;
            imageData.data[x * 4 + 1] = ((p * keyB.g) + (1.0 - p) * (keyA.g)) * 255;
            imageData.data[x * 4 + 2] = ((p * keyB.b) + (1.0 - p) * (keyA.b)) * 255;
            imageData.data[x * 4 + 3] = 255;
        }
    }

    for (var i = 0; i < 50; i++)
    {
        this._ctx.putImageData(imageData, 0, i);
    }

    if (this._opId && this._portName)
    {
        let keyData = [];
        for (var i = 0; i < keys.length; i++)
        {
            keyData[i] =
                {
                    "pos": keys[i].pos,
                    "r": keys[i].r,
                    "g": keys[i].g,
                    "b": keys[i].b
                };
        }

        let op = gui.patch().scene.getOpById(this._opId);
        op.getPort(this._portName).set(JSON.stringify({ "keys": keyData }));
    }
};

CABLES.GradientEditor.prototype.onChange = function ()
{
    function compare(a, b) { return a.pos - b.pos; }

    this._keys.sort(compare);
    this.updateCanvas();
    if (this._callback) this._callback();
};

CABLES.GradientEditor.prototype.deleteKey = function (k)
{
    this._keys.splice(this._keys.indexOf(k), 1);
    // console.log(this._keys.length+' keys');
    this.onChange();
};

CABLES.GradientEditor.prototype.setCurrentKey = function (key)
{
    CABLES.currentKey = key;

    $("#gradientColorInput").unbind();
    $("#gradientColorInput").val("rgb(" + Math.round(key.r * 255) + "," + Math.round(key.g * 255) + "," + Math.round(key.b * 255) + ")");
    this._bindColorPicker();
};


CABLES.GradientEditor.prototype.addKey = function (pos, r, g, b)
{
    let rect = this._paper.rect(pos * this._width, 0, this._keyWidth, this._keyHeight).attr({ "stroke": "#000" });

    if (r == undefined)
    {
        r = Math.random();
        g = Math.random();
        b = Math.random();
    }

    let key = { pos, rect, r, g, b };

    rect.attr({ "fill": "rgba(" + Math.round(key.r * 255) + "," + Math.round(key.g * 255) + "," + Math.round(key.b * 255) + ",1)" });

    this._keys.push(key);
    let shouldDelete = false;
    this.setCurrentKey(key);

    function move(dx, dy, x, y, e)
    {
        this.setCurrentKey(key);
        this._movingkey = true;
        let attribs = {};
        attribs.stroke = "#000";

        if (e.target == key.rect.node || e.target.tagName == "svg")
        {
            attribs.x = e.offsetX - (this._keyWidth / 2);
            key.pos = (attribs.x + this._keyWidth / 2) / this._width;
        }

        if (Math.abs(this._startMouseY - y) > this._dragDownDeleteThreshold)
        {
            attribs["fill-opacity"] = 0.3;
            attribs.stroke = "#f00";
            shouldDelete = true;
        }
        else
        {
            attribs["fill-opacity"] = 1.0;
            shouldDelete = false;
        }

        rect.attr(attribs);
        this.onChange();
    }

    function down(x, y, e)
    {
        this._startMouseY = y;
        this._movingkey = true;
        this.setCurrentKey(key);
    }

    function up(e)
    {
        setTimeout(function ()
        {
            this._movingkey = false;
        }.bind(this), 100);

        if (shouldDelete)
        {
            key.rect.remove();
            this.deleteKey(key);
            console.log("key should be deleted!");
        }
    }

    rect.drag(move.bind(this), down.bind(this), up.bind(this));
};

CABLES.GradientEditor.prototype.show = function (cb)
{
    this._callback = cb;

    let html = CABLES.UI.getHandleBarHtml("GradientEditor", {});

    CABLES.UI.MODAL.show(html, {
        "title": "",
        "nopadding": true
    });

    this._paper = Raphael("gradienteditorbar", 0, 0);

    $("#gradienteditorbar svg").click(function (e)
    {
        if (this._movingkey) return;
        this.addKey(e.offsetX / this._width);
        this.onChange();
    }.bind(this));

    if (this._opId && this._portName)
    {
        let op = gui.patch().scene.getOpById(this._opId);
        let data = op.getPort(this._portName).get();
        try
        {
            this._previousContent = data;
            let keys = JSON.parse(data).keys;
            for (let i = 1; i < keys.length - 1; i++)
            {
                console.log("addddd", keys[i]);
                this.addKey(keys[i].pos, keys[i].r, keys[i].g, keys[i].b);
            }
        }
        catch (e)
        {
            console.log(e);
        }
    }

    if (this._keys.length == 0)
    {
        this.addKey(0.25, 0, 0, 0);
        this.addKey(0.75, 1, 1, 1);
    }

    this.onChange();
    CABLES.GradientEditor.editor = this;

    $("#gradientSaveButton").click(function ()
    {
        console.log("save!");
        CABLES.UI.MODAL.hide();
    });
    $("#gradientCancelButton").click(function ()
    {
        let op = gui.patch().scene.getOpById(this._opId);
        op.getPort(this._portName).set(this._previousContent);
        CABLES.UI.MODAL.hide();
    }.bind(this));
};

CABLES.GradientEditor.prototype._bindColorPicker = function ()
{
    window.cppp = $("#gradientColorInput").colorPicker({
        "opacity": true,
        "animationSpeed": 0,
        // dark: '#0f0',
        // light: '#f00',

        // margin: '-80px -40px 0',
        // doRender: 'div div',
        renderCallback(res, toggled) {

            if (toggled === false) {
                ignoreColorChanges = true;
            }
            if (toggled === true) {
                // updateColorPickerButton(id);
                // colors = this.color.colors;
                ignoreColorChanges = false;
            }


            if (!ignoreColorChanges && CABLES.currentKey)
            {
                // console.log(this.color.colors.rgb);
                CABLES.currentKey.r=this.color.colors.rgb.r;
                CABLES.currentKey.g=this.color.colors.rgb.g;
                CABLES.currentKey.b=this.color.colors.rgb.b;

                // console.log(CABLES.currentKey);
                // console.log(editor._keys.length);
                CABLES.GradientEditor.editor._ctx=null;
                CABLES.GradientEditor.editor.onChange();
                CABLES.GradientEditor.editor.updateCanvas();
            //     $('#portval_' + portNum + '_range').val(colors.rgb.r).trigger('input');
            //     $('#portval_' + (portNum + 1) + '_range').val(colors.rgb.g).trigger('input');
            //     $('#portval_' + (portNum + 2) + '_range').val(colors.rgb.b).trigger('input');
            // } else {
            //     updateColorPickerButton(id);

                // $('#gradientColorInput').css({"color":"transparent !important"});;
            }
        },
        buildCallback($elm) {
        }
    });
};


function rgbToHex(R, G, B) { return toHex(R) + toHex(G) + toHex(B);}
function toHex(n)
{
    n = parseInt(n, 10);
    if (isNaN(n)) return "00";
    n = Math.max(0, Math.min(n, 255));
    return "0123456789ABCDEF".charAt((n-n % 16) / 16)
      + "0123456789ABCDEF".charAt(n % 16);
}
