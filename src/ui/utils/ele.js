/**
 * Ele - minimalistic html dom helper
 *
 * @class
 */

class Ele
{
    /**
     * shortcut for document.getElementById(id)
     * @param  {String} id
     * @returns {Object} DOM element
     */
    byId(id)
    {
        if (id && id[0] == "#") console.warn("ele.byId should not contain #");
        return document.getElementById(id);
    }

    /**
     * shortcut for document.querySelector(id)
     * @param  {String} query
     * @returns {Object} DOM element
     */
    byQuery(q)
    {
        return document.querySelector(q);
    }

    /**
     * shortcut for document.querySelectorAll(id)
     * @param  {String} query
     * @returns {Array} DOM elements
     */
    byQueryAll(q)
    {
        return document.querySelectorAll(q);
    }

    /**
     * returns the first element with class
     * @param  {String} classname
     * @returns {Object} DOM element
     */
    byClass(name)
    {
        if (name && name[0] == ".") console.warn("ele.byClass should not contain .");
        const els = document.getElementsByClassName(name);
        if (els.length > 0) return els[0];
        return null;
    }

    /**
     * returns the all elements with class
     * @param  {String} classname
     * @returns {Array} DOM elements
     */
    byClassAll(name)
    {
        if (name && name[0] == ".") console.warn("ele.byClassAll should not contain .");
        const els = document.getElementsByClassName(name);
        if (!els) return [];
        return els;
    }

    forEachClass(name, cb)
    {
        if (name && name[0] == ".") console.warn("ele.forEachClass should not contain .");

        const eles = document.getElementsByClassName(name);
        for (let i = 0; i < eles.length; i++) cb(eles[i]);
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

    isVisible(el)
    {
        let style = window.getComputedStyle(el);
        return !(style.display === "none");
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

export default new Ele();
