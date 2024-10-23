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
}
