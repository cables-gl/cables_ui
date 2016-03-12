
var tooltipTimeout=null;

CABLES.UI=CABLES.UI || {};

CABLES.UI.showToolTip=function(e,txt)
{
    $('.tooltip').show();
    $('.tooltip').css('top',e.clientY+12);
    $('.tooltip').css('left',e.clientX+25);
    $('.tooltip').html(txt);
};


CABLES.UI.hideToolTip=function()
{
    $('.tooltip').hide();
};

$(document).on('mouseover mousemove', '.tt', function(e)
{
    clearTimeout(tooltipTimeout);
    var txt=$(this).data('tt');
    tooltipTimeout = setTimeout(function()
    {
        CABLES.UI.showToolTip(e,txt);
    }, 300);
});

$(document).on('mouseout', '.tt', function()
{
    clearTimeout(tooltipTimeout);
    CABLES.UI.hideToolTip();
});


// --------------------------

CABLES.UI.showInfo=function(txt)
{
    if(!txt)txt='';
    $('#infoArea').html(mmd(txt));
};


CABLES.UI.hideInfo=function()
{
    $('#infoArea').html('');
};


$(document).on('mouseover mousemove', '.info', function(e)
{
    clearTimeout(tooltipTimeout);
    var txt=$(this).data('info');
    CABLES.UI.showInfo(txt);
});

$(document).on('mouseout', '.info', function()
{
    clearTimeout(tooltipTimeout);
    CABLES.UI.hideInfo();
});
