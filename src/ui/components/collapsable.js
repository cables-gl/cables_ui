import ele from "../utils/ele";

const Collapsable = {};

export default Collapsable;

Collapsable.setup = function (parentEle, childEle, collapsed)
{
    if (!parentEle) return;

    parentEle.classList.add("collapsable");

    if (!childEle)
    {
        if (parentEle.innerHTML.indexOf("icon-chevron") == -1)
            parentEle.innerHTML = "<span class=\"icon icon-chevron-down\" style=\"opacity:0\"></span>" + parentEle.innerHTML;
        return;
    }

    if (parentEle.innerHTML.indexOf("icon-chevron") == -1)
        parentEle.innerHTML = "<span class=\"icon icon-chevron-down\"></span>" + parentEle.innerHTML;

    Collapsable._setGroupCollapsed(parentEle, childEle, collapsed);

    // Collapsable._setGroupCollapsed(parentEle, childEle);

    parentEle.addEventListener("click", () =>
    {
        console.log("click....");

        Collapsable._toggleGroupElements(parentEle, childEle);
    });
};

Collapsable._setGroupCollapsed = (parentEle, childEle, collapsed) =>
{
    if (!collapsed)
    {
        childEle.classList.remove("hidden");
        parentEle.children[0].classList.add("icon-chevron-down");
        parentEle.children[0].classList.remove("icon-chevron-right");
    }
    else
    {
        childEle.classList.add("hidden");
        parentEle.children[0].classList.remove("icon-chevron-down");
        parentEle.children[0].classList.add("icon-chevron-right");
    }
};

Collapsable._toggleGroupElements = (parentEle, childEle) =>
{
    // const els = ele.byClassAll(name);
    // for (let i = 0; i < els.length; i++)
    // {
    childEle.classList.toggle("hidden");
    // }

    parentEle.children[0].classList.toggle("icon-chevron-down");
    parentEle.children[0].classList.toggle("icon-chevron-right");
};
