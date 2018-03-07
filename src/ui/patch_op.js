var CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.cleanRaphael = function(el) {
    el.node.removeAttribute('font-family');
    el.node.removeAttribute('font-size');
    el.node.removeAttribute('stroke-width');
    el.node.removeAttribute('stroke');
    el.node.removeAttribute('fill');
    el.node.removeAttribute('fill-opacity');
    el.node.removeAttribute('stroke-opacity');
};

function getPortDescription(thePort) {
    var str = thePort.getTypeString()+' <b>' + thePort.getName() + '</b> ';
    var strInfo = '';

    if (thePort.direction == PORT_DIR_IN) strInfo += CABLES.UI.TEXTS.portDirIn;
    if (thePort.direction == PORT_DIR_OUT) strInfo += CABLES.UI.TEXTS.portDirOut;
    if (thePort.isLinked()) strInfo += CABLES.UI.TEXTS.portMouseUnlink;
    else strInfo += CABLES.UI.TEXTS.portMouseCreate;
    CABLES.UI.showInfo(strInfo);

    return str;
}

Raphael.el.setGroup = function(group) {
    this.group = group;
};

Raphael.el.getGroup = function() {
    return this.group;
};

var OpRect = function(_opui, _x, _y, _w, _h, _text, objName) {
    var isSelected = true;
    var group = Raphael.fn.set();
    var background = null;
    var miniRect = null;
    var backgroundResize=null;
    // var resizeHandle = null;
    var label = null;
    var w = _w;
    var h = _h;
    var x = _x;
    var y = _y;
    var opui = _opui;
    var title = _text;

    var commentText = null;
    this._errorIndicator = null;

    this.getHeight = function() {
        return h;
    };

    this.getRect = function() {
        return background;
    };

    this.isVisible = function() {
        return label !== null;
    };

    this.setPosition = function(posx, posy) {
        if (this.getGroup()) {
            this.getGroup().transform('t' + posx + ',' + posy);
        }

        if (miniRect) miniRect.attr({
            x: posx,
            y: posy
        });
    };

    this.deleteUi = function() {
        group.clear();

        if (background) background.remove();
        if (label) label.remove();
        if (commentText) commentText.remove();
        if(backgroundResize)backgroundResize.remove();
        if (this._errorIndicator) this._errorIndicator.remove();
        // if(resizeHandle)resizeHandle.remove();
        if (miniRect) miniRect.remove();
        // label=background=commentText=backgroundResize=null;
        label = background = commentText = null;
    };

    this.removeUi = function() {
        if (!this.isVisible()) return;
        this.deleteUi();
    };

    this.getScreenCTM = function() {
        if (background && background.node) return background.node.getScreenCTM();
    };


    this.showCopyAnim = function() {
        if (!background || !background.node) return;
        background.node.classList.add('copyOp');

        if (!background.node.hasAnimEndListenerCopy) {
            background.node.addEventListener("animationend", function() {
                background.node.classList.remove('copyOp');
            }, false);
            background.node.hasAnimEndListenerCopy = true;
        }

    };

    this.showFocus = function() {
        if (!background || !background.node) return;

        background.node.classList.add('focusOp');

        if (!background.node.hasAnimEndListenerFocus) {
            background.node.addEventListener("animationend", function() {
                background.node.classList.remove('focusOp');
            }, false);
            background.node.hasAnimEndListenerFocus = true;
        }
    };

    this.getWidth = function() {
        return w;
    };

    this.setWidth = function(_w) {
        if (_w) {

            w = _w;
            // if(this.isVisible())
            // {
            //     background.attr({width:w});
            //
            //     if(miniRect) miniRect.attr({
            //         width:w,
            //         height:10,
            //     });
            // }
        } else {
            if (!commentText && !backgroundResize) {
                var labelWidth = label.getBBox().width + 20;
                // if(Math.abs(labelWidth-w)>15) labelWidth+=Math.abs(labelWidth-w);

                var setw = w;

                if (labelWidth > w) {
                    setw = labelWidth;
                }
                if (this.isVisible()) {
                    background.attr({
                        "width": setw
                    });
                    label.attr({
                        x: setw / 2
                    });
                    // resizeHandle.attr({x:setw-CABLES.UI.uiConfig.resizeBarWidth});
                    if (miniRect) miniRect.attr({
                        width: setw,
                        height: 10
                    });
                }
            }
        }
    };

    function hover() {
        CABLES.UI.selectedEndOp = opui;
        opui.isMouseOver = true;
    }

    function unhover() {
        opui.isMouseOver = false;
    }


    var shakeCountP = 0;
    var shakeCountN = 0;
    var shakeLastX = -1;
    var shakeStartTime = 0;
    var shakeTimeOut = 0;
    var lastShakeDir = false;

    var down = function(x, y, e) {
        shakeCount = 0;
        shakeCountP = 0;
        shakeCountN = 0;

        if (e.metaKey) {
            CABLES.UI.quickAddOpStart = opui;
            return;
        }

        $('#patch').focus();

        if (e.buttos == 2) {
            //show context menu...
            return;
        }

        if (opui.isSelected()) {
            if (e.shiftKey) {
                gui.patch().removeSelectedOp(opui);
                opui.setSelected(false);
            }
            return;
        }

        opui.showAddButtons();


        if (!e.shiftKey) {
            gui.patch().setSelectedOp(null);
            gui.patch().setSelectedOp(opui);
        } else {
            gui.patch().addSelectedOp(opui);
            opui.setSelected(true);
        }


    };

    var move = function(dx, dy, a, b, e) {
        if (e.metaKey && gui.patch().getSelectedOps().length == 1) {
            return;
        }
        if (shakeLastX != -1) {

            // console.log('shake diff',shakeLastX-a);

            if (shakeLastX - a > 30 && lastShakeDir) {
                lastShakeDir = false;
                shakeCountP++;
                shakeLastX = a;
                clearTimeout(shakeTimeOut);
                shakeTimeOut = setTimeout(function() {
                    shakeCountP = 0;
                    shakeCountN = 0;
                }, 250);
            } else
            if (shakeLastX - a < -30 && !lastShakeDir) {
                lastShakeDir = true;
                shakeCountN++;
                shakeLastX = a;
                clearTimeout(shakeTimeOut);
                shakeTimeOut = setTimeout(function() {
                    shakeCountP = 0;
                    shakeCountN = 0;
                }, 250);
            }
            if (shakeCountP + shakeCountN == 1) {
                shakeStartTime = CABLES.now();
            }

            if (shakeCountP + shakeCountN >= 6 && CABLES.now() - shakeStartTime > 100) {
                opui.op.unLinkTemporary();
                shakeCount = 0;
                shakeLastX = -1;
            }


        }
        shakeLastX = a;

        gui.patch().moveSelectedOps(dx, dy, a, b, e);
        gui.patch().updateBounds = true;
        gui.setStateUnsaved();
    };

    var up = function(e) {
        if (e.metaKey && CABLES.UI.quickAddOpStart) {
            gui.patch().linkTwoOps(
                CABLES.UI.quickAddOpStart,
                CABLES.UI.selectedEndOp
            );

            CABLES.UI.quickAddOpStart = null;
            CABLES.UI.selectedEndOp = null;

            return;
        }

        shakeCount = 0;
        shakeCountP = 0;
        shakeCountN = 0;

        lastX = -1;

        if (CABLES.UI.LINKHOVER) {
            var oldLink = CABLES.UI.LINKHOVER;
            if (oldLink.p1 && oldLink.p2) {
                var portIn = oldLink.p1;
                var portOut = oldLink.p2;

                if (oldLink.p2.thePort.direction == PORT_DIR_IN) {
                    portIn = oldLink.p2;
                    portOut = oldLink.p1;
                }

                portIn.thePort.removeLinks();

                if (CABLES.Link.canLink(opui.op.portsIn[0], portOut.thePort)) {
                    gui.patch().scene.link(
                        opui.op,
                        opui.op.portsIn[0].getName(), portOut.thePort.parent, portOut.thePort.getName());

                    gui.patch().scene.link(
                        opui.op,
                        opui.op.portsOut[0].getName(), portIn.thePort.parent, portIn.thePort.getName());

                    var pos = gui.patch().getCanvasCoordsMouse(e);

                    // opui.setPos(portOut.thePort.parent.uiAttribs.translate.x,opui.op.uiAttribs.translate.y);
                    opui.setPos(pos.x, opui.op.uiAttribs.translate.y);
                } else {
                    gui.patch().scene.link(
                        portIn.thePort.parent, portIn.thePort.getName(),
                        portOut.thePort.parent, portOut.thePort.getName());
                }
            }
        }

        gui.patch().moveSelectedOpsFinished();
        gui.patch().showOpParams(opui.op);
        CABLES.UI.LINKHOVER = null;
    };

    // this.getBgColor=function()
    // {
    //     var fill=CABLES.UI.uiConfig.colorOpBg;
    //     // if( objName.startsWith('Ops.Gl') ) fill='#ccffcc';
    //     // else if( objName.startsWith('Ops.WebAudio') ) fill='#bbeeff';
    //     return fill;
    // };

    this.updateComment = function() {
        if (objName == 'Ops.Ui.Comment') {
            if (commentText) {
                commentText.attr({
                    'text': opui.op.text.get(),
                    'text-anchor': 'start',
                    'x': 0,
                });

            }
            if (label) {
                label.attr({
                    'text': opui.op.inTitle.get(),
                    'x': 0,
                    'text-anchor': 'start'
                });

            }
            this.updateSize();

        }
    };

    this.updateSize = function() {

        
        if (objName == 'Ops.Ui.Comment') {
            var sw = 150;
            var sh = 100;
            var resizeSize = 0;
            if (!label) return;

            if (opui.op.uiAttribs.size) {
                sw = opui.op.uiAttribs.size[0];
                sh = opui.op.uiAttribs.size[1];
            }

            var commentWidth = label.getBBox().width;
            var commentHeight = label.getBBox().height + 20;


            label.attr({
                'y': 40,
                'x': -5
            });

            if (commentText) {
                CABLES.UI.SVGParagraph(commentText, sw * 2);
                commentText.toFront();
                commentText.attr({
                    'y': commentText.getBBox().height / 2 + 76,

                });

                commentHeight += commentText.getBBox().height;
                commentWidth = Math.max(commentWidth, commentText.getBBox().width);
            }


            var y = 0;
            if (label.getBBox().height == 0) {
                y = 60;
                commentHeight += 30;
            }

            background.attr({
                'x': -20,
                'y': y,
                'width': commentWidth + 40 || 10,
                'height': commentHeight - 20 || 10,
                "fill": '#000'
            });

        }
    };

    this.updateErrorIndicator = function() {
        if (opui.op.uiAttribs.error) // || opui.op.uiAttribs.warning)
        {
            if (!this._errorIndicator) {
                this._errorIndicator = gui.patch().getPaper().circle(w, h / 2, 4);

                if (opui.op.objName.indexOf("Deprecated") > -1) this._errorIndicator.node.classList.add('error-indicator-warning');
                if (opui.op.uiAttribs.error) this._errorIndicator.node.classList.add('error-indicator');

                this._errorIndicator.node.classList.add('tt');
                this._errorIndicator.node.setAttribute("data-tt", opui.op.uiAttribs.error);

                group.push(this._errorIndicator);
            }

            opui.setPos();

            if (background) this._errorIndicator.attr({
                cx: background.getBBox().width
            });
            this._errorIndicator.toFront();
        } else {
            if (this._errorIndicator) {
                this._errorIndicator.remove();
                this._errorIndicator = null;
            }
        }
    };

    var dblClick=function(ev)
    {
        gui.patch().setSelectedOp(null);
        if (CABLES.Op.isSubpatchOp(opui.op.objName)) gui.patch().setCurrentSubPatch(opui.op.patchId.val);
    };

    var mouseUp=function(ev) {
        opui.isDragging = false;
    };


    this.addUi = function() {
        if (this.isVisible()) return;

        if(gui.patch().getPaperMap())
        {
            miniRect = gui.patch().getPaperMap().rect(x, y, w, h);
            miniRect.attr({
                "width": w,
                "height": 32,
                "fill-opacity": 1
            });
    
            miniRect.node.classList.add(CABLES.UI.uiConfig.getOpMiniRectClassName(opui.op.objName));
            CABLES.UI.cleanRaphael(miniRect);
        }


        background = gui.patch().getPaper().rect(0, 3, w, h - 6);
        // background=gui.patch().getPaper().rect(0, 0, w, h);
        CABLES.UI.cleanRaphael(background);
        background.node.classList.add('op_background');
        var objNameClassNameified = opui.op.objName.replace(/[\W_]+/g, "_");
        background.node.classList.add(objNameClassNameified);
        background.node.setAttribute('data-info', CABLES.UI.TEXTS.op_background);


        // resizeHandle=gui.patch().getPaper().rect(w-CABLES.UI.uiConfig.resizeBarWidth, 0, CABLES.UI.uiConfig.resizeBarWidth, 0);
        // CABLES.UI.cleanRaphael(resizeHandle);
        // resizeHandle.node.classList.add(CABLES.UI.uiConfig.getOpHandleClassName(opui.op.objName));
        // resizeHandle.node.classList.add('op_handle');

        label = gui.patch().getPaper().text(0 + w / 2, 0 + h / 2 - 0.8, title);

        label.node.classList.add(CABLES.UI.uiConfig.getOpHandleClassName(opui.op.objName));

        // label.attr({"font-family": "SourceSansPro, sans-serif" });

        CABLES.UI.cleanRaphael(label);

        this.setTitle(title);

        // $(label.node).css({'pointer-events': 'none'});


        background.drag(move, down, up);
        background.hover(hover, unhover);
        background.node.ondblclick = dblClick;
        background.onmouseup = mouseUp;

        if (CABLES.Op.isSubpatchOp(opui.op.objName)) background.node.classList.add('op_subpatch');
        if (opui.op.objName == "Ops.Ui.PatchInput") background.node.classList.add('op_subpatch_in');
        if (opui.op.objName == "Ops.Ui.PatchOutput") background.node.classList.add('op_subpatch_out');

        if (objName == 'Ops.Ui.Comment') {
            var sw = 150;
            var sh = 100;
            var resizeSize = 20;

            if (opui.op.uiAttribs.size) {
                sw = opui.op.uiAttribs.size[0];
                sh = opui.op.uiAttribs.size[1];
            }

            // resizeHandle.remove();

            label.node.setAttribute("class", "commentTitle");

            CABLES.UI.cleanRaphael(label);

            commentText = gui.patch().getPaper().text(0, 0, "opui.op.text.get()" + opui.op.text.get());
            commentText.attr({
                "width": sw
            });
            commentText.node.setAttribute("class", "commentText");
            background.attr({
                'opacity': 0.001
            });

            // CABLES.UI.cleanRaphael(commentText);
            // console.log('addui');

            // backgroundResize=gui.patch().getPaper().rect(0, 0, resizeSize, resizeSize).attr(
            // {
            //     "x":sw-resizeSize,
            //     "y":sh-resizeSize,
            //     "fill": '#000',
            //     "stroke": CABLES.UI.uiConfig.colorPatchStroke,
            //     "stroke-width":0,
            //     'opacity':0.2,
            //     "cursor": "se-resize"
            // });

            // CABLES.UI.cleanRaphael(backgroundResize);

            var oldPosX, oldPosY;
            // var resizeCommentStart = function(dx, dy,a,b,e)
            // {
            //     oldPosX=backgroundResize.attrs.x;
            //     oldPosY=backgroundResize.attrs.y;
            //     opui.isDragging=true;
            // };

            // var resizeCommentEnd = function(dx, dy,a,b,e)
            // {
            //     oldPosX=-1;
            //     oldPosY=-1;
            //     opui.isDragging=false;
            // };

            //     var resizeCommentMove = function(dx, dy,a,b,e)
            //     {
            //         if(oldPosX<0)return;
            //
            //         var width=backgroundResize.attrs.x-background.attrs.x;
            //         var height=backgroundResize.attrs.y-background.attrs.y;
            //
            //         if(width<50)width=50;
            //         if(height<50)height=50;
            //
            //         // label.attr({
            //         //     x:0
            //         // });
            // //
            //         // background.attr({
            //         //     width:width+resizeSize
            //         // });
            // //
            //         // backgroundResize.attr({
            //         //     x:oldPosX+dx,
            //         //     y:oldPosY+dy
            //         // });
            // //
            //         // commentText.attr({
            //         //     x:background.attrs.x,
            //         //     y:background.attrs.y,
            //         //     width:width+resizeSize,
            //         //     height:height+resizeSize
            //         // });
            // //
            //         _opui.op.uiAttribs.size=[width,height];
            //
            //         gui.patch().background.toBack();
            //         background.toFront();
            //         backgroundResize.toFront();
            // commentText.toFront();
            //     };
            this.updateComment();

            // backgroundResize.drag(resizeCommentMove, resizeCommentStart,resizeCommentEnd);

            // group.push(backgroundResize,commentText);
            group.push(commentText);
            gui.patch().background.toBack();
            // backgroundResize.toFront();
            background.toFront();
            label.toFront();
            if (this._errorIndicator) this._errorIndicator.toFront();
            if (commentText) commentText.toFront();
        }


        if (objName == 'Ops.Ui.CommentArea')
        {
            var sw = 150;
            var sh = 100;
            var resizeSize = 20;

            // CABLES.UI.cleanRaphael(commentText);
            // console.log('addui');

            backgroundResize=gui.patch().getPaper().rect(0, 0, resizeSize, resizeSize).attr(
            {
                "x":sw-resizeSize,
                "y":sh-resizeSize,
                "fill": '#000',
                "stroke": CABLES.UI.uiConfig.colorPatchStroke,
                "stroke-width":0,
                'opacity':0.2,
                "cursor": "se-resize"
            });

            CABLES.UI.cleanRaphael(backgroundResize);

            var oldPosX, oldPosY;
            var resizeCommentStart = function(dx,dy,a,b,e)
            {
                oldPosX=backgroundResize.attrs.x;
                oldPosY=backgroundResize.attrs.y;
                opui.isDragging=true;
            };

            var resizeCommentEnd = function(dx,dy,a,b,e)
            {
                oldPosX=-1;
                oldPosY=-1;
                opui.isDragging=false;
            };

            var resizeCommentMove = function(dx,dy,x,y,e)
            {
                // if(oldPosX<0)return;
                var pos = gui.patch().getCanvasCoordsMouse(e);

                var width=Math.abs(pos.x-x);
                var height=Math.abs(pos.y-y);

                if(width<50)width=50;
                if(height<50)height=50;

                // label.attr({
                //     x:0
                // });




                backgroundResize.attr({
                    x:oldPosX+dx,
                    y:oldPosY+dy
                });

                background.attr({
                    width:width,//-width+resizeSize,
                    height:height,//height+resizeSize
                });


                // commentText.attr({
                //     x:background.attrs.x,
                //     y:background.attrs.y,
                //     width:width+resizeSize,
                //     height:height+resizeSize
                // });

                _opui.op.uiAttribs.size=[width,height];

                gui.patch().background.toBack();
                background.toFront();
                backgroundResize.toFront();
            };

            this.updateComment();

            backgroundResize.drag(resizeCommentMove, resizeCommentStart,resizeCommentEnd);

            group.push(backgroundResize,commentText);
            // group.push(commentText);
            // gui.patch().background.toBack();
            background.toFront();
            backgroundResize.toFront();
            label.toFront();
        }

        group.push(background, label); //,resizeHandle);
        // resizeHandle.toFront();
        this.updateSize();
    };

    this.setEnabled = function(enabled) {
        if (this.isVisible())
            if (enabled) group.attr({
                "fill-opacity": 1
            });
            else group.attr({
                "fill-opacity": 0.25
            });
    };

    this.setSelected = function(sel) {
        if (isSelected == sel) return;
        group.toFront();
        if (this._errorIndicator) this._errorIndicator.toFront();
        isSelected = sel;

        if (this.isVisible() && !commentText)
            if (sel) {
                background.node.classList.add("active");
                label.node.classList.add("active");
                // background.attr( { "fill": CABLES.UI.uiConfig.colorOpBgSelected,"stroke-width":0,"stroke":"#fff" });
                // label.attr( { "font-weight": "bold" });
            }
        else {
            background.node.classList.remove("active");
            label.node.classList.remove("active");
            // background.attr( { "fill": this.getBgColor(),"stroke-width":0 });
            // label.attr( { "font-weight": "normal" });
        }

        if (commentText) {
            if (sel) {
                this.updateSize();
                background.attr({
                    'opacity': 0.3
                });
            } else {
                background.attr({
                    'opacity': 0.001
                });
            }
        }

        if (backgroundResize) {
            backgroundResize.toFront();
        }

        // if(opui.op.uiAttribs.error && opui.op.uiAttribs.error.length>0)
        // {
        //     if(background)background.attr({"fill":"#f88"});
        // }

        // if(sel) background.attr( { stroke: '#fff', "stroke-width": 10});
        //     else background.attr( { stroke: '#fff', "stroke-width": 0});
    };

    this.setTitle = function(t) {
        if(typeof t !== 'undefined') {
            if(t === null) { title = ""; } 
            else { title = t; }
        }
        if (label) {
            label.attr({
                text: title
            });
            this.setWidth();
            this.addUi();
            // label = gui.patch().getPaper().text(0+w/2,0+h/2+0, title);
            // while(label.node.getComputedTextLength()>background.attr("width"))
            // {
            //     shownTitle=shownTitle.substr(0,shownTitle.length-1);
            //     label.attr({'text': shownTitle+'...  '});
            // }
            this.updateSize();
            this.updateErrorIndicator();
        }
    };

    this.getGroup = function() {
        return group;
    };

    this.highlight=function(b)
    {
        if(b) background.node.classList.add("op_highlight");
            else background.node.classList.remove("op_highlight");
    };

    // group.push(background);
    group.transform('t' + x + ',' + y);
};



// --------------------------------------------------------------------------------------



var OpUi = function(paper, op, x, y, w, h, txt) {
    var self = this;
    this.links = [];
    this.portsIn = [];
    this.portsOut = [];
    var hidden = false;
    var deleted = false;
    this.op = op;
    var selected = false;
    var width = w;

    var oldUiAttribs = '';
    var startMoveX = -1;
    var startMoveY = -1;
    var olsPosX = 0;
    var olsPosY = 0;
    var posx = 0;
    var posy = 0;

    this.isMouseOver = false;

    op.onUiAttrChange = function(attribs) {
        if (attribs && attribs.hasOwnProperty('warning')) {
            this.oprect.updateErrorIndicator();

        }
        if (attribs && attribs.hasOwnProperty('error')) {
            this.oprect.updateErrorIndicator();
        }
        if (typeof attribs.title !== 'undefined' && attribs.title !== null) {
            this.oprect.setTitle(attribs.title);
        }

    }.bind(this);

    this.fixTitle=function()
    {
        this.oprect.setTitle();
    };

    this.remove = function() {
        deleted = true;
        this.hide();
        this.oprect.getGroup().remove();
        this.oprect.deleteUi();
    };

    this.getHeight = function() {
        return this.oprect.getHeight();
    };

    this.getWidth = function() {
        return this.oprect.getWidth();
    };

    this.getSubPatch = function() {
        if (!op.uiAttribs.subPatch) return 0;
        else return op.uiAttribs.subPatch;
    };

    this.showFocus = function() {
        this.oprect.showFocus();
    };

    this.isSelected = function() {
        return selected;
    };

    this.hide = function() {
        hidden = true;
        this.oprect.removeUi();
        this.oprect.getGroup().hide();

        var j = 0;
        for (j in self.portsIn) self.portsIn[j].removeUi();
        for (j in self.portsOut) self.portsOut[j].removeUi();

        for (j in self.links) {
            self.links[j].hide();
            self.links[j].hideAddButton();
        }
    };

    this.show = function() {
        if (deleted) return;
        hidden = false;

        this.oprect.addUi();
        this.oprect.getGroup().show();

        var j = 0;
        if (op.objName != 'Ops.Ui.Comment') {
            for (j in self.portsIn) self.portsIn[j].addUi(this.oprect.getGroup());
            for (j in self.portsOut) self.portsOut[j].addUi(this.oprect.getGroup());
        }

        for (j in self.links) self.links[j].show();

        self.setPos();
    };

    this.isHidden = function() {
        return hidden;
    };

    this.removeDeadLinks = function() {
        var found = true;
        var j = 0;
        var port = null;

        while (found) {
            found = false;

            var p = 0;
            for (p in self.portsIn) {
                port = self.portsIn[p];
                for (j in port.links) {
                    if (port.links[j].portIn === null || port.links[j].portOut === null) {
                        port.links[j].remove();
                        console.log('found zombie link');
                        found = true;
                    }
                }
            }

            for (p in self.portsOut) {
                port = self.portsOut[p];
                for (j in port.links) {
                    if (port.links[j].portIn === null || port.links[j].portOut === null) {
                        port.links[j].remove();
                        found = true;
                    }
                }
            }
        }
        found = true;

        while (found) {
            found = false;
            for (j in self.links) {
                if (!self.links[j]) {
                    self.links.splice(j, 1);
                    found = true;
                } else
                if (self.links[j].p1 === null || self.links[j].p2 === null) {
                    self.links[j].hide();
                    self.links.splice(j, 1);
                    found = true;
                } else
                if (!self.links[j].p2.thePort.isLinked() || !self.links[j].p1.thePort.isLinked()) {
                    self.links[j].hide();
                    self.links.splice(j, 1);
                    found = true;
                }
            }
        }
    };

    this.showAddButtons = function() {
        if (this.isHidden()) return;
        // self.removeDeadLinks();
        for (var j in self.links) self.links[j].showAddButton();
    };

    this.hideAddButtons = function() {
        // self.removeDeadLinks();
        for (var j in self.links) self.links[j].hideAddButton();
    };

    this.doMoveFinished = function() {
        CABLES.undo.add({
            undo: function() {
                try {
                    var u = JSON.parse(oldUiAttribs);
                    self.setPos(u.translate.x, u.translate.y);
                } catch (e) {}
            },
            redo: function() {}
        });

        startMoveX = -1;
        startMoveY = -1;
        self.isDragging = false;
    };

    this.getPosX = function() {
        return posx;
    };
    this.getPosY = function() {
        return posy;
    };

    this.setPosFromUiAttr=function()
    {
        self.oprect.setPosition(op.uiAttribs.translate.x, op.uiAttribs.translate.y);
        for (var j in self.links)self.links[j].redraw();
    }

    this.setPos = function(x, y) {
        if (isNumber(x)) {
            posx = x;
            posy = y;
        }

        self.oprect.setPosition(posx, posy);
        self.op.uiAttr({
            "translate": {
                x: posx,
                y: posy
            }
        });

        for (var j in self.links)
            self.links[j].redraw();
    };

    this.doMove = function(dx, dy, a, b, e) {
        if (e.which == 3) return;
        if (e.which == 2) return;

        e = mouseEvent(e);

        var pos = gui.patch().getCanvasCoordsMouse(e);

        if (!self.op.uiAttribs) {
            self.op.uiAttribs = {};
            self.op.uiAttribs.translate = {
                x: pos.x,
                y: pos.y
            };
        }

        if (startMoveX == -1 && self.op.uiAttribs.translate) {
            oldUiAttribs = JSON.stringify(self.op.uiAttribs);
            startMoveX = pos.x - self.op.uiAttribs.translate.x;
            startMoveY = pos.y - self.op.uiAttribs.translate.y;
        }

        pos.x = pos.x - startMoveX;
        pos.y = pos.y - startMoveY;

        // var snapRange=10;
        // var snap=(pos.x%65)-snapRange;
        // if(snap>0 && snap<snapRange) pos.x-=snap;
        // if(snap<0 && snap>-snapRange) pos.x-=snap;
        //
        // snap=(pos.y%50)-snapRange;
        // if(snap>0 && snap<snapRange) pos.y-=snap;
        // if(snap<0 && snap>-snapRange) pos.y-=snap;

        // if(e.shiftKey===true)
        // {
        //     pos.x=parseInt(pos.x/25,10)*25;
        //     pos.y=parseInt(pos.y/25,10)*25;
        // }

        self.setPos(pos.x, pos.y);
        self.isDragging = true;
    };

    this.oprect = new OpRect(this, x, y, w, h, txt, self.op.objName);

    this.setEnabled = function(en) {
        this.op.setEnabled(en);
        this.oprect.setEnabled(en);

        if (en) gui.patchConnection.send(CABLES.PACO_OP_ENABLE, {
            "op": this.op.id
        });
        else gui.patchConnection.send(CABLES.PACO_OP_DISABLE, {
            "op": this.op.id
        });


        // if(!en) this.op.unLinkTemporary();
        //     else this.op.preUnLinkTemporary();

    };

    this.getPortLinks = function(portId) {
        var links = [];
        for (var i = 0; i < this.links.length; i++) {
            if (this.links[i].p2)
                if (this.links[i].p2.thePort.id == portId || this.links[i].p1.thePort.id == portId) links.push(this.links[i]);
        }

        return links;
    };

    this.setSelected = function(sel) {
        selected = sel;
        if (sel) self.showAddButtons();
        else self.hideAddButtons();
        self.isDragging = false;
        this.oprect.setSelected(sel);
    };

    this.highlight=function(b)
    {
        this.oprect.highlight(b);
    };

    this.initPorts=function()
    {
        var i=0;
        
        for(i=0;i<this.portsIn.length;i++)
        {
            this.portsIn[i].removeUi();
        }

        for(i=0;i<this.portsOut.length;i++)
        {
            this.portsOut[i].removeUi();
        }

        this.portsIn.length=0;
        this.portsOut.length=0;

        for (i in self.op.portsIn) {
            var p = self.op.portsIn[i];

            if (!p.uiAttribs) p.uiAttribs = {};

            var uiPort=null;

            if (p.uiAttribs.display != 'readonly' && !p.uiAttribs.hidePort)
            {
                uiPort=self.addPort(PORT_DIR_IN, p);
            }
            else
            {
                p.onUiAttrChange=function()
                {
                    gui.patch().updateOpParams(self.op.id);
                    self.initPorts();
                    self.setPos();
                }.bind(self);
            }

            if (p.uiAttribs.hasOwnProperty('display')) {
                if (p.uiAttribs.display == 'dropdown') p.uiAttribs.type = 'string';
                if (p.uiAttribs.display == 'file') p.uiAttribs.type = 'string';
                if (p.uiAttribs.display == 'bool') p.uiAttribs.type = 'bool';
            }

        }

        for (var i2 in op.portsOut)
            self.addPort(PORT_DIR_OUT, op.portsOut[i2]);

        var ops1=[];
        var ops2=[];
        var ps1=[];
        var ps2=[];
        for(var j=0;j<this.links.length;j++)
        {
            ops1.push(this.links[j].p1.thePort.parent);
            ops2.push(this.links[j].p2.thePort.parent);

            ps1.push(this.links[j].p1.thePort.getName());
            ps2.push(this.links[j].p2.thePort.getName());
        }

        while(this.links.length>0)
        {
            this.links[0].unlink();
        }

        for(var i3=0;i3<ops1.length;i3++)
        {
            var l=gui.scene().link(
                ops1[i3],ps1[i3],
                ops2[i3],ps2[i3]
            );
        }
    };

    this.addPort = function(_inout, thePort) {
        
        var inout = _inout;
        var portIndex = this.portsIn.length;
        if (inout == PORT_DIR_OUT) portIndex = this.portsOut.length;

        var w = (CABLES.UI.uiConfig.portSize + CABLES.UI.uiConfig.portPadding) * portIndex;
        if (self.oprect.getWidth() < w + CABLES.UI.uiConfig.portSize + CABLES.UI.uiConfig.resizeBarWidth * 2)
            self.oprect.setWidth(w + CABLES.UI.uiConfig.portSize + CABLES.UI.uiConfig.resizeBarWidth * 2);

        var port = new CABLES.UI.Port(thePort);

        port.direction = inout;
        port.op = self.op;
        port.opUi = self;
        port.portIndex = portIndex;

        if (this.oprect.getRect()) port.addUi(this.oprect.getGroup());

        if (inout == PORT_DIR_OUT) this.portsOut.push(port);
        else this.portsIn.push(port);

        return port;
    };
};
