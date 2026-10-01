import { ele, Events, Logger } from "cables-shared-client";
import { gui } from "../gui.js";
import { platform } from "../platform.js";

export default class Jobs extends Events
{
    constructor()
    {
        super();
        this._log = new Logger("Jobs");
        this._jobs = [];
        this._finishedJobs = [];
        this._uploadBatch = [];
        this._elUploadProgressBar = null;
        this._removeUploadProgressBarTimeout = null;
        this._lastIndicator = null;
        this._jobsEle = ele.byId("jobs");
        this._listenerStarted = false;
        this.hideProgressTimeout = null;
    }

    startListener()
    {
        this._listenerStarted = true;
    }

    getList()
    {
        let arr = [];
        for (const i in this._jobs)
        {
            arr.push(this._jobs[i]);
        }
        arr = arr.concat(this._finishedJobs);
        return arr;
    }

    updateJobListing()
    {
        if (!window.gui) return;

        let str = "";

        if (platform.isOffline()) str += "<b>Offline! No internet connection.</b><br/><br/>";

        if (this._jobs.length === 0)
        {
            this._visibleJobAnim = false;
            gui.showLoadingProgress(false);
        }
        else this._visibleJobAnim = true;

        this._updateVisibility();
    }

    update(job, func)
    {
        for (const i in this._jobs)
        {
            if (this._jobs[i].id == job.id)
            {
                this._jobs[i].title = job.title;
                break;
            }
        }
        this.updateJobListing();
    }

    hasJob(id)
    {
        for (const i in this._jobs)
        {
            if (this._jobs[i].id == id)
            {
                return true;
            }
        }
    }

    start(job, func)
    {
        for (const i in this._jobs)
        {
            if (this._jobs[i].id == job.id)
            {
                this._jobs.splice(i, 1);
                break;
            }
        }

        if (!job.id)
        {
            this._log.error("job undefined", job, new Error());
        }

        gui.showLoadingProgress(true);

        gui.on("uiloaded", () =>
        {
            this.updateJobListing();
        });

        if (!job.timeStart) job.timeStart = Date.now();

        this._jobs.push(job);
        this.updateJobListing();
        this.emitEvent("taskAdd");

        if (func)
        {
            setTimeout(func, 30);
        }

        if (!this.addedListeners)
        {
            this.addedListeners = true;
            gui.corePatch().loading.on("finishedTask", this.updateAssetProgress.bind(this));
            gui.corePatch().loading.on("addTask", this.updateAssetProgress.bind(this));
            gui.corePatch().loading.on("startTask", this.updateAssetProgress.bind(this));
        }
    }

    _updateVisibility()
    {
        if (gui.unload) return;
        const elContainer = ele.byId("uploadprogresscontainer");

        if (elContainer) return;

        if (this._visibleProgressBar)
        {
            clearTimeout(this.hideProgressTimeout);
            elContainer.classList.remove("hidden");
        }
        else
        {
            this.hideProgressTimeout = setTimeout(() =>
            {
                elContainer.classList.add("hidden");
            }, 100);
        }

        if (gui.isRemoteClient)
        {
            if (!this._visibleJobAnim && !this._visibleProgressBar) ele.byId("menubar").classList.add("hidden");
            else ele.byId("menubar").classList.remove("hidden");
        }
    }

    updateAssetProgress()
    {
        clearTimeout(this.removeProgressTo);
        let prog = gui.corePatch().loading.getProgress();

        if (prog === 1)
        {
            this.removeProgressTo = setTimeout(() =>
            {
                this._visibleProgressBar = false;
                this._updateVisibility();
            }, 100);
        }
        if (prog == 100)
        {
            this._visibleProgressBar = false;
            this._updateVisibility();
        }
        else
        {
            if (gui.corePatch().loading.getNumAssets() > 2)
            {
                this._visibleProgressBar = true;
                this._updateVisibility();
            }

            clearTimeout(this.timeout);
            this.timeout = setTimeout(this.updateAssetProgress.bind(this), 300);
        }
    }

    setProgress(jobId, progress)
    {
        this._visibleProgressBar = progress != 100;

        let avg = 0;
        let avgCount = 0;
        for (const i in this._jobs)
        {
            if (this._jobs[i].id == jobId)
            {
                this._jobs[i].progress = progress;
                this.setUploadProgress(jobId, progress);
            }

            if (this._jobs[i].progress)
            {
                avgCount++;
                avg += this._jobs[i].progress;
            }
        }
        if (avgCount)
        {
            const prog = avg / avgCount;
            ele.byId("uploadprogress").style.width = prog + "%";
            this._visibleProgressBar = prog != 100;
        }
        this._updateVisibility();
    }

    expectUpload(jobId)
    {
        if (!this._findUpload(jobId)) this._uploadBatch.push({ "id": jobId, "progress": 0 });
        this._updateUploadProgress();
    }

    _findUpload(jobId)
    {
        for (let i = 0; i < this._uploadBatch.length; i++)
        {
            if (this._uploadBatch[i].id == jobId) return this._uploadBatch[i];
        }
        return null;
    }

    setUploadProgress(jobId, progress)
    {
        let upload = this._findUpload(jobId);
        if (!upload && progress == 100) return;
        if (!upload)
        {
            upload = { "id": jobId, "progress": 0 };
            this._uploadBatch.push(upload);
        }
        upload.progress = Math.max(upload.progress, progress);
        this._updateUploadProgress();
    }

    _updateUploadProgress()
    {
        let numFinished = 0;
        let sum = 0;
        for (let i = 0; i < this._uploadBatch.length; i++)
        {
            if (this._uploadBatch[i].progress == 100) numFinished++;
            sum += this._uploadBatch[i].progress;
        }

        this._setUploadProgressBar(sum / this._uploadBatch.length);

        if (numFinished == this._uploadBatch.length)
        {
            this._uploadBatch = [];
            this._removeUploadProgressBarTimeout = setTimeout(this._removeUploadProgressBar.bind(this), 300);
        }
    }

    _setUploadProgressBar(percent)
    {
        clearTimeout(this._removeUploadProgressBarTimeout);

        const elMenubar = ele.byId("menubar");
        if (!elMenubar) return;

        if (!this._elUploadProgressBar)
        {
            this._elUploadProgressBar = document.createElement("div");
            this._elUploadProgressBar.id = "menubaruploadprogress";
            document.body.appendChild(this._elUploadProgressBar);
        }

        const rect = elMenubar.getBoundingClientRect();
        this._elUploadProgressBar.style.left = rect.left + "px";
        this._elUploadProgressBar.style.top = rect.top + "px";
        this._elUploadProgressBar.style.width = (rect.width * percent / 100) + "px";
    }

    _removeUploadProgressBar()
    {
        if (this._elUploadProgressBar) this._elUploadProgressBar.remove();
        this._elUploadProgressBar = null;
    }

    finish(jobId)
    {
        setTimeout(() =>
        {
            for (const i in this._jobs)
            {
                if (this._jobs[i].id == jobId)
                {
                    this._jobs[i].finished = true;
                    this._jobs[i].timeEnd = Date.now();

                    if (this._findUpload(jobId)) this.setUploadProgress(jobId, 100);

                    this._finishedJobs.push(this._jobs[i]);
                    this._jobs.splice(i, 1);
                    this.emitEvent("taskFinish");

                    break;
                }
            }

            if (this._jobs.length === 0)
            {
                const logo = document.querySelector(".cables .logo");
                if (logo)
                {
                    logo.classList.add("cablesLogo");
                    logo.classList.remove("fa");
                    logo.classList.remove("fa-circle-o-notch");
                    logo.classList.remove("fa-spin");
                }
            }
            this.updateJobListing();
            this.emitEvent("taskFinish");
        }, 150);
    }
}
