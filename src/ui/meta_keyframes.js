CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};


CABLES.UI.MetaKeyframes=function(projectId)
{
  this.anim=null;

};

CABLES.UI.MetaKeyframes.prototype.update=
CABLES.UI.MetaKeyframes.prototype.show=function()
{

    if(self.anim)
    {
        for(var i=0;i<self.anim.keys.length;i++)
        {
            self.anim.keys[i].frame=self.anim.keys[i].time*gui.timeLine().getFPS();
        }
    }

    var html = CABLES.UI.getHandleBarHtml('meta_keyframes',
    {
        anim:self.anim
    });

    $('#meta_content_keyframes').html(html);
};

CABLES.UI.MetaKeyframes.prototype.addKey=function()
{
    var v=prompt("New Keyframe [frame value]");
    if(v==null)return;

    var values=v.split(" ");

    gui.timeLine().getAnim().setValue(values[0]/gui.timeLine().getFPS(),values[1]||0);
    gui.timeLine().refresh();
    this.update();
};

CABLES.UI.MetaKeyframes.prototype.setAnim=function(anim)
{
    if(CABLES.UI.userSettings.get("metatab")=="keyframes")
    {
        self.anim=anim;
        console.log(anim);
        this.show();
    }

};
