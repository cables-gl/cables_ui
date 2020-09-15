
CABLES.UI.Logger = class extends CABLES.EventTarget
{
    constructor()
    {
        super();
        this._logs = [];
    }

    log(log)
    {
        console.log("[" + log.initiator + "] " + log.text);

        if (this._logs.length > 0)
        {
            const lastLog = this._logs[this._logs.length - 1];
            let equals = true;
            for (const i in log)
            {
                if (lastLog[i] && lastLog[i] != log[i])
                {
                    equals = false;
                    break;
                }
            }
            if (equals)
            {
                lastLog.count++;
                return;
            }
        }

        log.count = 0;
        this._logs.push(log);
    }

    userInteraction(text)
    {
        this.log({ "initiator": "userinteraction", "text": text });
    }
};
