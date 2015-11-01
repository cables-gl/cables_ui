var CABLES = CABLES || {};

CABLES.UI.CHAT = function() {

    var proto = location.protocol;
    var host = location.hostname;
    var port = location.port;
    var namespace = "/chat";

    var url = location.protocol + "//" + location.hostname;

    if (location.port != 80) {
        url += ":" + port;
    }

    var socket = io.connect(url + namespace);
    var room = "#general";
    var user = null;

    jQuery.get("/api/user/me", function(response) {
        user = response.user;
    });

    socket.on('disconnect', function() {
        console.warn("socket disconnected!");
    });

    socket.on('connect', function() {
        console.info("Connected!", arguments);

        socket.emit("create", room);

        socket.on("message", function(data) {
            console.log("Received message", data);
            data.isMe = data.sender === user.username;

            var template = Handlebars.compile(jQuery("#chat-message").html());
            var rendered = jQuery(template(data));

            if (data.isMe) {
                rendered.find("span.user").addClass("me");
            }

            $('#messages').append(rendered);
        });
    });

    socket.on("error", function(errorMessage) {
        console.error("SOCKET ERROR: ", errorMessage);
    });

    jQuery("#message-input").on("keydown", function(e) {
        if (user === null) {
            return;
        }

        var c = e.which || e.keyCode;

        if (c === 13) {
            e.preventDefault();

            var message = {
                room: room,
                sender: user.username,
                sent: new Date(),
                message: jQuery("#message-input").val()
            };

            console.log("sending message", message);
            socket.emit("message", message);

            jQuery("#message-input").val("");
        }
    });

    Handlebars.registerHelper('timeFormat', function(context, block) {
        function prefix(i) {
            if (i < 10) {
                i = "0" + i;
            }
            return i;
        }

        var date = new Date(context);
        return prefix(date.getHours()) + ":" + prefix(date.getMinutes());
    });
}

if (!CABLES.UI.chat) CABLES.UI.chat = new CABLES.UI.CHAT();
