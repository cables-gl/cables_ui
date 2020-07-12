CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.DRAGGINGOPS_STARTX = 0;
CABLES.UI.DRAGGINGOPS_STARTY = 0;
CABLES.UI.DRAGGINGOPS = false;
CABLES.UI.DRAGGINGOPSDIR = -1;


CABLES.UI.cleanRaphael = function (el)
{
    el.node.removeAttribute("font-family");
    el.node.removeAttribute("font-size");
    el.node.removeAttribute("stroke-width");
    el.node.removeAttribute("stroke");
    el.node.removeAttribute("fill");
    el.node.removeAttribute("fill-opacity");
    el.node.removeAttribute("stroke-opacity");
    el.node.style.removeProperty("-webkit-tap-highlight-color");
    el.node.style.removeProperty("font-family");
    el.node.style.removeProperty("font-size");
    el.node.style.removeProperty("text-anchor"); // set as: "text-anchor: middle"
};

CABLES.UI.isComment = function (objname)
{
    return objname.indexOf("Ops.Ui.Comment") == 0;
};

CABLES.UI.snapOpPosX = function (posX)
{
    return Math.round(posX / CABLES.UI.uiConfig.snapX) * CABLES.UI.uiConfig.snapX;
};

CABLES.UI.snapOpPosY = function (posY)
{
    return Math.round(posY / CABLES.UI.uiConfig.snapY) * CABLES.UI.uiConfig.snapY;
};

CABLES.UI.updateHoverToolTip = function (event, port)
{
    if (!port) return;

    let txt = CABLES.UI.getPortDescription(port);
    let val = null;
    if (port)
    {
        if (port.type == CABLES.OP_PORT_TYPE_VALUE || port.type == CABLES.OP_PORT_TYPE_STRING)
        {
            val = port.get();
            if (CABLES.UTILS.isNumeric(val))val = Math.round(val * 1000) / 1000;
            else val = "\"" + val + "\"";
            txt += ": <span class=\"code\">" + val + "</span>";
        }
        else if (port.type == CABLES.OP_PORT_TYPE_ARRAY)
        {
            val = port.get();
            if (val)
            {
                txt += " (total:" + val.length + ") <span class=\"\"> [";
                for (let i = 0; i < Math.min(3, val.length); i++)
                {
                    if (i != 0)txt += ", ";

                    if (CABLES.UTILS.isNumeric(val[i]))txt += Math.round(val[i] * 1000) / 1000;
                    else if (typeof val[i] == "string")txt += "\"" + val[i] + "\"";
                    else if (typeof val[i] == "object")txt += "[object]";
                    else JSON.stringify(val[i]);
                }

                txt += " ...] </span>";
            }
            else txt += "no array";
        }
    }

    CABLES.UI.showToolTip(event, txt);
    if (CABLES.UI.hoverInterval == -1)
        CABLES.UI.hoverInterval = setInterval(function ()
        {
            CABLES.UI.updateHoverToolTip(event, port);
        }, 50);
};


CABLES.UI.getPortDescription = function (thePort)
{
    let str = "";

    str += "[" + thePort.getTypeString() + "] ";

    if (thePort.uiAttribs.title) str += " <b>" + thePort.uiAttribs.title + " (" + thePort.getName() + ") </b> ";
    else str += " <b>" + thePort.getName() + "</b> ";
    let strInfo = "";

    if (thePort.direction == CABLES.PORT_DIR_IN) strInfo += CABLES.UI.TEXTS.portDirIn;
    if (thePort.direction == CABLES.PORT_DIR_OUT) strInfo += CABLES.UI.TEXTS.portDirOut;
    if (thePort.isLinked()) strInfo += CABLES.UI.TEXTS.portMouseUnlink;
    else strInfo += CABLES.UI.TEXTS.portMouseCreate;
    CABLES.UI.showInfo(strInfo);

    return str;
};

Raphael.el.setGroup = function (group)
{
    this.group = group;
};

Raphael.el.getGroup = function ()
{
    return this.group;
};

const OpRect = function (_opui, _x, _y, _w, _h, _text, objName)
{
    let isSelected = true;
    const group = Raphael.fn.set();
    let background = null;

    this._striked = null;

    let miniRect = null;
    let backgroundResize = null;
    // var colorHandle=null;
    // var resizeHandle = null;
    let label = null;
    let w = _w;
    let h = _h;
    const x = _x;
    const y = _y;
    const opui = _opui;
    let title = null;
    this._attachedComment = null;
    let commentText = null;
    this._errorIndicator = null;
    this._colorHandle = null;

    this.getHeight = function ()
    {
        return h;
    };

    this.getRect = function ()
    {
        return background;
    };

    this.isVisible = function ()
    {
        return label !== null;
    };

    // var lastRotation=0;
    this._updateRotation = function ()
    {
        if (this.getGroup() && opui.op.uiAttribs.rotate)
        {
            // this.getGroup().rotate();
            // this.getGroup().rotate(-1*lastRotation,w/2,h/2);
            // if(this.getGroup()) this.getGroup().node.style.transform='rotate('+opui.op.uiAttribs.rotate+'deg)';
            this.getGroup().rotate(opui.op.uiAttribs.rotate, 0, 0);

            // lastRotation=opui.op.uiAttribs.rotate;
        }
    };

    this.setPosition = function (posx, posy)
    {
        // round for performane
        posx = Math.round(posx);
        posy = Math.round(posy);

        if (this.getGroup())
        {
            this.getGroup().transform("t" + posx + "," + posy);
            this._updateRotation();
        }

        if (miniRect) miniRect.attr({
            "x": posx,
            "y": posy
        });
    };

    this.deleteUi = function ()
    {
        group.clear();

        if (background) background.remove();
        if (label) label.remove();
        if (commentText) commentText.remove();
        if (backgroundResize)backgroundResize.remove();
        if (this._errorIndicator) this._errorIndicator.remove();
        // if(resizeHandle)resizeHandle.remove();
        if (this._colorHandle) this._colorHandle.remove();
        if (miniRect) miniRect.remove();
        if (this._attachedComment) this._attachedComment.remove();
        // label=background=commentText=backgroundResize=null;

        if (this._striked) this._striked.remove();
        if (this._striked2) this._striked2.remove();


        this._attachedComment = label = background = commentText = null;
    };

    this.removeUi = function ()
    {
        if (!this.isVisible()) return;
        this.deleteUi();
    };

    this.getScreenCTM = function ()
    {
        if (background && background.node) return background.node.getScreenCTM();
    };

    this.showCopyAnim = function ()
    {
        if (!background || !background.node) return;
        background.node.classList.add("copyOp");

        if (!background.node.hasAnimEndListenerCopy)
        {
            background.node.addEventListener("animationend", function ()
            {
                background.node.classList.remove("copyOp");
            }, false);
            background.node.hasAnimEndListenerCopy = true;
        }
    };

    this.showFocus = function ()
    {
        if (!background || !background.node) return;

        background.node.classList.add("focusOp");

        if (!background.node.hasAnimEndListenerFocus)
        {
            background.node.addEventListener("animationend", function ()
            {
                background.node.classList.remove("focusOp");
            }, false);
            background.node.hasAnimEndListenerFocus = true;
        }
    };

    this.getWidth = function ()
    {
        return w;
    };

    this.setWidth = function (__w)
    {
        if (__w)
        {
            w = __w;
        }
        else
        {
            if (commentText || backgroundResize) return;
            const labelWidth = label.getBBox().width + 20;
            let setw = w;

            if (labelWidth > w)
            {
                setw = labelWidth;
            }
            if (this.isVisible())
            {
                background.attr({ "width": setw });

                if (this._colorHandle) this._colorHandle.attr({ "x": setw - CABLES.UI.uiConfig.resizeBarWidth });

                label.attr({ "x": setw / 2 });

                if (miniRect) miniRect.attr({
                    "width": setw,
                    "height": 10
                });
            }
            w = setw;
        }
    };

    function hover(event, a, b)
    {
        CABLES.UI.selectedEndOp = opui;
        opui.isMouseOver = true;
    }

    function unhover()
    {
        opui.isMouseOver = false;
        self.hoverFitPort = false;
        // $('#drop-op-canlink').hide();
        gui.setCursor("default");
    }

    let shakeCountP = 0;
    let shakeCountN = 0;
    let shakeLastX = -1;
    let shakeStartTime = 0;
    let shakeTimeOut = 0;
    let lastShakeDir = false;

    const down = function (__x, __y, e)
    {
        shakeCountP = 0;
        shakeCountN = 0;

        if (e.metaKey || e.altKey || e.buttons == CABLES.UI.MOUSE_BUTTON_WHEEL)
        {
            CABLES.UI.quickAddOpStart = opui;
            gui.setCursor("copy");
            return;
        }

        $("#patch").focus();

        if (e.buttos == 2)
        {
            // show context menu...
            return;
        }

        if (opui.isSelected())
        {
            if (e.shiftKey)
            {
                gui.patch().removeSelectedOp(opui);
                opui.setSelected(false);
            }
            return;
        }

        gui.patch().prepareMovingOps();

        opui.showAddButtons();

        if (!e.shiftKey)
        {
            gui.patch().setSelectedOp(null);
            gui.patch().setSelectedOp(opui);
        }
        else
        {
            gui.patch().addSelectedOp(opui);
            opui.setSelected(true);
        }
    };

    const move = function (dx, dy, a, b, e)
    {
        if (CABLES.UI.selectedStartPort && CABLES.UI.selectedEndOp)
        {
            const fit = CABLES.UI.selectedEndOp.op.findFittingPort(CABLES.UI.selectedStartPort);
            if (fit)
            {
                // self.hoverFitPort=true;
                gui.setCursor("port_check");
            }
        }
        else gui.setCursor("default");


        if ((e.metaKey || e.altKey) && gui.patch().getSelectedOps().length == 1)
        {
            return;
        }

        // if(self.hoverFitPort) gui.setCursor("check");


        if (shakeLastX != -1)
        {
            if (shakeLastX - a > 30 && lastShakeDir)
            {
                lastShakeDir = false;
                shakeCountP++;
                shakeLastX = a;
                clearTimeout(shakeTimeOut);
                shakeTimeOut = setTimeout(function ()
                {
                    shakeCountP = 0;
                    shakeCountN = 0;
                }, 250);
            }
            else
            if (shakeLastX - a < -30 && !lastShakeDir)
            {
                lastShakeDir = true;
                shakeCountN++;
                shakeLastX = a;
                clearTimeout(shakeTimeOut);
                shakeTimeOut = setTimeout(function ()
                {
                    shakeCountP = 0;
                    shakeCountN = 0;
                }, 250);
            }
            if (shakeCountP + shakeCountN == 1)
            {
                shakeStartTime = CABLES.now();
            }

            if (shakeCountP + shakeCountN >= 6 && CABLES.now() - shakeStartTime > 100)
            {
                opui.op.unLinkTemporary();
                shakeLastX = -1;
            }
        }
        shakeLastX = a;

        gui.patch().moveSelectedOps(dx, dy, a, b, e);
        this._updateElementOrder(true);
        gui.setStateUnsaved();
    };

    const up = function (e)
    {
        this._updateElementOrder(false);

        // if((e.metaKey || e.altKey || e.buttons===CABLES.UI.MOUSE_BUTTON_WHEEL) && CABLES.UI.quickAddOpStart)
        if (CABLES.UI.quickAddOpStart)
        {
            gui.patch().linkTwoOps(CABLES.UI.quickAddOpStart, CABLES.UI.selectedEndOp);

            CABLES.UI.quickAddOpStart = null;
            CABLES.UI.selectedEndOp = null;

            return false;
        }

        shakeCountP = 0;
        shakeCountN = 0;

        if (CABLES.UI.LINKHOVER)
        {
            const oldLink = CABLES.UI.LINKHOVER;
            if (oldLink.p1 && oldLink.p2)
            {
                let portIn = oldLink.p1;
                let portOut = oldLink.p2;

                if (oldLink.p2.thePort.direction == CABLES.PORT_DIR_IN)
                {
                    portIn = oldLink.p2;
                    portOut = oldLink.p1;
                }

                oldLink.unlink();

                if (CABLES.Link.canLink(opui.op.portsIn[0], portOut.thePort))
                {
                    gui.corePatch().link(
                        opui.op,
                        opui.op.portsIn[0].getName(), portOut.thePort.parent, portOut.thePort.getName()
                    );

                    gui.corePatch().link(
                        opui.op,
                        opui.op.portsOut[0].getName(), portIn.thePort.parent, portIn.thePort.getName()
                    );

                    const pos = gui.patch().getCanvasCoordsMouse(e);

                    // opui.setPos(portOut.thePort.parent.uiAttribs.translate.x,opui.op.uiAttribs.translate.y);
                    opui.setPos(pos.x, opui.op.uiAttribs.translate.y);
                }
                else
                {
                    gui.corePatch().link(
                        portIn.thePort.parent, portIn.thePort.getName(),
                        portOut.thePort.parent, portOut.thePort.getName()
                    );
                }
            }
        }

        gui.patch().moveSelectedOpsFinished();
        gui.opParams.show(opui.op);
        CABLES.UI.LINKHOVER = null;
    };

    // this.getBgColor=function()
    // {
    //     var fill=CABLES.UI.uiConfig.colorOpBg;
    //     // if( objName.startsWith('Ops.Gl') ) fill='#ccffcc';
    //     // else if( objName.startsWith('Ops.WebAudio') ) fill='#bbeeff';
    //     return fill;
    // };

    this.updateAttachedComment = function ()
    {
        if (!opui.op.uiAttribs.comment && this._attachedComment)
        {
            this._attachedComment.remove();
            this._attachedComment = null;
            return;
        }
        if (!opui.op.uiAttribs.comment) return;

        if (!this._attachedComment) this.setWidth();

        const yy = h / 2 - 0.8;
        const xx = w + 10;

        if (!this._attachedComment)
        {
            this._attachedComment = gui.patch().getPaper().text(xx, yy, "...");
            group.push(this._attachedComment);
            this._attachedComment.attr({ "fill": "#ccc", "text-anchor": "start" });
        }

        this._attachedComment.attr(
            {
                "x": xx,
                "y": yy,
                "text": opui.op.uiAttribs.comment
            }
        );

        opui.setPos();
    };

    this.updateComment = function ()
    {
        if (CABLES.UI.isComment(objName))
        {
            if (commentText)
            {
                let cmtStr = opui.op.uiAttribs.comment_text;
                if (!cmtStr && opui.op.text) cmtStr = opui.op.text.get();

                commentText.attr({
                    "text": cmtStr,
                    "text-anchor": "start",
                    "fill": "#eee",
                    "x": 0
                });
            }

            const color = opui.op.uiAttribs.color || "#eee";

            if (label)
            {
                let cmtTitleStr = opui.op.uiAttribs.comment_title;
                if (!cmtTitleStr && opui.op.inTitle) cmtTitleStr = opui.op.inTitle.get();

                label.attr({
                    "text": cmtTitleStr,
                    "text-anchor": "start",
                    "stroke": color,
                    "fill": color,
                    "x": 0
                });
            }
            this.updateSize();
            this._updateRotation();
        }
    };

    this.updateSize = function ()
    {
        if (CABLES.UI.isComment(objName))
        {
            let sw = 150;
            let sh = 100;
            const resizeSize = 0;
            if (!label) return;

            if (opui.op.uiAttribs.size)
            {
                sw = opui.op.uiAttribs.size[0];
                sh = opui.op.uiAttribs.size[1];
            }

            let commentWidth = label.getBBox().width;
            let commentHeight = label.getBBox().height + 20;

            label.attr({
                "y": 40,
                "x": -5
            });

            if (commentText)
            {
                CABLES.UI.SVGParagraph(commentText, sw * 2);
                // commentText.toFront();
                commentText.attr({ "y": commentText.getBBox().height / 2 + 76 });
                commentHeight += commentText.getBBox().height;
                commentWidth = Math.max(commentWidth, commentText.getBBox().width);
            }

            let ly = 0;
            if (label.getBBox().height == 0)
            {
                ly = 60;
                commentHeight += 30;
            }

            background.attr({
                "x": -20,
                "y": ly,
                "width": commentWidth + 40 || 10,
                "height": commentHeight - 20 || 10,
                "fill": "#000"
            });
        }
    };

    this.updateColorHandle = function ()
    {
        if (!gui.patch().isOpCurrentSubpatch(opui.op))
        {
            if (this._errorIndicator) this._errorIndicator.remove();
            return;
        }

        if (CABLES.UI.isComment(objName))
        {
            this.updateComment();
            return;
        }

        if (opui.op.uiAttribs.color)
        {
            if (!this._colorHandle)
            {
                this._colorHandle = gui.patch().getPaper().rect(w - CABLES.UI.uiConfig.resizeBarWidth, 3, CABLES.UI.uiConfig.resizeBarWidth, h - 6);
                CABLES.UI.cleanRaphael(this._colorHandle);
                group.push(this._colorHandle);
            }

            opui.setPos();

            this._colorHandle.attr({ "fill": opui.op.uiAttribs.color });
            this.setWidth();

            // if (background) this._errorIndicator.attr({
            //     cx: background.getBBox().width
            // });
            // this._errorIndicator.toFront();
        }
        else
        {
            if (this._colorHandle)
            {
                this._colorHandle.remove();
                this._colorHandle = null;
            }
        }
    };


    this.updateErrorIndicator = function ()
    {
        let isError = false;
        if (!gui.patch().isOpCurrentSubpatch(opui.op))
        {
            if (this._errorIndicator) this._errorIndicator.remove();
            return;
        }

        if (opui.op.uiAttribs.error || (opui.op.uiAttribs.uierrors && opui.op.uiAttribs.uierrors.length > 0)) // || opui.op.uiAttribs.warning)
        {
            if (!this._errorIndicator)
            {
                this._errorIndicator = gui.patch().getPaper().circle(w, h / 2, 4);

                if (opui.op.objName.indexOf("Deprecated") > -1) this._errorIndicator.node.classList.add("error-indicator-warning");
                if (opui.op.uiAttribs.error) isError = true;

                let errMsg = "";

                if (opui.op.uiAttribs.uierrors && opui.op.uiAttribs.uierrors.length > 0)
                {
                    isError = false;
                    for (let i = 0; i < opui.op.uiAttribs.uierrors.length; i++)
                    {
                        if (opui.op.uiAttribs.uierrors[i].level > 1)
                        {
                            errMsg = opui.op.uiAttribs.uierrors[i].txt;
                            isError = true;
                            break;
                        }
                    }
                }

                if (isError)
                {
                    this._errorIndicator.node.classList.add("error-indicator");
                    this._errorIndicator.node.classList.add("tt");
                    this._errorIndicator.node.setAttribute("data-tt", opui.op.uiAttribs.error || errMsg);

                    group.push(this._errorIndicator);
                }
                else
                {
                    if (this._errorIndicator)
                    {
                        this._errorIndicator.remove();
                        this._errorIndicator = null;
                    }
                }
            }

            opui.setPos();

            if (this._errorIndicator)
            {
                if (background) this._errorIndicator.attr({
                    "cx": background.getBBox().width
                });
                this._errorIndicator.toFront();
            }
        }
        else
        {
            if (this._errorIndicator)
            {
                this._errorIndicator.remove();
                this._errorIndicator = null;
            }
        }
    };

    const dblClick = function (ev)
    {
        gui.patch().setSelectedOp(null);
        if (CABLES.Op.isSubpatchOp(opui.op.objName)) gui.patch().setCurrentSubPatch(opui.op.patchId.val);
    };

    const mouseUp = function (ev)
    {
        opui.isDragging = false;
        CABLES.UI.DRAGGINGOPS = false;
    };

    let lastMouseDown = 0;

    const mouseDown = function (ev)
    {
        if (ev.metaKey || ev.altKey || ev.buttons == CABLES.UI.MOUSE_BUTTON_WHEEL)
        {
            CABLES.UI.quickAddOpStart = opui;
            gui.setCursor("copy");
            return;
        }

        const diff = performance.now() - lastMouseDown;
        if (diff < 400) dblClick();
        lastMouseDown = performance.now();
    };

    this._updateElementOrder = function (reverse)
    {
        if (!background) return;

        const perf = CABLES.uiperf.start("_updateElementOrder");

        if (reverse)
        {
            for (let i = 0; i < opui.portsIn.length; i++) if (opui.portsIn[i].rect) opui.portsIn[i].rect.toBack();
            for (let i = 0; i < opui.portsOut.length; i++) if (opui.portsOut[i].rect) opui.portsOut[i].rect.toBack();

            if (backgroundResize) backgroundResize.toBack();
            if (this._colorHandle) this._colorHandle.toBack();

            if (this._striked) this._striked.toBack();
            if (this._striked2) this._striked2.toBack();

            if (commentText) commentText.toBack();
            if (this._errorIndicator) this._errorIndicator.toBack();

            label.toBack();
            background.toBack();
        }
        else
        {
            background.toFront();
            label.toFront();

            for (let i = 0; i < opui.portsIn.length; i++) if (opui.portsIn[i].rect) opui.portsIn[i].rect.toFront();
            for (let i = 0; i < opui.portsOut.length; i++) if (opui.portsOut[i].rect) opui.portsOut[i].rect.toFront();

            if (backgroundResize) backgroundResize.toFront();
            if (this._colorHandle) this._colorHandle.toFront();

            if (this._striked) this._striked.toFront();
            if (this._striked2) this._striked2.toFront();

            if (commentText) commentText.toFront();
            if (this._errorIndicator) this._errorIndicator.toFront();
        }

        perf.finish();
    };


    this._updateStriked = function ()
    {
        if (opui.op.uiAttribs.working == true && this._striked)
        {
            this._striked.remove();
            this._striked2.remove();
            this._striked = null;
            this._striked2 = null;
            return;
        }
        if (opui.op.uiAttribs.working !== false) return;

        if (!this._striked)
        {
            this._striked = gui.patch().getPaper().path("M0,0 L20,20");
            this._striked.node.classList.add("op_striked");

            this._striked2 = gui.patch().getPaper().path("M0,0 L20,20");
            this._striked2.node.classList.add("op_striked");

            group.push(this._striked, this._striked2);
        }

        opui.setPos();

        let bb = { "width": 0, "height": 30 };
        if (background)bb = background.getBBox();
        const strX = bb.width;
        const strY = bb.height / 2 + 3;

        this._striked.attr("path", "M" + (strX - 5) + "," + (strY - 5) + " L" + (strX + 5) + "," + (strY + 5));
        this._striked2.attr("path", "M" + (strX + 5) + "," + (strY - 5) + " L" + (strX - 5) + "," + (strY + 5));
    };

    this.addUi = function ()
    {
        if (this.isVisible()) return;

        const perf = CABLES.uiperf.start("patchOpaddUi");

        if (opui.op.uiAttribs.size)
        {
            w = opui.op.uiAttribs.size[0];
            h = opui.op.uiAttribs.size[1];
        }


        const mmPaper = gui.patch().getViewBox().getMiniMapPaper();
        if (mmPaper)
        {
            miniRect = mmPaper.rect(x, y, w, h);
            miniRect.attr({
                "width": w,
                "height": 32,
                "fill-opacity": 1
            });

            miniRect.node.classList.add(CABLES.UI.uiConfig.getOpMiniRectClassName(opui.op.objName));
            CABLES.UI.cleanRaphael(miniRect);
        }

        background = gui.patch().getPaper().rect(0, 3, w, h - 6);
        CABLES.UI.cleanRaphael(background);
        background.node.classList.add("op_background");
        if (opui.op.objName.startsWith("Ops.User"))
        {
            background.node.classList.add("userop");
            const myOpName = "Ops.User." + gui.user.usernameLowercase + ".";
            if (opui.op.objName.startsWith(myOpName))
            {
                background.node.classList.add("mine");
            }
        }
        const objNameClassNameified = opui.op.objName.replace(/[\W_]+/g, "_");
        background.node.classList.add(objNameClassNameified);
        background.node.setAttribute("data-info", CABLES.UI.TEXTS.op_background);


        // resizeHandle=gui.patch().getPaper().rect(w-CABLES.UI.uiConfig.resizeBarWidth, 0, CABLES.UI.uiConfig.resizeBarWidth, 0);
        // CABLES.UI.cleanRaphael(resizeHandle);
        // resizeHandle.node.classList.add(CABLES.UI.uiConfig.getOpHandleClassName(opui.op.objName));
        // resizeHandle.node.classList.add('op_handle');

        label = gui.patch().getPaper().text(0 + w / 2, 0 + h / 2 - 0.8, "??!");

        label.node.classList.add(CABLES.UI.uiConfig.getOpHandleClassName(opui.op.objName));

        // label.attr({"font-family": "SourceSansPro, sans-serif" });

        CABLES.UI.cleanRaphael(label);

        this.setTitle(title);

        background.hover(hover, unhover);
        background.onmouseup = mouseUp;
        background.drag(move.bind(this), down.bind(this), up.bind(this));
        background.mousedown(mouseDown);

        if (CABLES.Op.isSubpatchOp(opui.op.objName)) background.node.classList.add("op_subpatch");
        if (opui.op.objName == "Ops.Ui.PatchInput") background.node.classList.add("op_subpatch_in");
        if (opui.op.objName == "Ops.Ui.PatchOutput") background.node.classList.add("op_subpatch_out");

        if (CABLES.UI.isComment(objName))
        {
            let sw = 150;
            let sh = 100;

            if (opui.op.uiAttribs.size)
            {
                sw = opui.op.uiAttribs.size[0];
                sh = opui.op.uiAttribs.size[1];
            }

            // resizeHandle.remove();

            label.node.setAttribute("class", "commentTitle");

            CABLES.UI.cleanRaphael(label);

            let cmtStr = "";
            cmtStr = opui.op.uiAttribs.comment_text;
            if (!cmtStr && opui.op.text)cmtStr = opui.op.text.get();

            commentText = gui.patch().getPaper().text(0, 0, "opui.op.text.get()" + cmtStr);
            commentText.attr({
                "width": sw
            });
            commentText.node.setAttribute("class", "commentText");
            background.attr({
                "opacity": 0.001
            });

            this.updateComment();

            group.push(commentText);

            this._updateStriked();
            this._updateElementOrder();
        }


        if (objName == "Ops.Ui.CommentArea")
        {
            const resizeSize = 10;

            backgroundResize = gui.patch().getPaper().rect(0, 0, resizeSize, resizeSize).attr(
                {
                    "x": w - resizeSize,
                    "y": h - resizeSize,
                    "fill": "#000",
                    "stroke": CABLES.UI.uiConfig.colorPatchStroke,
                    "stroke-width": 0,
                    "opacity": 1.0,
                    "cursor": "se-resize"
                }
            );

            CABLES.UI.cleanRaphael(backgroundResize);

            const resizeCommentStart = function (dx, dy, a, b, e)
            {
                opui.isDragging = true;
            };

            const resizeCommentEnd = function (dx, dy, a, b, e)
            {
                opui.isDragging = false;
            };

            const resizeCommentMove = function (dx, dy, ex, ey, e)
            {
                const opX = opui.op.uiAttribs.translate.x;
                const opY = opui.op.uiAttribs.translate.y;
                const pos = gui.patch().getCanvasCoordsMouse(e);

                if (CABLES.UI.userSettings.get("snapToGrid"))
                {
                    pos.x = CABLES.UI.snapOpPosX(pos.x);
                    pos.y = CABLES.UI.snapOpPosY(pos.y);
                }

                let width = pos.x - opX;
                let height = pos.y - opY;

                if (width < 50)width = 50;
                if (height < CABLES.UI.uiConfig.opHeight) height = CABLES.UI.uiConfig.opHeight;

                backgroundResize.attr({
                    "x": width - resizeSize,
                    "y": height - resizeSize
                });

                background.attr({
                    "width": width,
                    "height": height - 5 // why is this needed?
                });

                _opui.op.uiAttribs.size = [width, height];
                h = height;

                _opui.updateHeight();

                group.toBack();
                this.updateColorHandle();
                // this._updateElementOrder();
            };

            this.updateComment();

            backgroundResize.drag(resizeCommentMove.bind(this), resizeCommentStart, resizeCommentEnd);


            group.push(backgroundResize, commentText);
        }


        this.updateAttachedComment();

        group.push(background, label);

        // resizeHandle.toFront();
        this.updateSize();
        this.updateColorHandle();
        this._updateStriked();
        this._updateElementOrder();

        perf.finish();
    };

    this.setEnabled = function (enabled)
    {
        if (this.isVisible())
            if (enabled) group.attr({
                "fill-opacity": 1
            });
            else group.attr({
                "fill-opacity": 0.25
            });
    };

    this.setSelected = function (sel)
    {
        if (isSelected == sel) return;


        // if (this._errorIndicator) this._errorIndicator.toFront();
        isSelected = sel;

        if (this.isVisible() && !commentText)
            if (sel)
            {
                background.node.classList.add("active");
                label.node.classList.add("active");
                // background.attr( { "fill": CABLES.UI.uiConfig.colorOpBgSelected,"stroke-width":0,"stroke":"#fff" });
                // label.attr( { "font-weight": "bold" });
            }
            else
            {
                background.node.classList.remove("active");
                label.node.classList.remove("active");
            // background.attr( { "fill": this.getBgColor(),"stroke-width":0 });
            // label.attr( { "font-weight": "normal" });
            }

        if (commentText)
        {
            if (sel)
            {
                this.updateSize();
                background.attr({ "opacity": 0.3 });
            }
            else
            {
                background.attr({ "opacity": 0.001 });
            }
        }

        // if (backgroundResize) {
        // backgroundResize.toFront();
        // }

        // gui.patch().background.toBack();
        // group.toFront();
        this._updateElementOrder();


        // if(opui.op.uiAttribs.error && opui.op.uiAttribs.error.length>0)
        // {
        //     if(background)background.attr({"fill":"#f88"});
        // }

        // if(sel) background.attr( { stroke: '#fff', "stroke-width": 10});
        //     else background.attr( { stroke: '#fff', "stroke-width": 0});
    };

    this.setTitle = function (t)
    {
        title = t || title;

        let suffix = "";
        if (opui.op.uiAttribs.hasOwnProperty("extendTitle") && opui.op.uiAttribs.extendTitle) suffix += " | " + opui.op.uiAttribs.extendTitle;

        const perf = CABLES.uiperf.start("op.setTitle");

        if (!label) return;
        if (title != t || label.attr("text") != t)
        {
            if (typeof t !== "undefined")
            {
                if (t === null) { title = ""; }
                else { title = t; }
            }

            if (label &&
                (
                    !opui.op.uiAttribs.hasOwnProperty("comment_title") &&
                    !opui.op.uiAttribs.hasOwnProperty("comment_text")
                ))
            {
                label.attr({ "text": title + suffix });
                // if(objName.indexOf("Ops.User") == 0) label.attr({ text: '• '+title });
            }

            if (label)
            {
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
                this._updateStriked();
            }
        }

        this.updateAttachedComment();
        perf.finish();
    };

    this.getGroup = function ()
    {
        return group;
    };

    this.highlight = function (b)
    {
        if (b) background.node.classList.add("op_highlight");
        else background.node.classList.remove("op_highlight");
    };

    group.transform("t" + x + "," + y);
};


// --------------------------------------------------------------------------------------


// --------------------------------------------------------------------------------------


const OpUi = function (paper, op, x, y, w, h, txt)
{
    const self = this;
    this.links = [];
    this.portsIn = [];
    this.portsOut = [];
    let hidden = false;
    let deleted = false;
    this.op = op;
    let selected = false;
    const width = w;

    let oldUiAttribs = "";
    let startMoveX = -1;
    let startMoveY = -1;
    const olsPosX = 0;
    const olsPosY = 0;
    let posx = 0;
    let posy = 0;

    this.isMouseOver = false;

    op.addEventListener("onUiAttribsChange", (attribs) =>
    {
        if (!attribs) return;

        if (attribs.hasOwnProperty("warning"))
        {
            this.oprect.updateErrorIndicator();
            if (selected) gui.opParams.updateUiAttribs();
        }
        if (attribs.hasOwnProperty("error"))
        {
            this.oprect.updateErrorIndicator();
            if (selected) gui.opParams.updateUiAttribs();
        }
        if (attribs.hasOwnProperty("uierrors"))
        {
            this.oprect.updateErrorIndicator();

            if (selected)
            {
                gui.opParams.updateUiAttribs();
                gui.patch().updateOpParams(this.op.id);
            }
        }
        if (attribs.hasOwnProperty("color"))
        {
            this.oprect.updateColorHandle();
        }

        if (attribs.hasOwnProperty("comment"))
        {
            this.oprect.updateAttachedComment();
        }
        if (attribs.hasOwnProperty("title"))
        {
            this.oprect.setTitle(attribs.title);
        }

        if (attribs.hasOwnProperty("working"))
        {
            this.oprect._updateStriked();
        }
        if (typeof attribs.title !== "undefined" && attribs.title !== null)
        {
            this.oprect.setTitle(attribs.title);
        }
        if (attribs.hasOwnProperty("extendTitle"))
        {
            this.oprect.setTitle();
        }
        if (attribs && attribs.hasOwnProperty("translate"))
            if (attribs.translate.x != posx || attribs.translate.y != posy)
                this.setPos(attribs.translate.x, attribs.translate.y);

        if (attribs.hasOwnProperty("errors"))
        {
            if (selected) gui.patch().updateOpParams(this.op.id);
        }

        if (attribs.hasOwnProperty("comment_title") || attribs.hasOwnProperty("comment_text"))
        {
            this.oprect.updateComment();
        }
    });

    this.fixTitle = function ()
    {
        this.oprect.setTitle();
    };

    this.remove = function ()
    {
        deleted = true;
        this.hide();
        this.oprect.getGroup().remove();
        this.oprect.deleteUi();
    };

    this.getHeight = function ()
    {
        return this.oprect.getHeight();
    };

    this.getWidth = function ()
    {
        return this.oprect.getWidth();
    };

    this.getSubPatch = function ()
    {
        if (!op.uiAttribs.subPatch) return 0;
        else return op.uiAttribs.subPatch;
    };

    this.showFocus = function ()
    {
        this.oprect.showFocus();
    };

    this.isSelected = function ()
    {
        return selected;
    };

    this.hide = function ()
    {
        hidden = true;
        this.oprect.removeUi();
        this.oprect.getGroup().hide();

        let j = 0;
        for (j in self.portsIn) self.portsIn[j].removeUi();
        for (j in self.portsOut) self.portsOut[j].removeUi();

        for (j in self.links)
        {
            self.links[j].hide();
            self.links[j].hideAddButton();
        }
    };

    this.show = function ()
    {
        if (deleted) return;
        hidden = false;

        this.oprect.addUi();
        this.oprect.getGroup().show();

        let j = 0;
        if (!CABLES.UI.isComment(op.objName))
        {
            for (j in self.portsIn) self.portsIn[j].addUi(this.oprect.getGroup());
            for (j in self.portsOut) self.portsOut[j].addUi(this.oprect.getGroup());
        }

        for (j in self.links) self.links[j].show();

        self.setPos();
    };

    this.isHidden = function ()
    {
        return hidden;
    };

    this.removeDeadLinks = function ()
    {
        let found = true;
        let j = 0;
        let port = null;

        while (found)
        {
            found = false;

            let p = 0;
            for (p in self.portsIn)
            {
                port = self.portsIn[p];
                for (j in port.links)
                {
                    if (port.links[j].portIn === null || port.links[j].portOut === null)
                    {
                        port.links[j].remove();
                        console.log("found zombie link");
                        found = true;
                    }
                }
            }

            for (p in self.portsOut)
            {
                port = self.portsOut[p];
                for (j in port.links)
                {
                    if (port.links[j].portIn === null || port.links[j].portOut === null)
                    {
                        port.links[j].remove();
                        found = true;
                    }
                }
            }
        }
        found = true;

        while (found)
        {
            found = false;
            for (j in self.links)
            {
                if (!self.links[j])
                {
                    self.links.splice(j, 1);
                    found = true;
                }
                else
                if (self.links[j].p1 === null || self.links[j].p2 === null)
                {
                    self.links[j].hide();
                    self.links.splice(j, 1);
                    found = true;
                }
                else
                if (!self.links[j].p2.thePort.isLinked() || !self.links[j].p1.thePort.isLinked())
                {
                    self.links[j].hide();
                    self.links.splice(j, 1);
                    found = true;
                }
            }
        }
    };

    this.showAddButtons = function ()
    {
        if (this.isHidden()) return;
        // self.removeDeadLinks();
        for (const j in self.links) self.links[j].showAddButton();
    };

    this.hideAddButtons = function ()
    {
        // self.removeDeadLinks();
        for (const j in self.links) self.links[j].hideAddButton();
    };

    this.doMoveFinished = function ()
    {
        const undoAdd = (function ()
        {
            const newUiAttr = JSON.stringify(self.op.uiAttribs);
            const oldUiAttr = oldUiAttribs + " ";
            CABLES.undo.add({
                "title": "Move op",
                undo()
                {
                    try
                    {
                        const u = JSON.parse(oldUiAttr);
                        self.setPos(u.translate.x, u.translate.y);
                    }
                    catch (e) {}
                },
                redo()
                {
                    const u = JSON.parse(newUiAttr);
                    self.setPos(u.translate.x, u.translate.y);
                }
            });
        }());

        startMoveX = -1;
        startMoveY = -1;
        self.isDragging = false;
        CABLES.UI.DRAGGINGOPS = false;
    };

    this.getPosX = function ()
    {
        return posx;
    };
    this.getPosY = function ()
    {
        return posy;
    };

    this.setPosFromUiAttr = function ()
    {
        this.setPos(this.op.uiAttribs.translate.x, this.op.uiAttribs.translate.y);
        // console.log(this.op.uiAttribs.translate.x, this.op.uiAttribs.translate.y);
        for (const j in self.links) self.links[j].redraw();
    };

    this.setPos = function (_x, _y)
    {
        if (CABLES.UTILS.isNumber(_x))
        {
            posx = _x;
            posy = _y;
        }

        self.oprect.setPosition(posx, posy);
        if (!self.op.uiAttribs.translate || self.op.uiAttribs.translate.x != posx || self.op.uiAttribs.translate.y != posy)
            self.op.uiAttr({ "translate": { "x": posx, "y": posy } });

        for (const j in self.links)
            self.links[j].redraw();
    };

    this.doMove = function (dx, dy, a, b, e)
    {
        if (e.which == 3) return;
        if (e.which == 2) return;

        e = CABLES.mouseEvent(e);

        const pos = gui.patch().getCanvasCoordsMouse(e);

        if (!self.op.uiAttribs)
        {
            self.op.uiAttribs = {};
            self.op.uiAttribs.translate = {
                "x": pos.x,
                "y": pos.y
            };
        }

        if (startMoveX == -1 && self.op.uiAttribs.translate)
        {
            oldUiAttribs = JSON.stringify(self.op.uiAttribs);
            startMoveX = pos.x - self.op.uiAttribs.translate.x;
            startMoveY = pos.y - self.op.uiAttribs.translate.y;
        }

        pos.x -= startMoveX;
        pos.y -= startMoveY;

        if (CABLES.UI.userSettings.get("snapToGrid"))
        {
            pos.x = CABLES.UI.snapOpPosX(pos.x);
            pos.y = CABLES.UI.snapOpPosY(pos.y);
        }

        if (e.shiftKey)
        {
            const diffX = Math.abs(CABLES.UI.DRAGGINGOPS_STARTX - pos.x);
            const diffY = Math.abs(CABLES.UI.DRAGGINGOPS_STARTY - pos.y);

            if (CABLES.UI.DRAGGINGOPS && Math.max(diffX, diffY) > 10 && CABLES.UI.DRAGGINGOPSDIR == -1)
            {
                if (diffX > diffY)CABLES.UI.DRAGGINGOPSDIR = 0;
                else CABLES.UI.DRAGGINGOPSDIR = 1;
            }

            if (CABLES.UI.DRAGGINGOPSDIR == -1) {}
            else if (CABLES.UI.DRAGGINGOPSDIR == 0) pos.y = CABLES.UI.DRAGGINGOPS_STARTY;
            else pos.x = CABLES.UI.DRAGGINGOPS_STARTX;
        }


        self.setPos(pos.x, pos.y);
        if (!CABLES.UI.DRAGGINGOPS)
        {
            CABLES.UI.DRAGGINGOPSDIR = -1;
            CABLES.UI.DRAGGINGOPS = true;
            CABLES.UI.DRAGGINGOPS_STARTX = pos.x;
            CABLES.UI.DRAGGINGOPS_STARTY = pos.y;
        }
        self.isDragging = true;
    };

    this.oprect = new OpRect(this, x, y, w, h, txt, self.op.objName);

    this.setEnabled = function (en)
    {
        this.op.setEnabled(en);
        this.oprect.setEnabled(en);

        if (en) gui.patchConnection.send(CABLES.PACO_OP_ENABLE, {
            "op": this.op.id
        });
        else gui.patchConnection.send(CABLES.PACO_OP_DISABLE, {
            "op": this.op.id
        });
    };

    this.getPortLinks = function (portId)
    {
        const links = [];
        for (let i = 0; i < this.links.length; i++)
            if (this.links[i].p2)
                if (this.links[i].p2.thePort.id == portId || this.links[i].p1.thePort.id == portId) links.push(this.links[i]);

        return links;
    };

    this.setSelected = function (sel)
    {
        selected = sel;
        if (sel) self.showAddButtons();
        else self.hideAddButtons();
        self.isDragging = false;
        this.oprect.setSelected(sel);
    };

    this.highlight = function (b)
    {
        this.oprect.highlight(b);
    };


    this._setAutoPortSpacing = function (ports)
    {
        let lastName = "";
        let groupCount = 0;
        const dir = 0;
        for (let i = 0; i < ports.length; i++)
        {
            if (ports[i].hidePort) continue;
            const name = ports[i].name;
            if (name.substring(0, 3) == lastName.substring(0, 3))
            {
                if (i > 0 && groupCount == 0)ports[i - 1].setUiAttribs({ "spaceBefore": true });
                groupCount++;
            }
            else
            {
                if (groupCount > 0)
                {
                    groupCount = 0;
                    // if(dir==0)
                    // {
                    //     $(this).before("<tr><td></td></tr>");
                    //     $(this).data('hasBefore',true);
                    // }
                    // else
                    // {
                    //     $(this).after("<tr><td></td></tr>");
                    //     $(this).data('hasAfter',true);
                    // }
                    ports[i].setUiAttribs({ "spaceBefore": true });

                    console.log("----");
                }
            }
            console.log(name);
            lastName = name;
        }


        //     function testSpacers()
        //     {
        //         var name=$(this).data("portname");
        //         if(name.substring(0,3) == lastName.substring(0,3))
        //         {
        //             groupCount++;
        //         }
        //         else
        //         {
        //             if(groupCount>0)
        //             {
        //                 groupCount=0;
        //                 // $(this).css({"background-color":"red"});
        //                 // $(this).addClass("paramGroupSpacer");
        //                 if(dir==0)
        //                 {
        //                     $(this).before("<tr><td></td></tr>");
        //                     $(this).data('hasBefore',true);
        //                 }
        //                 else
        //                 {
        //                     $(this).after("<tr><td></td></tr>");
        //                     $(this).data('hasAfter',true);
        //                 }

        //                 console.log("----");
        //             }
        //         }
        //         console.log(name);
        //         lastName=name;
        //     }

        //     $('.opports_in').each(testSpacers);

        //     lastName='';
        //     groupCount=0;
        //     dir=1;

    //     jQuery.fn.reverse = [].reverse;
    //     $('.opports_in').reverse().each(testSpacers);
    };

    this.initPorts = function ()
    {
        let i = 0;
        for (i = 0; i < this.portsIn.length; i++) this.portsIn[i].removeUi();
        for (i = 0; i < this.portsOut.length; i++) this.portsOut[i].removeUi();
        this.portsIn.length = 0;
        this.portsOut.length = 0;
        this._setAutoPortSpacing(self.op.portsIn);

        for (i in self.op.portsIn)
        {
            const p = self.op.portsIn[i];

            if (!p.uiAttribs) p.uiAttribs = {};

            let uiPort = null;

            if (p.uiAttribs.display != "readonly" && !p.uiAttribs.hidePort)
            {
                uiPort = this.addPort(CABLES.PORT_DIR_IN, p);
            }
            else
            {
                p.addEventListener("onUiAttrChange", function ()
                {
                    gui.patch().updateOpParams(self.op.id);
                });
            }

            if (p.uiAttribs.hasOwnProperty("display"))
            {
                if (p.uiAttribs.display == "dropdown") p.uiAttribs.type = "string";
                else if (p.uiAttribs.display == "switch") p.uiAttribs.type = "string";
                else if (p.uiAttribs.display == "file") p.uiAttribs.type = "string";
                else if (p.uiAttribs.display == "bool") p.uiAttribs.type = "bool";
            }
        }

        for (const i2 in op.portsOut) self.addPort(CABLES.PORT_DIR_OUT, op.portsOut[i2]);

        const ops1 = [];
        const ops2 = [];
        const ps1 = [];
        const ps2 = [];
        for (let j = 0; j < this.links.length; j++)
        {
            ops1.push(this.links[j].p1.thePort.parent);
            ops2.push(this.links[j].p2.thePort.parent);

            ps1.push(this.links[j].p1.thePort.getName());
            ps2.push(this.links[j].p2.thePort.getName());
        }

        let count = 0;
        while (this.links.length > 0)
        {
            this.links[0].unlink();
            count++;
            if (count > 1000)
            {
                console.log("unlinking fail");
                break;
            }
        }
        this.links = [];

        for (let i3 = 0; i3 < ops1.length; i3++) gui.corePatch().link(ops1[i3], ps1[i3], ops2[i3], ps2[i3]);
    };

    this._lastUpdateHeight = -1;
    this.updateHeight = function ()
    {
        const hh = this.oprect.getHeight();
        if (hh != this._lastUpdateHeight)
        {
            for (let i = 0; i < this.portsOut.length; i++) this.portsOut[i].updateOnChangeOpHeight();
            for (const j in self.links) self.links[j].redraw();
            this._lastUpdateHeight = hh;
        }
    };

    this.addPort = function (_inout, thePort)
    {
        const inout = _inout;
        // var portIndex = this.portsIn.length;
        // if (inout == CABLES.PORT_DIR_OUT) portIndex = this.portsOut.length;

        // var w = (CABLES.UI.uiConfig.portSize + CABLES.UI.uiConfig.portPadding) * portIndex;

        let portIndex = this.portsIn.length;
        if (inout == CABLES.PORT_DIR_OUT) portIndex = this.portsOut.length;

        let portPosX = 0;

        if (inout == CABLES.PORT_DIR_OUT)
        {
            portPosX = (CABLES.UI.uiConfig.portSize + CABLES.UI.uiConfig.portPadding) * portIndex;
        }
        else
        {
            for (let i = 0; i < this.portsIn.length; i++)
            {
                portPosX += (CABLES.UI.uiConfig.portSize + CABLES.UI.uiConfig.portPadding);
            }
        }

        if (self.oprect.getWidth() < portPosX + CABLES.UI.uiConfig.portSize + CABLES.UI.uiConfig.resizeBarWidth * 2)
            self.oprect.setWidth(portPosX + CABLES.UI.uiConfig.portSize + CABLES.UI.uiConfig.resizeBarWidth * 2);

        const port = new CABLES.UI.Port(thePort);

        port.direction = inout;
        port.op = self.op;
        port.opUi = self;
        port.portPosX = portPosX;

        if (this.oprect.getRect()) port.addUi(this.oprect.getGroup());

        if (inout == CABLES.PORT_DIR_OUT) this.portsOut.push(port);
        else this.portsIn.push(port);

        return port;
    };


    op.addEventListener("onPortRemoved", function ()
    {
        this.initPorts();
    }.bind(this));
};
