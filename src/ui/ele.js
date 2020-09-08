

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
};

window.ele = new CABLES.Ele();
