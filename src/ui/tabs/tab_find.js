CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.FindTab=function(tabs,str)
{
    this._tab=new CABLES.UI.Tab("Search",{"icon":"search","infotext":"tab_find","padding":true});
    tabs.addTab(this._tab,true);
    this._tabs=tabs;

    this._lastSearch = "";
    this._findTimeoutId = 0;
    this._canceledSearch = 0;
    this._lastClicked = -1;
    this._lastSelected = -1;
    this._maxIdx = -1;
    this._inputId="tabFindInput"+CABLES.uuid();
    this._closed=false;

    var colors=[];
    var warnOps=[];

    for (var i=0;i<gui.scene().ops.length;i++)
    {
        var op=gui.scene().ops[i];
        if(!op)continue;
        if (op.uiAttribs.error)
        {
            if(op.objName.toLowerCase().indexOf("Deprecated")>-1)op.isDeprecated=true;
        }
        if (op.uiAttribs.warning) warnOps.push(op);
        if (op.uiAttribs.color) colors.push(op.uiAttribs.color);
    }
    colors = CABLES.uniqueArray(colors);



    var html = CABLES.UI.getHandleBarHtml("tab_find", {colors:colors,inputid:this._inputId});

    this._tab.html(html);

    this._updateCb=this.searchAfterPatchUpdate.bind(this);

    gui.opHistory.addEventListener("changed",this.updateHistory.bind(this));

    gui.scene().addEventListener("onOpDelete",this._updateCb);
    gui.scene().addEventListener("onOpAdd",this._updateCb);
    gui.scene().addEventListener("commentChanged",this._updateCb);
    

    this._tab.addEventListener("onClose",()=>
    {
        gui.opHistory.removeEventListener("changed",this.updateHistory.bind(this));

        gui.scene().removeEventListener("onOpDelete",this._updateCb);
        gui.scene().removeEventListener("onOpAdd",this._updateCb);
        gui.scene().removeEventListener("commentChanged",this._updateCb);
        this._closed=true;
    });

    document.getElementById(this._inputId).focus();

    document.getElementById(this._inputId).addEventListener("input",(e)=>
    {
        this.search(e.target.value);
    });

    document.getElementById(this._inputId).addEventListener(
        "keydown",
        function (e)
        {
            if (e.keyCode == 38)
            {
                var c = this._lastClicked - 1;
                if (c < 0) c = 0;
                this.setClicked(c);
                document.getElementById("findresult" + c).click();
                document.getElementById(this._inputId).focus();
            }
            else if (e.keyCode == 40)
            {
                var c = this._lastClicked + 1;
                if (c > this._maxIdx - 1) c = this._maxIdx;
                this.setClicked(c);
                document.getElementById("findresult" + c).click();
                document.getElementById(this._inputId).focus();
            }
        }.bind(this),
        
    );

    $("#tabsearchbox").show();
    $("#tabFindInput").val(this._lastSearch);
    this.focus();
    document.getElementById(this._inputId).setSelectionRange(0, this._lastSearch.length);

    clearTimeout(this._findTimeoutId);
    this._findTimeoutId = setTimeout( ()=>
    {
        this.search(this._lastSearch);
        this.updateHistory();

    }, 100);

    if(str)
    {
        $("#tabsearchbox input").val(str);
        this.search(str);
    }
    this.focus();
};

CABLES.UI.FindTab.prototype.focus = function ()
{
    this._tabs.activateTab(this._tab.id);

    $("#"+this._inputId).focus();
}

CABLES.UI.FindTab.prototype.isClosed = function ()
{
    return this._closed;
}

CABLES.UI.FindTab.prototype.setSearchInputValue = function (str)
{
    $("#tabsearchbox input").val(str);
}

CABLES.UI.FindTab.prototype.searchAfterPatchUpdate = function ()
{
    console.log("search after patch update");
    
    clearTimeout(this._findTimeoutId);
    this._findTimeoutId = setTimeout( ()=>
    {
        this.search(document.getElementById(this._inputId).value,true);
    }, 100);
}

CABLES.UI.FindTab.prototype.isVisible = function ()
{
    return this._tab.isVisible();
};

// CABLES.UI.FindTab.prototype._addResultOp
// {

// }

CABLES.UI.FindTab.prototype._addResultOp = function (op, result, idx)
{
    var html = "";
    var info = "";
    this._maxIdx = idx;

    info += "* score : " + result.score + "\n";

    if(op.op)op=op.op;

    var colorClass = "op_color_" + CABLES.UI.uiConfig.getNamespaceClassName(op.objName);
    html
        += "<div id=\"findresult"
        + idx
        + "\" class=\"info findresultop"
        + op.id
        + "\" data-info=\""
        + info + "\" ";
        
        html+= "onclick=\"gui.focusFindResult('"+String(idx)+"','"+op.id+"','"+op.uiAttribs.subPatch+"',"+op.uiAttribs.translate.x+","+op.uiAttribs.translate.y+");\">";
        // + "\" onclick=\"gui.patch().setCurrentSubPatch('"
        // + op.uiAttribs.subPatch
        // + "');"
        // + "gui.patch().focusOp('"
        // + op.id
        // + "');gui.patch().getViewBox().center("
        // + op.uiAttribs.translate.x
        // + ","
        // + op.uiAttribs.translate.y
        // + ");gui.patch().setSelectedOpById('"
        // + op.id
        // + "');$('#patch').focus();gui.find().setClicked("
        // + idx
        // + ")\">";

    var colorHandle = "";
    if (op.uiAttribs.color) colorHandle = "<span style=\"background-color:" + op.uiAttribs.color + ";\">&nbsp;&nbsp;</span>&nbsp;&nbsp;";

    html += "<h3 class=\"" + colorClass + "\">" + colorHandle + op.name + "</h3>";
    if(op.uiAttribs.comment) html+='<span style="color: var(--color-special);"> // '+op.uiAttribs.comment+'</span><br/>';
    html+=''+op.objName+'<br/>';
    html += result.where||"";

    if (op.uiAttribs.subPatch != 0)
        html += "<br/> subpatch: " + gui.patch().getSubPatchPathString(op.uiAttribs.subPatch);

    html += "</div>";

    $("#tabsearchresult").append(html);
};

CABLES.UI.FindTab.prototype.highlightWord = function (word, str)
{
    if(!str || str=="" )return "";
    str += "";

    var pos=str.toLowerCase().indexOf(word.toLowerCase());
    if(pos>=0)
    {
        const outStrA=str.substring(pos-15, pos);
        const outStrB=str.substring(pos, pos+word.length);
        const outStrC=str.substring(pos+word.length, pos+15);
        // str = str.replace(stringReg, "<span class=\"highlight\">" + word + "</span>");
        str=outStrA+'<b style="background-color:#aaa;color:black;">'+outStrB+"</b>"+outStrC;
    }

    return str;
};

CABLES.UI.FindTab.prototype.doSearch = function (str,userInvoked)
{
    // console.log("dosearch",str);
    const startTime=performance.now();
    this._lastSearch = str;
    $("#tabsearchresult").html("");
    if (str.length < 3) return;

    str = str.toLowerCase();

    var foundNum = 0;
    var results = [];

    if (str.indexOf(":") == 0)
    {
        if (str == ":recent")
        {
            var history=gui.opHistory.getAsArray(99);

            for(var i=0;i<history.length;i++)
            {
                var op = gui.corePatch().getOpById(history[i].id);
                results.push({ op, score: 1 });
                foundNum++;
            }
        }

        if (str == ":commented")
        {
            for (var i = 0; i < gui.corePatch().ops.length; i++)
            {
                var op = gui.corePatch().ops[i];

                if (op.uiAttribs && op.uiAttribs.comment && op.uiAttribs.comment.length > 0)
                {
                    results.push({ op, score: 1,where:op.uiAttribs.comment });
                    foundNum++;
                }
            }
        }
        else if (str == ":user")
        {
            for (var i = 0; i < gui.corePatch().ops.length; i++)
            {
                var op = gui.corePatch().ops[i];
                if (op.objName.indexOf("Ops.User") == 0)
                {
                    results.push({ op, score: 1,where:op.objName });
                    foundNum++;
                }
            }
        }
        else if (str.indexOf(":color=") == 0)
        {
            var col = str.substr(7).toLowerCase();

            for (var i = 0; i < gui.corePatch().ops.length; i++)
            {
                var op = gui.corePatch().ops[i];
                if (op.uiAttribs.color && op.uiAttribs.color.toLowerCase() == col)
                {
                    results.push({ op, score: 1 });
                    foundNum++;
                }
            }
        }
        else if (str == ":bookmarked")
        {
            const bms=gui.bookmarks.getBookmarks();

            for(var i=0;i<bms.length;i++)
            {
                var op=gui.corePatch().getOpById(bms[i]);
                results.push({ op, score: 1 });
                foundNum++;
            }
        }
        else if (str == ":unconnected")
        {
            for (var i = 0; i < gui.corePatch().ops.length; i++)
            {
                var op = gui.corePatch().ops[i];
                var count = 0;
                for (var j = 0; j < op.portsIn.length; j++)
                {
                    if (op.portsIn[j].isLinked())
                    {
                        count++;
                    }
                }
                if (count == 0)
                {
                    for (var j = 0; j < op.portsOut.length; j++)
                        if (op.portsOut[j].isLinked())
                            count++;
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
        var ops=gui.corePatch().ops;
        for (var i = 0; i < ops.length; i++)
        {

            var score = 0;

            if(str.length>5)
            {
                if (ops[i].id.indexOf(str) > -1)
                {
                    where = "op id ";
                    score += 1;
                }
            }

            if (ops[i].objName.toLowerCase().indexOf(str) > -1)
            {
                where = "name: " + this.highlightWord(str, ops[i].objName);
                score += 1;
            }

            if (
                ops[i].uiAttribs.comment && 
                ops[i].uiAttribs.comment.toLowerCase().indexOf(str) > -1 )
            {
                where = "comment: " + this.highlightWord(str, ops[i].uiAttribs.comment);
                score += 1;
            }

            if ( String(ops[i].name || "").toLowerCase().indexOf(str) > -1 )
            {
                if (ops[i].objName.indexOf(ops[i].name) == -1) score += 2; // extra points if non default name

                where = "name: " + this.highlightWord(str, ops[i].name);
                score += 2;
            }

            var op = ops[i];
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
                results.push({ op: ops[i], score, where });
                foundNum++;
            }
        }
    }

    if (foundNum === 0)
    {
        $("#tabsearchresult").html('<div style="pointer-events:none">&nbsp;&nbsp;&nbsp;No ops found</div>');
    }
    else
    {
        results.sort(function (a, b) { return b.score - a.score; });

        for (var i = 0; i < results.length; i++)
            this._addResultOp(results[i].op, results[i], i);
        
        var onclickResults='gui.patch().setSelectedOp(null);';
        for (var i = 0; i < results.length; i++)
            onclickResults+='gui.patch().addSelectedOpById(\''+results[i].op.id+'\');';
        onclickResults+='gui.patch().setStatusSelectedOps();';
        $("#tabsearchresult").append('<div style="background-color:var(--color-02);border-bottom:none;"><a class="button-small" onclick="'+onclickResults+'">'+results.length+' results</a></div>');
    }

    const timeUsed=performance.now()-startTime;

    if(!userInvoked) this.focus();
};

CABLES.UI.FindTab.prototype.search = function (str,userInvoked)
{
    this._maxIdx = -1;
    this.setSelectedOp(null);
    this.setClicked(-1);
    this.doSearch(str||"",userInvoked);
};

CABLES.UI.FindTab.prototype.setClicked = function (num)
{
    var el = document.getElementById("findresult" + this._lastClicked);
    if (el) el.classList.remove("lastClicked");

    el = document.getElementById("findresult" + num);
    if (el) el.classList.add("lastClicked");
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

CABLES.UI.FindTab.prototype.updateHistory = function ()
{
    console.log("this._lastSearch",this._lastSearch);
    if(this._lastSearch==":recent")
    {
        this._updateCb();
    }
};

