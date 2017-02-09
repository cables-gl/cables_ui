CABLES=CABLES || {};
CABLES.UI=CABLES.UI || {};
CABLES.UI.Introduction = CABLES.UI.Introduction ||

function() {
  /* Disables intro.js for the current logged-in user */
  function disableIntroForUser(){
    console.log("Intro completed");
    CABLES.api.put('user/introCompleted',function(result) {
        console.log(result);
    });
  }

  function defineIntroSteps(){
    $('#patch')
      .attr("data-step", 1)
      .attr("data-intro", "Press the Escape-key to insert your first op (operator)")
      .attr("data-position", "right");
    /*
    $('#project_settings').parent().parent().parent()
      .attr("data-step", 1)
      .attr("data-intro", "Settings panel, where you can access all project settings. If you select an op in the patch panel you will see its settings here instead.")
      .attr("data-position", "left");
    $('#glcanvas')
      .attr("data-step", 2)
      .attr("data-intro", "WebGL canvas where the visual output will be rendered to.")
      .attr("data-position", "bottom");
    $('#infoArea')
      .attr("data-step", 3)
      .attr("data-intro", "Hover over any element on the page to receive some information in the info panel.")
      .attr("data-position", "left");
    $('#projectfiles')
      .attr("data-step", 4)
      .attr("data-intro", "Easily upload project files (images, 3D-models, audio-files) by drag and dropping them to the files panel.")
      .attr("data-position", "left");
    $('#patch')
      .attr("data-step", 5)
      .attr("data-intro", "This is the most important part of <i>cables</i> – the patch panel – here you can connect ops together and create something.")
      .attr("data-position", "right");
    $('.cables')
      .attr("data-step", 6)
      .attr("data-intro", "On the main cables site you can browse through public projects / examples and get some inspiration.")
      .attr("data-position", "bottom");
      */
  }


  this.showIntroduction = function(){
    console.log("Introduction started");
    defineIntroSteps();
    addIntroJsStyles();
    introJs()
      .oncomplete(disableIntroForUser)
      .onafterchange(function(targetElement) {
        addIntroJsStyles();
      })
      .setOptions({
          'showBullets': false,
          'skipLabel': 'Close',
          'showProgress': true,
          'tooltipPosition': "left"
      })
      .start();
    addIntroJsStyles();
};

 /*
  * Because styles do not apply when we add them to the stylesheet we need to define them here...
  */
  function addIntroJsStyles(){
    /*$('.introjs-overlay')
      .css("display", "none")
      .css("background", "rgba(0, 0, 0, 0.2) !important")
      .css("background-color", "rgba(0, 0, 0, 0.2) !important")
      ;*/
    $('.introjs-helperLayer')
      .css("background", "rgba(255, 255, 255, 0.2)")
      .css("background-color", "rgba(255, 255, 255, 0.2)")
      .css("background-color", "transparent")
      /*.css("transition", "none")
      .css("-moz-transition", "none")
      .css("-webkit-transition", "none")*/
      .css("border-radius", "0")
      .css("border-top-left-radius", "0")
      .css("border-top-right-radius", "0")
      .css("border-bottom-right-radius", "0")
      .css("border-bottom-left-radius", "0")
      .css("border", "1px solid white")
      ;
    $('.introjs-tooltip')
      .css("background-color", "white")
      .css("border", "none")
      .css("border-radius", "0")
      .css("box-shadow", "none")
      ;
    $('.introjs-tooltipReferenceLayer')
      .css("border","1px solid white")
      .css("border-radius", "0")
      .css("z-index", "1000000")
      ;
    $('.introjs-tooltiptext')
      .css("color", "black")
      ;
    $('.introjs-helperNumberLayer')
      .css("padding", "20px")
      .css("display", "none")
      .css("background-color", "black")
      .css("background", "black")
      .css("text-shadow", "none")
      .css("color", "white")
      .css("box-shadow", "none")
      .css("border-radius", "1px solid white")
      .css("left", "-13")
      .css("top", "-13")
      ;
    $('.introjs-button')
      .css("border-radius", "0")
      .css("padding", "4px 10px")
      ;
    $('.introjs-showElement')
      .css("z-index", "1000")
      ;
  }
};
