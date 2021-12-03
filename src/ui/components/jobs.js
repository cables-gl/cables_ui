export default class Jobs
{
    constructor()
    {
        this._jobs = [];
        this._lastIndicator = null;
        this._jobsEle = ele.byId("jobs");
        this._listenerStarted = false;
    }

    startListener()
    {
        this._listenerStarted = true;

        gui.chat.addEventListener("updated", () =>
        {
            if (this._jobsEle.style.display == "block") this.updateJobListing();
        });
    }

    updateJobListing()
    {
        if (!window.gui || !gui.chat) return;

        let str = "";
        let indicator = null;

        if (CABLES.sandbox.isOffline()) str += "<b>Offline! No internet connection.</b><br/><br/>";

        for (const i in this._jobs)
        {
            if (this._jobs[i].indicator)indicator = this._jobs[i].indicator;
            str += "<div><i class=\"fa fa-circle-o-notch fa-spin\"></i>&nbsp;&nbsp;" + this._jobs[i].title + "";
            str += "<div id=\"jobprogress" + this._jobs[i].id + "\" style=\"width:" + (this._jobs[i].progress || 0) + "%;background-color:white;height:3px;margin-top:3px;margin-bottom:7px;\"></div>";
            str += "</div>";
        }

        if (this._jobs.length == 0)
        {
            str += "All server jobs finished...";
            // document.querySelector(".cables-logo .icon-cables").classList.remove("blinkanim");
            gui.showLoadingProgress(false);
        }

        ele.byId("jobs").innerHTML = str;
        if (!this._listenerStarted) this.startListener();
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
            console.error("job undefined", job);
            console.error((new Error()).stack);
        }

        gui.showLoadingProgress(true);

        gui.on("uiloaded", () =>
        {
            this.updateJobListing();
        });

        this._jobs.push(job);
        this.updateJobListing();

        if (func)
        {
            setTimeout(func, 30);
        }
    }


    setProgress(jobId, progress)
    {
        if (progress != 100)ele.byId("uploadprogresscontainer").classList.remove("hidden");
        let avg = 0;
        let avgCount = 0;
        for (const i in this._jobs)
        {
            if (this._jobs[i].id == jobId)
            {
                this._jobs[i].progress = progress;
                ele.byId("jobprogress" + this._jobs[i].id).style.width = progress + "%";
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

            if (prog === 100) ele.byId("uploadprogresscontainer").classList.add("hidden");
            else ele.byId("uploadprogresscontainer").classList.remove("hidden");
        }
    }

    finish(jobId)
    {
        setTimeout(() =>
        {
            for (const i in this._jobs)
            {
                if (this._jobs[i].id == jobId)
                {
                    if (this._jobs[i].title.indexOf("file") >= 0)
                    {
                        // gui.updateProjectFiles();
                        // CABLES.UI.fileSelect.load();
                        // gui.showFileManager();
                    }
                    this._jobs.splice(i, 1);
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
        }, 150);
    }
}
