
CABLES.UI=CABLES.UI || {};

CABLES.UI.setStatusText=function(txt)
{
    $('#statusbar').html('&nbsp;'+txt);
};


CABLES.UI.showPreview=function(opid,which,onoff)
{
    var op=gui.scene().getOpById(opid);
    if(!op)
    {
        console.log('opid not found:',opid);
        return;
    }
    var port=op.getPort(which);
    if(!port)
    {
        console.log('port not found:',which);
        return;
    }

    port.doShowPreview(onoff);
    if(!onoff)CGL.Texture.previewTexture=null;
};


CABLES.UI.togglePortValBool=function(which,checkbox)
{
    var bool_value = $('#'+which).val() == 'true';
    bool_value=!bool_value;

    if(bool_value)
    {
        $('#'+checkbox).addClass('fa-check-square-o');
        $('#'+checkbox).removeClass('fa-square-o');
    }
    else
    {
        $('#'+checkbox).addClass('fa-square-o');
        $('#'+checkbox).removeClass('fa-check-square-o');
    }

    $('#'+which).val(bool_value);
    $('#'+which).trigger('input');
};


CABLES.UI.inputIncrement=function(v,dir)
{
    if(v=='true') return 'false';
    if(v=='false') return 'true';

    var val=parseFloat(v);
    var add=1;
    if(Math.abs(val)<2) add=0.1;
        else if(Math.abs(val)<100) add=1;
            else add=10;

    var r=val+add*dir;

    if(isNaN(r))r=0.0;
    else
        r= Math.round(1000*r)/1000;
    return r;
};


function mouseEvent(event)
{
    if(!event.offsetX) event.offsetX = event.layerX;//(event.pageX - $(event.target).offset().left);
    if(!event.offsetY) event.offsetY = event.layerY;//(event.pageY - $(event.target).offset().top);
    return event;
}

Handlebars.registerHelper('json', function(context) {
    return JSON.stringify(context);
});

Handlebars.registerHelper('compare', function(left_value, operator, right_value, options) {
    var operators, result;

    if (arguments.length < 4) {
        throw new Error("Handlerbars Helper 'compare' needs 3 parameters, left value, operator and right value");
    }

    operators = {
        '==':       function(l,r) { return l == r; },
        '===':      function(l,r) { return l === r; },
        '!=':       function(l,r) { return l != r; },
        '<':        function(l,r) { return l < r; },
        '>':        function(l,r) { return l > r; },
        '<=':       function(l,r) { return l <= r; },
        '>=':       function(l,r) { return l >= r; },
        'typeof':   function(l,r) { return typeof l == r; }
    };

    if ( ! operators[operator]) {
        throw new Error("Handlerbars Helper 'compare' doesn't know the operator "+ operator);
    }

    result = operators[operator](left_value, right_value);

    if (result === true) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});
