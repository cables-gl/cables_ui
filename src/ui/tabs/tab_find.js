CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.FindTab=function(tabs,str)
{
    this._tab=new CABLES.UI.Tab("Search",{"icon":"search","infotext":"tab_find","padding":true});
    tabs.addTab(this._tab,true);


    this._lastSearch = "";
    this._findTimeoutId = 0;
    this._canceledSearch = 0;
    // var this._boundEscape = false;
    this._lastClicked = -1;
    this._lastSelected = -1;
    this._maxIdx = -1;
    this._inputId="tabFindInput"+CABLES.uuid();

    var colors=[];

    for (var i=0;i<gui.scene().ops.length;i++)
    {
        var op=gui.scene().ops[i];
        // if (!gui.scene().ops[i].isHidden()) numVisibleOps++;
        if (op.uiAttribs.error)
        {
            // errorOps.push(op);
            if(op.objName.toLowerCase().indexOf("Deprecated")>-1)op.isDeprecated=true;
        }
        if (op.uiAttribs.warning) warnOps.push(op);
        if (op.uiAttribs.color) colors.push(op.uiAttribs.color);
    }
    colors = CABLES.uniqueArray(colors);

    console.log(colors);

    var html = CABLES.UI.getHandleBarHtml("tab_find", {colors:colors,inputid:"tabFindInput"+this._inputId});

    this._tab.html(html);

    var updateCb=this.searchAfterPatchUpdate.bind(this);

    gui.scene().addEventListener("onOpDelete",updateCb);
    gui.scene().addEventListener("onOpAdd",updateCb);


    this._tab.addEventListener("onClose",()=>
    {
        gui.scene().removeEventListener("onOpDelete",updateCb);
        gui.scene().removeEventListener("onOpAdd",updateCb);
    });

    document.getElementById("tabFindInput"+this._inputId).focus();

    document.getElementById("tabFindInput"+this._inputId).addEventListener("input",(e)=>
    {
        console.log(e);
        this.search(e.target.value);
    });


    document.getElementById("tabFindInput"+this._inputId).addEventListener(
        "keydown",
        function (e)
        {
            if (e.keyCode == 38)
            {
                var c = this._lastClicked - 1;
                if (c < 0) c = 0;
                this.setClicked(c);
                document.getElementById("findresult" + c).click();
                document.getElementById("tabFindInput"+this._inputId).focus();
            }
            else if (e.keyCode == 40)
            {
                var c = this._lastClicked + 1;
                if (c > this._maxIdx - 1) c = this._maxIdx;
                this.setClicked(c);
                document.getElementById("findresult" + c).click();
                document.getElementById("tabFindInput"+this._inputId).focus();
            }
        }.bind(this),
    );

    console.log("jojo");


    $("#tabsearchbox").show();
    $("#tabFindInput").focus();
    $("#tabFindInput").val(this._lastSearch);
    document.getElementById("tabFindInput"+this._inputId).setSelectionRange(0, this._lastSearch.length);

    clearTimeout(this._findTimeoutId);
    this._findTimeoutId = setTimeout( ()=>
    {
        this.search(this._lastSearch);
    }, 100);

    if(str)
    {
        $("#tabsearchbox input").val(str);
        this.search(str);
    }

    
};

CABLES.UI.FindTab.prototype.setSearchInputValue = function (str)
{
    $("#tabsearchbox input").val(str);
}

CABLES.UI.FindTab.prototype.searchAfterPatchUpdate = function ()
{
    console.log("search after patch update");
    this.search(document.getElementById("tabFindInput"+this._inputId).value);

}


CABLES.UI.FindTab.prototype.isVisible = function ()
{
    return this._tab.isVisible();
    // return $("#tabsearchbox").is(":visible");
};


CABLES.UI.FindTab.prototype._addResultOp = function (op, result, idx)
{
    var html = "";
    var info = "";
    this._maxIdx = idx;

    info += "* score : " + result.score + "\n";
    // info += "* id : " + op.id + "\n";

    var colorClass = "op_color_" + CABLES.UI.uiConfig.getNamespaceClassName(op.op.objName);
    html
        += "<div id=\"findresult"
        + idx
        + "\" class=\"info findresultop"
        + op.op.id
        + "\" data-info=\""
        + info
        + "\" onclick=\"gui.patch().setCurrentSubPatch('"
        + op.getSubPatch()
        + "');gui.patch().focusOp('"
        + op.op.id
        + "');gui.patch().getViewBox().center("
        + op.op.uiAttribs.translate.x
        + ","
        + op.op.uiAttribs.translate.y
        + ");gui.patch().setSelectedOpById('"
        + op.op.id
        + "');$('#patch').focus();gui.find().setClicked("
        + idx
        + ")\">";

    var colorHandle = "";
    if (op.op.uiAttribs.color) colorHandle = "<span style=\"background-color:" + op.op.uiAttribs.color + ";\">&nbsp;&nbsp;</span>&nbsp;&nbsp;";

    html += "<h3 class=\"" + colorClass + "\">" + colorHandle + op.op.name + "</h3>";
    // html+=''+op.op.objName;
    html += result.where||"";

    if (op.op.uiAttribs.subPatch != 0)
    {
        html += "<br/> subpatch: " + gui.patch().getSubPatchPathString(op.op.uiAttribs.subPatch);
    }

    html += "</div>";

    setTimeout(function ()
    {
        $("#tabsearchresult").append(html);
    }, 1);
};

CABLES.UI.FindTab.prototype.highlightWord = function (word, str)
{
    if(!str || str=="" )return "";
    var stringReg = new RegExp(word, "gi");
    str += "";

    var cut = false;
    while (str.indexOf(word) > 10)
    {
        str = str.substr(1, str.length - 1);
        cut = true;
    }
    if (cut) str = "..." + str;
    cut = false;

    while (str.length - str.lastIndexOf(word) > 16)
    {
        str = str.substr(0, str.length - 1);
        cut = true;
    }
    if (cut) str += "...";

    str = str.replace(stringReg, "<span class=\"highlight\">" + word + "</span>");
    return str;
};

CABLES.UI.FindTab.prototype.doSearch = function (str, searchId)
{

    console.log("dosearch",str);


    this._lastSearch = str;
    $("#tabsearchresult").html("");
    if (str.length < 2) return;



    str = str.toLowerCase();

    var foundNum = 0;
    var results = [];

    if (str.indexOf(":") == 0)
    {
        if (str == ":commented")
        {
            for (var i = 0; i < gui.patch().ops.length; i++)
            {
                var op = gui.patch().ops[i];

                if (gui.patch().ops[i].op.uiAttribs.comment && gui.patch().ops[i].op.uiAttribs.comment.length > 0)
                {
                    results.push({ op, score: 1 });
                    foundNum++;
                }

                // if(op.op.objName.indexOf("Ops.User")==0)
                // {
                //     results.push({"op":op,"score":1});
                //     foundNum++;
                // }
            }
        }
        else if (str == ":user")
        {
            for (var i = 0; i < gui.patch().ops.length; i++)
            {
                var op = gui.patch().ops[i];
                if (op.op.objName.indexOf("Ops.User") == 0)
                {
                    results.push({ op, score: 1 });
                    foundNum++;
                }
            }
        }
        else if (str.indexOf(":color=") == 0)
        {
            var col = str.substr(7).toLowerCase();

            for (var i = 0; i < gui.patch().ops.length; i++)
            {
                var op = gui.patch().ops[i];
                if (op.op.uiAttribs.color && op.op.uiAttribs.color.toLowerCase() == col)
                {
                    results.push({ op, score: 1 });
                    foundNum++;
                }
            }
        }
        else if (str == ":unconnected")
        {
            for (var i = 0; i < gui.patch().ops.length; i++)
            {
                var op = gui.patch().ops[i];
                var count = 0;
                for (var j = 0; j < op.portsIn.length; j++)
                {
                    if (op.portsIn[j].thePort.isLinked())
                    {
                        count++;
                    }
                }
                if (count == 0)
                {
                    for (var j = 0; j < op.portsOut.length; j++)
                    {
                        if (op.portsOut[j].thePort.isLinked())
                        {
                            count++;
                        }
                    }
                }

                if (count == 0)
                {
                    results.push({ op, score: 1 });
                    foundNum++;
                }
            }
        }
    }
    else
    {
        var where = "";
        for (var i = 0; i < gui.patch().ops.length; i++)
        {
            if (this._canceledSearch == searchId)
            {
                console.log("canceled search...");
                return;
            }
            if (gui.patch().ops[i].op)
            {
                var score = 0;

                if (
                    gui
                        .patch()
                        .ops[i].op.objName.toLowerCase()
                        .indexOf(str) > -1
                )
                {
                    where = "name: " + this.highlightWord(str, gui.patch().ops[i].op.objName);
                    score += 1;
                }

                if (
                    gui.patch().ops[i].op.uiAttribs.comment
                    && gui
                        .patch()
                        .ops[i].op.uiAttribs.comment.toLowerCase()
                        .indexOf(str) > -1
                )
                {
                    where = "comment: " + this.highlightWord(str, gui.patch().ops[i].op.uiAttribs.comment);
                    score += 1;
                }

                if (
                    String(gui.patch().ops[i].op.name || "")
                        .toLowerCase()
                        .indexOf(str) > -1
                )
                {
                    if (gui.patch().ops[i].op.objName.indexOf(gui.patch().ops[i].op.name) == -1) score += 2; // extra points if non default name

                    where = "name: " + this.highlightWord(str, gui.patch().ops[i].op.name);

                    score += 2;
                }

                var op = gui.patch().ops[i].op;
                for (var j = 0; j < op.portsIn.length; j++)
                {
                    if ((op.portsIn[j].get() + "").toLowerCase().indexOf(str) > -1)
                    {
                        where = "<span style=\"color:var(--color_port_" + op.portsIn[j].getTypeString().toLowerCase() + ");\">▩</span> ";
                        where += op.portsIn[j].name + ": " + this.highlightWord(str, op.portsIn[j].get());

                        score += 2;
                    }
                }

                if (score > 0 && gui.patch().isOpCurrentSubpatch(op)) score++;

                if (score > 0)
                {
                    results.push({ op: gui.patch().ops[i], score, where });
                    foundNum++;
                }
            }
        }
    }

    if (foundNum === 0)
    {
        $("#tabsearchresult").html("<br/><center>No ops found</center><br/>");
    }
    else
    {
        results.sort(function (a, b)
        {
            return b.score - a.score;
        });
        for (var i = 0; i < results.length; i++)
        {
            this._addResultOp(results[i].op, results[i], i);
        }
    }
};

CABLES.UI.FindTab.prototype.search = function (str)
{
    this._maxIdx = -1;
    this.setSelectedOp(null);
    this.setClicked(-1);
    this.doSearch(str||"");
    console.log("search...",str);
};

CABLES.UI.FindTab.prototype.setClicked = function (num)
{
    var el = document.getElementById("findresult" + this._lastClicked);
    if (el)
    {
        el.classList.remove("lastClicked");
    }

    var el = document.getElementById("findresult" + num);

    if (el)
    {
        el.classList.add("lastClicked");
    }
    this._lastClicked = num;
};

CABLES.UI.FindTab.prototype.setSelectedOp = function (opid)
{
    var els = document.getElementsByClassName("findresultop" + this._lastSelected);
    if (els && els.length == 1) els[0].classList.remove("selected");

    els = document.getElementsByClassName("findresultop" + opid);
    if (els && els.length == 1) els[0].classList.add("selected");
    this._lastSelected = opid;
};