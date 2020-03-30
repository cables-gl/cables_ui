CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};

CABLES.UI.Chat=function(tabs,socket)
{
    this._tabs=tabs;

    socket.addEventListener("onChatMessage",this.onChatMsg.bind(this));

    this._msgs=[];

    this._socket=socket;
};

CABLES.UI.Chat.prototype.onChatMsg=function(payload)
{
    this._msgs.push(payload);
    console.log("chatmsg",payload.text);
    this._updateText();

};


CABLES.UI.Chat.prototype.show=function()
{
    this._tab=new CABLES.UI.Tab("chat",{"icon":"pie-chart","infotext":"tab_chat","padding":true});
    this._tabs.addTab(this._tab,true);

    var html = CABLES.UI.getHandleBarHtml('tab_chat',{});
    this._tab.html(html);

    this._updateText();

};

CABLES.UI.Chat.prototype._updateText=function()
{
    var html='';

    for(var i=0;i<this._msgs.length;i++)
    {
        html+='- ';
        html+=this._msgs[i].username+": ";
        html+=this._msgs[i].text;
        html+='<br/>'
    }

    document.getElementById("chatmsgs").innerHTML=html;
}


CABLES.UI.Chat.prototype.send=function(text)
{
    this._socket.send({"type":"chatmsg","text":text,"username":gui.user.usernameLowercase});
}

