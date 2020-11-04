

CABLES.Ele = class
{
    constructor()
    {

    }

    byId(id)
    {
        return document.getElementById(id);
    }

    getSelectValue(el)
    {
        return el.options[el.selectedIndex].text;
    }

    show(el)
    {
        if (el)el.classList.remove("hidden");
    }

    hide(el)
    {
        if (el)el.classList.add("hidden");
    }
};

window.ele = new CABLES.Ele();
