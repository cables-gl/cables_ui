import { ele, Events, Logger } from "cables-shared-client";
import { utils } from "cables";
import { Texture } from "cables-corelibs";
import { portType } from "../../core_constants.js";

/**
 * debug: show content of an array in a tab
 *
 * @export
 * @class WatchArrayTab
 * @extends {Events}
 */
export default class WatchArrayTab extends Events
{
    constructor(tabs, op, port, options)
    {
        super();
        this._tabs = tabs;
        this._log = new Logger("watcharray");

        this._numCols = 1;
        if (op.name.indexOf("Array3") > -1 || op.name.indexOf("Points") > -1) this._numCols = 3;
        if (op.name.indexOf("glArray") > -1 || port.type == portType.object) this._numCols = 4;

        this._rows = 40;

        this.cells = [];
        this._inputs = [];
        this._options = options;
        this.colNames = [];

        this.port = port;
        this.data = null;

        this.data = this._getData();

        this.portListenerId = this.port.on("change", this._updatePortValue.bind(this));

        this._tab = new CABLES.UI.Tab(options.title || "watch " + port.name + port.id, { "icon": "spreadsheet", "infotext": "tab_spreadsheet", "padding": true, "singleton": "true", });

        this._tab.on("close", () =>
        {
            this.port.off(this.portListenerId);
        });

        this._tabs.addTab(this._tab, true);

        this._id = "spread" + utils.uuid();
        this._tab.html("<div id='" + this._id + "'></div>");

        this._ele = document.getElementById(this._id);

        if (!this._ele)
        {
            if (this.port) this.port.off(this.portListenerId);
            this._tab.remove();
            this._log.warn("ele is null");
            this._log.warn(this);
            return;
        }

        this._ele.classList.add("editor_spreadsheet");

        this._eleIconbar = ele.create("div");
        this._ele.appendChild(this._eleIconbar);

        this._eleInfo = ele.create("div");
        this._ele.appendChild(this._eleInfo);

        if (this.port.type == portType.array)
        {
            this._eleIconMinus = ele.create("a");
            this._eleIconMinus.innerHTML = "-";
            this._eleIconMinus.classList.add("button");
            this._eleIconMinus.addEventListener("click", () => { this._changeColumns(-1); });
            this._eleIconbar.appendChild(this._eleIconMinus);

            this._eleIconPlus = ele.create("a");
            this._eleIconPlus.innerHTML = "+";
            this._eleIconPlus.classList.add("button");
            this._eleIconPlus.addEventListener("click", () => { this._changeColumns(1); });
            this._eleIconbar.appendChild(this._eleIconPlus);
        }

        // this._eleIconbar.innerHTML='<a href="http://localhost:5711/op/Ops.Array.RandomNumbersArray3_v2" class="button ">+</a>';

        this._eleTable = ele.create("table");
        this._ele.appendChild(this._eleTable);

        /*
         * if (!this.cells)
         *     for (let y = 0; y < this._rows; y++)
         *         for (let x = 0; x < this._numCols; x++)
         *             this.set(x, y, "");
         */

        this._html();
    }

    getColName(_c)
    {
        _c = parseFloat(_c);

        if (this.colNames.length > _c && this.colNames[_c])
        {
            return this.colNames[_c];
        }

        let str = "";

        let c = parseFloat(_c);

        if (c < 0) throw new Error("col invalid");

        while (c >= 0)
        {
            if (this.port.type == portType.object) str = "RGBAabcdefghijklmnopqrstuvwxyz"[c % 26] + str;
            else str = "abcdefghijklmnopqrstuvwxyz"[c % 26] + str;
            c = Math.floor(c / 26) - 1;
        }

        this.colNames[_c] = str;

        return str;
    }

    _getData()
    {
        if (!this.port) return [];
        if (this.port.type == portType.array)
        {
            return this.port.get();
        }

        if (this.port.type == portType.object)
        {
            const realTexture = this.port.get(),
                gl = this.port.op.patch.cgl.gl;

            if (!realTexture) return [];
            if (!this._fb) this._fb = gl.createFramebuffer();

            gl.bindFramebuffer(gl.FRAMEBUFFER, this._fb);

            let channels = gl.RGBA;
            let numChannels = 4;

            let texChanged = true;
            let channelType = gl.UNSIGNED_BYTE;

            if (texChanged)
            {
                gl.framebufferTexture2D(
                    gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, realTexture.tex, 0
                );

                let isFloatingPoint = realTexture.textureType == Texture.TYPE_FLOAT;
                if (isFloatingPoint) channelType = gl.FLOAT;

                if (
                    this._lastFloatingPoint != isFloatingPoint ||
                    this._lastWidth != realTexture.width ||
                    this._lastHeight != realTexture.height)
                {
                    const size = realTexture.width * realTexture.height * numChannels;
                    if (isFloatingPoint) this._pixelData = new Float32Array(size);
                    else this._pixelData = new Uint8Array(size);

                    this._lastFloatingPoint = isFloatingPoint;
                    this._lastWidth = realTexture.width;
                    this._lastHeight = realTexture.height;
                }

                texChanged = false;
            }

            gl.bindFramebuffer(gl.FRAMEBUFFER, this._fb);

            gl.readPixels(
                0, 0, Math.min(90, realTexture.width), 1, channels, channelType, this._pixelData
            );

            return this._pixelData;
        }
    }

    _changeColumns(n)
    {
        this._numCols += n;
        this._updatePortValue();
    }

    _updatePortValue()
    {
        if (!this.port || !this.port.get()) return;
        this.data = this._getData();
        if (this._eleTable) this._eleTable.remove();
        this._eleTable = ele.create("table");
        this._ele.appendChild(this._eleTable);

        this._html();
    }

    _html()
    {
        for (let i = 0; i < this._inputs.length; i++) this._inputs[i].remove();

        this._inputs.length = 0;
        const table = this._eleTable;

        const tr1 = ele.create("tr");
        for (let x = -1; x < this._numCols; x++)
        {
            const tdr = ele.create("td");
            if (x > -1)
            {
                tdr.innerHTML = "&nbsp;" + this.getColName(x);
                tdr.classList.add("colnum");
                tdr.style.width = (90 / this._numCols) + "%";
            }
            else
            {
                tdr.style.width = "10%";
            }
            tr1.appendChild(tdr);
        }
        table.appendChild(tr1);

        for (let y = 0; y < this._rows; y++)
        {
            const tr = ele.create("tr");
            table.appendChild(tr);

            const tdr = ele.create("td");
            if (y >= 0)
            {
                tdr.innerHTML = y;
                tdr.classList.add("rownum");
            }
            tr.appendChild(tdr);

            for (let x = 0; x < this._numCols; x++)
            {
                const td = ele.create("td");
                tr.appendChild(td);

                const input = ele.create("span");
                input.style.fontFamily = "Monospace";
                input.dataset.x = x;
                input.dataset.y = y;
                this._inputs[x + y * this._numCols] = input;

                let str = String(this.get(x, y));
                if (str.indexOf("-") == -1)str = "&nbsp;" + str;
                input.innerHTML = str || "";

                td.appendChild(input);
            }
        }

        if (this.port.type == portType.array)
        {
            let showNum = 0;
            let showLength = 0;
            if (this.data && this.data.length)
            {
                showNum = this._rows * this._numCols;
                showLength = this.data.length;
            }

            this._eleInfo.innerHTML = "showing " + showNum + " of " + showLength + " values ";
        }
        if (this.port.type == portType.object)
        {
            this._eleInfo.innerHTML = this.port.get().width + "x" + this.port.get().height + " - " + (this.port.get().height * this.port.get().width) + " Pixels";
        }
    }

    _focusCell(x, y)
    {
        const inp = this._inputs[(y * this._numCols) + x];

        if (inp)
        {
            inp.focus();

            setTimeout(() =>
            {
                inp.select();
            }, 50);
        }
    }

    get(x, y)
    {
        if (!this.data) return "???";
        if (this.data[x + y * this._numCols] === undefined) return "-";
        return this.data[x + y * this._numCols];
    }

    show()
    {
    }
}
