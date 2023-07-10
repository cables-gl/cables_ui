
export default class TreeView
{
    constructor()
    {
    }

    html(data = [], level = 0, html = "")
    {
        if (level == 0)
        {
            html = "+++++++" + level + " <table class=\"table treetable\">";
        }
        for (let i = 0; i < data.length; i++)
        {
            if (Array.isArray(data[i]))
            {
                html += this.html(data[i], level + 1);
            }
            else
            {
                html += "<tr>";
                html += "<td>";
                for (let j = 0; j < level; j++)html += "&nbsp;&nbsp;";
                html += data[i].title;
                html += "</td>";
                html += "</tr>";
            }
        }

        if (level == 0)
        {
            html += "</table>---------";
        }



        return html;
    }
}
