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
    var room = null;
    var user = null;
    var userList = [];
    var chatButton = $('#button_chat');
    var messages = [];
    var template = jQuery(CABLES.UI.getHandleBarHtml('chat', {
        "messages": [],
        "userList": []
    }));

    chatButton.on("click", function(e)
    {
        e.preventDefault();

        registerHandlers();

        chatButton.removeClass("new");

        CABLES.UI.MODAL.show(template);

        template.find("input").focus();
    });

    jQuery(document).on("beforeunload", function(e) {
        socket.emit("leave", user);
    });

    jQuery.get("/api/user/me", function(response) {
        user = response.user;
    });

    socket.on('disconnect', function() {
        CABLES.UI.setStatusText('Lost connection to server...');
    });

    socket.on('connect', function() {
        setTimeout(function() {
            handleConnection();
        }, 100);
    });

    socket.on("error", function(errorMessage) {
        console.error("SOCKET ERROR: ", errorMessage);
    });

    function handleConnection() {
        console.info("Connected!", arguments);
        CABLES.UI.setStatusText('Conntected to chat...');

        room = getRoom();

        socket.emit("join", {
            "user": user.username,
            "room": room
        });

        socket.on("message", function(data) {
            console.log("Received message", data);

            messages.push(data);

            var date = new Date(data.sent);
            var time = timePrefix(date.getHours()) + ":" + timePrefix(date.getMinutes());
            var sender = data.sender;
            var showNewMessage = false;

            if (data.message.search("/me") === 0) {
                data.type = "me";
                data.message = data.message.substr(4);
            }

            var parentClasses = "message " + data.type;

            if (sender === user.username && data.type !== "me") {
                sender = '<span class="user me">' + sender + "</span>";
            } else {
                sender = '<span class="user">' + sender + "</span>";

                showNewMessage = true;
            }

            var line = "";
            switch (data.type) {
                case "user":
                    line = time + " " + "&lt;" + sender + "&gt; " + data.message;
                    break;
                case "system":
                    line = "* " + time + " " + data.message;
                    showNewMessage = false;

                    break;
                case "me":
                    line = time + " " + sender + " " + data.message;
                    break;
            }

            if (showNewMessage) {
                if (!modalIsOpen()) {
                    jQuery("#button_chat").addClass("new");
                }
            }

            var messagesElement = jQuery(template[0]);
            messagesElement.append('<div class="' + parentClasses + '">' + line + '</div>');
            messagesElement.get(0).scrollTop = messagesElement.get(0).scrollHeight;
        });

        socket.on("userJoined", function(newUserList) {
            console.info("User joined", newUserList);

            userList = newUserList;

            if (userList.length > 1) {
                showChatIcon();
            }

            updateBadge();
        });

        socket.on("userLeaved", function(newUserList) {
            userList = newUserList;
            updateBadge();

            console.info("User leaved, newUserList", userList);
        });
    }

    function timePrefix(i) {
        if (i < 10) {
            i = "0" + i;
        }

        return i;
    }

    function showChatIcon() {
        chatButton.show();
    }

    function updateBadge() {
        chatButton.find(".badge").text(userList.length);
    }

    function registerHandlers() {
        template.find(".message-input").on("keydown", function(e) {
            var c = e.which || e.keyCode;

            if (c === 13) {
                e.preventDefault();
                sendMessage();
            }
        });

        template.find(".send").on("click", function() {
            sendMessage();
        });
    }

    function sendMessage() {
        var messageText = template.find(".message-input").val();

        if (messageText === "") {
            return;
        }

        var message = {
            room: room,
            sender: user.username,
            sent: new Date(),
            message: messageText,
            type: "user"
        };

        socket.emit("message", message);

        template.find(".message-input").val("");
    }

    function getRoom() {
        var projectName = jQuery("#serverprojectname").text();

        if(projectName !== "") {
            return "#" + projectName.replace(/\s+/g, '-').toLowerCase();
        }

        return "#" + Math.random().toString(36).slice(2);
    }

    function modalIsOpen() {
        var modal = jQuery("#modalcontent");

        if (modal.length === 0) {
            return false;
        }

        if (modal.find(".chat-messages").length === 0) {
            return false;
        }

        if (!modal.is(":visible")) {
            return false;
        }

        return true;
    }
}
