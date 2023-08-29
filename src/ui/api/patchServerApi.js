
import Logger from "../utils/logger";
import ModalDialog from "../dialogs/modaldialog";
import defaultops from "../defaultops";


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


export default class PatchSaveServer extends CABLES.EventTarget
{
    constructor()
    {
        super();
        this._currentProject = null;
        this._log = new Logger("patchsaveserver");
        this._serverDate = 0;
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

    checkUpdatedSaveForce(updated)
    {
        this._serverDate = updated;
        gui.closeModal();
        CABLES.CMD.PATCH.save(true, () =>
        {
            if (CABLES.sandbox.getPatchVersion())
            {
                CABLESUILOADER.talkerAPI.send("reload", { "patchId": gui.project().shortId });
            }
        });
    }


    checkUpdated(cb, fromSave = false)
    {
        if (!gui.project()) return;
        if (CABLES.sandbox.isOffline())
        {
            if (cb)cb();
            return;
        }

        gui.jobs().start({
            "id": "checkupdated",
            "title": "check patch was updated",
            "indicator": "canvas"
        });

        CABLESUILOADER.talkerAPI.send("checkProjectUpdated", { "projectId": gui.project()._id }, (err, data) =>
        {
            if (err)
            {
                console.log("error", err);
                gui.jobs().finish("checkupdated");
                /* ignore errors */
                return;
            }

            if (gui.isRemoteClient)
            {
                gui.jobs().finish("checkupdated");
                if (cb)cb(null);
                return;
            }
            else if (gui.socket && gui.socket.inMultiplayerSession)
            {
                gui.jobs().finish("checkupdated");
                if (cb)cb(null);

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
            else if (this._serverDate != data.updated)
            {
                let html =
                    "This patch was changed. Your version is out of date. <br/><br/>Last update: " + data.updatedReadable + " by " + (data.updatedByUser || "unknown") + "<br/><br/>" +
                    "<a class=\"button\" onclick=\"gui.closeModal();\">Close</a>&nbsp;&nbsp;";
                if (!gui.getSavedState()) html += "<a class=\"button\" onclick=\"gui.patchView.store.checkUpdatedSaveForce('" + data.updated + "');\"><span class=\"icon icon-save\"></span>Save anyway</a>&nbsp;&nbsp;";
                html += "<a class=\"button\" onclick=\"CABLES.CMD.PATCH.reload();\"><span class=\"icon icon-refresh\"></span>Reload patch</a>&nbsp;&nbsp;";

                new ModalDialog(
                    {
                        "title": "Meanwhile...",
                        "html": html
                    });

                gui.jobs().finish("checkupdated");
            }
            else
            {
                CABLESUILOADER.talkerAPI.send("getBuildInfo", {}, (buildInfoErr, buildInfo) =>
                {
                    let newCore = false;
                    let newUi = false;

                    if (buildInfo.updateWarning)
                    {
                        if (CABLESUILOADER.buildInfo.core) newCore = buildInfo.core.timestamp > CABLESUILOADER.buildInfo.core.timestamp;
                        if (CABLESUILOADER.buildInfo.ui) newUi = buildInfo.ui.timestamp > CABLESUILOADER.buildInfo.ui.timestamp;
                    }

                    if (newCore || newUi)
                    {
                        const html =
                                "Cables has been updated. Your version is out of date.<br/><br/>Please save your progress and reload this page!<br/><br/>" +
                                "<a class=\"button\" id=\"modalClose\">Close</a>&nbsp;&nbsp;" +
                                "<a class=\"button\" onclick=\"gui.patchView.store.checkUpdatedSaveForce('" + data.updated + "');\"><span class=\"icon icon-save\"></span>Save progress</a>&nbsp;&nbsp;" +
                                "<a class=\"button\" onclick=\"CABLES.CMD.PATCH.reload();\"><span class=\"icon icon-refresh\"></span>Reload patch</a>&nbsp;&nbsp;";

                        new ModalDialog(
                            {
                                "title": "Meanwhile...",
                                "html": html
                            });

                        gui.jobs().finish("checkupdated");
                    }
                    else
                    {
                        gui.jobs().finish("checkupdated");
                        if (cb)cb(null);
                    }
                });
            }
        });
    }


    saveAs()
    {
        if (gui.showGuestWarning()) return;

        // if (window.process && window.process.versions.electron)
        // {
        //     const electron = require("electron");
        //     const remote = electron.remote;
        //     const dialog = remote.dialog;
        //     const data = gui.corePatch().serialize({ "asObject": true });

        //     data.ui = {
        //         "viewBox": {},
        //         "timeLineLength": gui.timeLine().getTimeLineLength()
        //     };

        //     gui.bookmarks.cleanUp();
        //     data.ui.bookmarks = gui.bookmarks.getBookmarks();
        //     // data.ui.viewBox = this._viewBox.serialize();
        //     data.ui.subPatchViewBoxes = gui.patch.getSubPatchViewBoxes();
        //     data.ui.renderer = {};
        //     data.ui.renderer.w = gui.rendererWidth;
        //     data.ui.renderer.h = gui.rendererHeight;
        //     data.ui.renderer.s = gui.corePatch().cgl.canvasScale || 1;

        //     dialog.showSaveDialog(
        //         {
        //             // file filters, only display files with these extensions
        //             "filters": [{
        //                 "name": "cables",
        //                 "extensions": ["cables"]
        //             }]
        //         },
        //         function (filePath)
        //         {
        //             this.nativeWritePatchToFile(data, filePath);
        //             this.filename = filePath; // store the path so we don't have to ask on next save
        //             this._log.log("this.filename saved: ", this.filename);
        //             const projectName = self.getProjectnameFromFilename(filePath);
        //             gui.setProjectName(projectName);
        //         }
        //     );
        //     return;
        // }

        CABLESUILOADER.talkerAPI.send("getPatch", {}, (_err, project) =>
        {
            let hasPrivateUserOps = false;
            if (!project.userList.some((u) => { return u.usernameLowercase === gui.user.usernameLowercase; }))
            {
                hasPrivateUserOps = project.ops.find((op) => { return op.objName && op.objName.startsWith("Ops.User") && !op.objName.startsWith("Ops.User." + gui.user.usernameLowercase + "."); });
            }

            const copyCollaborators = (!project.isOpExample && !project.settings.isPublic); // dont do this for example and public patches

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
                    const checkboxGroup = { "title": "The following collaborators will have access to the copy:", "checkboxes": [] };
                    project.userList.forEach((user, i) =>
                    {
                        if (user._id !== gui.user.id)
                        {
                            const link = CABLES.sandbox.getCablesUrl() + "/u/" + user.username;
                            const checkboxData = {
                                "name": "copy-collab-user-" + i,
                                "value": user._id,
                                "title": "<a href=\"" + link + "\" target=\"blank\">" + user.username + "</a>",
                                "checked": true,
                            };
                            if (userOpsUsed.some((userOp) => { return defaultops.isUserOpOfUser(userOp.objName, user.usernameLowercase); }))
                            {
                                checkboxData.disabled = true;
                                checkboxData.tooltip = "Collaborator cannot be removed, their userops are used in the patch";
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
                            const link = CABLES.sandbox.getCablesUrl() + team.link;
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
                let patchOpsText = "Patch ops used in this patch will be copied to the new patch.";
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

            console.log("patch save as - gui.project().name", gui.project().name);
            console.log("patch save as - gui.corePatch().name", gui.corePatch().name);
            console.log("patch save as - patchName", patchName);

            const localBlueprints = gui.corePatch().ops.filter((op) =>
            {
                if (!defaultops.isBlueprintOp(op)) return false;
                const port = op.getPortByName("externalPatchId");
                if (port && port.get()) return port.get() === gui.patchId || port.get() === gui.project().shortId;
                return false;
            });
            if (localBlueprints.length > 0)
            {
                checkboxGroups.push({
                    "title": "Blueprints:",
                    "checkboxes": [
                        {
                            "name": "keepLocalBlueprints",
                            "title": "Point local blueprints to new patch",
                            "checked": true
                        }
                    ]
                });
            }

            new ModalDialog({
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
                            }
                        });
                    }
                    CABLESUILOADER.talkerAPI.send("saveProjectAs",
                        {
                            "name": name,
                            "originalId": gui.project()._id,
                            "copyCollaborators": copyCollaborators,
                            "collabUsers": collabUsers,
                            "collabTeams": collabTeams
                        },
                        (err, d) =>
                        {
                            if (!err)
                            {
                                const newProjectId = d.shortId ? d.shortId : d._id;
                                gui.corePatch().settings = gui.corePatch().settings || {};
                                gui.corePatch().settings.isPublic = false;
                                gui.corePatch().settings.secret = "";
                                gui.corePatch().settings.isExample = false;
                                gui.corePatch().settings.isTest = false;
                                gui.corePatch().settings.isFeatured = false;

                                if (checkboxStates && checkboxStates.keepLocalBlueprints)
                                {
                                    gui.patchView.replacePortValues(localBlueprints, "externalPatchId", newProjectId);
                                }

                                this.saveCurrentProject(() => { CABLESUILOADER.talkerAPI.send("gotoPatch", { "id": newProjectId }); }, d._id, d.name, true);
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
            });
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
            this.checkUpdated(
                function (err)
                {
                    if (!err) this._saveCurrentProject(cb, _id, _name);
                }.bind(this), true);

        gui.patchView.removeLostSubpatches();
    }

    finishAnimations()
    {
        const elePatchName = ele.byId("patchname");
        elePatchName.classList.remove("blinking");

        if (elePatchName.dataset.patchname != "undefined")
            elePatchName.innerHTML = elePatchName.dataset.patchname;

        setTimeout(() =>
        {
            document.getElementById("canvasflash").classList.add("hidden");
            document.getElementById("canvasflash").classList.remove("flash");
        }, 320);
    }

    _saveCurrentProject(cb, _id, _name)
    {
        if (gui.jobs().hasJob("projectsave"))
        {
            console.log("already saving...");
            return;
        }

        gui.corePatch().emitEvent("uiSavePatch");

        if (gui.showGuestWarning()) return;

        const ops = gui.corePatch().ops;
        this._savedPatchCallback = cb;

        const blueprintIds = [];
        for (let i = 0; i < ops.length; i++)
        {
            const op = ops[i];
            if (op.uiAttribs)
            {
                if (defaultops.isBlueprintOp(op) && op.uiAttribs.blueprintSubpatch)
                {
                    blueprintIds.push(op.uiAttribs.blueprintSubpatch);

                    if (op.patchId && op.isInBlueprint2())
                    {
                        console.log("subpatch in blueprint found!", op);
                        blueprintIds.push(op.patchId.get());
                    }
                }
            }

            if (op.uiAttribs.title == CABLES.getShortOpName(op.objName)) delete op.uiAttribs.title;
        }

        gui.jobs().start({ "id": "projectsave", "title": "save patch", "indicator": "canvas" });

        const currentProject = gui.project();

        let id = currentProject._id;
        let name = currentProject.name;
        if (_id) id = _id;
        if (_name) name = _name;
        let data = gui.corePatch().serialize({ "asObject": true });

        for (let i = 0; i < data.ops.length; i++)
        {
            if (data.ops[i].uiAttribs.error) delete data.ops[i].uiAttribs.error;
            if (data.ops[i].uiAttribs.warning) delete data.ops[i].uiAttribs.warning;
            if (data.ops[i].uiAttribs.hint) delete data.ops[i].uiAttribs.hint;
            if (data.ops[i].uiAttribs.uierrors) delete data.ops[i].uiAttribs.uierrors;
            if (data.ops[i].uiAttribs.extendTitle) delete data.ops[i].uiAttribs.extendTitle;
            if (data.ops[i].uiAttribs.loading) delete data.ops[i].uiAttribs.loading;


            if (data.ops[i].uiAttribs.hasOwnProperty("selected")) delete data.ops[i].uiAttribs.selected;
            if (data.ops[i].uiAttribs.subPatch == 0) delete data.ops[i].uiAttribs.subPatch;

            if (data.ops[i].uiAttribs.hasOwnProperty("fromNetwork"))
            {
                delete data.ops[i].uiAttribs.fromNetwork;
            }
        }


        // delete subpatch 2 ops
        let isu = data.ops.length;
        while (isu--)
            if (data.ops[isu].uiAttribs.blueprintSubpatch2 || (data.ops[isu].uiAttribs.subPatch && data.ops[isu].uiAttribs.subPatch.indexOf("blueprint2sub_") == 0))
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
            "timeLineLength": gui.timeLine().getTimeLineLength()
        };

        data.ui.texPreview = gui.metaTexturePreviewer.serialize();


        data.ui.bookmarks = gui.bookmarks.getBookmarks();

        gui.patchView.serialize(data.ui);

        data.ui.renderer = {};
        data.ui.renderer.w = gui.rendererWidth;
        data.ui.renderer.h = gui.rendererHeight;
        data.ui.renderer.s = data.ui.renderer.s = gui.corePatch().cgl.canvasScale || 1;

        // electron
        // if (window.process && window.process.versions.electron)
        // {
        //     const electron = require("electron");
        //     const ipcRenderer = electron.ipcRenderer;
        //     const remote = electron.remote;
        //     const dialog = remote.dialog;

        //     this._log.log("filename before check: ", filename);
        //     // patch has been saved before, overwrite the patch
        //     if (filename)
        //     {
        //         this.nativeWritePatchToFile(data, filename);
        //     }
        //     else
        //     {
        //         dialog.showSaveDialog(
        //             {
        //                 // file filters, only display files with these extensions
        //                 "filters": [{
        //                     "name": "cables",
        //                     "extensions": ["cables"]
        //                 }]
        //             },
        //             function (filePath)
        //             {
        //                 this.nativeWritePatchToFile(data, filePath);
        //                 filename = filePath; // store the path so we don't have to ask on next save
        //                 this._log.log("filename saved: ", filename);
        //                 const projectName = this.getProjectnameFromFilename(filePath);
        //                 gui.setProjectName(projectName);
        //             }
        //         );
        //     }

        //     return;
        // }

        CABLES.patch.namespace = currentProject.namespace;
        console.log(1);
        setTimeout(() =>
        {
            try
            {
                const datastr = JSON.stringify(data);
                gui.patchView.warnLargestPort();

                const origSize = Math.round(data.length / 1024);

                let uint8data = pako.deflate(datastr);

                if (origSize > 1000)
                    console.log("saving compressed data", Math.round(uint8data.length / 1024) + "kb (was: " + origSize + "kb)");

                console.log(2);

                // let b64 = Buffer.from(uint8data).toString("base64");
                // bytesArrToBase
                let b64 = bytesArrToBase64(uint8data);


                document.getElementById("patchname").innerHTML = "Saving Patch";
                document.getElementById("patchname").classList.add("blinking");


                // let buf = new Buffer(b64, "base64"); // Ta-da
                // console.log("buf!!", buf);


                const startTime = performance.now();

                CABLES.sandbox.savePatch(
                    {
                        "id": id,
                        "name": name,
                        "namespace": currentProject.namespace,
                        "dataB64": b64,
                        "fromBackup": CABLES.sandbox.getPatchVersion() || false,
                        "buildInfo":
                    {
                        "core": CABLES.build,
                        "ui": CABLES.UI.build
                    }
                    },
                    (err, r) =>
                    {
                        if (err)
                        {
                            this._log.warn("[save patch error]", err);
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

                        gui.jobs().finish("projectsave");

                        if (!r || !r.success)
                        {
                            let msg = "no response";
                            if (r && r.msg) msg = r.msg;

                            CABLES.UI.MODAL.showError("Patch not saved", "Could not save patch: " + msg);

                            this._log.log(r);
                            this.finishAnimations();
                            return;
                        }
                        else
                        {
                            CABLES.UI.notify("Patch saved (" + data.ops.length + " ops)");
                            if (gui.socket)
                            {
                                if (gui.user.usernameLowercase)
                                    gui.socket.sendNotification(gui.user.usernameLowercase, "saved patch in other window");
                                else
                                    gui.socket.sendNotification("Patch saved in other window");
                            }

                            this._serverDate = r.updated;
                        }

                        const doSaveScreenshot = gui.corePatch().isPlaying();

                        if (doSaveScreenshot && !CABLES.sandbox.manualScreenshot()) this.saveScreenshot();
                        else this.finishAnimations();
                    }

                );
            }
            catch (e)
            {
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
                        // this._log.log(e);
                        // this is the op!

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

                console.log(e);
                if (!found)
                    CABLES.UI.notifyError("error saving patch - try to delete disabled ops");
            }
            finally {}
        }, 100);
    }


    /**
     * Saves a patch to a file, overwrites the file it exists
     *
     * @param {object} patchData The data-object to be saved
     * @param string} path The file-path to store the patch, e.g. '/Users/ulf/myPatch.cables'
     */
    // nativeWritePatchToFile(patchData, path)
    // {
    //     this._log.log("Saving patch to: ", path);
    //     const fs = require("fs");
    //     if (path)
    //     {
    //         fs.writeFile(path, JSON.stringify(patchData, null, 2), function (err)
    //         {
    //             if (err)
    //             {
    //                 CABLES.UI.notifyError("Error saving patch");
    //                 return this._log.log(err);
    //             }
    //             this._log.log("Patch successfully saved");
    //             CABLES.UI.notify("patch saved");
    //             gui.jobs().finish("projectsave");
    //             gui.setStateSaved();
    //         });
    //     }
    // }

    /**
     * Extracts the postfix-filename from a full filename
     * @param {string} filename e.g. '/Users/Ulf/foo.cables'
     * @returns {string} filename prefix, e.g. 'foo'
     */
    getProjectnameFromFilename(filename)
    {
        if (!filename) { return ""; }
        const lastDotIndex = filename.lastIndexOf(".");
        const separator = filename.indexOf("/") > -1 ? "/" : "\\";
        const lastSeparatorIndex = filename.lastIndexOf(separator);
        const name = filename.substring(lastSeparatorIndex + 1, lastDotIndex);
        return name;
    }

    showModalTitleDialog()
    {
        new CABLES.UI.ModalDialog({
            "prompt": true,
            "title": "Patch Title",
            "text": "Set the title of this patch",
            "promptValue": currentProject.name,
            "promptOk": (v) =>
            {
                console.log("yes! prompt finished", v);
            }
        });
    }


    saveScreenshot(hires, cb)
    {
        const thePatch = gui.corePatch();
        const cgl = thePatch.cgl;
        const currentProject = gui.project();

        const w = cgl.canvas.width / cgl.pixelDensity;
        const h = cgl.canvas.height / cgl.pixelDensity;

        let screenshotWidth = 640;
        let screenshotHeight = 360;

        if (hires)
        {
            screenshotWidth = 1280;
            screenshotHeight = 720;
        }

        cgl.canvas.width = screenshotWidth + "px";
        cgl.canvas.height = screenshotHeight + "px";
        cgl.canvas.style.width = screenshotWidth + "px";
        cgl.canvas.style.height = screenshotHeight + "px";

        const screenshotTimeout = setTimeout(() =>
        {
            cgl.setSize(w, h);
            thePatch.resume();
        }, 300);

        thePatch.pause();
        cgl.setSize(screenshotWidth, screenshotHeight);
        document.getElementById("canvasflash").classList.remove("hidden");
        document.getElementById("canvasflash").classList.add("flash");

        thePatch.renderOneFrame();
        thePatch.renderOneFrame();
        gui.jobs().start({ "id": "screenshotsave", "title": "save patch - create screenshot" });

        cgl.screenShot((screenBlob) =>
        {
            clearTimeout(screenshotTimeout);

            cgl.setSize(w, h);
            thePatch.resume();

            const reader = new FileReader();

            reader.onload = (event) =>
            {
                this._log.log("send screenshot", Math.round(event.target.result.length / 1024) + "kb");
                CABLESUILOADER.talkerAPI.send(
                    "saveScreenshot",
                    {
                        "id": currentProject._id,
                        "screenshot": event.target.result
                    },
                    (error, re) =>
                    {
                        if (error)
                            this._log.warn("[screenshot save error]", error);

                        gui.jobs().finish("screenshotsave");
                        if (gui.onSaveProject) gui.onSaveProject();
                        if (cb)cb();

                        this.finishAnimations();
                    });
            };

            try
            {
                reader.readAsDataURL(screenBlob);
            }
            catch (e)
            {
                this._log.log(e);
            }
        });
        // }, false, "image/webp", 80);
    }
}
