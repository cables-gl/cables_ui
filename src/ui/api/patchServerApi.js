
import Logger from "../utils/logger";
import ModalDialog from "../dialogs/modaldialog";

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
        // gui.closeModal();
        gui.closeModal();
        CABLES.CMD.PATCH.save(true);
    }

    checkUpdated(cb)
    {
        if (!gui.project()) return;
        if (CABLES.sandbox.isOffline())
        {
            if (cb)cb();
            return;
        }

        gui.jobs().start({
            "id": "checkupdated",
            "title": "check if patch was updated",
            "indicator": "canvas"
        });

        // todo is this protected ?
        CABLES.api.get("project/" + gui.project()._id + "/updated",
            function (data)
            {
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

                if (data.maintenance)
                {
                    const html =
                        "Cables is currently in maintenance mode, saving of patches is disallowed.<br/><br/>Leave this window open, and wait until we are finished with the update.<br/><br/>" +
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
                    const html =
                        "This patch was changed. Your version is out of date. <br/><br/>Last update: " + data.updatedReadable + " by " + (data.updatedByUser || "unknown") + "<br/><br/>" +
                        "<a class=\"button\" onclick=\"gui.closeModal();\">Close</a>&nbsp;&nbsp;" +
                        "<a class=\"button\" onclick=\"gui.patchView.store.checkUpdatedSaveForce('" + data.updated + "');\"><span class=\"icon icon-save\"></span>Save anyway</a>&nbsp;&nbsp;" +
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
                    CABLESUILOADER.talkerAPI.send("getBuildInfo", {},
                        (err, buildInfo) =>
                        {
                            let newCore = false;
                            let newUi = false;
                            let newApi = false;

                            if (buildInfo.updateWarning)
                            {
                                if (CABLESUILOADER.buildInfo.core) newCore = buildInfo.core.timestamp > CABLESUILOADER.buildInfo.core.timestamp;
                                if (CABLESUILOADER.buildInfo.ui) newUi = buildInfo.ui.timestamp > CABLESUILOADER.buildInfo.ui.timestamp;
                                if (CABLESUILOADER.buildInfo.api) newApi = buildInfo.api.timestamp > CABLESUILOADER.buildInfo.api.timestamp;
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
            }.bind(this), function () { /* ignore errors */ }
        );
    }


    saveAs()
    {
        if (gui.showGuestWarning()) return;

        // if (window.process && window.process.versions.electron)
        // {
        //     const electron = require("electron");
        //     const remote = electron.remote;
        //     const dialog = remote.dialog;
        //     const data = gui.corePatch().serialize(true);

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

        const project = gui.project();
        let hasPrivateUserOps = false;
        if (!project.userList.includes(gui.user.usernameLowercase))
        {
            hasPrivateUserOps = project.ops.find((op) => { return op.objName.startsWith("Ops.User") && !op.objName.startsWith("Ops.User." + gui.user.usernameLowercase + "."); });
        }

        const copyCollaborators = (!project.isOpExample && !project.settings.isPublic); // dont do this for example and public patches

        let prompt = "Enter a name for the copy of this Project.";

        if (hasPrivateUserOps)
        {
            prompt += "<br/><br/><b>THIS PATCH HAS PRIVATE OPS.</b><br/>You can continue saving this patch, but probably some things will not work.";
        }

        if (copyCollaborators)
        {
            prompt += "<br/><br/>The following users will have access to the copy: ";
            project.userList.forEach((name, i) =>
            {
                if (i > 0) prompt += ", ";
                prompt += name;
            });
        }
        else
        {
            prompt += "<br/><br/>Collaborators will NOT be copied for public patches!";
        }

        const p = new ModalDialog({
            "prompt": true,
            "title": "Save As...",
            "text": prompt,
            "promptValue": "copy of " + gui.corePatch().name,
            "promptOk": (name) =>
            {
                CABLESUILOADER.talkerAPI.send("saveProjectAs",
                    {
                        "name": name,
                        "originalId": gui.project()._id,
                        "copyCollaborators": copyCollaborators
                    },
                    (err, d) =>
                    {
                        const newProjectId = d.shortId ? d.shortId : d._id;
                        gui.corePatch().settings = gui.corePatch().settings || {};
                        gui.corePatch().settings.isPublic = false;
                        gui.corePatch().settings.secret = "";
                        gui.corePatch().settings.isExample = false;
                        gui.corePatch().settings.isTest = false;
                        gui.corePatch().settings.isFeatured = false;
                        gui.corePatch().settings.opExample = "";

                        this.saveCurrentProject(
                            function ()
                            {
                                CABLESUILOADER.talkerAPI.send("gotoPatch", { "id": newProjectId });
                            }, d._id, d.name, true);
                    });
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
            this.checkUpdated(
                function (err)
                {
                    if (!err) this._saveCurrentProject(cb, _id, _name);
                }.bind(this));
    }

    finishAnimations()
    {
        document.getElementById("patchname").classList.remove("blinking");

        if (document.getElementById("patchname").dataset.patchname != "undefined")
            document.getElementById("patchname").innerHTML = document.getElementById("patchname").dataset.patchname;


        setTimeout(() =>
        {
            document.getElementById("canvasflash").classList.add("hidden");
            document.getElementById("canvasflash").classList.remove("flash");
        }, 320);
    }

    _saveCurrentProject(cb, _id, _name)
    {
        gui.corePatch().emitEvent("uiSavePatch");

        if (gui.showGuestWarning()) return;

        const ops = gui.corePatch().ops;
        this._savedPatchCallback = cb;

        for (let i = 0; i < ops.length; i++)
        {
            // this._log.log(ops[i]);
            if (ops[i].uiAttribs.error) delete ops[i].uiAttribs.error;
            if (ops[i].uiAttribs.warning) delete ops[i].uiAttribs.warning;
            if (ops[i].uiAttribs.hint) delete ops[i].uiAttribs.hint;
            if (ops[i].uiAttribs.uierrors) delete ops[i].uiAttribs.uierrors;
        }

        gui.jobs().start({ "id": "projectsave", "title": "saving project", "indicator": "canvas" });

        const currentProject = gui.project();

        let id = currentProject._id;
        let name = currentProject.name;
        if (_id) id = _id;
        if (_name) name = _name;
        let data = gui.corePatch().serialize(true);

        data.ui = {
            "viewBox": {},
            "timeLineLength": gui.timeLine().getTimeLineLength()
        };

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

        try
        {
            data = JSON.stringify(data);
            gui.patchView.warnLargestPort();

            const origSize = Math.round(data.length / 1024);

            // data = LZString.compress(data);
            let uint8data = pako.deflate(data);
            this._log.log("saving compressed data ", Math.round(uint8data.length / 1024) + " / " + origSize + "kb");


            document.getElementById("patchname").innerHTML = "Saving Patch";
            document.getElementById("patchname").classList.add("blinking");


            CABLES.sandbox.savePatch(
                {
                    "id": id,
                    "name": name,
                    "namespace": currentProject.namespace,
                    "data": uint8data,
                    "fromBackup": !!CABLES.sandbox.getPatchVersion(),
                    "buildInfo": {
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

                    gui.jobs().finish("projectsave");

                    gui.setStateSaved();
                    if (this._savedPatchCallback) this._savedPatchCallback();
                    this._savedPatchCallback = null;

                    if (!r || !r.success)
                    {
                        let msg = "no response";
                        if (r)msg = r.msg;

                        CABLES.UI.MODAL.showError("Patch not saved", "Could not save patch: " + msg);

                        this._log.log(r);
                        return;
                    }
                    else
                    {
                        CABLES.UI.notify("Patch saved");
                        if (gui.socket)
                        {
                            if (gui.user.usernameLowercase)
                            {
                                gui.socket.sendNotification(gui.user.usernameLowercase, "saved patch in other window");
                            }
                            else
                            {
                                gui.socket.sendNotification("Patch saved in other window");
                            }
                        }
                    }

                    this._serverDate = r.updated;
                    const thePatch = gui.corePatch();
                    const cgl = thePatch.cgl;
                    const doSaveScreenshot = gui.corePatch().isPlaying();

                    if (CABLES.sandbox.manualScreenshot()) this._log.log("not sending screenshot...");

                    if (doSaveScreenshot && !CABLES.sandbox.manualScreenshot())
                    {
                        this.saveScreenshot();
                    }
                    else
                    {
                        this.finishAnimations();
                    }
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

            this._log.log(e);
            if (!found)
                CABLES.UI.notifyError("error saving patch - try to delete disabled ops");
        }
        finally {}
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
        gui.jobs().start({ "id": "screenshotsave", "title": "saving screenshot" });

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
                        {
                            this._log.warn("[screenshot save error]", error);
                        }
                        // this._log.log("screenshot saved!");
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
