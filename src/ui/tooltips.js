
var tooltipTimeout=null;

CABLES.UI=CABLES.UI || {};

CABLES.UI.showToolTip=function(e,txt)
{
    $('.tooltip').show();
    $('.tooltip').css('top',e.clientY+12);
    $('.tooltip').css('left',e.clientX+12);
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

