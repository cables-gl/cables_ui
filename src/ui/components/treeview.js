
export default class TreeView
{
    constructor()
    {
    }

    html(data = [], level = 0, html = "")
    {
        if (level == 0)
        {
            html = " <table class=\"table treetable\">";
        }
        for (let i = 0; i < data.length; i++)
        {
            html += "<tr>";
            html += "<td>";

            for (let j = 0; j < level; j++)
            {
                html += "<span style=\"border-right:2px solid #555;margin-right:9px;width:8px;display:block;float:left;height:20px;;\"></span>";

                if (level == j + 1)
                    if (data[i].hasOwnProperty("childs") && data[i].childs.length > 0) html += "<span class=\"icon icon-chevron-down\" style=\"margin-right:3px;\"></span>";
                    else html += "<span style=\"border-right:2px solid #555;margin-right:9px;width:8px;display:block;float:left;height:20px;;\"></span>";
            }

            html += "<span class=\"icon icon-op iconhover\"></span>";


            html += "&nbsp;&nbsp;";

            html += "<a class=\"link\" onclick=\"\">";
            html += data[i].title;
            html += "</a>";



            html += "</td>";
            html += "<td>";
            html += "<span class=\"icon icon-three-dots iconhover\"></span>";
            html += "</td>";
            html += "</tr>";


            if (data[i].hasOwnProperty("childs") && data[i].childs.length > 0)
            {
                html += this.html(data[i].childs, level + 1);
            }
        }

        if (level == 0)
        {
            html += "</table>";
        }



        return html;
    }
}
