
var CABLES=CABLES||{};
CABLES.UI=CABLES.UI ||{};

CABLES.UI.UserSettings=function()
{
    var settings=JSON.parse(localStorage.getItem("cables.usersettings"))||{};

    this.set=function(key,value)
    {
        settings[key]=value;
        localStorage.setItem("cables.usersettings",JSON.stringify(settings));
    };

    this.get=function(key)
    {
        if(!settings || !settings.hasOwnProperty(key))return null;
        return settings[key];
    };

    this.getAll=function()
    {
        return settings;
    };

};


CABLES.UI.userSettings=new CABLES.UI.UserSettings();
