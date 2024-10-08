/*
Simple Javascript undo and redo.
https://github.com/ArthurClemens/Javascript-Undo-Manager
*/

const UndoManager = function ()
{
    let commands = [],
        index = -1,
        groupIndex = 0,
        limit = 0,
        isExecuting = false,
        callback,
        paused = false,
        execute,
        removeFromTo;

    execute = function (command, action)
    {
        if (!command || typeof command[action] !== "function")
        {
            return this;
        }
        isExecuting = true;

        command[action]();

        isExecuting = false;
        return this;
    };

    removeFromTo = function (array, from, to)
    {
        array.splice(from,
            !to ||
            1 + to - from + (!(to < 0 ^ from >= 0) && (to < 0 || -1) * array.length));
        return array.length;
    };

    return {

        /*
            Add a command to the queue.
            */
        "add": function (command)
        {
            if (paused) return;

            if (isExecuting)
            {
                return this;
            }
            // if we are here after having called undo,
            // invalidate items higher on the stack
            commands.splice(index + 1, commands.length - index);

            commands.push(command);

            // if limit is set, remove items from the start
            if (limit && commands.length > limit)
            {
                removeFromTo(commands, 0, -(limit + 1));
            }

            // set the current index to the end
            index = commands.length - 1;
            if (callback)
            {
                callback();
            }

            return this;
        },

        /*
            Pass a function to be called on undo and redo actions.
            */
        "setCallback": function (callbackFunc)
        {
            callback = callbackFunc;
        },

        /*
            Perform undo: call the undo function at the current index and decrease the index by 1.
            */
        "undo": function ()
        {
            if (paused) return;

            let command = commands[index];
            if (!command)
            {
                return this;
            }
            let g = command.group;
            while (command.group === g)
            {
                execute(command, "undo");
                index -= 1;
                command = commands[index];
                if (!command || !command.group) break;
            }
            if (callback)
            {
                callback();
            }

            return this;
        },

        /*
            Perform redo: call the redo function at the next index and increase the index by 1.
            */
        "redo": function ()
        {
            if (paused) return;

            let command = commands[index + 1];
            if (!command)
            {
                return this;
            }
            let g = command.group;
            while (command.group === g)
            {
                execute(command, "redo");
                index += 1;
                command = commands[index + 1];
                if (!command || !command.group) break;
            }
            if (callback)
            {
                callback();
            }
            return this;
        },

        "group": function (step, name, idx)
        {
            if (paused) return;

            if (!step) return groupIndex;
            idx = idx || index;
            if (step < 1) step = 1;
            groupIndex += 1;
            while (step-- && idx - step >= 0)
                commands[idx - step].group = groupIndex;

            commands[index].groupName = name;
            return groupIndex;
        },

        /*
            Clears the memory, losing all stored states. Reset the index.
            */
        "clear": function ()
        {
            let prev_size = commands.length;

            commands = [];
            index = -1;
            groupIndex = 0;

            if (callback && (prev_size > 0))
            {
                callback();
            }
        },

        "hasUndo": function ()
        {
            return index !== -1;
        },

        "hasRedo": function ()
        {
            return index < (commands.length - 1);
        },

        "getCommands": function ()
        {
            return commands;
        },

        "getIndex": function ()
        {
            return index;
        },
        "startGroup": function ()
        {
            return index;
        },
        "endGroup": function (group, name)
        {
            this.group(index - group, name);
            if (callback)
            {
                callback();
            }
        },

        "getGroup": function (g)
        {
            let G = [];
            for (let i = 0, len = commands.length; i < len; i++)
            {
                if (commands[i].group === g) G.push({
                    "index": i,
                    "command": commands[i]
                });
            }
            return G;
        },

        "setLimit": function (l)
        {
            limit = l;
        },

        "pause": function ()
        {
            paused = true;
        },

        "paused": function ()
        {
            return paused;
        },

        "resume": function ()
        {
            paused = false;
        }
    };
};

export default UndoManager;
