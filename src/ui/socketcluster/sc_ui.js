import { gui } from "../gui.js";
import { notify, notifyWarn } from "../elements/notification.js";
import ModalDialog from "../dialogs/modaldialog.js";
import { platform } from "../platform.js";

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

            let opNames = "";
            for (let i in gui.serverOps.opIdsChangedOnServer)
            {
                opNames += gui.serverOps.opIdsChangedOnServer[i].opName + " ";
            }

            gui.restriction.setMessage("cablesupdate", "Some ops in this patch have changed: " + opNames + "  <a class=\"button\" onclick=\"CABLES.CMD.OP.reloadChangedOps();\"><span class=\"icon icon-refresh\"></span>reload ops</a>");

        }
    }

    _patchSaved(payload)
    {
        const data = payload.data || {};
        if (payload.isOwn)
        {
            platform.setSaving(false);
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
            else if (data.updated)
            {
                const serverDate = moment(data.updated);
                const localDate = moment(gui.patchView.store.getServerDate());
                if (serverDate.isAfter(localDate)) gui.patchView.store.setServerDate(data.updated);
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
            gui.jobs().finish("patchCreateBackup");
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
