CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.getHandleBarHtml=function(name,obj)
{
    var source   = $("#"+name).html();
    var template = Handlebars.compile(source);
    var context = obj;
    return template(context);
};

function isNumber (o) {
  return ! isNaN (o-0) && o !== null && o !== "" && o !== false;
}

CABLES.UI.getWheelSpeed=function(event)
{
    var normalized;
    if (event.wheelDelta)
    {
        normalized = (event.wheelDelta % 120 - 0) == -0 ? event.wheelDelta / 120 : event.wheelDelta / 12;
    }
    else
    {
        var rawAmmount = event.deltaY ? event.deltaY : event.detail;
        normalized = -(rawAmmount % 3 ? rawAmmount * 10 : rawAmmount / 3);
    }
    return normalized*-0.2;
};