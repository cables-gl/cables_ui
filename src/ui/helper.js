
CABLES.UI=CABLES.UI || {};

// CABLES.UI.setStatusText=function(txt)
// {
//     // $('#statusbar .text').html('&nbsp;'+txt);
// };
CABLES.UI.MOUSE_BUTTON_NONE = 0;
CABLES.UI.MOUSE_BUTTON_LEFT = 1;
CABLES.UI.MOUSE_BUTTON_RIGHT = 2;
CABLES.UI.MOUSE_BUTTON_WHEEL = 4;


CABLES.UI.sanitizeUsername=function(name)
{
    name=name.toLowerCase();
    name = name.split(' ').join('_');
    name=name.replace(/\./g, '_');
    if (name.match(/^\d/))name='u_'+name; 
    return name;
};

CABLES.uniqueArray=function(arr)
{
    var u = {}, a = [];
    for(var i = 0, l = arr.length; i < l; ++i){
        if(!u.hasOwnProperty(arr[i])) {
            a.push(arr[i]);
            u[arr[i]] = 1;
        }
    }
    return a;
};

CABLES.serializeForm=function(selector)
{
    var json={};
    $(selector).find(':input').each( function()
    {
        json[$(this).attr('name')]=$(this).val();
        // console.log(,);
    });
    console.log(json);
    return json;
};



CABLES.UI.showJson=function(opid,which)
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


    // CABLES.UI.MODAL.show( '<pre><code>'+ +'</code></pre>');


    CABLES.UI.MODAL.showPortValue(port.name,port);

    // gui.showEditor();
    // gui.editor().addTab(
    // {
    //     content:JSON.stringify(port.get() ,null, 4),
    //     title:'content: '+port.name,
    //     syntax:'JSON',
    //     onSave:function(setStatus,content)
    //     {
    //     }
    // });


};


// CABLES.UI.togglePreview=function(opid,which)
// {
//     CABLES.UI.PREVIEW.onoff=!CABLES.UI.PREVIEW.onoff;
//     console.log('CABLES.UI.PREVIEW.onoff',CABLES.UI.PREVIEW.onoff);
//
//     if(!CABLES.UI.PREVIEW.onoff)
//     {
//         CABLES.UI.PREVIEW.port.doShowPreview(CABLES.UI.PREVIEW.onoff);
//         CABLES.UI.PREVIEW.op=null;
//         CABLES.UI.PREVIEW.port=null;
//         CGL.Texture.previewTexture=null;
//         console.log('preview OFFF');
//     }
//     else
//     {
//         var op=gui.scene().getOpById(opid);
//         if(!op)
//         {
//             console.log('opid not found:',opid);
//             return;
//         }
//         var port=op.getPort(which);
//         if(!port)
//         {
//             console.log('port not found:',which);
//             return;
//         }
//
//         CABLES.UI.PREVIEW.op=op;
//         CABLES.UI.PREVIEW.port=port;
//     }
//
//     if(CABLES.UI.PREVIEW.port && CABLES.UI.PREVIEW.onoff) CABLES.UI.PREVIEW.port.doShowPreview(CABLES.UI.PREVIEW.onoff);
//
//  // onmouseover="CABLES.UI.showPreview('{{op.id}}','{{port.name}}',true);" onmouseout="CABLES.UI.showPreview('{{op.id}}','{{port.name}}',false);"
// };
//
// CABLES.UI.showPreview=function()
// {
//     // if(CABLES.UI.PREVIEW.port) CABLES.UI.PREVIEW.port.doShowPreview(CABLES.UI.PREVIEW.onoff);
//     if(CABLES.UI.PREVIEW.port && CABLES.UI.PREVIEW.onoff) CABLES.UI.PREVIEW.port.doShowPreview(CABLES.UI.PREVIEW.onoff);
// };


CABLES.UI.togglePortValBool=function(which,checkbox)
{
    gui.setStateUnsaved();
    var bool_value = $('#'+which).val() == 'true';
    bool_value=!bool_value;

    if(bool_value)
    {
        $('#'+checkbox).addClass('fa-check-square');
        $('#'+checkbox).removeClass('fa-square');
    }
    else
    {
        $('#'+checkbox).addClass('fa-square');
        $('#'+checkbox).removeClass('fa-check-square');
    }

    $('#'+which).val(bool_value);
    $('#'+which).trigger('input');
};


CABLES.UI.inputIncrement=function(v,dir,e)
{
    gui.setStateUnsaved();
    if(v=='true') return 'false';
    if(v=='false') return 'true';

    var val=parseFloat(v);
    if(val!=val)return v;


    var add=0.1;
    if(e.target.classList.contains('inc_int'))add=1;

    if(e && e.shiftKey&& e.metaKey)add=0.001;
        else if(e && e.altKey && e.shiftKey) add=10;
        else if(e && e.shiftKey)add=0.01;
        else if(e && e.altKey) add=1;

    var r=val+add*dir;

    if(isNaN(r)) r=0.0;
        else r= Math.round(1000*r)/1000;
    return r;
};




function mouseEvent(event)
{

    if(event.buttons===undefined) // safari
    {
        event.buttons=event.which;

        if(event.which==3)event.buttons=CABLES.UI.MOUSE_BUTTON_RIGHT;
        if(event.which==2)event.buttons=CABLES.UI.MOUSE_BUTTON_WHEEL;
    }

    if(event.type=="touchmove" && event.originalEvent)
    {
        event.buttons=3;
        event.clientX=event.originalEvent.touches[0].pageX;
        event.clientY=event.originalEvent.touches[0].pageY;
    }

    if(!event.offsetX) event.offsetX = event.layerX;//(event.pageX - $(event.target).offset().left);
    if(!event.offsetY) event.offsetY = event.layerY;//(event.pageY - $(event.target).offset().top);
    return event;
}

CABLES.UI.initHandleBarsHelper=function ()
{
    Handlebars.registerHelper('json', function(context) {
        return JSON.stringify(context,true,4);
    });

    Handlebars.registerHelper('console', function(context) {
        return console.log(context);
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

};



function valueChanger(ele)
{
    var isDown=false;
    var startVal=$('#'+ele).val();
    var el=document.getElementById(ele);
    var incMode=0;

    function keydown(e)
    {
    }

    function down(e)
    {
        gui.setStateUnsaved();
        isDown=true;
        document.addEventListener('pointerlockchange', lockChange, false);
        document.addEventListener('mozpointerlockchange', lockChange, false);
        document.addEventListener('webkitpointerlockchange', lockChange, false);

        document.addEventListener('keydown', keydown, false);

        if (el.classList.contains('inc_int')) incMode=1;

        el.requestPointerLock = el.requestPointerLock ||
                                    el.mozRequestPointerLock ||
                                    el.webkitRequestPointerLock;
        if(el.requestPointerLock) el.requestPointerLock();
    }

    function up(e)
    {
        gui.setStateUnsaved();
        isDown=false;
        document.removeEventListener('pointerlockchange', lockChange, false);
        document.removeEventListener('mozpointerlockchange', lockChange, false);
        document.removeEventListener('webkitpointerlockchange', lockChange, false);
        document.removeEventListener('keydown', keydown, false);

        if(document.exitPointerLock)document.exitPointerLock();

        $( document ).unbind( "mouseup", up );
        $( document ).unbind( "mousedown", down );

        document.removeEventListener("mousemove", move, false);
    }

    function move(e)
    {
        gui.setStateUnsaved();
        var v=parseFloat( $('#'+ele).val() ,10);
        var inc=0;

        if(incMode==0)
        {
            inc=e.movementY*-0.01;
            if(e.shiftKey || e.which==3)inc=e.movementY*-0.5;

            v+=inc;
            v=Math.round(v*1000)/1000;
        }
        else
        {
            inc=e.movementY*-1;
            if(e.shiftKey || e.which==3)inc=e.movementY*-5;

            v+=inc;
            v=Math.floor(v);
        }

        $('#'+ele).val(v);
        $('#'+ele).trigger('input');
    }

     function lockChange(e)
     {
        if (document.pointerLockElement === el || document.mozPointerLockElement === el || document.webkitPointerLockElement === el)
        {
            document.addEventListener("mousemove", move, false);
        }
        else
        {
            //propably cancled by escape key / reset value
            $('#'+ele).val(startVal);
            $('#'+ele).trigger('input');
            up();
        }

    }

    $( document ).bind( "mouseup", up );
    $( document ).bind( "mousedown", down );

}
