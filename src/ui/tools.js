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
