CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.Tipps = function ()
{
    this._index=0;
    this._wasShown=false;    

    var tipps=
        [
            {
                descr: "To **add an op** press the `Esc`-key. In the popup you can now enter any text which is part of the op’s namespace (e.g. `MainLoop`). You can now navigate through the result-set using your arrow keys (`↓` and `↑`). \n\nWhen you press `Enter` the selected op will be added to the editor.descr:",
                img: "a_add_op_new.gif"
            }, {
                descr: "To **add another op and connect it** to the one we just added you can now drag out a cable from one of the ports.  ",
                img: "b_add_op_and_connect_it_new.gif"
            }, {
                descr: "To **add an op in between two ops** just press the circle in the middle of the cable (one of the existing ops must be highlighted for this).  ",
                img: "c_add_op_between_other_ops.gif"
            }, {
                descr: "To **change one of the op-parameters** first select the op by clicking on it, then you will see the the op-settings in the pane on the right. To change one of the number value inputs click and drag up or down.",
                img: "d_change_op_parameter.gif"
            }, {
                descr: "To **access an op’s example patch** first select the op, then click **view example patches**.",
                img: "e_view_example_patch.gif"
            }, {
                descr:"To **delete a cable** just press the `right mouse button` on one of the connected ports.",
                img: "f_delete_link.gif"
            }, {
                descr: "To **reconnect a cable to another port** press and drag with the `right mouse button`.",
                img: "g_reconnect_link.gif"
            }, {
                descr: "**Ops can be duplicated** by making a selection with your `left mouse button`, pressing `cmd + c` or `ctrl + c` to copy, followed by `cmd + v` or `ctrl + v` to paste.  ",
                img: "h_copy_paste_op.gif"
            }, {
                descr: "To bring some order into your patch you can **align ops** by making a selection with your `left mouse button` and pressing `a` to horizontally align or `shift + a` to vertically align.   ",
                img: "i_align_ops.gif"
            }, {
                descr: "To **unlink an op** hold it with the `left mouse button` and shake it.  ",
                img: "j_disconnect_by_shaking.gif"
            }, {
                descr: "You can also unlink ops by selecting them and pressing `x`",
                img: "k_disconnect_with_x_key.gif"
            }, {
                descr: "Drag a cable to the center of an op to see suggestions of fitting ports. if there is only one the link will be connected automatically.",
                img: "l_connect_with_drag_to_center.gif"
            }, {
                descr: "To add an existing op between two other ops, click and drag it to the middle of the cable and release.",
                img: "m_add_existing_op_between.gif"
            }, {
                descr: "Duplicate a link by pressing `alt` and the `right-mouse button` and dragging the cable to another port",
                img: "n_duplicate_link.gif"
            }, {
                descr: "See data and function flow by pressing `f`",
                img: "o_op_flow_with_f_key.gif"
            }, {
                descr: "Disable ops and its children by pressing `d`",
                img: "p_disable_ops_with_d_key.gif	"
            }, {
                descr: "Temporarily disconnect/bypass a selected op by pressing `shift+d`, pressing `shift+d` again reconnects the cable",
                img: "q_disable_op_with_shift_and_d_key.gif"
            }, {
                descr: "Upload files by dragging them into the window",
                img: "r_add_file_drag_and_drop.gif"
            }, {
                descr: "access the command palette by pressing `CMD+P` or `CTRL+P`. ",
                img: "s_command_palette_ctrl_and_p.gif"
            }, {
                descr: "set a custom title to an op by clicking the title in the parameter panel (you can also select an op and press `t`)",
                img: "t_change_op_title.gif"
            }, {
                descr: "organize huge patches by putting ops into subpatches",
                img: "u_create_subpatch.gif"
            }, {
                descr: "to find documentation and examples for an op, click on the op and then click the link",
                img: "v_op_documentation_link.gif"
            }, {
                descr: "set colors for ops for easier identification",
                img: "colormarker.gif"
            }, {
                descr: "create and link new op by clicking parameter",
                img: "linkparameter.gif"
            },
            {
                descr: "use snap to grid for cleaner looking patches",
                img: "snaptogrid.gif",
            }
        ];


    index = Math.round(tipps.length * Math.random());
    console.log(index, tipps.length);


    this.next=function()
    {
        index++;
        this.show();
    }

    this.neverShow = function () {
        CABLES.UI.userSettings.set("showTipps", false);
        this.show();
    }
    this.showAlways = function () {
        CABLES.UI.userSettings.set("showTipps", true);
        this.show();
    }

    this.show = function ()
    {
        if (index >= tipps.length) index = 0;
        var html = '';//'<h2>Tipps</h2>';

        const tipp=tipps[index];

        html += '<div>';
        html += '</div>';

        html += '<div style="background-color:#111;">';
        html += '  <div style="width:320px;max-height:300px;padding:20px;float:left">';
        html += '    <img style="max-width:300px;min-height:273px;max-height:273px;align:left;" src="https://docs.cables.gl/ui_walkthrough/video/'+tipp.img+'" />';
        html += '  </div>';
        html += '  <div style="width:320px;float:left;">';
        html += '    <h3>' + (tipp.title ||'Did you know...')+'</h3>';
        html += tipp.descr;
        html += '    <br/>';
        html += '    <br/>';
        html += '    '+(index+1)+'/'+tipps.length;
        html += '  </div>';
        html += '<div style="clear:both;"></div>';
        html += '</div>';

        html += '<div style="clear:both;padding:20px;">';
        html += '  <a onclick="CABLES.UI.MODAL.hide();" class="bluebutton">close</a>&nbsp;&nbsp;&nbsp;';
        html += '  <a onclick="CABLES.UI.tipps.next();" class="greybutton">next tipp</a>';

        html += '  <div style="float:right;"><br/>';
        if (CABLES.UI.userSettings.get("showTipps")) html += '<a onclick="CABLES.UI.tipps.neverShow();" class="">do not show this on startup</a>';
            else html += '<a onclick="CABLES.UI.tipps.showAlways();" class="">show on startup again</a>';
        html += '  </div">';


        html += '</div>';

        // CABLES.UI.MODAL.show(html);
        CABLES.UI.MODAL.show(html,{title:'',nopadding:true});

    };

    this.showOnce = function ()
    {
        if (this._wasShown)return;
        this._wasShown=true;
        this.show();
    }
};

CABLES.UI.tipps=new CABLES.UI.Tipps();