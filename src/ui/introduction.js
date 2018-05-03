CABLES=CABLES || {};
CABLES.UI=CABLES.UI || {};
CABLES.UI.Introduction = CABLES.UI.Introduction ||

function() {
  /* Disables intro.js for the current logged-in user */
  function disableIntroForUser(){
    CABLES.api.put('user/introCompleted',function(result) {
        console.log(result);
    });
  }

  var stepTmp = 1; /* the introjs position when it is explained */

  /**
   * Defines a intro step, performs check if element exists
   * @param {string} selector - Selector, can be class, id or element, first element picked 
   * @param {string} text - The text to show for the element
   * @param {string} position - Where to show the intro for the element, either 'left', 'right', 'top' or 'bottom'
   */
  function defineIntroStep(selector, text, position) {
      if(!selector || !text || !position) {
        console.error('defineIntroStep called with empty argument(s)');
        return;
      }
      var el = $(selector).first();
      if(el.length) { /* if element exists */
        el.attr("data-step", stepTmp)
        el.attr("data-intro", text);
        stepTmp++;
      } else {
        console.error('introduction step missing, selector: ', selector); 
        return;
      }
  }

  function defineIntroSteps(){
    defineIntroStep(
      '#patch',
      'Hi and welcome to cables! <br />This is the the patch panel. Here you can connect ops (operators) to create a patch.<br />Now press <code>Enter</code> to move on with the introduction.',
      'right'
    );
    defineIntroStep(
      '#glcanvas', 
      'This is the WebGL canvas where the visual output will be rendered to.',
      'bottom'
    );
    defineIntroStep(
      '#infoArea',
      'In the info area you get help. Hover over any element on the page to receive information about it.',
      'left'
    );
    defineIntroStep(
      '#options',
      'When you select an op in the patch panel its parameters will be shown here.',
      'left'
    );
    defineIntroStep(
      '#metatabs',
      'In these tabs you can access additional features, e.g. the documentation for the currently selected op.',
      'left'
    );
    defineIntroStep(
      '.button.projectname',
      'Click on the patch name to access the settings, here you can e.g. publish a patch or invite collaborators.',
      'bottom'
    );
    defineIntroStep(
      '.nav-item-help',
      'Make sure to check out the video tutorials and documentation, these will help you get started in a blink!',
      'bottom'
    );
    defineIntroStep(
      '#icon-bar',
      'In the sidebar you can access often used features.',
      'right'
    );
    defineIntroStep(
      '#icon-bar .icon-three-dots',
      'Feel free to customize it by pressing the <i>…</i> icon.',
      'top'
    );
    defineIntroStep(
      '#icon-bar li[data-cmd="add op"]',
      'To add your first op to the patch you can press the <i>Add Op</i> icon, but it is much faster to just press the <code>Esc</code> key.<br />Happy patching!',
      'right'
    );
  }

  this.showIntroduction = function(){
    console.log("Introduction started");
    defineIntroSteps();
    introJs()
      .oncomplete(function() {
        // console.log('intro completed');
        disableIntroForUser();
      })
      .onskip(function() { /* needed because of introjs 2.9.0 bug: https://github.com/usablica/intro.js/issues/848 */
        // console.log('intro skipped');
        disableIntroForUser();
      })
      .setOptions({
          'showBullets': false,
          'skipLabel': 'Close',
          'showProgress': true,
          'tooltipPosition': "left"
      })
      .start();
  };
};
