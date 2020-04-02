CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.Chat = function (tabs, socket)
{
    this._tabs = tabs;

    socket.addEventListener("onChatMessage", this.onChatMsg.bind(this));
    socket.addEventListener("onInfoMessage", this.onChatMsg.bind(this));
    socket.addEventListener("onPingAnswer", this.onPingAnswer.bind(this));

    this._msgs = [];
    this._users = {};

    this._socket = socket;
};

CABLES.UI.Chat.updateIntervalSeconds = 10;

CABLES.UI.Chat.prototype.onChatMsg = function (payload)
{
    this._msgs.push(payload);
    console.log("chatmsg", payload.text);
    this._updateText();
};

CABLES.UI.Chat.prototype.onPingAnswer = function (payload)
{
    if (!Array.isArray(this._users[payload.username]))
    {
        this._users[payload.username] = [];
    }
    const client = this._users[payload.username].find(c => c.clientId == payload.clientId);
    if (client)
    {
        client.lastSeen = payload.lastSeen;
    }
    else
    {
        this._users[payload.username].push({ clientId: payload.clientId, lastSeen: payload.lastSeen });
    }
    this._cleanUpUserList();
    console.log("new user list", this._users);
};

CABLES.UI.Chat.prototype.show = function ()
{
    this._tab = new CABLES.UI.Tab("chat", { icon: "pie-chart", infotext: "tab_chat", padding: true });
    this._tabs.addTab(this._tab, true);

    var html = CABLES.UI.getHandleBarHtml("tab_chat", {});
    this._tab.html(html);
    this._updateText();
};

CABLES.UI.Chat.prototype._cleanUpUserList = function ()
{
    const timeOutSeconds = CABLES.UI.Chat.updateIntervalSeconds * 2;
    Object.keys(this._users).forEach((userName) =>
    {
        const user = this._users[userName];
        for (var j = 0; j < user.length; j++)
        {
            const client = user[j];
            if (client.lastSeen && Date.now() - client.lastSeen > timeOutSeconds * 1000)
            {
                user.splice(j, 1);
            }
            if (user.length === 0)
            {
                delete this._users[userName];
            }
        }
    });
};

CABLES.UI.Chat.prototype._updateText = function ()
{
    var html = "";

    var logEle = document.getElementById("chatmsgs");
    if (!logEle) return;

    for (var i = 0; i < this._msgs.length; i++)
    {
        if (this._msgs[i].type == "info")
        {
            html += "<b>";
            html += this._msgs[i].text;
            html += "</b>";
        }
        else
        {
            html += "- ";
            html += this._msgs[i].username + ": ";
            html += this._msgs[i].text;
        }
        html += "<br/>";
    }

    logEle.innerHTML = html;
};

CABLES.UI.Chat.prototype.send = function (text)
{
    this._socket.sendChat(text);
};
