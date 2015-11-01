var CABLES = CABLES || {};

CABLES.Chat = function() {

    var proto = location.protocol;
    var host = location.hostname;
    var port = location.port;
    var namespace = "/chat";

    var url = location.protocol + "//" + location.hostname;

    if (location.port != 80) {
        url += ":" + port;
    }

    console.log("Connecting to ", url, namespace);

    var socket = io.connect(url + namespace);
    var room = "#general";
    var user = null;
    var userList = [];
    var chatButton = $('#button_chat');
    var messages = [];
    var template = CABLES.UI.getHandleBarHtml('chat', {
        "messages": [],
        "userList": []
    });

    chatButton.on("click", function(e) {
        e.preventDefault();

        console.log("Open chat");

        registerHandlers();
        CABLES.UI.MODAL.show(template);
    });

    jQuery(document).on("beforeunload", function(e) {
        socket.emit("leave", user);
    });

    jQuery.get("/api/user/me", function(response) {
        user = response.user;
    });

    socket.on('disconnect', function() {
        console.warn("socket disconnected!");
        CABLES.UI.setStatusText('Lost connection to server...');
    });

    socket.on('connect', function() {
        console.info("Connected!", arguments);
        CABLES.UI.setStatusText('Conntected to chat...');

        socket.emit("join", {
            "user": user.username,
            "room": room
        });

        socket.on("message", function(data) {
            console.log("Received message", data);

            messages.push(data);

            var date = new Date(data.sent);
            var time = timePrefix(date.getHours()) + ":" + timePrefix(date.getMinutes());

            var line = time + " " + "<" + data.sender + "> " + data.message;

            template.find("#chat-messages").append("<span>" + line + "</span>");
        });

        socket.on("userJoined", function(users) {
            console.log("User joined", users);

            userList = users;

            if(userList.length > 1) {
                showChatIcon();
            }
        });
    });

    socket.on("error", function(errorMessage) {
        console.error("SOCKET ERROR: ", errorMessage);
    });

    function timePrefix(i) {
        if (i < 10) {
            i = "0" + i;
        }

        return i;
    }

    function showChatIcon() {
        chatButton.show();
        chatButton.find(".badge").text(userList.length);
    }

    function registerHandlers() {
        console.log("registering handlers");

        jQuery("#send").on("click", function() {
            console.log("wuff");
        });

        jQuery("#message-input").on("keydown", function(e) {
            console.log("keydown");
            if (user === null) {
                console.warn("USER IS NULL!");
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
    }
}
