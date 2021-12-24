
export default
{
    "valueChangerInitSliders" : ()=>
    {
        const els = document.querySelectorAll(".valuesliderinput input");
        for (let i = 0; i < els.length; i++)
        {
            const v = els[i].value;
            CABLES.UI.paramsHelper.valueChangerSetSliderCSS(v, els[i].parentElement);
        }
    },

    "valueChangerSetSliderCSS" : (v, eleInput)=>
    {
        if (eleInput.dataset.min || eleInput.dataset.max)
            v = CABLES.map(v, parseFloat(eleInput.dataset.min), parseFloat(eleInput.dataset.max), 0, 1);

        v = Math.max(0, v);
        v = Math.min(1, v);
        const cssv = v * 100;
        const grad = "linear-gradient(0.25turn,#5a5a5a, #5a5a5a " + cssv + "%, #444 " + cssv + "%)";

        eleInput.style.background = grad;
    },

    "togglePortValBool":  (which, checkbox)=>
    {
        gui.setStateUnsaved();
        const inputEle = document.getElementById(which);
        const checkBoxEle = document.getElementById(checkbox);

        let bool_value = inputEle.value == "true";
        bool_value = !bool_value;

        if (bool_value)
        {
            checkBoxEle.parentElement.classList.add("checkbox-active");
            checkBoxEle.parentElement.classList.remove("checkbox-inactive");
        }
        else
        {
            checkBoxEle.parentElement.classList.add("checkbox-inactive");
            checkBoxEle.parentElement.classList.remove("checkbox-active");
        }

        inputEle.value = bool_value;
        inputEle.dispatchEvent(new Event("input"));
    }

};



