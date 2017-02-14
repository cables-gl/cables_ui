CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

// localStorage.cables=localStorage.cables || {};
// localStorage.cables.editor=localStorage.cables.editor || {};
// localStorage.cables.editor.serverops= [];


// todo: merge serverops and opdocs.js ....



CABLES.UI.ServerOps=function(gui)
{
    var ops=[];
    var self=this;
    var storedOps=[];

    function updateStoredOps()
    {
        if(!storedOps)storedOps=[];

        storedOps = storedOps.slice() // slice makes copy of array before sorting it
          .sort()
          .reduce(function(a,b){
            if (a.slice(-1)[0] !== b) a.push(b); // slice(-1)[0] means last item in array without removing it (like .pop())
            return a;
          },[]); // this empty array becomes the starting value for a

        localStorage.setItem("cables.editor.serverops",JSON.stringify(storedOps));
        console.log('storedops'+storedOps.length);
        // console.log('storedOps.length',storedOps.length);
    }

    this.load=function(cb)
    {
        CABLES.api.get(CABLES.noCacheUrl('ops/'),function(res)
        {
            if(res)
            {
                ops=res;

                logStartup('Ops loaded');

                if(cb)cb(ops);

                storedOps=JSON.parse(localStorage.getItem("cables.editor.serverops"));
                updateStoredOps();
                self.loaded=true;
                incrementStartup();

                if(storedOps && storedOps.length>0)
                {
                    for(var i in storedOps)
                    {
                        self.edit(storedOps[i]);
                    }
                }
            }
        });
    };

    this.showOpInstancingError=function(name,e)
    {
        // console.log('show server op error message modal');

        gui.patch().loadingError=true;

        var msg='<h2><span class="fa fa-exclamation-triangle"></span> cablefail :/</h2>';
        msg+='error creating op: '+name;
        msg+='<br/><pre>'+e+'</pre><br/>';

        if(this.isServerOp(name))
        {
            msg+='<a class="bluebutton" onclick="gui.showEditor();gui.serverOps.edit(\''+name+'\')">edit op</a>';
        }
        if(gui.user.isAdmin)
        {
            msg+=' <a class="bluebutton" onclick="gui.serverOps.pullOp(\''+name+'\')">try to pull</a>';
        }
        CABLES.UI.MODAL.show(msg);

    };

    this.isServerOp=function(name)
    {
        for(var i=0;i<ops.length;i++)
        {
            if(ops[i].name==name)
            {
                return true;
            }
        }

        return false;
    };

    this.create=function(name,cb)
    {
        CABLES.api.get(
            'ops/create/'+name,
            function(res)
            {
                self.load(
                function()
                {
                    console.log('now edit...');
                    self.edit(name);
                });
            },
            function(res)
            {
                console.log('err res',res);

            }
        );

    };

    this.execute=function(name)
    {
        // console.log(name);
        CABLES.UI.MODAL.showLoading('executing...');
        var s = document.createElement( 'script' );
        s.setAttribute( 'src', '/api/op/'+name+'?nocache='+CABLES.generateUUID() );
        s.onload=function()
        {
            gui.patch().scene.reloadOp(name,function(num)
            {
                CABLES.UI.notify(num+' ops reloaded');
            });

            CABLES.UI.MODAL.hideLoading();
        };
        document.body.appendChild( s );

    };



    this.clone=function(oldname,name)
    {

        console.log('clone',name,oldname);
        CABLES.api.get(
            'ops/clone/'+oldname+'/'+name,
            function(res)
            {
                self.load(
                function()
                {
                    console.log('now edit...');
                    self.edit(name);
                });
            },
            function(res)
            {
                console.log('err res',res);
                CABLES.UI.MODAL.showError('op name invalid','');
            }
        );
    };


    this.addOpSummary=function(opName,summary)
    {
        CABLES.api.put(
            'op/'+opName+'/summary/'+summary,
            function(res)
            {
                console.log(res);
            });
    };


    this.addOpLib=function(opName,libName)
    {

        CABLES.api.put(
            'op/'+opName+'/libs/'+libName,
            function(res)
            {
                console.log(res);
            });

    };

    this.deleteAttachment=function(opName,attName)
    {
        if(confirm("really ?"))
        {
            CABLES.api.delete(
                'op/'+opName+'/attachments/'+attName,
                function(res)
                {
                    console.log(res);
                });
        }
    };

    this.addAttachmentDialog=function(name)
    {
        var attName=prompt('Attachment name');

        CABLES.api.post(
            'op/'+name+'/attachments/'+attName,
            function(res)
            {
                console.log(res);
            });
    };

    this.opNameDialog=function(title,name,cb)
    {
        var newName=name;
        if(name.indexOf('Ops.')===0)newName=name.substr(4,name.length);

        var html='<h2>'+title+'</h2>';
        html+='<div class="clone"><span>Ops.User.'+gui.user.username+'.</span><input id="opNameDialogInput" value="'+newName+'"/></div></div>';
        html+='<br/>';
        html+='Your op will be private. Only you can see and use them.';
        html+='<br/><br/>';
        html+='<a id="opNameDialogSubmit" class="bluebutton fa fa-clone">create</a>';
        html+='<br/><br/>';

        CABLES.UI.MODAL.show(html);
        $('#cloneOpName').focus();

        $('#opNameDialogSubmit').bind("click",
            function(event)
            {
                cb($('#opNameDialogInput').val());
            });
    };

    this.createDialog=function()
    {
        console.log('aaa');
        this.opNameDialog('Create operator',name,function(newname)
        {
            console.log(newname);
            self.create('Ops.User.'+gui.user.username+'.'+newname,function()
            {
                CABLES.UI.MODAL.hide();
            });
        });

    };

    this.cloneDialog=function(oldName)
    {
        this.opNameDialog('Clone operator',name,function(newname)
        {
            gui.serverOps.clone(oldName,'Ops.User.'+gui.user.username+'.'+newname);
        });
    };

    this.editAttachment=function(opname,attachmentname)
    {
        CABLES.api.clearCache();

        gui.showEditor();

        CABLES.api.get(
            'op/'+opname+'/attachment/'+attachmentname,
            function(res)
            {
                var content=res.content||'';

                var syntax="text";

                if(attachmentname.endsWith(".frag"))syntax="glsl";
                if(attachmentname.endsWith(".vert"))syntax="glsl";
                if(attachmentname.endsWith(".json"))syntax="json";


                gui.editor().addTab(
                {
                    content:content,
                    title:attachmentname,
                    syntax:syntax,
                    onSave:function(setStatus,content)
                    {
                        CABLES.api.post(
                            'op/'+opname+'/attachment/'+attachmentname,
                            {content:content},
                            function(res)
                            {
                                setStatus('saved');
                                console.log('res',res);
                            },
                            function(res)
                            {
                                setStatus('error: not saved');
                                console.log('err res',res);
                            }
                        );
                    }
                });
            });
    };



    this.edit=function(name,readOnly)
    {
        var op=null;

        for(var i=0;i<ops.length;i++)
        {
            if(ops[i].name==name)
            {
                op=ops[i];
            }
        }
        if(!op)
        {
            console.log('server op not found '+name);
            return;
        }
        CABLES.api.get(
            'ops/'+op.name,
            function(res)
            {
                gui.showEditor();
                CABLES.UI.MODAL.hide();

                storedOps.push(name);
                updateStoredOps();

                var html='';
                if(!readOnly) html+='<a class="button" onclick="gui.serverOps.execute(\''+op.name+'\');">execute</a>';

                var save=null;
                if(!readOnly) save=function(setStatus,content)
                    {
                        CABLES.api.put(
                            'ops/'+op.name,
                            {code:content},
                            function(res)
                            {
                                if(!res.success)
                                {
                                    if(res.error) setStatus('error: Line '+res.error.lineNumber+' : '+res.error.description,true);
                                    else setStatus('error: unknown error',true);
                                }
                                else
                                {
                                    if(!gui.patch().scene.getOpClass(op.name))
                                    {
                                        console.log('execute first time...');
                                        gui.serverOps.execute(op.name);
                                    }

                                    // exec ???
                                    setStatus('saved '+op.name);
                                }
                                console.log('res',res);
                            },
                            function(res)
                            {
                                setStatus('error: not saved');
                                console.log('err res',res);
                            }
                        );
                    };


                var parts=op.name.split(".");
                var title='Op '+parts[parts.length-1];
                gui.editor().addTab(
                {
                    content:res.code,
                    title:title,
                    opname:op.name,
                    syntax:'js',
                    readOnly:readOnly,
                    toolbarHtml:html,
                    onClose:function(which)
                    {
                        console.log('close tab',which);

                        for(var i=storedOps.length;i>=0;i--)
                        {
                            console.log('-- ', storedOps[i], which.opname);

                            if(storedOps[i]==which.opname)
                            {
                                console.log('found op to remove');
                                storedOps.splice(i,1);

                            }
                        }
                        updateStoredOps();
                    },
                    onSave:save
                });

            });


    };



        this._loadedLibs=[];

        this.getOpLibs=function(opname,checkLoaded)
        {
            for(i=0;i<ops.length;i++)
            {
                if(ops[i].name==opname)
                {
                    if(ops[i].libs)
                    {
                        var libs=[];
                        for(var j=0;j<ops[i].libs.length;j++)
                        {
                            var libName='/libs/'+ops[i].libs[j];
                            if(!checkLoaded)
                            {
                                libs.push(libName);
                            }
                            else
                            if(this._loadedLibs.indexOf(libName)==-1)
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

        this.loadProjectLibs=function(proj,next)
        {
            console.log('loading project libs...');

            var libsToLoad=[];
            var i=0;

            for(i=0;i<proj.ops.length;i++)
            {
                libsToLoad=libsToLoad.concat( this.getOpLibs(proj.ops[i].objName) );
            }

            libsToLoad=CABLES.uniqueArray(libsToLoad);

            console.log(libsToLoad);

            if(libsToLoad.length===0)
            {
                next();
                return;
            }

            var id=CABLES.generateUUID();
            loadjs(libsToLoad,'oplibs'+id);



            loadjs.ready('oplibs'+id, function()
            {
                for(i=0;i<libsToLoad.length;i++)
                {
                    this._loadedLibs.push(libsToLoad[i]);
                }

                console.log('finished loading libs...');
                next();
            }.bind(this));


        };

        this.isLibLoaded=function(libName)
        {
            return this._loadedLibs.indexOf(libName)!=-1;

        };

        this.opHasLibs=function(opName)
        {
            return this.getOpLibs(opName).length!==0;
        };

        this.opLibsLoaded=function(opName)
        {
            var libsToLoad=this.getOpLibs(opName);
            for(var i=0;i<libsToLoad.length;i++)
            {
                if(!this.isLibLoaded(libsToLoad[i]))return false;
            }
            return true;

        };

        this.loadOpLibs=function(opName,next)
        {
            var libsToLoad=this.getOpLibs(opName);

            if(libsToLoad.length===0)
            {
                next();
                return;
            }

            var lid='oplibs'+CABLES.generateUUID();

            loadjs.ready(lid, function()
            {
                console.log('finished loading libs for '+opName);
                next();
            });
            loadjs(libsToLoad,lid);


        };


    this.loaded=false;
    this.finished=function()
    {
        return this.loaded;
    };

this.load();

};
