CABLES = CABLES || {};
CABLES.UI = CABLES.UI || {};
CABLES.UI.Jobs = CABLES.UI.Jobs ||

function ()
{
    const jobs = [];
    let lastIndicator = null;
    this._jobsEle = document.getElementById("jobs");
    this._listenerStarted = false;

    this.startListener = function ()
    {
        this._listenerStarted = true;

        gui.chat.addEventListener("updated", () =>
        {
            if (this._jobsEle.style.display == "block") this.updateJobListing();
        });
    };

    this.updateJobListing = function ()
    {
        let str = "";
        let indicator = null;

        if (CABLES.sandbox.isOffline()) str += "<b>Offline! No internet connection.</b><br/><br/>";

        for (const i in jobs)
        {
            if (jobs[i].indicator)indicator = jobs[i].indicator;
            str += "<div><i class=\"fa fa-circle-o-notch fa-spin\"></i>&nbsp;&nbsp;" + jobs[i].title + "";
            str += "<div id=\"jobprogress" + jobs[i].id + "\" style=\"width:" + (jobs[i].progress || 0) + "%;background-color:white;height:3px;margin-top:3px;margin-bottom:7px;\"></div>";
            str += "</div>";
        }

        if (jobs.length == 0)
        {
            str += "All server jobs finished...";
            // document.querySelector(".cables-logo .icon-cables").classList.remove("blinkanim");
            gui.showLoadingProgress(false);
        }

        if (indicator)
        {
            gui.setWorking(true, indicator);
            lastIndicator = indicator;
        }
        else
        {
            if (lastIndicator) gui.setWorking(false, lastIndicator);
        }

        document.getElementById("jobs").innerHTML = str;
        document.getElementById("navsocketinfo").innerHTML = gui.chat.getUserInfoHtml();
        if (!this._listenerStarted) this.startListener();
    };

    this.update = function (job, func)
    {
        for (const i in jobs)
        {
            if (jobs[i].id == job.id)
            {
                jobs[i].title = job.title;
                break;
            }
        }
        this.updateJobListing();
    };

    this.start = function (job, func)
    {
        for (const i in jobs)
        {
            if (jobs[i].id == job.id)
            {
                jobs.splice(i, 1);
                break;
            }
        }

        // document.querySelector(".cables-logo .icon-cables").classList.add("blinkanim");
        gui.showLoadingProgress(true);

        jobs.push(job);
        this.updateJobListing();

        if (func)
        {
            setTimeout(func, 30);
        }
    };

    // this.updateProgressMainBar = function (prog)
    // {

    // };

    this.setProgress = function (jobId, progress)
    {
        let avg = 0;
        let avgCount = 0;
        for (const i in jobs)
        {
            if (jobs[i].id == jobId)
            {
                jobs[i].progress = progress;
                document.getElementById("jobprogress" + jobs[i].id).style.width = progress + "%";
            }

            if (jobs[i].progress)
            {
                avgCount++;
                avg += jobs[i].progress;
            }
        }
        if (avgCount)
        {
            const prog = avg / avgCount;
            document.getElementById("uploadprogress").style.width = prog + "%";

            if (prog === 100) document.getElementById("uploadprogresscontainer").classList.add("hidden");
            else document.getElementById("uploadprogresscontainer").classList.remove("hidden");
        }
    };

    this.finish = function (jobId)
    {
        setTimeout(() =>
        {
            for (const i in jobs)
            {
                if (jobs[i].id == jobId)
                {
                    if (jobs[i].title.indexOf("file") >= 0)
                    {
                        // gui.updateProjectFiles();
                        // CABLES.UI.fileSelect.load();
                        gui.showFileManager();
                    }
                    jobs.splice(i, 1);
                    break;
                }
            }


            if (jobs.length === 0)
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
        }, 250);
    };
};
