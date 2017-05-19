CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.getHandleBarHtml=function(name,obj)
{
    var source   = $("#"+name).html();
    if(!source)
    {
        CABLES.UI.MODAL.showError('template not found','template '+name+' not found...');

        return;
    }
    var template = Handlebars.compile(source);
    var context = obj;
    return template(context);
};

function isNumber (o) {
  return ! isNaN (o-0) && o !== null && o !== "" && o !== false;
}

/**
 * @param t a raphael text shape
 * @param width - pixels to wrapp text width
 * modify t text adding new lines characters for wrapping it to given width.
 *
 * from: http://stackoverflow.com/questions/3142007/how-to-either-determine-svg-text-box-width-or-force-line-breaks-after-x-chara
 */
CABLES.UI.SVGParagraph = function(t, width) {
    var content = t.attr("text");
    var abc="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    t.attr({'text-anchor': 'start', "text": abc});
    var letterWidth=t.getBBox().width / abc.length;
    t.attr({"text": content});
    var words = content.split(" "), x=0, s=[];
    for ( var i = 0; i < words.length; i++) {
        var l = words[i].length;
        if(x+l>width) {
            s.push("\n");
            x=0;
        }
        else {
            x+=l*letterWidth;
        }
        s.push(words[i]+" ");
    }
    t.attr({"text": s.join("")});
};
