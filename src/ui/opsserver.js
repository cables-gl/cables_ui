CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

// todo: merge serverops and opdocs.js ....

CABLES.UI.ServerOps = function (gui)
{
    var ops = [];
    var self = this;

    CABLES.editorSession.addListener("op",
        function(name,data)
        {
            var lastTab = CABLES.UI.userSettings.get("editortab");
            this.edit(name, false, function ()
            {
                gui.mainTabs.activateTabByName(lastTab);
                CABLES.UI.userSettings.set("editortab", lastTab);
            });
        }.bind(this),
    );

    CABLES.editorSession.addListener(
        "attachment",
        function (name, data)
        {
            var lastTab = CABLES.UI.userSettings.get("editortab");
            if (data && data.opname)
            {
                this.editAttachment(data.opname, name, false, function ()
                {
                    gui.mainTabs.activateTabByName(lastTab);
                    CABLES.UI.userSettings.set("editortab", lastTab);
                });
            }
        }.bind(this),
    );

    this.load = function (cb)
    {
        CABLES.api.get(
            CABLESUILOADER.noCacheUrl(CABLES.sandbox.getUrlOpsList()),
            function (res)
            {
                if (res)
                {
                    ops = res;

                    logStartup("Ops loaded");

                    if (cb) cb(ops);

                    self.loaded = true;
                    incrementStartup();
                }
            },
        );
    };

    this.showOpInstancingError = function (name, e)
    {
        // console.log('show server op error message modal');

        gui.patch().loadingError = true;

        var msg = "<h2><span class=\"fa fa-exclamation-triangle\"></span> cablefail :/</h2>";
        msg += "error creating op: " + name;
        msg += "<br/><pre>" + e + "</pre><br/>";

        if (this.isServerOp(name))
        {
            msg += "<a class=\"bluebutton\" onclick=\"gui.showEditor();gui.serverOps.edit('" + name + "')\">edit op</a>";
        }
        if (gui.user.isAdmin)
        {
            msg += " <a class=\"bluebutton\" onclick=\"gui.serverOps.pullOp('" + name + "')\">try to pull</a>";
        }
        CABLES.UI.MODAL.show(msg);
    };

    this.isServerOp = function (name)
    {
        for (var i = 0; i < ops.length; i++) if (ops[i].name == name) return true;

        return false;
    };

    this.create = function (name, cb)
    {
        CABLESUILOADER.talkerAPI.send(
            "opCreate",
            {
                opname: name,
            },
            function (err, res)
            {
                if (err) console.err(err);

                self.load(function ()
                {
                    gui.showFileManager();
                    self.edit(name);
                    gui.serverOps.execute(name);
                    gui.opSelect().reload();
                });
            },
        );
    };

    this.saveOpLayout = function (op)
    {
        var i = 0;
        var opObj = {
            portsIn: [],
            portsOut: [],
            name: op.objName,
        };

        for (i = 0; i < op.portsIn.length; i++)
        {
            var l=
                {
                    "type": op.portsIn[i].type,
                    "name": op.portsIn[i].name
                };


            if (op.portsIn[i].uiAttribs.group) l.group = op.portsIn[i].uiAttribs.group;

            if (op.portsIn[i].type == CABLES.OP_PORT_TYPE_VALUE)
            {
                if (op.portsIn[i].uiAttribs.display == "bool") l.subType = "boolean";
                else if (op.portsIn[i].uiAttribs.type == "string") l.subType = "string";
                else if (op.portsIn[i].uiAttribs.increment == "integer") l.subType = "integer";
                else if (op.portsIn[i].uiAttribs.display == "dropdown") l.subType = "select box";
                else l.subType = "number";
            }

            opObj.portsIn.push(l);
        }

        for (i = 0; i < op.portsOut.length; i++)
        {
            var l = {
                type: op.portsOut[i].type,
                name: op.portsOut[i].name,
            };

            if (op.portsOut[i].type == CABLES.OP_PORT_TYPE_VALUE)
            {
                if (op.portsOut[i].uiAttribs.display == "bool") l.subType = "boolean";
                else if (op.portsOut[i].uiAttribs.type == "string") l.subType = "string";
                else if (op.portsOut[i].uiAttribs.display == "dropdown") l.subType = "dropdown";
                else if (op.portsOut[i].uiAttribs.display == "file") l.subType = "url";
                else l.subType = "number";
            }

            opObj.portsOut.push(l);
        }

        CABLESUILOADER.talkerAPI.send(
            "opSaveLayout",
            {
                opname: op.objName,
                layout: opObj,
            },
            function (err, res)
            {
                if (err) console.err(err);
            },
        );
    };

    this.execute = function (name,next)
    {
        if (gui.patch().scene._crashedOps.indexOf(name) > -1)
        {
            html = "";
            html += "<h1>can not execute op</h1>";
            html += "this op crashed before, you should reload the page.<br/><br/>";
            html += "<a class=\"button fa fa-refresh\" onclick=\"CABLES.CMD.PATCH.reload();\">reload patch</a>&nbsp;&nbsp;";

            CABLES.UI.MODAL.show(html, {
                title: "need to reload page",
            });

            return;
        }

        CABLES.UI.MODAL.showLoading("executing...");
        var s = document.createElement("script");
        s.setAttribute("src", CABLESUILOADER.noCacheUrl(CABLES.sandbox.getCablesUrl() + "/api/op/" + name));
        s.onload = function ()
        {
            gui.patch().scene.reloadOp(
                name,
                function (num, ops)
                {
                    CABLES.UI.notify(num + " ops reloaded");

                    for (var i = 0; i < ops.length; i++) gui.patch().opCollisionTest(gui.patch().getUiOp(ops[i]));


                    if (ops.length > 0) this.saveOpLayout(ops[0]);
                    gui.patch().checkCollisionsEdge();
                    if(next)next();
                }.bind(this),
            );

            CABLES.UI.MODAL.hideLoading();
        }.bind(this);
        document.body.appendChild(s);
    };

    this.clone = function (oldname, name)
    {
        console.log("clone", name, oldname);

        CABLESUILOADER.talkerAPI.send(
            "opClone",
            {
                opname: oldname,
                name,
            },
            (err, res) =>
            {
                if (err)
                {
                    console.log("err res", res);
                    CABLES.UI.MODAL.showError("could not clone op", "");
                    return;
                }
                this.load(() =>
                {
                    this.edit(name);
                    gui.serverOps.execute(name);
                    gui.opSelect().reload();
                });
            },
        );
    };

    this.addOpLib = function (opName, libName)
    {
        console.log("opaddlib");
        CABLESUILOADER.talkerAPI.send(
            "opAddLib",
            {
                opname: opName,
                name: libName,
            },
            function (err, res)
            {
                console.log("lib added!");
                gui.reloadDocs(function ()
                {
                    console.log("docs reloaded");
                    gui.metaTabs.activateTabByName("code");
                });
            },
        );
    };

    this.deleteAttachment = function (opName, attName)
    {
        if (confirm("really ?"))
        {
            CABLESUILOADER.talkerAPI.send(
                "opAttachmentDelete",
                {
                    opname: opName,
                    name: attName,
                },
                function (err, res)
                {
                    gui.metaTabs.activateTabByName("code");
                },
            );
        }
    };

    this.addAttachmentDialog = function (opname)
    {
        var attName = prompt("Attachment name");

        CABLESUILOADER.talkerAPI.send(
            "opAttachmentAdd",
            {
                opname,
                name: attName,
            },
            function (err, res)
            {
                gui.metaTabs.activateTabByName("code");
            },
        );
    };

    this.opNameDialog = function (title, name, cb)
    {
        var newName = name;
        if (name.indexOf("Ops.") === 0) newName = name.substr(4, name.length);

        var usernamespace = "Ops.User." + gui.user.usernameLowercase;

        var html = "<h2>" + title + "</h2>";
        html += "Your op will be private. Only you can see and use it.<br/><br/>";
        html += "Enter a name:<br/><br/>";
        html += "<div class=\"clone\"><span>" + usernamespace + ".&nbsp;&nbsp;</span><input type=\"text\" id=\"opNameDialogInput\" value=\"" + newName + "\" placeholder=\"MyAwesomeOpName\"/></div></div>";
        html += "<br/>";
        html += "<br/><br/>";
        html += "<div id=\"opcreateerrors\"></div>";
        html += "<a id=\"opNameDialogSubmit\" class=\"bluebutton fa fa-clone\">create</a>";
        html += "<br/><br/>";

        CABLES.UI.MODAL.show(html);

        $("#opNameDialogInput").focus();
        $("#opNameDialogInput").bind("input", function ()
        {
            var v = $("#opNameDialogInput").val();
            console.log("INPUT!", v);
            CABLES.api.get("op/checkname/" + usernamespace + "." + v, function (res)
            {
                console.log(res);
                if (res.problems.length > 0)
                {
                    var html = "<b>your op name has issues:</b><br/><ul>";
                    for (var i = 0; i < res.problems.length; i++) html += "<li>" + res.problems[i] + "</li>";
                    html += "</ul><br/><br/>";
                    $("#opcreateerrors").html(html);
                    $("#opNameDialogSubmit").hide();
                }
                else
                {
                    $("#opcreateerrors").html("");
                    $("#opNameDialogSubmit").show();
                }
            });
        });

        $("#opNameDialogSubmit").bind("click", function (event)
        {
            if ($("#opNameDialogInput").val() == "")
            {
                alert("please enter a name for your op!");
                return;
            }
            cb($("#opNameDialogInput").val());
        });
    };

    this.createDialog = function ()
    {
        this.opNameDialog("Create operator", name, function (newname)
        {
            self.create("Ops.User." + gui.user.usernameLowercase + "." + newname, function ()
            {
                CABLES.UI.MODAL.hide();
            });
        });
    };

    this.cloneDialog = function (oldName)
    {
        this.opNameDialog("Clone operator", name, function (newname)
        {
            const opname = "Ops.User." + gui.user.usernameLowercase + "." + newname;
            gui.serverOps.clone(oldName, opname);
            gui.opSelect().reload();
            gui.serverOps.execute(opname);
        });
    };

    this.editAttachment = function (opname, attachmentName, readOnly, cb)
    {
        var editorObj = CABLES.editorSession.rememberOpenEditor("attachment", attachmentName, { opname });
        CABLES.api.clearCache();

        gui.jobs().start({ id: "load_attachment_" + attachmentName, title: "loading attachment " + attachmentName });

        CABLESUILOADER.talkerAPI.send(
            "opAttachmentGet",
            {
                opname,
                name: attachmentName,
            },
            function (err, res)
            {
                if(err || !res || res.content==undefined)
                {
                    if(err)console.log('[opattachmentget] err',err);
                    if (editorObj) CABLES.editorSession.remove(editorObj.name, editorObj.type);
                    return;
                }
                var content = res.content || "";
                var syntax = "text";

                if (attachmentName.endsWith(".frag")) syntax = "glsl";
                if (attachmentName.endsWith(".vert")) syntax = "glsl";
                if (attachmentName.endsWith(".json")) syntax = "json";
                if (attachmentName.endsWith(".css")) syntax = "css";

                gui.jobs().finish("load_attachment_" + attachmentName);

                if (editorObj)
                {
                    new CABLES.UI.EditorTab({
                        title: attachmentName,
                        name: editorObj.name,
                        content,
                        syntax,
                        editorObj,
                        onClose(which)
                        {
                            console.log("close!!! missing infos...");
                            if (which.editorObj && which.editorObj.name) CABLES.editorSession.remove(which.editorObj.name, which.editorObj.type);
                        },
                        onSave(setStatus, content)
                        {
                            CABLESUILOADER.talkerAPI.send(
                                "opAttachmentSave",
                                {
                                    opname,
                                    name: attachmentName,
                                    content,
                                },
                                function (err, res)
                                {
                                    if (err)
                                    {
                                        CABLES.UI.notifyError("error: op not saved");
                                        // setStatus('ERROR: not saved - '+res.msg);
                                        console.warn("[opAttachmentSave]", err);
                                        return;
                                    }

                                    setStatus("saved");
                                    gui.serverOps.execute(opname);
                                },
                            );
                        },
                    });
                }

                if (cb) cb();
                else gui.maintabPanel.show();
                // gui.showEditor();
                // gui.editor().addTab({
                //     content: content,
                //     title: attachmentName,
                //     syntax: syntax,
                //     id:CABLES.Editor.sanitizeId('editattach_'+opname+attachmentName),
                //     editorObj: editorObj,
                //     toolbarHtml: toolbarHtml,
                //     onSave: function(setStatus, content) {
                //         CABLES.api.post(
                //             'op/' + opname + '/attachment/' + attachmentName, {
                //                 content: content
                //             },
                //             function(res) {
                //                 setStatus('saved');
                //                 gui.serverOps.execute( opname );
                //             },
                //             function(res) {
                //                 setStatus('ERROR: not saved - '+res.msg);
                //                 console.log('err res', res);
                //             }
                //         );
                //     },
                //     onClose: function(which) {
                //         if(which.editorObj && which.editorObj.name)
                //             CABLES.editorSession.remove(which.editorObj.name,which.editorObj.type);
                //     },

                // });
            },
            function (err)
            {
                gui.jobs().finish("load_attachment_" + attachmentName);
                console.error("error opening attachment " + attachmentName);
                console.log(err);
                if (editorObj) CABLES.editorSession.remove(editorObj.name, editorObj.type);
            },
        );
    };

    // Shows the editor and displays the code of an op in it
    this.edit = function (opname, readOnly, cb)
    {
        if (!opname || opname == "")
        {
            console.log("UNKNOWN OPNAME ", opname);
            return;
        }

        gui.jobs().start({ id: "load_opcode_" + opname, title: "loading op code " + opname });

        CABLESUILOADER.talkerAPI.send(
            "getOpCode",
            {
                opname,
            },
            function (err, res)
            {
                var editorObj = CABLES.editorSession.rememberOpenEditor("op", opname);
                gui.jobs().finish("load_opcode_" + opname);

                // var html = '';
                // if (!readOnly) html += '<a class="button" onclick="gui.serverOps.execute(\'' + opname + '\');">execute</a>';

                var save = null;
                if (!readOnly)
                {
                    save = function (setStatus, content,editor)
                    {
                        CABLESUILOADER.talkerAPI.send(
                            "saveOpCode",
                            {
                                opname,
                                code: content,
                            },
                            function (err, res)
                            {
                                if (!res.success)
                                {
                                    if (res.error && res.error.line != undefined) setStatus("Error: Line " + res.error.line + " : " + res.error.message, true);
                                    else setStatus("Error: " + err.msg || "Unknown error");
                                }
                                else
                                {
                                    if (!CABLES.Patch.getOpClass(opname))
                                    {
                                        gui.opSelect().reload();
                                    }

                                    // exec ???
                                    gui.serverOps.execute(opname,function()
                                    {
                                        setStatus("saved " + opname);
                                        editor.focus();
                                    });

                                }
                            // console.log('res', res);
                            },
                            function (res)
                            {
                                setStatus("ERROR: not saved - " + res.msg);
                                console.log("err res", res);
                            },
                        );
                    };
                }

                var parts = opname.split(".");
                var title = "Op " + parts[parts.length - 1];

                if (editorObj)
                {
                    new CABLES.UI.EditorTab({
                        title,
                        name: editorObj.name,
                        content: res.code,
                        singleton: true,
                        syntax: "js",
                        onSave: save,
                        editorObj,
                        onClose(which)
                        {
                            if (which.editorObj) CABLES.editorSession.remove(which.editorObj.name, which.editorObj.type);
                        },
                    });
                }
                else
                {
                    console.log("no editorobj!");
                    gui.mainTabs.activateTabByName(opname);
                }

                if (cb) cb();
            },
        );
    };

    this._loadedLibs = [];

    this.getOpLibs = function (opname, checkLoaded)
    {
        for (var i = 0; i < ops.length; i++)
        {
            if (ops[i].name == opname)
            {
                if (ops[i].libs)
                {
                    var libs = [];
                    for (var j = 0; j < ops[i].libs.length; j++)
                    {
                        var libName = ops[i].libs[j];
                        if (!checkLoaded)
                        {
                            libs.push(libName);
                        }
                        else if (this._loadedLibs.indexOf(libName) == -1)
                        {
                            libs.push(libName);
                        }
                    }

                    return libs;
                }
            }
        }
        return [];
    };

    this.loadProjectLibs = function (proj, next)
    {
        var libsToLoad = [];
        var i = 0;

        for (i = 0; i < proj.ops.length; i++)
        {
            libsToLoad = libsToLoad.concat(this.getOpLibs(proj.ops[i].objName));
        }

        libsToLoad = CABLES.uniqueArray(libsToLoad);

        if (libsToLoad.length === 0)
        {
            next();
            return;
        }

        var loader = new CABLES.libLoader(libsToLoad, function ()
        {
            next();
        });

        // var id = CABLES.generateUUID();
        // loadjs(libsToLoad, 'oplibs' + id);

        // loadjs.ready('oplibs' + id, function() {
        //     for (var i = 0; i < libsToLoad.length; i++) {
        //         this._loadedLibs.push(libsToLoad[i]);

        //         console.log('loaded libs...', this._loadedLibs);

        //     }

        //     // console.log(this._loadedLibs);
        //     next();
        // }.bind(this));
    };

    this.isLibLoaded = function (libName)
    {
        // console.log(this._loadedLibs);
        var isloaded = this._loadedLibs.indexOf(libName) != -1;
        // console.log(libName,isloaded);
        return isloaded;
    };

    this.opHasLibs = function (opName)
    {
        return this.getOpLibs(opName).length !== 0;
    };

    this.opLibsLoaded = function (opName)
    {
        var libsToLoad = this.getOpLibs(opName);
        for (var i = 0; i < libsToLoad.length; i++)
        {
            if (!this.isLibLoaded(libsToLoad[i])) return false;
        }
        return true;
    };

    this.loadOpLibs = function (opName, next)
    {
        function libReady()
        {
            console.log("finished loading libs for " + opName);

            var libsToLoad = this.getOpLibs(opName);
            for (var i = 0; i < libsToLoad.length; i++)
            {
                this._loadedLibs.push(libsToLoad[i]);
            }

            next();
        }

        var libsToLoad = this.getOpLibs(opName);

        if (libsToLoad.length === 0)
        {
            next();
            return;
        }

        var loader = new CABLES.libLoader(libsToLoad, function ()
        {
            next();
        });
        // if (!this.isLibLoaded(libsToLoad[0])) {
        //     var lid = 'oplibs' + libsToLoad[0];

        //     try {
        //         loadjs.ready(lid, libReady.bind(this));
        //         loadjs(libsToLoad, lid);
        //     } catch (e) {
        //         console.log('...', e);
        //     }

        // } else {
        //     next();
        // }
    };

    this.loaded = false;
    this.finished = function ()
    {
        return this.loaded;
    };

    this.load();
};
