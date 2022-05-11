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
            hash = this.clientId.charCodeAt(i) + ((hash << 5) - hash);

        const value = ((hash >> 8) & 0xFF) / 255;
        const result = chroma(360 * value, 1, 0.6, "hsl").rgb();

        return {
            "r": result[0] / 255,
            "g": result[1] / 255,
            "b": result[2] / 255,
            "rb": result[0],
            "gb": result[1],
            "bb": result[2],
        };
    }
}
