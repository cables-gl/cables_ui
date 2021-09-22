

export default class Ele
{
    byId(id)
    {
        return document.getElementById(id);
    }

    loopByClassName(name, cb)
    {
        const eles = document.getElementsByClassName(name);

        for (let i = 0; i < eles.length; i++)
        {
            cb(eles[i]);
        }
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

    create(n)
    {
        return document.createElement(n);
    }

    hasFocus(el)
    {
        return document.activeElement == el;
    }

    fadeOut(el, duration, completeCallback)
    {
        if (!el) return;
        const fadeEffect = setInterval(function ()
        {
            if (!el.style.opacity)
            {
                el.style.opacity = 1;
            }
            if (el.style.opacity > 0)
            {
                el.style.opacity -= 0.1;
            }
            else
            {
                clearInterval(fadeEffect);
                if (typeof completeCallback === "function") completeCallback(el);
            }
        }, duration);
    }

    slideUp(el, duration, completeCallback)
    {
        el.style.transitionProperty = "height, margin, padding";
        el.style.transitionDuration = duration + "ms";
        el.style.boxSizing = "border-box";
        el.style.height = el.offsetHeight + "px";
        el.style.overflow = "hidden";
        el.style.height = 0;
        el.style.paddingTop = 0;
        el.style.paddingBottom = 0;
        el.style.marginTop = 0;
        el.style.marginBottom = 0;
        window.setTimeout(() =>
        {
            el.style.display = "none";
            el.style.removeProperty("height");
            el.style.removeProperty("padding-top");
            el.style.removeProperty("padding-bottom");
            el.style.removeProperty("margin-top");
            el.style.removeProperty("margin-bottom");
            el.style.removeProperty("overflow");
            el.style.removeProperty("transition-duration");
            el.style.removeProperty("transition-property");
            if (typeof completeCallback === "function") completeCallback(el);
        }, duration);
    }
}
