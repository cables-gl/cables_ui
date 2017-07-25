CABLES=CABLES || {};
CABLES.UI=CABLES.UI || {};
CABLES.UI.Jobs=CABLES.UI.Jobs ||

function()
{
    var jobs=[];

    function updateJobListing()
    {
        var str='';

        for(var i in jobs)
            str+='<li><i class="fa fa-circle-o-notch fa-spin"></i>&nbsp;&nbsp;'+jobs[i].title+'</li>';

        if(jobs.length==0)
        {
            str+='<li>no background jobs...</li>';
            $('.icon-cables').removeClass('blinkanim');
        }

        $('#jobs').html(str);
    }

    this.update=function(job,func)
    {
        for(var i in jobs)
        {
            if(jobs[i].id==job.id)
            {
                jobs[i].title=job.title;
                break;
            }
        }
        updateJobListing();
    };

    this.start=function(job,func)
    {
        for(var i in jobs)
        {
            if(jobs[i].id==job.id)
            {
                jobs.splice(i,1);
                break;
            }
        }

        $('.icon-cables').addClass('blinkanim');

        // $('.cables .logo').addClass('fa fa-circle-o-notch fa-spin');

        jobs.push(job);
        updateJobListing();

        if(func)
        {
            setTimeout(func,30);
        }
    };

    this.finish=function(jobId)
    {

        setTimeout(function()
        {
            for(var i in jobs)
            {
                if(jobs[i].id==jobId)
                {
                    if(jobs[i].title.indexOf('file')>=0)
                    {
                        // gui.updateProjectFiles();
                        CABLES.UI.fileSelect.load();
                    }
                    jobs.splice(i,1);
                    break;
                }
            }



            if(jobs.length===0)
            {
                $('.cables .logo').addClass('cablesLogo');
                $('.cables .logo').removeClass('fa fa-circle-o-notch fa-spin');
            }
            updateJobListing();

        },111000);

    };
};
