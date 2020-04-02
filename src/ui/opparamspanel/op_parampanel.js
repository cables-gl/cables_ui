var CABLES=CABLES||{};

CABLES.UI.OpParampanel=class extends CABLES.EventTarget
{
    constructor()
    {
        super();

        this._watchPorts = [];
        this._watchAnimPorts = [];
        this._watchColorPicker = [];

        this._sourcePort = $("#params_port").html();
        this._templatePort = Handlebars.compile(this._sourcePort);

        this._sourceHead = $("#params_op_head").html();
        this._templateHead = Handlebars.compile(this._sourceHead);

        this._currentOp=null;

        this._updateWatchPorts();

        // this._cycleWatchPort = false;
    }

    dispose()
    {
        this._watchPorts.length=0;
    }

    show(op)
    {
        this._currentOp=op;
        if(!op)return;
        if(op.id!=self._oldOpParamsId)
        {
            if(gui.fileManager)gui.fileManager.setFilePort(null);
            self._oldOpParamsId=op.id;
        }

        // var ops=gui.corePatch().ops;
        var perf = CABLES.uiperf.start('_showOpParams');
        var perfHtml = CABLES.uiperf.start('_showOpParamsHTML');
        
        gui.opHistory.push(op.id);
        gui.setTransformGizmo(null);

        var i = 0;
        this.emitEvent('opSelected', op);

        op.isServerOp=gui.serverOps.isServerOp(op.objName);

        // show first anim in timeline
        if (self.timeLine) {
            var foundAnim = false;
            for (i =0;i<op.portsIn.length;i++) {
                if (op.portsIn[i].isAnimated()) {
                        self.timeLine.setAnim(op.portsIn[i].anim, {
                        name: op.portsIn[i].name
                    });
                    foundAnim = true;
                    continue;
                }
            }
            if (!foundAnim) self.timeLine.setAnim(null);
        }

        // for (var iops =0; iops<this.ops.length;iops++)
        //     if (this.ops[iops].op == op)
        //         currentOp = this.ops[iops];

        op.summary = gui.opDocs.getSummary(op.objName);
        var doc = gui.opDocs.getOpDocByName(op.objName);
        var hasScreenshot=(doc && doc.hasScreenshot);


        // if (!currentOp) return;

        this._watchPorts = [];
        this._watchAnimPorts = [];
        this._watchColorPicker = [];

        var ownsOp = false;
        if (op.objName.startsWith('Ops.User.' + gui.user.username)) ownsOp = true;
        if (op.objName.startsWith('Ops.Deprecated.')) {
            op.isDeprecated = true;
            var notDeprecatedName = op.objName.replace("Deprecated.", '');
            var alt = CABLES.Patch.getOpClass(notDeprecatedName);
            if (alt) op.isDeprecatedAlternative = notDeprecatedName;
        }
        if (op.objName.startsWith('Ops.Exp.')) op.isExperimental = true;

        var isBookmarked=false;
        if (op) isBookmarked = gui.bookmarks.hasBookmarkWithId(op.id);


        var oldversion=false;
        if(doc && doc.oldVersion)oldversion=doc.oldVersion

        var html=this._templateHead({
            "op": op,
            "isBookmarked": isBookmarked,
            "colorClass": "op_color_" + CABLES.UI.uiConfig.getNamespaceClassName(op.objName),
            "texts": CABLES.UI.TEXTS,
            "user": gui.user,
            "ownsOp": ownsOp,
            "oldVersion":oldversion,
            "cablesUrl": CABLES.sandbox.getCablesUrl(),
            "hasExample":hasScreenshot
        });

        CABLES.UI.showInfo(CABLES.UI.TEXTS.patchSelectedOp);

        if (op.portsIn.length > 0) {
            html += CABLES.UI.getHandleBarHtml('params_ports_head', {
                "dirStr": 'in',
                "title": 'Input',
                "texts": CABLES.UI.TEXTS
            });

            var lastGroup=null;
            var perfLoop = CABLES.uiperf.start('_showOpParamsLOOP');

            for(i=0;i<op.portsIn.length;i++)
            {
                var startGroup = null;
                var groupSpacer = false;

                var opGroup = op.portsIn[i].uiAttribs.group;

                if(!op.portsIn[i].uiAttribs.hideParam)
                {
                    if (lastGroup != opGroup && !opGroup) groupSpacer=true;

                    if (lastGroup != opGroup )
                    {
                        groupSpacer = true;
                        lastGroup = opGroup;
                        startGroup = lastGroup;
                    }
                }

                op.portsIn[i].watchId = 'in_' + i;
                this._watchAnimPorts.push(op.portsIn[i]);

                if (op.portsIn[i].uiAttribs.colorPick) this._watchColorPicker.push(op.portsIn[i]);
                if (op.portsIn[i].isLinked() || op.portsIn[i].isAnimated()) this._watchPorts.push(op.portsIn[i]);

                html += this._templatePort({
                    port: op.portsIn[i],
                    "startGroup": startGroup,
                    "groupSpacer": groupSpacer,
                    "dirStr": "in",
                    "portnum": i,
                    "isInput": true,
                    "op": op,
                    "texts": CABLES.UI.TEXTS,
                    "vars": op.patch.getVars()
                });
            }
            perfLoop.finish();
        }

        if (op.portsOut.length > 0)
        {
            html += CABLES.UI.getHandleBarHtml('params_ports_head',
            {
                "dirStr": 'out',
                "title": 'Output',
                "op": op,
                texts: CABLES.UI.TEXTS
            });

            var perfLoopOut = CABLES.uiperf.start('_showOpParamsLOOP OUT');

            var foundPreview = false;
            for (var i2 in op.portsOut)
            {
                if (op.portsOut[i2].getType() == CABLES.OP_PORT_TYPE_VALUE || op.portsOut[i2].getType() == CABLES.OP_PORT_TYPE_ARRAY || op.portsOut[i2].getType() == CABLES.OP_PORT_TYPE_STRING)
                {
                    op.portsOut[i2].watchId = 'out_' + i2;
                    this._watchPorts.push(op.portsOut[i2]);
                }

                var startGroup = null;
                var groupSpacer = false;

                var opGroup = op.portsOut[i2].uiAttribs.group;
                if (lastGroup != opGroup && !opGroup) groupSpacer=true;

                if (lastGroup != opGroup)
                {
                    groupSpacer = true;
                    lastGroup = opGroup;
                    startGroup = lastGroup;
                }
                
                // set auto preview
                if (!foundPreview && op.portsOut[i2].uiAttribs.preview) {
                    foundPreview = true;
                    gui.texturePreview().selectTexturePort(op.portsOut[i2]);
                }

                html += this._templatePort({
                    "port": op.portsOut[i2],
                    "dirStr": "out",
                    "groupSpacer":groupSpacer,
                    "startGroup":startGroup,
                    "portnum": i2,
                    "isInput": false,
                    "op": op
                });
            }

            perfLoopOut.finish();
        }

        html += CABLES.UI.getHandleBarHtml('params_op_foot', {
            "op": op,
            "opserialized":op.getSerialized(),
            "user": gui.user
        });

        // $('#options').html(html);
        document.getElementById("options").innerHTML=html;

        // gui.showOpDoc(op.objName);
        CABLES.UI.bindInputListeners();
        perfHtml.finish();

        CABLES.valueChangerInitSliders();

        this.updateUiAttribs();
        






        for (i = 0; i < op.portsIn.length; i++)
        {
            if (op.portsIn[i].uiAttribs.display && op.portsIn[i].uiAttribs.display == 'file')
            {
                var shortName=String(op.portsIn[i].get()||'none');
                if(shortName.indexOf("/")>-1) shortName=shortName.substr(shortName.lastIndexOf("/")+1);
                $('#portFilename_' + i).html('<span class="button fa fa-folder-open-o monospace" style="text-transform:none;font-family:monospace;font-size: 13px;">'+shortName+'</span>');

                if (op.portsIn[i].get() && ((op.portsIn[i].get() + '').endsWith('.jpg') || (op.portsIn[i].get() + '').endsWith('.png'))) {
                    $('#portFileVal_' + i+'_preview').css('max-width', '100%');
                    $('#portFileVal_' + i+'_preview').html('<img class="dark" src="' + op.portsIn[i].get() + '" style="max-width:100%;margin-top:10px;"/>');
                } else {
                    $('#portFileVal_' + i+'_preview').html('');
                }
            }
        }


        for (var ipo in op.portsOut) {
            this._showOpParamsCbPortDelete(ipo,op);
            (function (index) {
                $('#portTitle_out_' + index).on('click', function (e) {
                    const p = op.portsOut[index];
                    if (!p.uiAttribs.hidePort)
                        gui.opSelect().show(
                            {
                                x: p.parent.uiAttribs.translate.x + (index * (CABLES.UI.uiConfig.portSize + CABLES.UI.uiConfig.portPadding)),
                                y: p.parent.uiAttribs.translate.y + 50,
                            }, op, p);
                });
            }) (ipo);

        }

        for (var ipi =0;ipi<op.portsIn.length;ipi++) CABLES.UI.initPortClickListener(op,ipi);

        for (var ipip = 0; ipip < op.portsIn.length; ipip++) {
            (function(index) {
                $('#portdelete_in_' + index).on('click', function(e) {
                    op.portsIn[index].removeLinks();
                    self.showOpParams(op);
                });
            })(ipip);
        }

        for (var ipii = 0; ipii < op.portsIn.length; ipii++) CABLES.UI.initPortInputListener(op, ipii);

        for (var iwap in this._watchAnimPorts) {
            var thePort = this._watchAnimPorts[iwap];
            (function(thePort) {
                var id = '.watchPortValue_' + thePort.watchId;

                $(id).on("focusin", function() {
                    if (thePort.isAnimated()) gui.timeLine().setAnim(thePort.anim, {
                        name: thePort.name
                    });
                });

            })(thePort);
        }

        for (var iwcp in this._watchColorPicker) {
            var thePort2 = this._watchColorPicker[iwcp];
            CABLES.UI.watchColorPickerPort(thePort2);
        }

        perf.finish();
    }


    updateUiAttribs()
    {
        if(!this._currentOp)return;


        this._uiAttrFpsLast=this._uiAttrFpsLast||performance.now();
        this._uiAttrFpsCount++;

        if(performance.now()-this._uiAttrFpsLast>1000)
        {
            this._uiAttrFpsLast=performance.now();
            if(this._uiAttrFpsCount>=10) console.warn("Too many ui attr updates!",this._uiAttrFpsCount,this._currentOp.name)
            this._uiAttrFpsCount=0;
        }
        


        var perf = CABLES.uiperf.start('updateUiAttribs');
        var el=null;

        // this.setCurrentOpTitle(this._currentOp.name);
        // uiop.op.setTitle(t);

        el = document.getElementById('options_warning');
        if(el)
        {
            if (!this._currentOp.uiAttribs.warning || this._currentOp.uiAttribs.warning.length === 0) el.style.display = "none";
            else {
                el.style.display = "block";
                if (el) el.innerHTML = this._currentOp.uiAttribs.warning;
            }
        }

        el = document.getElementById('options_hint');
        if(el)
        {
            if (!this._currentOp.uiAttribs.hint || this._currentOp.uiAttribs.hint.length === 0) el.style.display = "none";
            else {
                el.style.display = "block";
                if (el) el.innerHTML = this._currentOp.uiAttribs.hint;
            }
        }

        el = document.getElementById('options_error');
        if(el)
        {
            if (!this._currentOp.uiAttribs.error || this._currentOp.uiAttribs.error.length === 0) el.style.display = "none";
            else {
                el.style.display = "block";
                if (el) el.innerHTML = this._currentOp.uiAttribs.error;
            }
        }

        el = document.getElementById('options_info');
        if (el) 
        {
            if (!this._currentOp.uiAttribs.info) el.style.display = "none";
                else
                {
                    el.style.display = "block";
                    el.innerHTML = '<div class="panelhead">info</div><div class="panel">' + this._currentOp.uiAttribs.info + '</div>';
                }
        }

        perf.finish();
    }

    _showOpParamsCbPortDelete(index,op)
    {
        $('#portdelete_out_' + index).on('click', function (e) {
            op.portsOut[index].removeLinks();
            this.show(op);
        });
    }

    
    _updateWatchPorts()
    {
        if(this._watchPorts.length)
        {
            var perf=CABLES.uiperf.start('watch ports');

            for (var i=0;i<this._watchPorts.length;i++)
            {
                const thePort=this._watchPorts[i];

                if (thePort.type != CABLES.OP_PORT_TYPE_VALUE && 
                    thePort.type != CABLES.OP_PORT_TYPE_STRING && 
                    thePort.type != CABLES.OP_PORT_TYPE_ARRAY) continue;


                var newValue="";
                const id = '.watchPortValue_' + thePort.watchId;
                var el=null;

                if (thePort.isAnimated()) {
                    el = $(id);
                    thePort._tempLastUiValue=thePort.get();
                    if (el.val() != thePort.get()) el.val(thePort.get());
                }
                else if (thePort.type == CABLES.OP_PORT_TYPE_ARRAY) {
                    if (thePort.get()) newValue='Array (' + String(thePort.get().length)+')';
                    else newValue='Array (null)';
                }
                else if (thePort.type == CABLES.OP_PORT_TYPE_STRING) {
                    newValue='\"'+thePort.get()+'\"';
                } else {
                    newValue=String(thePort.get());
                }

                if(thePort._tempLastUiValue!=newValue)
                {
                    el = $(id);
                    el.html(newValue);
                    thePort._tempLastUiValue=newValue;
                }

                CABLES.watchPortVisualize.update(id, thePort.watchId, thePort.get());
            }

            perf.finish();       
        }

        if (CABLES.UI.uiConfig.watchValuesInterval == 0)return;

         setTimeout(this._updateWatchPorts.bind(this),CABLES.UI.uiConfig.watchValuesInterval);
    }


    setCurrentOpComment(v)
    {
        if (this._currentOp)
        {
            this._currentOp.uiAttr({"comment":v});
            if(v.length==0)this._currentOp.uiAttr({"comment":null});
            this._currentOp.patch.emitEvent("commentChanged");
        }
        else
        {
            console.log("no current op commenrt");
        }
    };

    setCurrentOpTitle(t) {
        if (this._currentOp) this._currentOp.setTitle(t);
    };


}