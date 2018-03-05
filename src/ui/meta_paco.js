CABLES=CABLES || {};
CABLES.UI=CABLES.UI || {};

CABLES.UI.Paco=function()
{
};

CABLES.UI.Paco.prototype.open=function()
{
    var popup=window.open("/renderer/","_blank");
    popup.addEventListener('load', function()
    {
        console.log("loaded!");
        setTimeout(function() // kinda sucks... better create client send event and then send patch data....
        {
            var json={};
            json=gui.patch().scene.serialize(true);
            gui.patchConnection.send(CABLES.PACO_LOAD, {
                "patch": JSON.stringify(json),
            });    
            console.log(json);
        },1000);
    }, false);
    
}


CABLES.UI.Paco.prototype.show=function()
{
    var html = CABLES.UI.getHandleBarHtml('meta_paco',
    {
        // op:op,
        // doc:doc,
        // summary:summary,
        // libs:gui.opDocs.libs,
        user:gui.user
    });
    $('#meta_content_paco').html(html);

};
