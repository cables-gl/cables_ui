CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};


// todo: merge serverops and opdocs.js ....

CABLES.UI.ServerOps = function(gui) {
    var ops = [];
    var self = this;
    

    CABLES.editorSession.addListener("op",
        function(name,data)
        {
            // console.log('editor open for op',name,data);
            this.edit(name);
        }.bind(this));

    CABLES.editorSession.addListener("attachment",
        function(name,data)
        {
            // console.log('editor open for editAttachment',name,data);
            if(data && data.opname) this.editAttachment(data.opname, name);
        }.bind(this));


    this.load = function(cb) {
        CABLES.api.get(CABLES.noCacheUrl(CABLES.sandbox.getUrlOpsList()), function(res) {
            if (res) {
                ops = res;

                logStartup('Ops loaded');

                if (cb) cb(ops);

                self.loaded = true;
                incrementStartup();


            }
        }.bind(this));
    };

    this.showOpInstancingError = function(name, e) {
        // console.log('show server op error message modal');

        gui.patch().loadingError = true;

        var msg = '<h2><span class="fa fa-exclamation-triangle"></span> cablefail :/</h2>';
        msg += 'error creating op: ' + name;
        msg += '<br/><pre>' + e + '</pre><br/>';

        if (this.isServerOp(name)) {
            msg += '<a class="bluebutton" onclick="gui.showEditor();gui.serverOps.edit(\'' + name + '\')">edit op</a>';
        }
        if (gui.user.isAdmin) {
            msg += ' <a class="bluebutton" onclick="gui.serverOps.pullOp(\'' + name + '\')">try to pull</a>';
        }
        CABLES.UI.MODAL.show(msg);

    };

    this.isServerOp = function(name) {
        for (var i = 0; i < ops.length; i++) {
            if (ops[i].name == name) {
                return true;
            }
        }

        return false;
    };

    this.create = function(name, cb) {
        CABLES.api.get(
            'ops/create/' + name,
            function(res) {
                self.load(
                    function() {
                        console.log('now edit...');
                        self.edit(name);
                    });
            },
            function(res) {
                console.log('err res', res);

            }
        );
    };

    this.saveOpLayout = function(op) {
        var i = 0;
        var opObj = {
            portsIn: [],
            portsOut: [],
            name: op.objName
        };

        for (i = 0; i < op.portsIn.length; i++)
        {
            var l=
                {
                    "type": op.portsIn[i].type,
                    "name": op.portsIn[i].name
                };
            
            if(op.portsIn[i].type==CABLES.OP_PORT_TYPE_VALUE)
            {
                if(op.portsIn[i].uiAttribs.display=='bool')l.subType="boolean";
                else if(op.portsIn[i].uiAttribs.type=='string')l.subType="string";
                else if(op.portsIn[i].uiAttribs.increment=='integer')l.subType="integer";
                else if(op.portsIn[i].uiAttribs.display=='dropdown')l.subType="select box";
                else l.subType="number";
            }

            opObj.portsIn.push(l);
        }
        for (i = 0; i < op.portsOut.length; i++) {
            var l={
                "type": op.portsOut[i].type,
                "name": op.portsOut[i].name
            }
            
            if(op.portsOut[i].type==CABLES.OP_PORT_TYPE_VALUE)
            {
                if(op.portsOut[i].uiAttribs.display=='bool')l.subType="boolean";
                else if(op.portsOut[i].uiAttribs.type=='string')l.subType="string";
                else l.subType="number";
            }

            opObj.portsOut.push(l);

        }

        CABLES.api.post('op/layout/' + op.objName, {
            layout: opObj
        });
    };

    this.execute = function(name) {
        // console.log('exe',name);
        if(gui.patch().scene._crashedOps.indexOf(name)>-1)
        {
            html='';
            html+='<h1>can not execute op</h1>';
            html+='this op crashed before, you should reload the page.<br/><br/>';
            html+='<a class="button fa fa-refresh" onclick="document.location.reload();">reload patch</a>&nbsp;&nbsp;';

            CABLES.UI.MODAL.show(html, {
                title: 'need to reload page'
            });

            return;
        }

        CABLES.UI.MODAL.showLoading('executing...');
        var s = document.createElement('script');
        s.setAttribute('src', CABLES.noCacheUrl('/api/op/' + name));
        s.onload = function() {
            gui.patch().scene.reloadOp(name, function(num, ops) {
                CABLES.UI.notify(num + ' ops reloaded');
                if (ops.length > 0) this.saveOpLayout(ops[0]);
                gui.editor().focus();
            }.bind(this));

            CABLES.UI.MODAL.hideLoading();
        }.bind(this);
        document.body.appendChild(s);
    };

    this.clone = function(oldname, name) {

        console.log('clone', name, oldname);
        CABLES.api.get(
            'ops/clone/' + oldname + '/' + name,
            function(res) {
                self.load(
                    function() {
                        console.log('now edit...');
                        self.edit(name);
                    });
            },
            function(res) {
                console.log('err res', res);
                CABLES.UI.MODAL.showError('op name invalid', '');
            }
        );
    };


    this.addOpLib = function(opName, libName) {

        CABLES.api.put(
            'op/' + opName + '/libs/' + libName,
            function(res) {
                console.log(res);
            });

    };

    this.deleteAttachment = function(opName, attName) {
        if (confirm("really ?")) {
            CABLES.api.delete(
                'op/' + opName + '/attachments/' + attName, {},
                function(res) {
                    gui.showMetaCode();
                    console.log(res);
                });
        }
    };

    this.addAttachmentDialog = function(name) {
        var attName = prompt('Attachment name');

        CABLES.api.post(
            'op/' + name + '/attachments/' + attName, {},
            function(res) {
                console.log(name, attName);
                gui.showMetaCode();
            }
        );
    };

    this.opNameDialog = function(title, name, cb) {
        var newName = name;
        if (name.indexOf('Ops.') === 0) newName = name.substr(4, name.length);

        var html = '<h2>' + title + '</h2>';
        html += '<div class="clone"><span>Ops.User.' + gui.user.usernameLowercase + '.&nbsp;&nbsp;</span><input type="text" id="opNameDialogInput" value="' + newName + '"/></div></div>';
        html += '<br/>';
        html += 'Your op will be private. Only you can see and use them.';
        html += '<br/><br/>';
        html += '<a id="opNameDialogSubmit" class="bluebutton fa fa-clone">create</a>';
        html += '<br/><br/>';

        CABLES.UI.MODAL.show(html);

        $('#opNameDialogInput').focus();
        

        $('#opNameDialogSubmit').bind("click",
            function(event) {
                if($('#opNameDialogInput').val()=="")
                {
                    alert("please enter a name for your op!");
                    return;
                }
                cb($('#opNameDialogInput').val());
            });
    };

    this.createDialog = function() {
        this.opNameDialog('Create operator', name, function(newname) {
            console.log(newname);
            self.create('Ops.User.' + gui.user.usernameLowercase + '.' + newname, function() {
                CABLES.UI.MODAL.hide();
            });
        });

    };

    this.cloneDialog = function(oldName) {
        this.opNameDialog('Clone operator', name, function(newname) {
            gui.serverOps.clone(oldName, 'Ops.User.' +gui.user.usernameLowercase + '.' + newname);
        });
    };

    this.editAttachment = function(opname, attachmentname, readOnly) {
        var editorObj=CABLES.editorSession.rememberOpenEditor("attachment",attachmentname,{"opname":opname} );
        CABLES.api.clearCache();
        

        var toolbarHtml = '';

        gui.jobs().start({id:'load_attachment_'+attachmentname,title:'loading attachment '+attachmentname});

        CABLES.api.get(
            'op/' + opname + '/attachment/' + attachmentname,
            function(res) {
                var content = res.content || '';
                var syntax = "text";

                if (attachmentname.endsWith(".frag")) syntax = "glsl";
                if (attachmentname.endsWith(".vert")) syntax = "glsl";
                if (attachmentname.endsWith(".json")) syntax = "json";
                if (attachmentname.endsWith(".css")) syntax = "css";
                
                gui.jobs().finish('load_attachment_'+attachmentname);

                gui.showEditor();
                gui.editor().addTab({
                    content: content,
                    title: attachmentname,
                    syntax: syntax,
                    id:CABLES.Editor.sanitizeId('editattach_'+opname+attachmentname),
                    editorObj: editorObj,
                    toolbarHtml: toolbarHtml,
                    onSave: function(setStatus, content) {
                        CABLES.api.post(
                            'op/' + opname + '/attachment/' + attachmentname, {
                                content: content
                            },
                            function(res) {
                                setStatus('saved');
                                gui.serverOps.execute( opname );
                            },
                            function(res) {
                                setStatus('ERROR: not saved - '+res.msg);
                                console.log('err res', res);
                            }
                        );
                    },
                    onClose: function(which) {
                        if(which.editorObj && which.editorObj.name)
                            CABLES.editorSession.remove(which.editorObj.name,which.editorObj.type);
                    },

                });
            },function(err)
            {
                gui.jobs().finish('load_attachment_'+attachmentname);
                console.error("error opening attachment "+attachmentname);
                console.log(err);
                if(editorObj) CABLES.editorSession.remove(editorObj.name,editorObj.type);
            }
        );
    };


    // Shows the editor and displays the code of an op in it
    this.edit = function(opname, readOnly)
    {
        if(!opname || opname=='')
        {
            console.log("UNKNOWN OPNAME ",opname);
            return;
        }

        // for (var i = 0; i < ops.length; i++) {
        //     if (ops[i].name == name) {
        //         op = ops[i];
        //     }
        // }
        // if (!op) {
        //     console.log('server op not found ' + name);
        //     return;
        // }
        CABLES.api.get(
            'ops/' + opname,
            function(res) {
                gui.showEditor();
                CABLES.UI.MODAL.hide();

                var editorObj=CABLES.editorSession.rememberOpenEditor("op",opname);

                var html = '';
                // if (!readOnly) html += '<a class="button" onclick="gui.serverOps.execute(\'' + opname + '\');">execute</a>';

                var save = null;
                if (!readOnly) save = function(setStatus, content) {
                    CABLES.api.put(
                        'ops/' + opname, {
                            code: content
                        },
                        function(res) {
                            if (!res.success) {
                                if (res.error) setStatus('Error: Line ' + res.error.lineNumber + ' : ' + res.error.description, true);
                                else setStatus('error: unknown error', true);
                            } else {
                                
                                if (!CABLES.Patch.getOpClass(opname))
                                {
                                    console.log('execute first time...');
                                    gui.opSelect().reload();
                                    
                                    
                                }

                                // exec ???
                                gui.serverOps.execute(opname);
                                // setStatus('saved ' + opname);

                            }
                            // console.log('res', res);
                        },
                        function(res) {
                            setStatus('ERROR: not saved - '+res.msg);
                            console.log('err res', res);
                        }
                    );
                };

                var parts = opname.split(".");
                var title = 'Op ' + parts[parts.length - 1];
                gui.editor().addTab({
                    content: res.code,
                    title: title,
                    id:CABLES.Editor.sanitizeId('editop_'+opname),
                    editorObj: editorObj,
                    opname: opname,
                    syntax: 'js',
                    readOnly: readOnly,
                    toolbarHtml: html,
                    onClose: function(which)
                    {
                        CABLES.editorSession.remove(which.editorObj.name,which.editorObj.type);
                    },
                    onSave: save
                });

            });


    };

    this._loadedLibs = [];

    this.getOpLibs = function(opname, checkLoaded) {
        for (var i = 0; i < ops.length; i++) {
            if (ops[i].name == opname) {
                if (ops[i].libs) {
                    var libs = [];
                    for (var j = 0; j < ops[i].libs.length; j++) {
                        var libName = ops[i].libs[j];
                        if (!checkLoaded) {
                            libs.push(libName);
                        } else
                        if (this._loadedLibs.indexOf(libName) == -1) {
                            libs.push(libName);
                        }
                    }

                    return libs;
                }
            }
        }
        return [];
    };

    this.loadProjectLibs = function(proj, next) {
        var libsToLoad = [];
        var i = 0;

        for (i = 0; i < proj.ops.length; i++) {
            libsToLoad = libsToLoad.concat(this.getOpLibs(proj.ops[i].objName));
        }

        libsToLoad = CABLES.uniqueArray(libsToLoad);

        if (libsToLoad.length === 0) {
            next();
            return;
        }

        var loader=new CABLES.libLoader(libsToLoad,
            function()
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

    this.isLibLoaded = function(libName) {
        // console.log(this._loadedLibs);
        var isloaded = this._loadedLibs.indexOf(libName) != -1;
        // console.log(libName,isloaded);
        return isloaded;

    };

    this.opHasLibs = function(opName) {
        return this.getOpLibs(opName).length !== 0;
    };

    this.opLibsLoaded = function(opName) {
        var libsToLoad = this.getOpLibs(opName);
        for (var i = 0; i < libsToLoad.length; i++) {
            if (!this.isLibLoaded(libsToLoad[i])) return false;
        }
        return true;

    };

    this.loadOpLibs = function(opName, next) {
        function libReady() {
            console.log('finished loading libs for ' + opName);

            var libsToLoad = this.getOpLibs(opName);
            for (var i = 0; i < libsToLoad.length; i++) {
                this._loadedLibs.push(libsToLoad[i]);
            }

            next();
        }

        var libsToLoad = this.getOpLibs(opName);

        if (libsToLoad.length === 0) {
            next();
            return;
        }


        var loader=new CABLES.libLoader(libsToLoad,
            function()
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
    this.finished = function() {
        return this.loaded;
    };

    this.load();

};
