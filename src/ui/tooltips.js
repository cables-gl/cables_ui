


CABLES.UI=CABLES.UI || {};

CABLES.UI.tooltipTimeout=null;


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
    clearTimeout(CABLES.UI.tooltipTimeout);
    var txt=$(this).data('tt');
    CABLES.UI.tooltipTimeout = setTimeout(function()
    {
        CABLES.UI.showToolTip(e,txt);
    }, 300);
});

$(document).on('mouseout', '.tt', function()
{
    clearTimeout(CABLES.UI.tooltipTimeout);
    CABLES.UI.hideToolTip();
});

// --------------------------

CABLES.UI.showInfo=function(txt)
{
    return;
  if(!txt) { txt = CABLES.UI.TEXTS.infoArea; }
  $('#infoArea').html(mmd(txt)+'<a class="button" onclick="gui.closeInfo();">close</a>');
};

CABLES.UI.hideInfo=function()
{
  var txt = CABLES.UI.TEXTS.infoArea;
  $('#infoArea').html('');
};


$(document).on('mouseover mousemove', '.info', function(e)
{
    clearTimeout(CABLES.UI.tooltipTimeout);
    var txt=$(this).data('info');
    if(!txt) { txt = $('infoArea').data('info');}
    CABLES.UI.showInfo(txt);
});

$(document).on('mouseout', '.info', function()
{
    clearTimeout(CABLES.UI.tooltipTimeout);
    CABLES.UI.hideInfo();
});
