CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

// todo: merge serverops and opdocs.js ....

CABLES.UI.ServerOps = function (gui, patchId, next)
{
    let ops = [];

    const self = this;

    CABLES.editorSession.addListener("op",
        function (name, data)
        {
            const lastTab = CABLES.UI.userSettings.get("editortab");
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
            // usersettings stores editortab as basename/att_example.inc
            // editAttachment demands att_example.inc plus the opname to then store
            // stuff in session
            const opBasename = data.opname.substr(data.opname.lastIndexOf(".") + 1);
            const attName = name.replace(opBasename + "/", "");
            if (name.includes("att_") && data && data.opname)
            {
                const lastTab = CABLES.UI.userSettings.get("editortab");
                this.editAttachment(data.opname, attName, false, function ()
                {
                    gui.mainTabs.activateTabByName(lastTab);
                    CABLES.UI.userSettings.set("editortab", lastTab);
                }, true);
            }
        }.bind(this),
    );

    this.load = function (cb)
    {
        const that = this;
        CABLESUILOADER.talkerAPI.send(
            "getAllProjectOps",
            { "projectId": patchId },
            (err, res) =>
            {
                if (err) console.error(err);

                ops = res;
                logStartup("Ops loaded");
                if (cb) cb(ops);
                that.loaded = true;
                incrementStartup();
            },
        );
    };

    this.showOpInstancingError = function (name, e)
    {
        // console.log('show server op error message modal');

        // gui.patch().loadingError = true;

        let msg = "<h2><span class=\"fa fa-exclamation-triangle\"></span> cablefail :/</h2>";
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
        for (let i = 0; i < ops.length; i++) if (ops[i].name == name) return true;

        return false;
    };

    this.create = function (name, cb)
    {
        CABLESUILOADER.talkerAPI.send(
            "opCreate",
            {
                "opname": name,
            },
            function (err, res)
            {
                if (err) console.error(err);

                self.load(function ()
                {
                    gui.maintabPanel.show(true);
                    self.edit(name);
                    gui.serverOps.execute(name);
                    gui.opSelect().reload();
                });
            },
        );
    };

    this.saveOpLayout = function (op)
    {
        let i = 0;
        const opObj = {
            "portsIn": [],
            "portsOut": [],
            "name": op.objName,
        };

        for (i = 0; i < op.portsIn.length; i++)
        {
            if (op.portsIn[i].uiAttribs && op.portsIn[i].uiAttribs.hideParams === true)
            {
                console.log("no hidden params in layout and doc");
                // no hidden ports in layout and documentation
                continue;
            }
            const l =
                {
                    "type": op.portsIn[i].type,
                    "name": op.portsIn[i].name
                };

            if (op.portsIn[i].uiAttribs.hidePort) continue;
            if (op.portsIn[i].uiAttribs.group) l.group = op.portsIn[i].uiAttribs.group;
            if (op.portsIn[i].type == CABLES.OP_PORT_TYPE_VALUE)
            {
                if (op.portsIn[i].uiAttribs.display == "bool") l.subType = "boolean";
                else if (op.portsIn[i].uiAttribs.type == "string") l.subType = "string";
                else if (op.portsIn[i].uiAttribs.increment == "integer") l.subType = "integer";
                else if (op.portsIn[i].uiAttribs.display == "dropdown") l.subType = "select box";
                else l.subType = "number";
            }

            if (op.portsIn[i].uiAttribs.objType) l.objType = op.portsIn[i].uiAttribs.objType;

            opObj.portsIn.push(l);
        }

        for (i = 0; i < op.portsOut.length; i++)
        {
            const l = {
                "type": op.portsOut[i].type,
                "name": op.portsOut[i].name,
            };

            if (op.portsOut[i].uiAttribs.hidePort) continue;
            if (op.portsOut[i].type == CABLES.OP_PORT_TYPE_VALUE)
            {
                if (op.portsOut[i].uiAttribs.display == "bool") l.subType = "boolean";
                else if (op.portsOut[i].uiAttribs.type == "string") l.subType = "string";
                else if (op.portsOut[i].uiAttribs.display == "dropdown") l.subType = "dropdown";
                else if (op.portsOut[i].uiAttribs.display == "file") l.subType = "url";
                else l.subType = "number";
            }

            if (op.portsOut[i].uiAttribs.objType) l.objType = op.portsOut[i].uiAttribs.objType;
            opObj.portsOut.push(l);
        }

        CABLESUILOADER.talkerAPI.send(
            "opSaveLayout",
            {
                "opname": op.objName,
                "layout": opObj,
            },
            function (err, res)
            {
                if (err) console.error(err);
            },
        );
    };

    this.execute = function (name, next)
    {
        if (gui.corePatch()._crashedOps.indexOf(name) > -1)
        {
            let html = "";
            html += "<h1>can not execute op</h1>";
            html += "this op crashed before, you should reload the page.<br/><br/>";
            html += "<a class=\"button fa fa-refresh\" onclick=\"CABLES.CMD.PATCH.reload();\">reload patch</a>&nbsp;&nbsp;";

            CABLES.UI.MODAL.show(html, { "title": "need to reload page" });

            return;
        }

        CABLES.UI.MODAL.showLoading("executing...");
        const s = document.createElement("script");
        s.setAttribute("src", CABLESUILOADER.builtVersionUrl("core", CABLES.sandbox.getCablesUrl() + "/api/op/" + name));
        s.onload = function ()
        {
            gui.corePatch().reloadOp(
                name,
                function (num, newOps)
                {
                    CABLES.UI.notify(num + " ops reloaded");

                    for (let i = 0; i < newOps.length; i++)
                    {
                        delete newOps[i].uiAttribs.uierrors;
                    }

                    if (newOps.length > 0) this.saveOpLayout(newOps[0]);
                    if (next)next();
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
                "opname": oldname,
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
        CABLESUILOADER.talkerAPI.send(
            "opAddLib",
            {
                "opname": opName,
                "name": libName,
            },
            function (err, res)
            {
                console.log("lib added!");
                gui.reloadDocs(function ()
                {
                    console.log("docs reloaded");
                    gui.metaTabs.activateTabByName("code");
                    let html = "";
                    html += "to initialize the new library, you should reload the patch.<br/><br/>";
                    html += "<a class=\"button fa fa-refresh\" onclick=\"CABLES.CMD.PATCH.reload();\">reload patch</a>&nbsp;&nbsp;";

                    CABLES.UI.MODAL.show(html, {
                        "title": "new library added",
                    });
                });
            },
        );
    };

    this.removeOpLib = function (opName, libName)
    {
        if (confirm("really remove library '" + libName + "' from op?"))
        {
            CABLESUILOADER.talkerAPI.send(
                "opRemoveLib",
                {
                    "opname": opName,
                    "name": libName,
                },
                function (err, res)
                {
                    if (err)
                    {
                        CABLES.UI.MODAL.showError("ERROR", "unable to remove library: " + err.msg);
                    }
                    else
                    {
                        gui.reloadDocs(function ()
                        {
                            gui.metaTabs.activateTabByName("code");
                            let html = "";
                            html += "to re-initialize after removing the library, you should reload the patch.<br/><br/>";
                            html += "<a class=\"button fa fa-refresh\" onclick=\"CABLES.CMD.PATCH.reload();\">reload patch</a>&nbsp;&nbsp;";

                            CABLES.UI.MODAL.show(html, {
                                "title": "library removed",
                            });
                        });
                    }
                },
            );
        }
    };

    this.addCoreLib = function (opName, libName)
    {
        CABLESUILOADER.talkerAPI.send(
            "opAddCoreLib",
            {
                "opname": opName,
                "name": libName,
            },
            function (err, res)
            {
                gui.reloadDocs(function ()
                {
                    gui.metaTabs.activateTabByName("code");
                    let html = "";
                    html += "to initialize the new library, you should reload the patch.<br/><br/>";
                    html += "<a class=\"button fa fa-refresh\" onclick=\"CABLES.CMD.PATCH.reload();\">reload patch</a>&nbsp;&nbsp;";

                    CABLES.UI.MODAL.show(html, {
                        "title": "new library added",
                    });
                });
            },
        );
    };

    this.removeCoreLib = function (opName, libName)
    {
        if (confirm("really remove corelib '" + libName + "' from op?"))
        {
            CABLESUILOADER.talkerAPI.send(
                "opRemoveCoreLib",
                {
                    "opname": opName,
                    "name": libName,
                },
                function (err, res)
                {
                    if (err)
                    {
                        CABLES.UI.MODAL.showError("ERROR", "unable to remove corelib: " + err.msg);
                    }
                    else
                    {
                        gui.reloadDocs(function ()
                        {
                            gui.metaTabs.activateTabByName("code");
                            let html = "";
                            html += "to re-initialize after removing the library, you should reload the patch.<br/><br/>";
                            html += "<a class=\"button fa fa-refresh\" onclick=\"CABLES.CMD.PATCH.reload();\">reload patch</a>&nbsp;&nbsp;";

                            CABLES.UI.MODAL.show(html, {
                                "title": "corelib removed",
                            });
                        });
                    }
                },
            );
        }
    };

    this.deleteAttachment = function (opName, attName)
    {
        if (confirm("really ?"))
        {
            CABLESUILOADER.talkerAPI.send(
                "opAttachmentDelete",
                {
                    "opname": opName,
                    "name": attName,
                },
                function (err, res)
                {
                    if (err)
                    {
                        CABLES.UI.MODAL.showError("ERROR", "unable to remove attachment: " + err.msg);
                    }
                    else
                    {
                        gui.metaTabs.activateTabByName("code");
                    }
                },
            );
        }
    };

    this.addAttachmentDialog = function (opname)
    {
        const attName = prompt("Attachment name");

        CABLESUILOADER.talkerAPI.send(
            "opAttachmentAdd",
            {
                opname,
                "name": attName,
            },
            function (err, res)
            {
                gui.metaTabs.activateTabByName("code");
            },
        );
    };

    this.opNameDialog = function (title, name, cb)
    {
        let newName = name || "";
        if (name && name.indexOf("Ops.") === 0) newName = name.substr(4, name.length);

        const usernamespace = "Ops.User." + gui.user.usernameLowercase;

        let html = "<h2>" + title + "</h2>";
        html += "Your op will be private. Only you can see and use it.<br/><br/>";
        html += "Enter a name:<br/><br/>";
        html += "<div class=\"clone\"><span>" + usernamespace + ".&nbsp;&nbsp;</span><input type=\"text\" id=\"opNameDialogInput\" value=\"" + newName + "\" placeholder=\"MyAwesomeOpName\"/></div></div>";
        html += "<br/>";
        html += "<br/><br/>";
        html += "<div id=\"opcreateerrors\"></div>";
        html += "<a id=\"opNameDialogSubmit\" class=\"bluebutton fa fa-clone\">create</a>";
        html += "<br/><br/>";

        CABLES.UI.MODAL.show(html);

        document.getElementById("opNameDialogInput").focus();
        document.getElementById("opNameDialogInput").addEventListener("input", function ()
        {
            const v = document.getElementById("opNameDialogInput").value;
            console.log("INPUT!", v);
            CABLES.api.get("op/checkname/" + usernamespace + "." + v, function (res)
            {
                console.log(res);
                if (res.problems.length > 0)
                {
                    let htmlIssue = "<b>your op name has issues:</b><br/><ul>";
                    for (let i = 0; i < res.problems.length; i++) htmlIssue += "<li>" + res.problems[i] + "</li>";
                    htmlIssue += "</ul><br/><br/>";
                    document.getElementById("opcreateerrors").innerHTML = htmlIssue;
                    document.getElementById("opNameDialogSubmit").style.display = "none";
                }
                else
                {
                    document.getElementById("opcreateerrors").innerHTML = "";
                    document.getElementById("opNameDialogSubmit").style.display = "block";
                }
            });
        });

        document.getElementById("opNameDialogSubmit").addEventListener("click", function (event)
        {
            if (document.getElementById("opNameDialogInput").value == "")
            {
                alert("please enter a name for your op!");
                return;
            }
            cb(document.getElementById("opNameDialogInput").value);
        });
    };

    this.createDialog = function (name)
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
        if (gui.showGuestWarning()) return;

        this.opNameDialog("Clone operator", name, function (newname)
        {
            const opname = "Ops.User." + gui.user.usernameLowercase + "." + newname;
            gui.serverOps.clone(oldName, opname);
            // gui.opSelect().reload();
            // gui.serverOps.execute(opname);
        });
    };

    this.editAttachment = function (opname, attachmentName, readOnly, cb, fromListener = false)
    {
        const parts = opname.split(".");
        const shortname = parts[parts.length - 1];
        const title = shortname + "/" + attachmentName;

        let editorObj = null;
        CABLES.api.clearCache();

        gui.jobs().start({ "id": "load_attachment_" + attachmentName, "title": "loading attachment " + attachmentName });

        CABLESUILOADER.talkerAPI.send(
            "opAttachmentGet",
            {
                opname,
                "name": attachmentName,
            },
            function (err, res)
            {
                gui.jobs().finish("load_attachment_" + attachmentName);

                editorObj = CABLES.editorSession.rememberOpenEditor("attachment", title, { opname }, true);

                if (err || !res || res.content == undefined)
                {
                    if (err)console.log("[opattachmentget] err", err);
                    if (editorObj) CABLES.editorSession.remove(editorObj.name, editorObj.type);
                    return;
                }
                const content = res.content || "";
                let syntax = "text";

                if (attachmentName.endsWith(".frag")) syntax = "glsl";
                if (attachmentName.endsWith(".vert")) syntax = "glsl";
                if (attachmentName.endsWith(".json")) syntax = "json";
                if (attachmentName.endsWith(".js")) syntax = "js";
                if (attachmentName.endsWith(".css")) syntax = "css";


                if (editorObj)
                {
                    const lastTab = CABLES.UI.userSettings.get("editortab");
                    let inactive = false;
                    if (fromListener)
                    {
                        if (lastTab !== title)
                        {
                            inactive = true;
                        }
                    }

                    new CABLES.UI.EditorTab({
                        "title": title,
                        "name": editorObj.name,
                        content,
                        syntax,
                        editorObj,
                        "allowEdit": self.canEditAttachment(gui.user, opname),
                        "inactive": inactive,
                        onClose(which)
                        {
                            console.log("close!!! missing infos...");
                            if (which.editorObj && which.editorObj.name) CABLES.editorSession.remove(which.editorObj.name, which.editorObj.type);
                        },
                        onSave(_setStatus, _content)
                        {
                            CABLESUILOADER.talkerAPI.send(
                                "opAttachmentSave",
                                {
                                    opname,
                                    "name": attachmentName,
                                    "content": _content,
                                },
                                function (errr, re)
                                {
                                    if (errr)
                                    {
                                        CABLES.UI.notifyError("error: op not saved");
                                        // _setStatus('ERROR: not saved - '+res.msg);
                                        console.warn("[opAttachmentSave]", errr);
                                        return;
                                    }

                                    _setStatus("saved");
                                    gui.serverOps.execute(opname);
                                },
                            );
                        },
                    });
                }


                if (cb) cb();
                else gui.maintabPanel.show();
            },
            (err) =>
            {
                gui.jobs().finish("load_attachment_" + attachmentName);
                console.error("error opening attachment " + attachmentName);
                console.log(err);
                if (editorObj) CABLES.editorSession.remove(editorObj.name, editorObj.type);
            }
        );

        if (!editorObj)
        {
            gui.mainTabs.activateTabByName(title);
        }
    };

    // Shows the editor and displays the code of an op in it
    this.edit = function (opname, readOnly, cb)
    {
        if (gui.isGuestEditor())
        {
            CABLES.UI.MODAL.showError("Demo Editor", CABLES.UI.TEXTS.guestHint);
            return;
        }

        if (!opname || opname == "")
        {
            console.log("UNKNOWN OPNAME ", opname);
            return;
        }

        gui.jobs().start({ "id": "load_opcode_" + opname, "title": "loading op code " + opname });

        CABLESUILOADER.talkerAPI.send(
            "getOpCode",
            {
                opname,
                "projectId": patchId
            },
            function (er, rslt)
            {
                const editorObj = CABLES.editorSession.rememberOpenEditor("op", opname);
                gui.jobs().finish("load_opcode_" + opname);

                // var html = '';
                // if (!readOnly) html += '<a class="button" onclick="gui.serverOps.execute(\'' + opname + '\');">execute</a>';

                let save = null;
                if (!readOnly)
                {
                    save = function (setStatus, content, editor)
                    {
                        CABLESUILOADER.talkerAPI.send(
                            "saveOpCode",
                            {
                                opname,
                                "code": content,
                            },
                            function (err, res)
                            {
                                if (!res || !res.success)
                                {
                                    if (res.error && res.error.line != undefined) setStatus("Error: Line " + res.error.line + " : " + res.error.message, true);
                                    else setStatus("Error: " + err.msg || "Unknown error");
                                }
                                else
                                {
                                    if (!CABLES.Patch.getOpClass(opname))
                                        gui.opSelect().reload();

                                    // exec ???
                                    gui.serverOps.execute(opname, function ()
                                    {
                                        setStatus("saved " + opname);
                                        editor.focus();

                                        setTimeout(() => { gui.opParams.refresh(); }, 100);
                                    });
                                }
                            },
                            function (result)
                            {
                                setStatus("ERROR: not saved - " + result.msg);
                                console.log("err result", result);
                            },
                        );
                    };
                }

                const parts = opname.split(".");
                const title = "Op " + parts[parts.length - 1];

                if (editorObj)
                {
                    const t = new CABLES.UI.EditorTab({
                        title,
                        "name": editorObj.name,
                        "content": rslt.code,
                        "singleton": true,
                        "syntax": "js",
                        "allowEdit": self.canEditOp(gui.user, editorObj.name),
                        "onSave": save,
                        editorObj,
                        onClose(which)
                        {
                            if (which.editorObj) CABLES.editorSession.remove(which.editorObj.name, which.editorObj.type);
                        },
                    });
                }
                else
                {
                    gui.mainTabs.activateTabByName(opname);
                }


                if (cb) cb();
            },
        );
    };

    this._loadedLibs = [];
    this._loadedCoreLibs = [];

    this.getOpLibs = function (opname, checkLoaded)
    {
        for (let i = 0; i < ops.length; i++)
        {
            if (ops[i].name == opname)
            {
                if (ops[i].libs)
                {
                    const libs = [];
                    for (let j = 0; j < ops[i].libs.length; j++)
                    {
                        const libName = ops[i].libs[j];
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

    this.getCoreLibs = function (opname, checkLoaded)
    {
        for (let i = 0; i < ops.length; i++)
        {
            if (ops[i].name == opname)
            {
                if (ops[i].coreLibs)
                {
                    const coreLibs = [];
                    for (let j = 0; j < ops[i].coreLibs.length; j++)
                    {
                        const libName = ops[i].coreLibs[j];
                        if (!checkLoaded)
                        {
                            coreLibs.push(libName);
                        }
                        else if (this._loadedCoreLibs.indexOf(libName) == -1)
                        {
                            coreLibs.push(libName);
                        }
                    }
                    return coreLibs;
                }
            }
        }
        return [];
    };

    this.loadProjectLibs = function (proj, _next)
    {
        let libsToLoad = [];
        let coreLibsToLoad = [];

        for (let i = 0; i < proj.ops.length; i++)
        {
            if (proj.ops[i])
            {
                // if (this.getOpLibs(proj.ops[i].objName).length) console.log("op with libs:", proj.ops[i].objName, this.getOpLibs(proj.ops[i].objName));

                libsToLoad = libsToLoad.concat(this.getOpLibs(proj.ops[i].objName));
                coreLibsToLoad = coreLibsToLoad.concat(this.getCoreLibs(proj.ops[i].objName));
            }
        }


        libsToLoad = CABLES.uniqueArray(libsToLoad);
        coreLibsToLoad = CABLES.uniqueArray(coreLibsToLoad);

        if (libsToLoad.length === 0 && coreLibsToLoad.length === 0)
        {
            if (_next)_next();
            return;
        }

        new CABLES.LibLoader(libsToLoad, function ()
        {
            new CABLES.CoreLibLoader(coreLibsToLoad, function ()
            {
                if (_next)_next();
            });
        });
    };

    this.isLibLoaded = function (libName)
    {
        const isloaded = this._loadedLibs.indexOf(libName) != -1;
        return isloaded;
    };

    this.opHasLibs = function (opName)
    {
        return this.getOpLibs(opName).length !== 0;
    };

    this.opLibsLoaded = function (opName)
    {
        const libsToLoad = this.getOpLibs(opName);
        for (let i = 0; i < libsToLoad.length; i++)
        {
            if (!this.isLibLoaded(libsToLoad[i])) return false;
        }
        return true;
    };

    this.loadOpLibs = function (opName, finishedCb)
    {
        function libReady()
        {
            // console.log("finished loading libs for " + opName);

            const libsToLoad = this.getOpLibs(opName);
            for (let i = 0; i < libsToLoad.length; i++)
            {
                this._loadedLibs.push(libsToLoad[i]);
            }

            finishedCb();
        }

        const libsToLoad = this.getOpLibs(opName);
        const coreLibsToLoad = this.getCoreLibs(opName);

        if (libsToLoad.length === 0 && coreLibsToLoad.length === 0)
        {
            finishedCb();
            return;
        }

        new CABLES.LibLoader(libsToLoad, function ()
        {
            new CABLES.CoreLibLoader(coreLibsToLoad, function ()
            {
                finishedCb();
            });
        });
    };

    this.loaded = false;
    this.finished = function ()
    {
        return this.loaded;
    };

    this.ownsOp = function (opname)
    {
        const usernamespace = "Ops.User." + gui.user.usernameLowercase + ".";
        if (opname.indexOf(usernamespace) == 0) return true;
        return false;
    };

    this.canEditOp = function (user, opName)
    {
        if (user.roles.includes("alwaysEditor"))
        {
            // users with "alwaysEditor" role are always allowed to edit everything
            return true;
        }
        if (opName.startsWith("Ops.User."))
        {
            if (user.isAdmin || this.ownsOp(opName))
            {
                // admins may edit any userop, users are only allowed to edit their own userops
                return true;
            }
        }
        if (user.isAdmin)
        {
            // admins are only allowed to edit everything on dev
            if (CABLES.sandbox.isDevEnv())
            {
                return true;
            }
            else
            {
                return false;
            }
        }
        return false;
    };

    this.canEditAttachment = function (user, opName)
    {
        if (user.roles.includes("alwaysEditor"))
        {
            // users with "alwaysEditor" role are always allowed to edit everything
            return true;
        }
        if (this.ownsOp(opName))
        {
            // users are only allowed to edit attachments of their own userops
            return true;
        }
        if (user.isAdmin)
        {
            // admins are only allowed to edit everything on dev
            if (CABLES.sandbox.isDevEnv())
            {
                return true;
            }
            else
            {
                return false;
            }
        }
        return false;
    };

    this.load(next);
};
