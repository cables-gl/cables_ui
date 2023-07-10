
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
            if (Array.isArray(data[i]))
            {
                html += this.html(data[i], level + 1);
            }
            else
            {
                html += "<tr>";
                html += "<td>";


                for (let j = 0; j < level; j++)
                {
                    if (j == 0)html += "<span style=\"border-right:2px solid #777;margin-right:12px;width:10px;display:block;float:left;height:20px;;\"></span>";
                    else html += "<span style=\"width:20px;display:block;float:left;height:20px;;\"></span>";
                }
                html += "<span class=\"icon icon-chevron-down\"></span>";

                html += data[i].title;


                html += "</td>";
                html += "</tr>";
            }
        }

        if (level == 0)
        {
            html += "</table>";
        }



        return html;
    }
}
