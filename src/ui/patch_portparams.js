
var CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};


CABLES.UI.checkDefaultValue=function (op, index) {
    if (op.portsIn[index].defaultValue !== undefined && op.portsIn[index].defaultValue !== null) {
        var titleEl = $('#portTitle_in_' + index);
        if (op.portsIn[index].val != op.portsIn[index].defaultValue) {
            if (!titleEl.hasClass('nonDefaultValue')) titleEl.addClass('nonDefaultValue');
        } else {
            if (titleEl.hasClass('nonDefaultValue')) titleEl.removeClass('nonDefaultValue');
        }
    }

}


CABLES.UI.initPortInputListener=function(op,index)
{
    CABLES.UI.checkDefaultValue(op, index);
    var ele = $('#portval_' + index);
    ele.on('input', function (e) {
        var v = '' + ele.val();

        if (!op.portsIn[index].uiAttribs.type || op.portsIn[index].uiAttribs.type == 'number') {
            if (isNaN(v) || v === '') {
                ele.addClass('invalid');
                return;
            } else {
                ele.removeClass('invalid');
                v = parseFloat(v);
            }
        }

        if (op.portsIn[index].uiAttribs.type == 'int') {
            if (isNaN(v) || v === '') {
                ele.addClass('invalid');
                return;
            } else {
                ele.removeClass('invalid');
                v = parseInt(v, 10);
            }
        }

        if (op.portsIn[index].uiAttribs.display == 'bool') {
            if (v != 'true' && v != 'false') {
                v = false;
                ele.val('false');
            }
            if (v == 'true') v = true;
            else v = false;
        }

        op.portsIn[index].set(v);
        gui.patchConnection.send(CABLES.PACO_VALUECHANGE, {
            "op": op.id,
            "port": op.portsIn[index].name,
            "v": v
        });

        CABLES.UI.checkDefaultValue(op, index);

        if (op.portsIn[index].isAnimated()) gui.timeLine().scaleHeightDelayed();
    });
}
CABLES.UI.initPortClickListener=function(op,index)
{
    if (op.portsIn[index].isAnimated()) $('#portanim_in_' + index).addClass('timingbutton_active');
    if (op.portsIn[index].isAnimated() && op.portsIn[index].anim.stayInTimeline) $('#portgraph_in_' + index).addClass('timingbutton_active');

    $('#portTitle_in_' + index).on('click', function (e) {
        const p = op.portsIn[index];
        if (!p.uiAttribs.hidePort)
            gui.opSelect().show(
                {
                    x: p.parent.uiAttribs.translate.x + (index * (CABLES.UI.uiConfig.portSize + CABLES.UI.uiConfig.portPadding)),
                    y: p.parent.uiAttribs.translate.y - 50,
                }, op, p);
    });

    $('#portCreateOp_in_' + index).on('click', function (e) {
        var thePort = op.portsIn[index];
        if (thePort.type == CABLES.OP_PORT_TYPE_TEXTURE) {
            gui.scene().addOp('Ops.Gl.Texture', {}, function (newop) {
                gui.scene().link(op, thePort.name, newop, newop.getFirstOutPortByType(thePort.type).name);
            });

        }
    });

    $('#portedit_in_' + index).on('click', function (e) {
        var thePort = op.portsIn[index];
        // console.log('thePort.uiAttribs.editorSyntax',thePort.uiAttribs.editorSyntax);

        gui.patch().openParamEditor(op.id, op.portsIn[index].name)

        // gui.showEditor();
        // gui.editor().addTab({
        //     content: op.portsIn[index].get() + '',
        //     title: '' + op.portsIn[index].name,
        //     syntax: thePort.uiAttribs.editorSyntax,
        //     onSave: function(setStatus, content) {
        //         // console.log('setvalue...');
        //         gui.setStateUnsaved();
        //         gui.jobs().finish('saveeditorcontent');
        //         thePort.set(content);
        //     }
        // });
    });

    $('#portbutton_' + index).on('click', function (e) {
        op.portsIn[index]._onTriggered();
    });


    $('#portgraph_in_' + index).on('click', function (e) {
        if (op.portsIn[index].isAnimated()) {
            op.portsIn[index].anim.stayInTimeline = !op.portsIn[index].anim.stayInTimeline;
            $('#portgraph_in_' + index).toggleClass('timingbutton_active');
            gui.patch().timeLine.setAnim(op.portsIn[index].anim, {
                name: op.portsIn[index].name,
                defaultValue: parseFloat($('#portval_' + index).val())
            });
        }
    });

    $('#portanim_in_' + index).on('click', function (e) {
        if ($('#portanim_in_' + index).hasClass('timingbutton_active')) {
            var val = gui.patch().timeLine.removeAnim(op.portsIn[index].anim);
            op.portsIn[index].setAnimated(false);

            gui.patch().timeLine.setAnim(null);
            // op.portsIn[index].anim=null;
            $('#portanim_in_' + index).removeClass('timingbutton_active');
            $('#portval_' + index).val(val);
            $('#portval_' + index).trigger('input');
            $('#portval_' + index).focus();
            return;
        }

        $('#portanim_in_' + index).addClass('timingbutton_active');

        op.portsIn[index].toggleAnim();
        gui.patch().timeLine.setAnim(op.portsIn[index].anim, {
            name: op.portsIn[index].name,
            defaultValue: parseFloat($('#portval_' + index).val())
        });
    });
}