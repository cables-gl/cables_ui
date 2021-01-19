CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};

CABLES.UI.PatchServer = class extends CABLES.EventTarget
{
    constructor()
    {
        super();
        this._serverDate = 0;
    }

    setServerDate(d)
    {
        this._serverDate = d;
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
                if (this._serverDate != data.updated)
                {
                    CABLES.UI.MODAL.showError("meanwhile...", "This patch was changed. Your version is out of date. <br/><br/>Last update: " + data.updatedReadable + " by " + (data.updatedByUser || "unknown") + "<br/><br/>");
                    CABLES.UI.MODAL.contentElement.innerHTML += "<a class=\"button\" onclick=\"CABLES.UI.MODAL.hide(true);\">close</a>&nbsp;&nbsp;";
                    CABLES.UI.MODAL.contentElement.innerHTML += "<a class=\"button\" onclick=\"gui.patch().checkUpdatedSaveForce('" + data.updated + "');\">save anyway</a>&nbsp;&nbsp;";
                    CABLES.UI.MODAL.contentElement.innerHTML += "<a class=\"button fa fa-refresh\" onclick=\"CABLES.CMD.PATCH.reload();\">reload patch</a>&nbsp;&nbsp;";
                }
                else
                {
                    if (cb)cb(null);
                }
                gui.jobs().finish("checkupdated");
            }.bind(this), function () { /* ignore errors */ }
        );
    }


    saveAs()
    {
        if (gui.showGuestWarning()) return;

        if (window.process && window.process.versions.electron)
        {
            const electron = require("electron");
            const remote = electron.remote;
            const dialog = remote.dialog;
            const data = gui.corePatch().serialize(true);

            data.ui = {
                "viewBox": {},
                "timeLineLength": gui.timeLine().getTimeLineLength()
            };

            gui.bookmarks.cleanUp();
            data.ui.bookmarks = gui.bookmarks.getBookmarks();
            // data.ui.viewBox = this._viewBox.serialize();
            data.ui.subPatchViewBoxes = gui.patch().getSubPatchViewBoxes();
            data.ui.renderer = {};
            data.ui.renderer.w = gui.rendererWidth;
            data.ui.renderer.h = gui.rendererHeight;
            data.ui.renderer.s = gui.corePatch().cgl.canvasScale || 1;

            dialog.showSaveDialog(
                {
                    // file filters, only display files with these extensions
                    "filters": [{
                        "name": "cables",
                        "extensions": ["cables"]
                    }]
                },
                function (filePath)
                {
                    this.nativeWritePatchToFile(data, filePath);
                    gui.patch().filename = filePath; // store the path so we don't have to ask on next save
                    console.log("gui.patch().filename saved: ", gui.patch().filename);
                    const projectName = self.getProjectnameFromFilename(filePath);
                    gui.setProjectName(projectName);
                }
            );
            return;
        }

        const project = gui.project();

        const copyCollaborators = (project.settings.opExample.length == 0 && !project.settings.isPublic); // dont do this for example and public patches
        console.log("collabsen", project.settings, copyCollaborators);
        let prompt = "Enter a name for the copy of this Project.";

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


        CABLES.UI.MODAL.prompt(
            "Save As...",
            prompt,
            "copy of " + gui.corePatch().name,
            (name) =>
            {
                CABLESUILOADER.talkerAPI.send("saveProjectAs",
                    {
                        "name": name,
                        "originalId": gui.project()._id,
                        "copyCollaborators": copyCollaborators
                    },
                    (err, d) =>
                    {
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
                                CABLESUILOADER.talkerAPI.send("gotoPatch", { "id": d._id });
                            }, d._id, d.name, true);
                    });
            });
    }


    saveCurrentProject(cb, _id, _name, _force)
    {
        if (gui.showGuestWarning()) return;


        if (this.loadingError)
        {
            CABLES.UI.MODAL.showError("Project not saved", "Could not save project: had errors while loading!");
            return;
        }

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

    _saveCurrentProject(cb, _id, _name)
    {
        if (gui.showGuestWarning()) return;

        const ops = gui.corePatch().ops;
        this._savedPatchCallback = cb;

        for (let i = 0; i < ops.length; i++)
        {
            // console.log(ops[i]);
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
        // data.ui.viewBox = gui.patch()._viewBox.serialize();

        gui.patchView.serialize(data.ui);
        data.ui.subPatchViewBoxes = gui.patch().getSubPatchViewBoxes();

        data.ui.renderer = {};
        data.ui.renderer.w = gui.rendererWidth;
        data.ui.renderer.h = gui.rendererHeight;
        data.ui.renderer.s = data.ui.renderer.s = gui.corePatch().cgl.canvasScale || 1;

        // electron
        if (window.process && window.process.versions.electron)
        {
            const electron = require("electron");
            const ipcRenderer = electron.ipcRenderer;
            const remote = electron.remote;
            const dialog = remote.dialog;

            console.log("gui.patch().filename before check: ", gui.patch().filename);
            // patch has been saved before, overwrite the patch
            if (gui.patch().filename)
            {
                this.nativeWritePatchToFile(data, gui.patch().filename);
            }
            else
            {
                dialog.showSaveDialog(
                    {
                        // file filters, only display files with these extensions
                        "filters": [{
                            "name": "cables",
                            "extensions": ["cables"]
                        }]
                    },
                    function (filePath)
                    {
                        this.nativeWritePatchToFile(data, filePath);
                        gui.patch().filename = filePath; // store the path so we don't have to ask on next save
                        console.log("gui.patch().filename saved: ", gui.patch().filename);
                        const projectName = this.getProjectnameFromFilename(filePath);
                        gui.setProjectName(projectName);
                    }
                );
            }

            return;
        }

        CABLES.patch.namespace = currentProject.namespace;

        try
        {
            data = JSON.stringify(data);
            gui.patch().getLargestPort();

            console.log("saving data ", Math.round(data.length / 1024) + "kb");

            CABLES.sandbox.savePatch(
                {
                    "id": id,
                    "name": name,
                    "namespace": currentProject.namespace,
                    "data": data,
                    "buildInfo": {
                        "core": CABLES.build,
                        "ui": CABLES.UI.build
                    }
                },
                function (err, r)
                {
                    if (err)
                    {
                        console.warn("[save patch error]", err);
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

                        console.log(r);
                        return;
                    }
                    else CABLES.UI.notify("Patch saved");

                    this._serverDate = r.updated;
                    const thePatch = gui.corePatch();
                    const cgl = thePatch.cgl;
                    const doSaveScreenshot = gui.corePatch().isPlaying();
                    const w = cgl.canvas.width / cgl.pixelDensity;
                    const h = cgl.canvas.height / cgl.pixelDensity;

                    if (doSaveScreenshot)
                    {
                        cgl.canvas.width = "640px";
                        cgl.canvas.height = "360px";
                    }

                    if (doSaveScreenshot)
                    {
                        const screenshotTimeout = setTimeout(function ()
                        {
                            cgl.setSize(w, h);
                            thePatch.resume();
                        }, 300);

                        thePatch.pause();
                        cgl.setSize(640, 360);
                        thePatch.renderOneFrame();
                        thePatch.renderOneFrame();
                        gui.jobs().start({ "id": "screenshotsave", "title": "saving screenshot" });

                        cgl.screenShot(function (screenBlob)
                        {
                            clearTimeout(screenshotTimeout);

                            cgl.setSize(w, h);
                            thePatch.resume();

                            const reader = new FileReader();

                            reader.onload = function (event)
                            {
                                CABLESUILOADER.talkerAPI.send(
                                    "saveScreenshot",
                                    {
                                        "id": currentProject._id,
                                        "screenshot": event.target.result
                                    },
                                    function (error, re)
                                    {
                                        if (error)
                                        {
                                            console.warn("[screenshot save error]", error);
                                        }
                                        // console.log("screenshot saved!");
                                        gui.jobs().finish("screenshotsave");
                                        if (gui.onSaveProject) gui.onSaveProject();
                                    });
                            };

                            try
                            {
                                reader.readAsDataURL(screenBlob);
                            }
                            catch (e)
                            {
                                console.log(e);
                            }
                        });
                    }
                }.bind(this)

            );
        }
        catch (e)
        {
            console.log(e);
            CABLES.UI.notifyError("error saving patch - try to delete disables ops");
        }
        finally {}
    }


    /**
     * Saves a patch to a file, overwrites the file it exists
     *
     * @param {object} patchData The data-object to be saved
     * @param string} path The file-path to store the patch, e.g. '/Users/ulf/myPatch.cables'
     */
    nativeWritePatchToFile(patchData, path)
    {
        console.log("Saving patch to: ", path);
        const fs = require("fs");
        if (path)
        {
            fs.writeFile(path, JSON.stringify(patchData, null, 2), function (err)
            {
                if (err)
                {
                    CABLES.UI.notifyError("Error saving patch");
                    return console.log(err);
                }
                console.log("Patch successfully saved");
                CABLES.UI.notify("patch saved");
                gui.jobs().finish("projectsave");
                gui.setStateSaved();
            });
        }
    }

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
};
