export default class Introduction
{
    constructor()
    {
        this._stepTmp = 1; /* the introjs position when it is explained */
        this._introStepsDefined = false;
    }

    /* Disables intro.js for the current logged-in user */
    disableIntroForUser()
    {
        CABLES.UI.userSettings.set("introCompleted", true);
    }

    /**
   * Defines a intro step, performs check if element exists
   * @param {string} selector - Selector, can be class, id or element, first element picked
   * @param {string} text - The text to show for the element
   * @param {string} position - Where to show the intro for the element, either 'left', 'right', 'top' or 'bottom'
   */
    defineIntroStep(selector, text, position)
    {
        if (!selector || !text || !position)
        {
            console.error("defineIntroStep called with empty argument(s)");
            return;
        }
        const el = document.querySelector(selector);
        if (el)
        { /* if element exists */
            el.setAttribute("data-step", this._stepTmp);
            el.setAttribute("data-intro", text);
            this._stepTmp++;
        }
        else
        {
            console.error("introduction step missing, selector: ", selector);
        }
    }

    defineIntroSteps()
    {
        this.defineIntroStep(
            "#glpatch2",
            "Hi and welcome to cables! <br />This is the the patch panel. Here you can connect ops (operators) to create a patch.<br />Now press <code>Enter</code> to move on with the introduction.",
            "right"
        );
        this.defineIntroStep(
            "#cablescanvas",
            "This is the WebGL canvas where the visual output will be rendered to.",
            "bottom"
        );
        this.defineIntroStep(
            "#metatabpanel",
            "In the info area you get help. Hover over any element on the page to receive information about it.",
            "left"
        );
        this.defineIntroStep(
            "#patchname",
            "Click on the patch name to access the settings, here you can e.g. publish a patch or invite collaborators.",
            "bottom"
        );
        this.defineIntroStep(
            "#iconbar_sidebar_left",
            "In the sidebar you can access often used features.",
            "right"
        );
        this.defineIntroStep(
            ".nav-item-help",
            "Make sure to check out the video tutorials and documentation, these will help you get started in a blink!",
            "bottom"
        );
        this.defineIntroStep(
            "#iconbar_sidebar_left div[data-info=\"cmd_addop\"]",
            "To add your first op to the patch you can press the <i>Add Op</i> icon, but it is much faster to just press the <code>Esc</code> key.<br />Happy patching!",
            "right"
        );
    }


    showIntroduction()
    {
        if (!this._introStepsDefined)
        {
            this.defineIntroSteps();
            this._introStepsDefined = true;
        }
        introJs()
            .oncomplete(() =>
            {
                this.disableIntroForUser();
            })
            .onskip(() =>
            { /* needed because of introjs 2.9.0 bug: https://github.com/usablica/intro.js/issues/848 */
                this.disableIntroForUser();
            })
            .setOptions({
                "showBullets": false,
                "skipLabel": "Close",
                "showProgress": true,
                "tooltipPosition": "left"
            })
            .start();
    }
}
