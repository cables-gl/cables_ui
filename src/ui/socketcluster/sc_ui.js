import { gui } from "../gui.js";
import { notify, notifyWarn } from "../elements/notification.js";
import ModalDialog from "../dialogs/modaldialog.js";

export default class ScUi
{
    constructor(connection)
    {
        this._connection = connection;
        this._registerEventListeners();
    }

    _registerEventListeners()
    {
        this._connection.on("onInfoMessage", (payload) =>
        {
            const data = payload.data;
            if (!data || !data.action) return;

            switch (data.action)
            {
            case "patchOpSaved":
                this._patchOpSaved(payload);
                break;
            case "patchSaved":
                this._patchSaved(payload);
                break;
            case "backupCreated":
                this._backupCreated(payload);
                break;
            }
        });
    }

    _patchOpSaved(payload)
    {
        const data = payload.data || {};
        if (!payload.isOwn)
        {
            gui.serverOps.addOpIdChangedOnServer(data.opId, data);
        }
    }

    _patchSaved(payload)
    {
        const data = payload.data || {};
        if (payload.isOwn)
        {
            if (data.error)
            {
                this._connection._log.warn("[save patch error] ", data.msg);
                const modalOptions = {
                    "warning": true,
                    "title": "Patch not saved",
                    "text": "Could not save patch: " + data.msg
                };
                new ModalDialog(modalOptions);
            }
            else
            {
                gui.patchView.store.setServerDate(data.updated);
            }
        }
        else
        {
            if (!data.error)
            {
                if (data.updatedByUser)
                {
                    notify(data.updatedByUser + " saved patch in other window");
                }
                else
                {
                    notify("Patch saved in other window");
                }
            }
        }
    }

    _backupCreated(payload)
    {
        const data = payload.data || {};
        if (payload.isOwn)
        {
            if (data.error)
            {
                notifyWarn("Backup failed! " + data.msg);
            }
            else
            {
                notify("Backup created!");
            }
        }
    }
}
