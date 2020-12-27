CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.Chat = class extends CABLES.EventTarget
{
    constructor(tabs, socket)
    {
        super();
        this._msgs = [];
        this._socket = socket;
        this._tabs = tabs;

        socket.addEventListener("onChatMessage", this.onChatMsg.bind(this));
        socket.addEventListener("onInfoMessage", this.onChatMsg.bind(this));
    }

    onChatMsg(payload)
    {
        this._msgs.push(payload);
        this._updateText();
    }


    show()
    {
        this._tab = new CABLES.UI.Tab("chat", { "icon": "pie-chart", "infotext": "tab_chat", "padding": true });
        this._tabs.addTab(this._tab, true);

        const html = CABLES.UI.getHandleBarHtml("tab_chat", {});
        this._tab.html(html);
        this._updateText();
    }

    _updateText()
    {
        let html = "";
        const logEle = document.getElementById("chatmsgs");
        if (!logEle) return;

        for (let i = 0; i < this._msgs.length; i++)
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
    }

    send(text)
    {
        this._socket.sendChat(text);
    }
};
