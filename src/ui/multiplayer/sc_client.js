export default class ScClient
{
    constructor(payload, ownClient)
    {
        let isOwnAnswer = false;
        if (ownClient && ownClient.clientId)
        {
            isOwnAnswer = payload.clientId === ownClient.clientId;
        }

        this.username = payload.username;
        this.userid = payload.userid;
        this.shortname = payload.username.substr(0, 2).toUpperCase();
        this.clientId = payload.clientId;
        this.lastSeen = payload.lastSeen;
        this.isMe = isOwnAnswer;
        this.color = this.getColor(payload.clientId);
        this.connectedSince = payload.connectedSince;
        this.inSessionSince = payload.inSessionSince;
        this.following = isOwnAnswer && ownClient ? ownClient.following : payload.following;
        this.isRemoteClient = payload.isRemoteClient;
        this.platform = payload.platform;
        this.x = payload.x;
        this.y = payload.y;
        this.subpatch = payload.subpatch;
        this.zoom = payload.zoom;
        this.scrollX = payload.scrollX;
        this.scrollY = payload.scrollY;
        this.inMultiplayerSession = payload.inMultiplayerSession;
        this.multiplayerCapable = payload.multiplayerCapable;
        this.isPilot = payload.isPilot;
    }

    getColor()
    {
        let hash = 0;
        for (let i = 0; i < this.clientId.length; i++)
        {
            hash = this.clientId.charCodeAt(i) + ((hash << 5) - hash);
        }
        let result = [];
        for (let i = 0; i < 3; i++)
        {
            let value = (hash >> (i * 8)) & 0xFF;
            result[i] = value / 255;
        }
        const color = {
            "r": result[0],
            "g": result[1],
            "b": result[2],
        };
        color.rb = Math.round(255 * color.r);
        color.gb = Math.round(255 * color.g);
        color.bb = Math.round(255 * color.b);

        return color;
    }
}
