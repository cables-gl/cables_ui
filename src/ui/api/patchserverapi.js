import { Logger, Events } from "cables-shared-client";
import { CgContext } from "cables-corelibs";
import { utils } from "cables";
import ModalDialog from "../dialogs/modaldialog.js";
import { notify, notifyError, notifyWarn } from "../elements/notification.js";
import namespace from "../namespaceutils.js";
import { gui } from "../gui.js";
import { platform } from "../platform.js";

export function bytesArrToBase64(arr)
{
    const abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"; // base64 alphabet
    const bin = (n) => { return n.toString(2).padStart(8, 0); }; // convert num to 8-bit binary string
    const l = arr.length;
    let result = "";

    for (let i = 0; i <= (l - 1) / 3; i++)
    {
        let c1 = i * 3 + 1 >= l; // case when "=" is on end
        let c2 = i * 3 + 2 >= l; // case when "=" is on end
        let chunk = bin(arr[3 * i]) + bin(c1 ? 0 : arr[3 * i + 1]) + bin(c2 ? 0 : arr[3 * i + 2]);
        let r = chunk.match(/.{1,6}/g).map((x, j) => { return (j == 3 && c2 ? "=" : (j == 2 && c1 ? "=" : abc[+("0b" + x)])); });
        result += r.join("");
    }

    return result;
}

export default class PatchSaveServer extends Events
{
    constructor()
    {
        super();
        this._currentProject = null;
        this._log = new Logger("patchsaveserver");
        this._serverDate = 0;
        this._lastErrorReport = null;

        this.isSaving = false;

    }

    getUiSettings()
    {
        if (this._currentProject)
            return this._currentProject.ui;
    }

    setProject(proj)
    {
        gui.setProjectName(proj.name);
        this._currentProject = proj;
    }

    setServerDate(d)
    {
        this._serverDate = d;
    }

    getServerDate()
    {
        return this._serverDate;
    }

    checkUpdatedSaveForce(updated)
    {
        this.setServerDate(updated);
        gui.closeModal();
        CABLES.CMD.PATCH.save(true, () =>
        {
            if (platform.getPatchVersion())
            {
                platform.talkerAPI.send("reload", { "patchId": gui.project().shortId });
            }
        });
    }

    checkUpdated(cb = null, fromSave = false, forceRequest = false)
    {
        if (!gui.project()) return;
        if (platform.isOffline() && !forceRequest)
        {
            if (cb)cb();
            return;
        }

        gui.jobs().start({
            "id": "checkupdated",
            "title": "check patch was updated",
            "indicator": "canvas"
        });

        platform.talkerAPI.send("checkProjectUpdated", {}, (err, data) =>
        {
            if (err)
            {
                this._log.log("error", err);
                gui.jobs().finish("checkupdated");

                /* ignore errors, unless project got deleted */
                if (cb && err.code === 404) cb(err);
                return;
            }

            platform.setOnline();
            if (gui.isRemoteClient)
            {
                gui.jobs().finish("checkupdated");
                if (cb) cb(null);
                return;
            }

            if (fromSave && data.maintenance && data.disallowSave)
            {
                const html =
                    "Cables is currently in maintenance mode, saving of patches is disallowed.<br/><br/>Leave the browser-window open, and wait until we are finished with the update.<br/><br/>" +
                    "<a class=\"button\" onclick=\"gui.closeModal();\">Close</a>&nbsp;&nbsp;";
                new ModalDialog(
                    {
                        "title": "Maintenance Mode",
                        "html": html,
                        "warning": true
                    });

                gui.jobs().finish("checkupdated");
            }
            else if (data.updated && (this._serverDate !== data.updated))
            {
                const serverDate = moment(data.updated);
                const localDate = moment(gui.patchView.store.getServerDate());
                if (serverDate.isAfter(localDate))
                {
                    if (fromSave)
                    {
                        let html = "This patch was changed. Your version is out of date. <br/><br/>Last update: " + moment(data.updated).fromNow() + " by " + (data.updatedByUser || "unknown") + "<br/><br/>";
                        html += "<a class=\"button\" onclick=\"gui.closeModal();\">Close</a>&nbsp;&nbsp;";
                        html += "<a class=\"button\" onclick=\"gui.patchView.store.checkUpdatedSaveForce('" + data.updated + "');\"><span class=\"icon icon-save\"></span>Save anyway</a>&nbsp;&nbsp;";
                        html += "<a class=\"button\" onclick=\"CABLES.CMD.PATCH.reload();\"><span class=\"icon icon-refresh\"></span>Reload patch</a>&nbsp;&nbsp;";

                        new ModalDialog({
                            "title": "Meanwhile...",
                            "html": html
                        });

                    }
                    else if (!gui.restriction.visible)
                    {
                        gui.restriction.setMessage("cablesupdate", "This patch was changed by " + (data.updatedByUser || "unknown") + ", " + moment(data.updated).fromNow() + "&nbsp;&nbsp;&nbsp; <a class=\"button\" onclick=\"CABLES.CMD.PATCH.reload();\"><span class=\"icon icon-refresh\"></span>reload </a>to get the latest update!");
                    }
                }
                if (cb)cb(null);
                gui.jobs().finish("checkupdated");
            }
            else
            {
                if (data.platform && data.platform.buildInfo)
                {
                    let newCore = false;
                    let newUi = false;
                    const buildInfo = data.platform.buildInfo;
                    if (buildInfo.updateWarning)
                    {
                        if (CABLESUILOADER.buildInfo.core) newCore = buildInfo.core.timestamp > CABLESUILOADER.buildInfo.core.timestamp;
                        if (CABLESUILOADER.buildInfo.ui) newUi = buildInfo.ui.timestamp > CABLESUILOADER.buildInfo.ui.timestamp;
                    }

                    if ((!gui.restriction.visible || gui.restriction.showing("cablesbuild")) && (newCore || newUi))
                    {
                        gui.restriction.setMessage("cablesupdate", "cables.gl has been updated! &nbsp;&nbsp;&nbsp; <a class=\"button\" onclick=\"CABLES.CMD.PATCH.reload();\"><span class=\"icon icon-refresh\"></span>reload </a>to get the latest update!");
                        gui.jobs().finish("checkupdated");
                    }
                    else
                    {
                        gui.jobs().finish("checkupdated");
                    }
                    if (cb)cb(null);
                }
                else
                {
                    gui.jobs().finish("checkupdated");
                    if (cb)cb(null);
                }
            }
        });
    }

    saveAs()
    {
        if (gui.showGuestWarning()) return;

        platform.talkerAPI.send("getPatch", {}, (_err, project) =>
        {
            if (_err)
            {
                let msg = _err || "no response";
                if (_err && _err.msg) msg = _err.msg;
                this._log.warn("[save patch error] ", msg);
                const modalOptions = {
                    "warning": true,
                    "title": "Could not clone patch",
                    "text": msg
                };
                new ModalDialog(modalOptions);
                return;
            }

            let hasPrivateUserOps = false;
            if (!project.userList.some((u) => { return u.usernameLowercase === gui.user.usernameLowercase; }))
            {
                hasPrivateUserOps = project.ops.find((op) => { return op.objName && op.objName.startsWith("Ops.User") && !op.objName.startsWith("Ops.User." + gui.user.usernameLowercase + "."); });
            }

            const copyCollaborators = project.visibility !== "public"; // don't do this for public patches

            let prompt = "Enter a name for the copy of this patch.";

            const modalNotices = [];

            if (hasPrivateUserOps)
            {
                modalNotices.push("<b>THIS PATCH HAS PRIVATE OPS.</b><br/>You can continue cloning this patch, but probably some things will not work.");
            }

            const checkboxGroups = [];
            const hasCollaborators = project.userList.filter((u) => { return u.username !== gui.user.username; }).length > 0;
            const hasTeams = true;

            if (hasCollaborators)
            {
                const userOpsUsed = gui.patchView.getUserOpsUsedInPatch();
                if (copyCollaborators)
                {
                    const checkboxGroup = { "title": "Invite the following collaborators to the copy:", "checkboxes": [] };
                    project.userList.forEach((user, i) =>
                    {
                        if (user._id !== gui.user.id)
                        {
                            const link = platform.getCablesUrl() + "/user/" + user.username;
                            const checkboxData = {
                                "name": "copy-collab-user-" + i,
                                "value": user._id,
                                "title": "<a href=\"" + link + "\" target=\"blank\">" + user.username + "</a>",
                                "checked": false,
                            };
                            if (userOpsUsed.some((userOp) => { return namespace.isUserOpOfUser(userOp.objName, user.usernameLowercase); }))
                            {
                                checkboxData.checked = true;
                                checkboxData.title += "<br/><span class=\"warning\">Collaborator should not be removed, their userops are used in the patch</span>";
                            }
                            checkboxGroup.checkboxes.push(checkboxData);
                        }
                    });
                    if (checkboxGroup.checkboxes.length > 0) checkboxGroups.push(checkboxGroup);
                }
                else
                {
                    modalNotices.push("Collaborators will NOT be copied for public patches!");
                }
            }

            if (hasTeams)
            {
                if (copyCollaborators)
                {
                    const checkboxGroup = { "title": "Add teams to the copy:", "checkboxes": [] };
                    project.teams.forEach((team, i) =>
                    {
                        if (team.allowEdit)
                        {
                            const link = platform.getCablesUrl() + team.link;
                            checkboxGroup.checkboxes.push({
                                "name": "copy-collab-team-" + i,
                                "value": team._id,
                                "title": "<a href=\"" + link + "\" target=\"blank\">" + team.name + "</a>",
                                "checked": false,
                                "disabled": false
                            });
                        }
                    });
                    if (checkboxGroup.checkboxes.length > 0) checkboxGroups.push(checkboxGroup);
                }
            }

            const usedPatchOps = gui.patchView.getPatchOpsUsedInPatch();
            if (usedPatchOps.length > 0)
            {
                let patchOpsText = "Patch ops used in this patch will be copied to the new patch. Create a <a href=\"" + platform.getCablesUrl() + "/myteams/\" target=\"_blank\">team</a> to share ops between patches and users!";
                modalNotices.push(patchOpsText);
            }

            if (project.userId !== gui.user.id)
            {
                let licenceText = "The author of the patch reserves all copyright on this work. Please respect this decision.";
                if (project.settings && project.settings.licence)
                {
                    let licenceName = project.settings.licence;
                    let licenceLink = null;
                    if (licenceName.startsWith("cc"))
                    {
                        let licenceUrl = licenceName.split("cc-", 2)[1];
                        if (licenceName === "cc0") licenceUrl = "cc0";
                        licenceLink = "https://creativecommons.org/licenses/" + licenceUrl + "/4.0/";
                        if (licenceLink) licenceName = "<a href=\"" + licenceLink + "\" target=\"_blank\">" + licenceName.toUpperCase() + "</a>";
                        licenceText = "Patch has a " + licenceName + " Licence. Please respect the licence chosen by the author.";
                    }
                }
                modalNotices.push(licenceText);
            }

            let patchName = gui.project().name;
            if (gui.corePatch() && gui.corePatch().name && gui.corePatch().name !== patchName) patchName = gui.corePatch().name;

            const saveAsModal = new ModalDialog({
                "prompt": true,
                "title": "Save As...",
                "text": prompt,
                "notices": modalNotices,
                "promptValue": "copy of " + patchName,
                "checkboxGroups": checkboxGroups,
                "promptOk": (name, checkboxStates) =>
                {
                    const collabUsers = [];
                    const collabTeams = [];
                    let copyAssets = false;

                    if (checkboxStates)
                    {
                        const keys = Object.keys(checkboxStates);
                        keys.forEach((key) =>
                        {
                            const value = checkboxStates[key];
                            if (value)
                            {
                                if (key.startsWith("copy-collab-team")) collabTeams.push(value);
                                if (key.startsWith("copy-collab-user")) collabUsers.push(value);
                                if (key === "copy-assets-on-clone") copyAssets = "used";
                                if (key === "copy-all-assets-on-clone") copyAssets = "all";
                            }
                        });
                    }
                    platform.talkerAPI.send("saveProjectAs",
                        {
                            "name": name,
                            "copyCollaborators": copyCollaborators,
                            "collabUsers": collabUsers,
                            "collabTeams": collabTeams,
                            "copyAssets": copyAssets
                        },
                        (err, d) =>
                        {
                            if (!err)
                            {
                                const newProjectId = d.shortId ? d.shortId : d._id;
                                gui.corePatch().settings = gui.corePatch().settings || {};
                                gui.corePatch().settings.secret = "";

                                if (copyAssets)
                                {
                                    platform.talkerAPI.send("gotoPatch", { "id": newProjectId });
                                }
                                else
                                {
                                    this.saveCurrentProject(() => { platform.talkerAPI.send("gotoPatch", { "id": newProjectId }); }, d._id, d.name, true);
                                }
                            }
                            else
                            {
                                new ModalDialog({
                                    "warning": true,
                                    "title": "Could not clone patch",
                                    "text": err.msg,
                                    "showOkButton": true
                                });
                            }
                        });
                }
            }, false);

            if (gui.user && gui.user.supporterFeatures)
            {
                if (gui.user.supporterFeatures.includes("copy_assets_on_clone"))
                {
                    platform.talkerAPI.send("getFilelist", { "source": "patch" }, (err, remoteFiles) =>
                    {
                        let numFiles = 0;
                        if (!err && remoteFiles) numFiles = remoteFiles.filter((remoteFile) => { return !remoteFile.isLibraryFile; }).length;

                        if (numFiles)
                        {
                            const checkboxGroup = { "title": "Supporter Features:", "checkboxes": [] };
                            checkboxGroup.checkboxes.push({
                                "name": "copy-assets-on-clone",
                                "value": true,
                                "title": "Copy used files to new patch"
                            });
                            checkboxGroup.checkboxes.push({
                                "name": "copy-all-assets-on-clone",
                                "value": true,
                                "title": "Copy all files to new patch"
                            });
                            checkboxGroups.push(checkboxGroup);
                            let patchOpsText = "Make sure you have all the rights to any asset you copy over to your new patch!";
                            modalNotices.push(patchOpsText);
                        }
                        saveAsModal.show();
                    });
                }
                else if (gui.user.supporterFeatures.includes("overquota_copy_assets_on_clone"))
                {
                    let patchOpsText = "You are out of storage space, upgrade your <a href=\"https://cables.gl/support\" target=\"_blank\">cables-support level</a>, to copy assets over to new patches again!</a> ";
                    modalNotices.push(patchOpsText);
                    saveAsModal.show();
                }
                else if (!gui.user.supporterFeatures.includes("disabled_copy_assets_on_clone"))
                {
                    let patchOpsText = "Become a <a href=\"https://cables.gl/support\" target=\"_blank\">cables supporter</a>, to copy assets over to new patches!</a> ";
                    modalNotices.push(patchOpsText);
                    saveAsModal.show();
                }
                else
                {
                    saveAsModal.show();
                }
            }
            else
            {
                saveAsModal.show();
            }
        });
    }

    saveCurrentProject(cb, _id, _name, _force)
    {
        if (gui.showGuestWarning()) return;
        if (!_force && gui.showSaveWarning()) return;

        if (_force)
        {
            this._saveCurrentProject(cb, _id, _name);
        }
        else
        {
            this.checkUpdated((err) =>
            {
                if (!err)
                {
                    this._saveCurrentProject(cb, _id, _name);
                }
                else
                {
                    let msg = err || "no response";
                    if (err && err.msg) msg = err.msg;
                    this._log.warn("[save patch error] ", msg);
                    const modalOptions = {
                        "warning": true,
                        "title": "Patch not saved",
                        "text": "Could not save patch: " + msg
                    };
                    new ModalDialog(modalOptions);
                }
            }, true);
        }
        gui.patchView.removeLostSubpatches();
    }

    finishAnimations()
    {
        gui.savingTitleAnimEnd();

        setTimeout(() =>
        {
            document.getElementById("canvasflash").classList.add("hidden");
            document.getElementById("canvasflash").classList.remove("flash");
        }, 320);
    }

    _saveCurrentProject(cb, _id, _name)
    {
        if (platform.isSaving())
        {
            this._log.log("already saving...");
            return;
        }

        if (gui.showGuestWarning()) return;

        gui.corePatch().emitEvent("uiSavePatch");
        platform.setSaving(true);

        const ops = gui.corePatch().ops;
        this._savedPatchCallback = cb;

        const blueprintIds = [];
        for (let i = 0; i < ops.length; i++)
        {
            const op = ops[i];
            if (!op || !op.uiAttribs) continue;

            if (op.isSubPatchOp() && op.uiAttribs.blueprintSubpatch)
            {
                blueprintIds.push(op.uiAttribs.blueprintSubpatch);

                if (op.patchId && op.isInBlueprint2())
                {
                    blueprintIds.push(op.patchId.get());
                }
            }

            if (op.uiAttribs.title === utils.getShortOpName(op.objName)) delete op.uiAttribs.title;
        }

        gui.jobs().start({ "id": "projectsave", "title": "save patch", "indicator": "canvas" });

        const currentProject = gui.project();

        let id = currentProject._id;
        let name = currentProject.name;
        if (_id) id = _id;
        if (_name) name = _name;
        let data = gui.corePatch().serialize({ "asObject": true });

        data.ops = data.ops || [];

        for (let i = 0; i < data.ops.length; i++)
        {
            if (data.ops[i].uiAttribs.error) delete data.ops[i].uiAttribs.error;
            if (data.ops[i].uiAttribs.warning) delete data.ops[i].uiAttribs.warning;
            if (data.ops[i].uiAttribs.hint) delete data.ops[i].uiAttribs.hint;
            if (data.ops[i].uiAttribs.uierrors) delete data.ops[i].uiAttribs.uierrors;
            if (data.ops[i].uiAttribs.extendTitle) delete data.ops[i].uiAttribs.extendTitle;
            if (data.ops[i].uiAttribs.loading) delete data.ops[i].uiAttribs.loading;
            if (data.ops[i].uiAttribs.history) delete data.ops[i].uiAttribs.history;

            if (data.ops[i].uiAttribs.hasOwnProperty("selected")) delete data.ops[i].uiAttribs.selected;
            if (data.ops[i].uiAttribs.subPatch == 0) delete data.ops[i].uiAttribs.subPatch;

            if (data.ops[i].uiAttribs.hasOwnProperty("fromNetwork")) delete data.ops[i].uiAttribs.fromNetwork;
        }

        // delete subpatch 2 ops
        let isu = data.ops.length;
        while (isu--)
            if (data.ops[isu].uiAttribs.blueprintSubpatch2 || (data.ops[isu].uiAttribs.subPatch && data.ops[isu].uiAttribs.subPatch.indexOf("bp2sub_") == 0))
                data.ops.splice(isu, 1);

        if (blueprintIds.length > 0)
        {
            let i = data.ops.length;
            // iterate backwards so we can splice
            while (i--)
            {
                const op = data.ops[i];
                if (op.uiAttribs && op.uiAttribs.subPatch && blueprintIds.includes(op.uiAttribs.subPatch))
                {
                    data.ops.splice(i, 1);
                }
            }
        }

        data.ui = {
            "viewBox": {},
            "renderer": {},
            "timeline": {},
        };

        data.ui.texPreview = gui.metaTexturePreviewer.serialize();
        data.ui.bookmarks = gui.bookmarks.getBookmarks();

        gui.patchView.serialize(data.ui);
        gui.patchParamPanel.serialize(data.ui);

        data.ui.renderer.w = Math.max(0, gui.rendererWidth);
        data.ui.renderer.h = Math.max(0, gui.rendererHeight);
        data.ui.renderer.s = Math.abs(gui.corePatch().cgl.canvasScale) || 1;

        if (gui.glTimeline)data.ui.timeline = gui.glTimeline.savePatchData();
        console.log("saving patch,.,,", data.ui.timeline);

        CABLES.patch.namespace = currentProject.namespace;

        setTimeout(() =>
        {
            try
            {
                const datastr = JSON.stringify(data);
                gui.patchView.warnLargestPort();

                const origSize = Math.round(datastr.length / 1024);

                let uint8data = pako.deflate(datastr);

                if (origSize > 1000)
                    this._log.log("saving compressed data", Math.round(uint8data.length / 1024) + "kb (was: " + origSize + "kb)");

                /*
                 * let b64 = Buffer.from(uint8data).toString("base64");
                 * bytesArrToBase
                 */
                let b64 = bytesArrToBase64(uint8data);

                if (datastr.length > 12 * 1024 * 1024)
                    notifyError("Patch is huge, try to reduce amount of data stored in patch/ports");

                gui.savingTitleAnimStart("Saving Patch...");

                /*
                 * document.getElementById("patchname").innerHTML = "Saving Patch";
                 * document.getElementById("patchname").classList.add("blinking");
                 */

                const startTime = performance.now();

                platform.savePatch(
                    {
                        "name": name,
                        "namespace": currentProject.namespace,
                        "dataB64": b64,
                        "fromBackup": platform.getPatchVersion() || false,
                        "buildInfo":
                        {
                            "core": CABLES.build,
                            "ui": CABLES.UI.build
                        }
                    },
                    (err, r) =>
                    {
                        platform.setSaving(false);

                        if (err)
                        {
                            this._log.warn("[save patch error] ", err.msg || err);
                        }
                        else if (r && r.updated)
                        {
                            this.setServerDate(r.updated);
                        }

                        gui.savedState.setSaved("patchServerApi", 0);
                        if (this._savedPatchCallback) this._savedPatchCallback();
                        this._savedPatchCallback = null;

                        if (gui.socket)
                            gui.socket.track("ui", "savepatch", "savepatch", {
                                "sizeCompressed": uint8data.length / 1024,
                                "sizeOrig": origSize,
                                "time": performance.now() - startTime
                            });

                        gui.emitEvent("patchsaved");
                        gui.jobs().finish("projectsave");

                        if (!r || !r.success || err)
                        {
                            let msg = err || "no response";
                            if (r && r.msg) msg = r.msg;

                            if (!navigator.onLine)msg = "no internet connection";

                            const modalOptions = {
                                "warning": true,
                                "title": "Patch not saved",
                                "text": "Could not save patch: " + msg
                            };

                            if (msg === "ILLEGAL_OPS")
                            {
                                const docsUrl = platform.getCablesDocsUrl();
                                modalOptions.text = "You lack permissions to the following ops:";
                                modalOptions.footer = "Invite the owners of the ops to this patch, join the teams the ops belong to, or convert them to patch ops.";
                                modalOptions.choice = true;
                                modalOptions.notices = [];
                                r.data.forEach((opName) =>
                                {
                                    modalOptions.notices.push("<a href=\"" + docsUrl + "/op/" + opName + "\">" + opName + "</a>");
                                });

                                modalOptions.cancelButton = {
                                    "text": "Convert",
                                    "callback": () =>
                                    {
                                        gui.patchView.unselectAllOps();
                                        r.data.forEach((opName) =>
                                        {
                                            const opsInPatch = gui.corePatch().getOpsByObjName(opName);
                                            opsInPatch.forEach((op) =>
                                            {
                                                gui.patchView.selectOpId(op.id);
                                            });
                                        });

                                        CABLES.CMD.OP.cloneSelectedOps();
                                    }
                                };
                            }
                            if (msg !== "CANCELLED")
                            {
                                new ModalDialog(modalOptions);
                            }
                            else
                            {
                                gui.setStateUnsaved();
                            }

                            this._log.log(r);
                            this.finishAnimations();
                            return;
                        }
                        else
                        {
                            if (gui.project().summary && gui.project().summary.isTest)
                            {
                                notifyWarn("Test patch saved", null, { "force": true });
                            }
                            else
                            if (gui.project().summary && gui.project().summary.exampleForOps && gui.project().summary.exampleForOps.length > 0)
                            {
                                notifyWarn("Example patch saved", null, { "force": true });
                            }
                            else
                            if (gui.project().summary && gui.project().summary.isPublic)
                            {
                                notifyWarn("Published patch saved", null, { "force": true });
                            }
                            else
                            {
                                notify("Patch saved (" + data.ops.length + " ops / " + Math.ceil(origSize) + " kb)", null, { "force": true });
                            }
                        }

                        const doSaveScreenshot = gui.corePatch().isPlaying();

                        if (doSaveScreenshot && !platform.manualScreenshot()) this.saveScreenshot();
                        else this.finishAnimations();
                    }
                );
            }
            catch (e)
            {
                platform.setSaving(false);

                let found = false;

                for (let i = 0; i < gui.corePatch().ops.length; i++)
                {
                    try
                    {
                        JSON.stringify(gui.corePatch().ops[i].getSerialized());
                    }
                    catch (e2)
                    {
                        found = true;

                        iziToast.error({
                            "position": "topRight", // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter, center
                            "theme": "dark",
                            "title": "update",
                            "message": "Error saving patch! ",
                            "progressBar": false,
                            "animateInside": false,
                            "close": true,
                            "timeout": false,
                            "buttons": [
                                [
                                    "<button>Go to op</button>",
                                    function (instance, toast)
                                    {
                                        gui.patchView.focusOp(gui.corePatch().ops[i].id);
                                        gui.patchView.centerSelectOp(gui.corePatch().ops[i].id);

                                        iziToast.hide({}, toast);
                                    }
                                ]
                            ]
                        });

                        break;
                    }
                }

                gui.jobs().finish("projectsave");
                this._log.log(e);
                if (!found) notifyError("error saving patch - try to delete disabled ops");
            }
            finally {}
        }, 100);
    }

    showModalTitleDialog(cb = null)
    {
        const currentProject = gui.project();
        new ModalDialog({
            "prompt": true,
            "title": "Patch Title",
            "text": "Set the title of this patch",
            "promptValue": currentProject.name,
            "promptOk": (v) =>
            {
                platform.talkerAPI.send(
                    "setProjectName",
                    {
                        "id": currentProject._id,
                        "name": v
                    },
                    (error, re) =>
                    {
                        const newName = re.data ? re.data.name : "";
                        if (error || !newName)
                        {
                            const options = {
                                "title": "Failed to set project name!",
                                "html": "Error: " + re.msg,
                                "warning": true,
                                "showOkButton": true
                            };
                            new ModalDialog(options);
                        }
                        else
                        {
                            if (re.data && re.data.summary)
                            {
                                gui.project().summary = re.data.summary;
                                gui.patchParamPanel.show(true);
                            }
                            platform.talkerAPI.send("updatePatchName", { "name": newName }, () =>
                            {
                                gui.setProjectName(newName);
                            });
                            if (cb) cb(newName);
                        }
                    });
            }
        });
    }

    saveScreenshot(hires, cb)
    {
        const thePatch = gui.corePatch();
        const cgl = thePatch.cgl;
        const w = (cgl.canvas.width / cgl.pixelDensity) || 640;
        const h = (cgl.canvas.height / cgl.pixelDensity) || 360;

        let screenshotWidth = 640;
        let screenshotHeight = 360;

        if (hires)
        {
            screenshotWidth = 1280;
            screenshotHeight = 720;
        }

        cgl.setSize(screenshotWidth, screenshotHeight);

        setTimeout(() =>
        {
            cgl.setSize(w, h);
            thePatch.resume();
        }, 300);

        thePatch.pause();
        document.getElementById("canvasflash").classList.remove("hidden");
        document.getElementById("canvasflash").classList.add("flash");

        setTimeout(() =>
        {
            // thePatch.renderOneFrame();
            // thePatch.renderOneFrame();
            gui.jobs().start({ "id": "screenshotsave", "title": "save patch - create screenshot" });

            if (cgl.gApi == CgContext.API_WEBGL) thePatch.resume();

            const url = gui.canvasManager.currentCanvas().toDataURL();

            platform.talkerAPI.send(
                "saveScreenshot",
                {
                    "screenshot": url
                },
                (error, re) =>
                {
                    if (error) this._log.warn("[screenshot save error]", error);

                    cgl.setSize(w, h + 1);
                    cgl.setSize(w, h);

                    thePatch.resume(); // must resume here for webgpu
                    gui.jobs().finish("screenshotsave");
                    if (gui.onSaveProject) gui.onSaveProject();
                    if (cb)cb();

                    this.finishAnimations();
                });

        }, 200);
    }

    sendErrorReport(report, manualSend = true)
    {
        const doneCallback = (res) =>
        {
            if (manualSend)
            {
                const modalOptions = {
                    "title": "Thank you",
                    "showOkButton": true,
                    "text": "We will look into it"
                };
                new ModalDialog(modalOptions);
            }

            if (res && res.data && res.data.url)
                this._log.log("sent error report: ", res.data.url);

            CABLES.lastError = null;
        };

        let sendReport = true;
        if (!manualSend)
        {
            if (this._lastErrorReport) sendReport = (performance.now() - this._lastErrorReport) > 2000;
        }

        if (!sendReport)
        {
            doneCallback();
        }
        else
        {
            this._lastErrorReport = performance.now();
            report.browserInfo = platformLib;
            try
            {
                const stringReport = JSON.stringify(report);
                if (stringReport.length > 10 * 1024 * 1024)
                {
                    this._log.warn("did not send error report - too big! " + Math.round(stringReport.length / 1024 / 1024) + " mb");
                    doneCallback();
                }
                else
                {
                    platform.talkerAPI.send("errorReport", report, doneCallback);
                }
            }
            catch (e)
            {
                this._log.warn("did not send error report - failed to stringify", e.message);
                doneCallback();
            }

        }
    }
}
