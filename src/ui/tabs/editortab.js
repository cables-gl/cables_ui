CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.EditorTab = function (options)
{
    this._editor = null;
    this._options = options;

    gui.maintabPanel.show();

    this._tab = new CABLES.UI.Tab(options.title,
        {
            "icon": null,
            "type": options.syntax,
            "name": options.name,
            "infotext": "a code editor",
            "singleton": options.singleton,
        });

    const existing = gui.mainTabs.getTabByTitle(options.title);
    if (existing)
    {
        gui.mainTabs.activateTab(existing.id);
        return;
    }

    this._tab.editorObj = options.editorObj;
    gui.mainTabs.addTab(this._tab, CABLES.UI.tabsAutoActivate);

    const html = "<div id=\"editorcontent" + this._tab.id + "\" style=\"width:100%;height:100%;\"></div>";
    this._tab.html(html);

    this._editor = CABLES.UI.createEditor("editorcontent" + this._tab.id, options.content || "");

    let allowEdit = false;
    if (gui.user.roles.includes("alwaysEditor"))
    {
        // users with "alwaysEditor" role are always allowed to edit everything
        allowEdit = true;
    }
    else if (options.name.startsWith("Ops.User."))
    {
        if (gui.user.isAdmin || options.name.startsWith("Ops.User." + gui.user.usernameLowercase + "."))
        {
            // admins may edit any userop, users are only allowed to edit their own userops
            allowEdit = true;
        }
    }
    else if (gui.user.isAdmin)
    {
        if (CABLES.sandbox.isDevEnv())
        {
            // admins are only allowed to edit everything on dev
            allowEdit = true;
        }
        else
        {
            if (!options.name.startsWith("Ops."))
            {
                allowEdit = true;
            }
        }
    }
    else if (options.name.startsWith("Ops."))
    {
        // only alwaysadmins and admins on dev are allowed to edit ops
        allowEdit = false;
    }
    else
    {
        // everyone is allowed to edit anything that is not an op
        allowEdit = true;
    }

    if (allowEdit)
    {
        if (options.onSave) this._tab.addButton(CABLES.UI.TEXTS.editorSaveButton, this.save.bind(this));
        if (!options.hideFormatButton)
        {
            if (options.onSave) this._tab.addButton(CABLES.UI.TEXTS.editorFormatButton, this.format.bind(this));
        }
    }
    else
    {
        this._editor.setOptions({ "readOnly": "true" });
    }

    // this._editor.setValue(options.content,-1);
    this._editor.resize();

    const undoManager = this._editor.session.getUndoManager();
    undoManager.reset();
    this._editor.session.setUndoManager(undoManager);

    this._editor.on(
        "change",
        function (e)
        {
            gui.mainTabs.setChanged(this._tab.id, true);
            if (options.onChange) options.onChange();
        }.bind(this),
    );

    this._editor.getSession().setUseWorker(true);

    if (options.syntax == "md") this._editor.session.setMode("ace/mode/Markdown");
    else if (options.syntax == "js") this._editor.session.setMode("ace/mode/javascript");
    else if (options.syntax == "glsl") this._editor.session.setMode("ace/mode/glsl");
    else if (options.syntax == "css") this._editor.session.setMode("ace/mode/css");
    else if (options.syntax == "json") this._editor.session.setMode("ace/mode/json");
    else
    {
        this._editor.session.setMode("ace/mode/plain_text");
        this._editor.getSession().setUseWorker(false);
    }

    this._tab.addEventListener("onClose", options.onClose);
    this._tab.addEventListener(
        "onActivate",
        function ()
        {
            this._editor.resize(true);
            this._editor.focus();
            CABLES.UI.userSettings.set("editortab", this._tab.editorObj.name);
        }.bind(this),
    );

    setTimeout(() =>
    {
        if (!options.inactive)
        {
            CABLES.UI.userSettings.set("editortab", this._tab.editorObj.name);
            gui.mainTabs.activateTab(this._tab.id);
        }
    }, 100);
};

CABLES.UI.EditorTab.prototype.format = function ()
{
    CABLESUILOADER.talkerAPI.send(
        "formatOpCode",
        {
            "code": this._editor.getValue(),
        },
        (err, res) =>
        {
            if (!res || !res.success)
            {
                CABLES.UI.notifyError("failed to format code, keeping old version");
                console.log("code formating error", err);
            }
            else
            {
                this._editor.setValue(res.opFullCode, 1);
                this._editor.focus();
            }
        },
        (result) =>
        {
            CABLES.UI.notifyError("failed to format code, keeping old version");
            console.log("code formating http error", result);
        },
    );
};

CABLES.UI.EditorTab.prototype.save = function ()
{
    function onSaveCb(txt)
    {
        gui.jobs().finish("saveeditorcontent");

        if (txt.toLowerCase().indexOf("error") == 0) CABLES.UI.notifyError(txt);
        else
        {
            CABLES.UI.notify(txt);
            gui.mainTabs.setChanged(this._tab.id, false);
        }

        this._editor.focus();
        setTimeout(
            function ()
            {
                this._editor.focus();
            }.bind(this),
            200,
        );
    }

    const anns = this._editor.getSession().getAnnotations();
    console.log("annotations", anns);

    if (this._options.onSave)
    {
        gui.jobs().start({ "id": "saveeditorcontent", "title": "saving editor content" });
        this._options.onSave(onSaveCb.bind(this), this._editor.getValue(), this._editor);
    }
};

CABLES.UI.createEditor = function (id, val)
{
    const editor = ace.edit(id);
    editor.setValue(""); // need to do this

    editor.setOptions({
        "fontFamily": "SourceCodePro",
        "fontSize": "14px",
        "enableBasicAutocompletion": true,
        "enableLiveAutocompletion": true,
        "enableSnippets": true,
        "showPrintMargin": false,
    });

    if (!CABLES.UI.userSettings.get("theme-bright")) editor.setTheme("ace/theme/cables");

    editor.session.setMode("ace/mode/javascript");
    editor.$blockScrolling = Infinity;

    editor.commands.bindKey("Ctrl-D", "selectMoreAfter");
    editor.commands.bindKey("Cmd-D", "selectMoreAfter");
    editor.commands.bindKey("Cmd-Ctrl-Up", "movelinesup");
    editor.commands.bindKey("Cmd-Ctrl-Down", "movelinesdown");

    editor.setValue(val, -1);

    const snippetManager = ace.require("ace/snippets").snippetManager;
    const snippets = snippetManager.parseSnippetFile("");

    snippets.push(
        {
            "content": "op.inTriggerButton(\"${1:name}\")",
            "name": "op.inTriggerButton",
        },
        {
            "content": "op.inTrigger(\"${1:name}\")",
            "name": "op.inTrigger",
        },
        {
            "content": "op.outTrigger(\"${1:name}\")",
            "name": "op.outTrigger",
        },
        {
            "content": "op.inBool(\"${1:name}\",${2:false})",
            "name": "op.inBool",
        },
        {
            "content": "op.inInt(\"${1:name}\",${2:0})",
            "name": "op.inInt",
        },
        {
            "content": "op.inFloatSlider(\"${1:name}\",${2:0})",
            "name": "op.inFloatSlider",
        },
        {
            "content": "op.inFloat(\"${1:name}\",${2:0})",
            "name": "op.inFloat",
        },
        {
            "content": "op.inDropDown(\"${1:name}\",\${2:['option a','option b']}\)",
            "name": "op.inDropDown",
        },
        {
            "content": "op.inSwitch(\"${1:name}\",\${2:['option a','option b']}\,\${3:'default'}\)",
            "name": "op.inSwitch",
        },
        {
            "content": "op.inStringEditor(\"${1:name}\",\"${2:default}\")",
            "name": "op.inStringEditor",
        },
        {
            "content": "op.inString(\"${1:name}\",\"${2:default}\")",
            "name": "op.inString",
        },
        {
            "content": "op.inObject(\"${1:name}\")",
            "name": "op.inObject",
        },
        {
            "content": "op.inTexture(\"${1:name}\")",
            "name": "op.inTexture",
        },
        {
            "content": "op.inArray(\"${1:name}\")",
            "name": "op.inArray",
        },
        {
            "content": "op.inUrl(\"${1:name}\")",
            "name": "op.inUrl",
        },
        {
            "content": "op.outNumber(\"${1:name}\")",
            "name": "op.outNumber",
        },
        {
            "content": "op.outBool(\"${1:name}\")",
            "name": "op.outBool",
        },
        {
            "content": "op.outString(\"${1:name}\")",
            "name": "op.outString",
        },
        {
            "content": "op.outObject(\"${1:name}\")",
            "name": "op.outObject",
        },
        {
            "content": "op.outArray(\"${1:name}\")",
            "name": "op.outArray",
        },
        {
            "content": "op.outTexture(\"${1:name}\")",
            "name": "op.outTexture",
        },
        {
            "content": "CABLES.map(${1:name})",
            "name": "CABLES.map",
        },
        {
            "content": "console.log(\"${1:text}\");",
            "name": "console.log",
        },
        {
            "content": "op.setPortGroup(\"${1:name}\",[${2:port},${3:port}]);",
            "name": "op.setPortGroup",
        },
        {
            "content": "CABLES.map(${1:value},${2:oldMin},${3:oldMax},${4:newMin},${5:newMax});",
            "name": "CABLES.map",
        },
        {
            "content": "op.toWorkPortsNeedToBeLinked(${1:port1},${2:port2});",
            "name": "op.toWorkPortsNeedToBeLinked",
        },
        {
            "content": "vec3.create();",
            "name": "vec3.create",
        },
        {
            "content": "vec3.set(${1:out},${2:x},${3:y},${4:z});",
            "name": "vec3.set(out, x, y, z)",
        },
        {
            "content": "mat4.create();",
            "name": "mat4.create",
        },
        {
            "content": "mat4.identity();",
            "name": "mat4.identity",
        },
        {
            "content": "mat4.translate(${1:out},${2:a},${3:v});",
            "name": "mat4.translate(out,a,v);",
        },
    );
    snippetManager.register(snippets, "javascript");

    const staticWordCompleter = {
        getCompletions(_editor, session, pos, prefix, callback)
        {
            const wordList = [
                "op.log",
                "onChange=",
                "onTriggered=",
                "onLinkChanged=",
                "op.toWorkNeedsParent",
                // "op.toWorkPortsNeedToBeLinked",
                "setUiAttribs",
                "op.patch.cgl",
                "CABLES.shuffleArray(arr);",
                "Math.seededRandom();",
                "Math.randomSeed=1;",
                "CABLES.now();",
            ];
            callback(
                null,
                wordList.map(function (word)
                {
                    return {
                        "caption": word,
                        "value": word,
                        "meta": "static",
                    };
                }),
            );
        },
    };

    // or
    editor.completers.push(staticWordCompleter);
    editor.resize();
    editor.focus();


    return editor;
};
