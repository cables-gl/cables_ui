

var CABLES=CABLES||{};
CABLES.UI=CABLES.UI||{};

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
    // console.log(e.target.type=="search");
    if(e.target.type=="search")return v;
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



CABLES.valueChangerInitSliders=function()
{
    $('.valuesliderinput input').each(function(e)
    {
        var grad=CABLES.valueChangerGetSliderCss( $(this).val() );
        $(this).parent().css({"background":grad});
    });
};

CABLES.valueChangerGetSliderCss=function(v)
{
    v=Math.max(0,v);
    v=Math.min(1,v);
    const cssv=v*100;
    return "linear-gradient(0.25turn,#5a5a5a, #5a5a5a "+cssv+"%, #444 "+cssv+"%)";
}

CABLES.valueChanger=function(ele,focus)
{
    var isDown=false;
    var startVal=$('#'+ele).val();
    // console.log(ele);
    var el=document.getElementById(ele);
    var incMode=0;
    var mouseDownTime=0;

    if(focus)setTextEdit(true);

    function onInput(e)
    {
        if($('#'+ele+'-container').hasClass('valuesliderinput'))
        {
            const grad=CABLES.valueChangerGetSliderCss( $('#'+ele).val() );
            $('#'+ele+'-container').css( { "background": grad } );
        }
    }

    function switchToNextInput(dir)
    {
        
        var portNum=$('#'+ele+'-container').data('portnum');
        console.log("this is "+portNum);

        // for(var i=portNum+1;i<portNum+dir*10;i+=dir)
        var count=0;
        while(count<10)
        {
            
            var i=(portNum+dir)+count*dir;
            if($('#portval_'+i+'-container').length)
            {
                console.log("found "+i);
                setTextEdit(false);
                $('#'+ele).unbind("keydown",tabKeyListener);

                CABLES.valueChanger('portval_'+i,true);
                
                return;
            }
            count++;
        }
    }

    function tabKeyListener(event)
    {
        if ( event.which == 9 )
        {
            event.preventDefault();
            if(event.shiftKey)switchToNextInput(-1);
                else switchToNextInput(1);
            return;
        }
        // console.log('klkk',event.which);
    }

    function setTextEdit(enabled)
    {
        if(enabled)
        {
            $('#'+ele).bind("input",onInput);
            $('#'+ele+'-container .numberinput-display').hide();

            $('.numberinput').removeClass('numberinputFocussed');
            $('#'+ele+'-container').addClass('numberinputFocussed');
            
            $('#'+ele).show();
            $('#'+ele).focus();
            

            var vv=$('#'+ele).val();
            // $('#'+ele).val('')
            // $('#'+ele).val(vv); // workaround to set cursor to end of line
            $('#'+ele)[0].setSelectionRange(0, vv.length);

            $( '#'+ele ).bind("keydown",tabKeyListener);
        }
        else
        {
            $('#'+ele).unbind("input",onInput);
            $('.numberinput').removeClass('numberinputFocussed');
            
            $('#'+ele+'-container .numberinput-display').show();
            $('#'+ele).hide();
            $('#'+ele).blur();
            $( document ).unbind( "mouseup", up );
            $( document ).unbind( "mousedown", down );
    
        }
    }


    function down(e)
    {
        if($('#'+ele).is(":focus")) return;
        

        mouseDownTime=performance.now();
        isDown=true;
        
        var isString= $('#'+ele).data("valuetype")=="string";

        if(!isString)
        {
            document.addEventListener('pointerlockchange', lockChange, false);
            document.addEventListener('mozpointerlockchange', lockChange, false);
            document.addEventListener('webkitpointerlockchange', lockChange, false);
            
    
            if (el.classList.contains('inc_int')) incMode=1;
    
            el.requestPointerLock = el.requestPointerLock || el.mozRequestPointerLock || el.webkitRequestPointerLock;
            if(el.requestPointerLock) el.requestPointerLock();
    
        }
    }

    function up(e)
    {
        if($('#'+ele).is(":focus")) return;
        var isString= $('#'+ele).data("valuetype")=="string";
        
        gui.setStateUnsaved();
        isDown=false;


        document.removeEventListener('pointerlockchange', lockChange, false);
        document.removeEventListener('mozpointerlockchange', lockChange, false);
        document.removeEventListener('webkitpointerlockchange', lockChange, false);

        if(document.exitPointerLock)document.exitPointerLock();

        $( document ).unbind( "mouseup", up );
        $( document ).unbind( "mousedown", down );

        document.removeEventListener("mousemove", move, false);

        if(performance.now()-mouseDownTime<200)
        {
            setTextEdit(true);
            return;
        }
    }

    function setProgress(v)
    {
        const grad=CABLES.valueChangerGetSliderCss(v);
        $('#'+ele+'-container').css( { "background": grad } );
        return v;
    }

    function move(e)
    {
        if($('#'+ele).is(":focus")) return;
        
        gui.setStateUnsaved();
        var v=parseFloat( $('#'+ele).val() ,10);
        var inc=0;

        if(Math.abs(e.movementX)>5) mouseDownTime=0;

        if($('#'+ele+'-container').hasClass('valuesliderinput'))
        {
            inc=e.movementX*0.001;
            v+=inc;
            v=Math.max(0,v);
            v=Math.min(1,v);
            v=Math.round(v*1000)/1000;
            v=setProgress(v);
        }
        else
        if(incMode==0)
        {
            inc=e.movementX*0.01;
            if(e.shiftKey || e.which==3)inc=e.movementX*0.5;

            v+=inc;
            v=Math.round(v*1000)/1000;
        }
        else
        {
            inc=e.movementX*1;
            if(e.shiftKey || e.which==3)inc=e.movementX*5;

            v+=inc;
            v=Math.floor(v);
        }

        $('#'+ele).val(v);
        $('#'+ele+'-container .numberinput-display').html(v);
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
            $('#'+ele+'-container .numberinput-display').html(startVal);
            $('#'+ele).trigger('input');
            up();
        }
    }

    $( document ).bind( "mouseup", up );
    $( document ).bind( "mousedown", down );
    // $( '#'+ele ).bind( "click", click );
    $( '#'+ele ).bind( "blur", 
        function()
        {
            $( '#'+ele ).unbind( "blur");

            // console.log("BLUR");
            
            $('#'+ele+'-container .numberinput-display').html($('#'+ele).val());
            setTextEdit(false);
            // $(document).focus();
            if($('#'+ele).hasClass('valuesliderinput'))setProgress();

        });
};
