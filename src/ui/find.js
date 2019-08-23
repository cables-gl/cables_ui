CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.Find = function ()
{
    var lastSearch = "";
    var findTimeoutId = 0;
    var canceledSearch = 0;
    var idSearch = 1;
    var boundEscape = false;

    this.isVisible = function ()
    {
        return $("#searchbox").is(":visible");
    };

    this.hide = function ()
    {
        $("#searchbox").hide();
    };

    this.show = function (str)
    {
        if (!boundEscape)
        {
            gui.addEventListener(
                "pressedEscape",
                function ()
                {
                    if (this.isVisible) this.hide();
                }.bind(this),
            );
            boundEscape = true;
        }

        $("#searchbox").show();
        $("#findinput").focus();
        $("#findinput").val(lastSearch);
        document.getElementById("findinput").setSelectionRange(0, lastSearch.length);
        var self = this;

        clearTimeout(findTimeoutId);
        findTimeoutId = setTimeout(function ()
        {
            self.search(lastSearch);
        }, 100);

        if (str)
        {
            $("#searchbox input").val(str);
            this.search(str);
        }
    };

    function addResultOp(op, result)
    {
        var html = "";
        var info = "";

        info += "* score : " + result.score + "\n";

        var colorClass = "op_color_" + CABLES.UI.uiConfig.getNamespaceClassName(op.op.objName);
        html
            += "<div class=\"info\" data-info=\""
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
            + "');$('#patch').focus();\">";

        var colorHandle = "";
        if (op.op.uiAttribs.color) colorHandle = "<span style=\"background-color:" + op.op.uiAttribs.color + ";\">&nbsp;&nbsp;</span>&nbsp;&nbsp;";

        html += "<h3 class=\"" + colorClass + "\">" + colorHandle + op.op.name + "</h3>";
        // html+=''+op.op.objName;
        html += result.where;

        if (op.op.uiAttribs.subPatch != 0)
        {
            html += "<br/> subpatch: " + gui.patch().getSubPatchPathString(op.op.uiAttribs.subPatch);
        }

        html += "</div>";

        setTimeout(function ()
        {
            $("#searchresult").append(html);
        }, 1);
    }

    this.highlightWord = function (word, str)
    {
        var stringReg = new RegExp(word, "gi");

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

        str = str.replace(stringReg, "<span style=\"font-weight:bold;text-decoration:underline\">" + word + "</span>");
        return str;
    };

    this.doSearch = function (str, searchId)
    {
        lastSearch = str;
        $("#searchresult").html("");
        if (str.length < 2) return;

        str = str.toLowerCase();
        // console.log('--- ',str);

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
                if (canceledSearch == searchId)
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
                            where = '<span style="color:var(--color_port_'+op.portsIn[j].getTypeString().toLowerCase()+');">▩</span> ';
                            where += op.portsIn[j].name+": " + this.highlightWord(str, op.portsIn[j].get());

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
            $("#searchresult").html("<br/><center>No ops found</center><br/>");
        }
        else
        {
            results.sort(function (a, b)
            {
                return b.score - a.score;
            });
            for (var i = 0; i < results.length; i++)
            {
                addResultOp(results[i].op, results[i]);
            }
        }
    };

    this.search = function (str)
    {
        this.doSearch(str);
    };
};
