CABLES = CABLES || {};

CABLES.SerializeOps = function (root, prefix)
{
    let items = [];

    for (const i in root)
    {
        if (i != "Deprecated")
            items.push(
                {
                    "name": i,
                    "fullname": prefix + "." + i,
                    "childs": CABLES.SerializeOps(root[i], prefix + "." + i)
                });
    }

    items = items.sort(
        function (a, b)
        {
            if (a.name < b.name) return -1;
            if (a.name > b.name) return 1;
            return 0;
        });

    return items;
};

CABLES.OpTree = function (config)
{
    this.data = CABLES.SerializeOps(window.Ops, "Ops");
};

CABLES.OpTree.prototype.searchFor = function (txt)
{
    $("#opsearch").val(txt);
    $("#opsearch").trigger("input");
};

CABLES.OpTree.prototype.itemHtml = function (item, html, level)
{
    if (!item.childs || item.childs.length == 0) return "";
    if (!item) return "";
    html = "";

    let i = 0;
    for (i = 0; i < level; i++) html += "&nbsp;&nbsp;&nbsp;";

    const style = CABLES.UI.uiConfig.getNamespaceClassName(item.fullname);

    html += "<a class=\"op_color_" + style + "\" onclick=\"gui.opSelect().tree.searchFor('" + item.fullname + "')\">";
    html += "" + item.name;
    html += "</a>";

    // if(item.childs && item.childs.length>0)html+=' ('+item.childs.length+')';
    html += "<br/>";

    if (item.childs)
        for (i = 0; i < item.childs.length; i++)
            html += this.itemHtml(item.childs[i], html, level + 1);

    return html;
};

CABLES.OpTree.prototype.html = function ()
{
    let html = "";

    for (let i = 0; i < this.data.length; i++)
        html += this.itemHtml(this.data[i], html, 0);

    return html;
};
