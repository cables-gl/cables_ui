
var tooltipTimeout=null;

$(document).on('mouseover mousemove', '.tt', function(e)
{
    clearTimeout(tooltipTimeout);
    var txt=$(this).data('tt');
    tooltipTimeout = setTimeout(function()
    {
        $('.tooltip').show();
        $('.tooltip').css('top',e.clientY+12);
        $('.tooltip').css('left',e.clientX+12);
        $('.tooltip').html(txt);
    }, 300);
});

$(document).on('mouseout', '.tt', function()
{
    clearTimeout(tooltipTimeout);
    $('.tooltip').hide();
});

