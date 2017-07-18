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
    // $('#patch')
    //   .attr("data-step", 1)
    //   .attr("data-intro", "Press the Escape-key to insert your first op (operator)")
    //   .attr("data-position", "right");
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
      .attr("data-position", "right");
  }

  this.showIntroduction = function(){
    console.log("Introduction started");
    defineIntroSteps();
    introJs()
      .oncomplete(disableIntroForUser)
      // .onafterchange(function(targetElement) {
      //   // addIntroJsStyles();
      // })
      .setOptions({
          'showBullets': false,
          'skipLabel': 'Close',
          'showProgress': true,
          'tooltipPosition': "left"
      })
      .start();
  };
};
