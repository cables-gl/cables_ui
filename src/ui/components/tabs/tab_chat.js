import { Events } from "cables-shared-client";
import Tab from "../../elements/tabpanel/tab.js";
import { getHandleBarHtml } from "../../utils/handlebars.js";

export default class Chat extends Events
{
    constructor(tabs, socket)
    {
        super();
        this._msgs = [];
        this._connection = socket;
        this._tabs = tabs;
        this.activityCounterIn = 0;
        this.activityCounterOut = 0;

        this._connection.on("onChatMessage", this.onChatMsg.bind(this));

        this._connection.on("connectionChanged", this._updateClientList.bind(this));
        this._connection.state.on("userListChanged", this._updateClientList.bind(this));

        this._connection.on("netActivityIn", this._activityIn.bind(this));
        this._connection.on("netActivityOut", this._activityOut.bind(this));
    }

    onChatMsg(payload)
    {
        // remove html
        const el = document.createElement("div");
        el.innerHTML = payload.text;
        payload.text = el.textContent || el.innerText || "";
        this._msgs.push(payload);
        this._updateText();
        this._updateClientList();
    }

    _activityIn()
    {
        const ele = document.getElementById("netactivityIn");
        if (!ele) return;
        this.activityCounterIn++;

        ele.innerHTML = this.activityCounterIn;
    }

    _activityOut()
    {
        const ele = document.getElementById("netactivityOut");
        if (!ele) return;
        this.activityCounterOut++;

        ele.innerHTML = this.activityCounterOut;
    }

    show()
    {
        this._tab = new Tab("chat", { "icon": "pie-chart", "infotext": "tab_chat", "padding": true, "singleton": "true", });
        this._tabs.addTab(this._tab, true);

        const html = getHandleBarHtml("tab_chat", {});
        this._tab.html(html);
        const inputEle = document.getElementById("newchatmsg");

        const submitAction = (event) =>
        {
            if (event.key === "Enter")
            {
                gui.socket.chat.send(document.getElementById("newchatmsg").value);
                document.getElementById("newchatmsg").value = "";
            }
        };
        if (inputEle)
        {
            inputEle.removeEventListener("keyup", submitAction);
            inputEle.addEventListener("keyup", submitAction);
        }
        this._updateText();
    }

    isOpen()
    {
        return this._tab && this._tab.active && this._tab.contentEle && this._tab.contentEle.offsetParent;
    }

    _updateClientList()
    {
        const ele = document.getElementById("chat-clientlist");

        if (ele)
        {
            const html = getHandleBarHtml("chat_clientlist", {
                "numClients": this._connection.state.getNumClients(),
                "clients": this._connection.state.clients,
                "connected": this._connection.isConnected()
            });
            ele.innerHTML = html;
        }
    }

    _updateText()
    {
        let html = "";
        const logEle = document.getElementById("chatmsgs");
        if (!logEle) return;

        for (let i = 0; i < this._msgs.length; i++)
        {
            if (this._msgs[i].name === "info")
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
        this._updateClientList();
    }

    send(text)
    {
        this._connection.sendChat(text);
    }
}
