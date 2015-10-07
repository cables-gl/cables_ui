CABLES =CABLES || {};
CABLES.UI =CABLES.UI || {};
CABLES.UI.SELECTPROJECT=CABLES.UI.SELECTPROJECT || {};


CABLES.UI.SELECTPROJECT.projectsHtml=null;
CABLES.UI.SELECTPROJECT.doReload=true;

CABLES.UI.SELECTPROJECT.showSelectProjects=function(html)
{

    CABLES.UI.MODAL.show(html);

    $('#projectsearch').focus();
    $('#projectsearch').on('input',function(e)
    {
        var searchFor= $('#projectsearch').val();

        if(!searchFor)
            $('#search_style').html('.searchable:{display:block;}');
        else
            $('#search_style').html(".searchable:not([data-index*=\"" + searchFor.toLowerCase() + "\"]) { display: none; }");
    });


    $( ".searchresult:first" ).addClass( "selected" );

    var displayBoxIndex=0;
    var Navigate = function(diff)
    {
        displayBoxIndex += diff;

        if (displayBoxIndex < 0) displayBoxIndex = 0;
        var oBoxCollection = $(".searchresult:visible");
        var oBoxCollectionAll = $(".searchresult");
        if (displayBoxIndex >= oBoxCollection.length) displayBoxIndex = 0;
        if (displayBoxIndex < 0) displayBoxIndex = oBoxCollection.length - 1;

        var cssClass = "selected";
        oBoxCollectionAll.removeClass(cssClass);

        oBoxCollection.removeClass(cssClass).eq(displayBoxIndex).addClass(cssClass);
    };

    function onInput(e)
    {
        displayBoxIndex=0;
        Navigate(0);
    }

    $('#projectsearch').on('input',onInput);

    $('#projectsearch').keydown(function(e)
    {
        switch(e.which)
        {
            case 13:
                var projid=$('.selected').data('projid');
                document.location.href='#/project/'+projid;
            break;

            case 8:
                onInput();
                return true;
            break;

            case 37: // left
            break;

            // case 38: // up
            //     $('.selected').removeClass('selected');
            //     Navigate(-1);
            // break;

            case 39: // right
            break;

            // case 40: // down
            //     $('.selected').removeClass('selected');
            //     Navigate(1);
            // break;

            default: return; // exit this handler for other keys
        }
        e.preventDefault(); // prevent the default action (scroll / move caret)
    });

    setTimeout(function(){$('#projectsearch').focus();},100);
};

CABLES.UI.SELECTPROJECT.show=function()
{

    if(!CABLES.UI.SELECTPROJECT.projectsHtml || CABLES.UI.SELECTPROJECT.doReload)
    {
        CABLES.api.get('myprojects',function(data)
        {
            CABLES.UI.MODAL.showLoading('loading projectlist...');
            CABLES.UI.SELECTPROJECT.projectsHtml = CABLES.UI.getHandleBarHtml('select_project',{projects:data });
            CABLES.UI.SELECTPROJECT.showSelectProjects(CABLES.UI.SELECTPROJECT.projectsHtml);
            CABLES.UI.SELECTPROJECT.doReload=false;
        });
    }
    else
        CABLES.UI.SELECTPROJECT.showSelectProjects(CABLES.UI.SELECTPROJECT.projectsHtml);

    

};



