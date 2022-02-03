

const text =
{
    "save_screenshot": "## Save Screenshot\n\nDownload renderer output as an image file",
    "toggle_sound": "## Toggle Sound\n\nTurn sound on or off",
    "toggle_helper": "Enable or disable of showing helper and bounding boxes",
    "canvas_lens": "## Pixel Magnifier\n\nMove over canvas to magnify pixels.\n\n[cmd_ctrl]`c` copy hovered color to clipboard",

    "canvas_size": "## Canvas Size\n\nCanvas size in pixels\n\nclick to set the canvas manually",
    "canvas_aspect": "## Canvas Aspect ratio\n\nclick to choose an aspect ratio",
    "canvas_zoom": "## Website Zoom\n\nYour browser is zoomed in, use [cmd_ctrl] and +/- to change zoom",
    "canvas_version": "## WebGl Version",
    "canvas_fps": "## FPS\n\nCurrently number of rendered frames per second",
    "canvas_ms": "## Miliseconds\n\nCurrent amount of time needed to render the mainloop",

    "renderer_patchbg": "## Toggle Patch Background\n\n[cmd_ctrl][shift]`enter` Toggle patch nackground renderer",
    "renderer_maximize": "## Toggle Fullscreen\n\n[cmd_ctrl]`enter` Toggle Fullscreen",
    "renderer_setsize": "## Canvas Size \n\n* click to set canvas size",
    "infoarea": "## Infoarea\n\nLook here for contextual information",

    "nav_patch_new": "## New Patch\n\nCreates a new patch",
    "nav_patch_open": "## Open Patch\n\nLoad an existing patch",

    "linkAddCircle": "## Cable \n\n* [LMB] insert op \n* [RMB] remove cable ",

    "timeLineToggle": "Toggle timeline / keyframing panel",
    "timeLineTime": "* Shows current frame/time in seconds\n\n * Click to enter frame to go to",

    "portFloatInput": "* Use mousewheel or up/down keys to inc/decrement by 0.1",
    "portFloatDrag": "* Hold left mouse button and drag to change value. \n\n* hold shift to for smaller increase.",
    "portUnlink": "Click to unlink port",
    "portCreateOp": "Create and connect new texture op",
    "portAnimKeep": "Keep in keyframing view",
    "portAnimToggle": "Toggle parameter animation. enable to keyframe parameter",

    "portDirIn": "## Input Port ",
    "portDirOut": "## Output Port",
    "portMouseUnlink": "|| [RMB] unlink port || [DRAG_RMB] move cable || `DEL` delete link || [alt]+[DRAG_RMB] copy link",
    "portMouseCreate": "|| [DRAG_LMB] create and link new op",
    "portObjectSnapshot": "see at object data snapshot",

    "patchSelectedMultiOps": "## Selected Multiple Ops\n\n* `d` disable ops and their childs\n* `a` align ops left\n* `c` center ops\n* [shift]`a` reduce vertical sptng\n* `DEL` delete selcted ops\n* [cmd_ctrl]`c` Copy selected op ",
    "patchSelectedOp": "## Selected Single Op\n\n* `T` set op title\n* `D` disable op and childs\n* [shift]`D` temporary unlink op \n* `X` unlink op \n* `DEL` delete op\n* `page up/down` snap to parent/child op",

    "projectSettingsPublic": "make patch public - everyone can see it",
    "projectSettingsTitle": "## Patch Name \n\nIf this is your op, click to edit",
    "projectSettingsExample": "ADMIN: patch will be listed as example",

    "projectExportNotSaved": "Patch not saved - save patch before exporting",
    "projectBackupNotSaved": "Patch not saved - save patch before creating a backup",
    "projectNotSaved": "Patch not saved - save patch and try again",

    "editorTab": "## Editor \n\n* [LMB] activate tab [MMB] close tab ",
    "searchResult": "|| [LMB] focus op || [shift][LMB] show op params",
    "dragfile": "## File \n\n* [DRAG_LMB] Drag this File to the patchfield to create op!",

    "editor": "## Code editor \n\nHere you can edit the code of your ops, write op descriptions, as well as edit objects / arrays.",
    "patch": "## Patchfield \n\n|| `ESC` add ops || [DRAG_RMB] Pan || [cmd_ctrl]`s` Save patch || `c` center all op || `+``-`[MW] Adjust zoom || [cmd_ctrl]`F` Search || [cmd_ctrl]`P` Command palette",
    "canvas": "## Canvas\n\n|| Here you can see the visual output of your patch.\n\n|| [cmd_ctrl][ENTER] - Maximize canvas",
    "projectFiles": "## Project Files \n\nOverview over your uploaded files",
    "undevLogo": "## UNDEV \n\nCables was made by **undefined development**, come visit us in our office in Berlin and have a coffee with us! ",

    "minimize_tabpanel": "## Minimize Panel\n\n`ESC` - minimize panel || [alt]`ESC` - unminimize panel",

    "tab_files": "## Files \n\nUpload and manage your files",
    "tab_code": "## Code\n\noperator code",
    "tab_doc": "## Documentation\n\noperator documentation",
    "tab_preview": "## Preview\n\npreview you generated textures",
    "tab_keyframes": "## Keyframes\n\n",
    "tab_variables": "## Variables\n\n",
    "tab_patchconnection": "## Patch Connection\n\n",
    "tab_profiler": "## Profiler \n\nFind out which ops require most processing time",
    "tab_bookmarks": "## Bookmarks \n\nBookmark ops in a big patch to easily locate them",
    "tab_debug": "## Debug \n\n",
    "tab_screen": "## Screen \n\n",

    "download_screenshot": "## Download screenshot \n\nDownload a HD-image (1920 x 1080) of your patch",
    "minimapContainer": "## Minimap \n\nShows an overview over your patch. Click inside the map to navigate.",
    "timelineui": "## Timeline \n\nIn the timeline you can animate ports over time.",
    "op_background": "## Op \n\n",
    "op_title": "## Op Title \n\n* click to edit title",

    "bookmark_added": "Bookmark added!",
    "bookmark_removed": "Bookmark removed!",

    "timeline_overview": "## timeline overview \n\nshows the current visible area\n\ndrag borders to resize\n\n* [DRAG_LMB] move area\n* [DRAG_RMB] move area and change time\n* `double click` toggle show full project length",
    "timeline_frames": "## timeline \n\n* [LMB] move cursor",
    "timeline_time": "[LMB] jump to frame",
    "timeline_progress": "`click` set project duration",
    "timeline_keys": "## timeline  \n\n* [DRAG_RMB] move visible area\n* [DRAG_LMB] select keys\n* `h` center all keys\n* `j` / `k` jump to next/previous key\n* `DEL` delete selected keys",

    "usersettings": "## User Settings\n\nchange editor settings ",
    "texpreview": "## Texture Preview\n\nshows result of last clicked texture outputing operator.\n\nclick to see focus operator\n\nclick patch background to hide",

    "valueChangerHover": "## Number Input \n\n* [DRAG_LMB] - change value slowly \n* [shift] + [DRAG_LMB] - change value fast",
    "valueChangerInput": "## Number Input Focussed \n\n* [up][down][MW] change value +/- 0.1 \n* [shift][up][down][MW] change value +/- 0.01\n* [alt][up][down][MW] change value +/- 1",
    "open_new_window": "## View Patch\n\nopen patch viewer in new window",
    "settings": "## Patch Settings\n\nrename,publish your patch\n\ninvite users to collaborate",

    "working_connected_to": "to work, this op needs to be a child of: ",
    "working_connected_needs_connections_to": "This op can not do anything without at least connecting those ports: ",

    "notOptimizedBrowser_title": "oops!",
    "notOptimizedBrowser_text": "cables is optimized for firefox and chrome, you are using something else<br/>feel free to continue, but be warned, it might behave strange",

    "filemanager_delete_file": "Delete file",
    "filemanager_file_search": "Search for ops that use this file",
    "filemanager_file_open": "Open file in new window",
    "filemanager_file_download": "Download file",
    "filemanager_file_refresh": "Reload file list",
    "filemanager_file_upload": "Upload new file",
    "filemanager_file_create": "Create a file",

    "editorSaveButton": "Save",
    "editorFormatButton": "Format",

    "cmd_centerpatch": "`c` center patch or selected ops",
    "cmd_zoomin": "`+` Zoom In",
    "cmd_zoomout": "`-` Zoom Out",
    "cmd_savepatch": "[cmd_ctrl]`S` Save Patch",
    "cmd_addop": "`esc` Add Operator",
    "cmd_patchsettings": "## Open Patch settings",

    "patch_hint_overlay_empty": "This patch is empty. press <code>escape</code> to add operators",
    "patch_hint_overlay_outofbounds": "<i>got lost ?</i>&nbsp;&nbsp;press <code>[C]</code>to center the whole patch again",

    "guestHint": "Cables is in Demo mode and has only limited functionality. Please register, it's free!",

    "opselect_intro": "<br/><h2>&nbsp;Start typing!</h2><br/>You can search for multiple words at once, e.g.: \"interpolate array\"<br/><br/>Add spaces between words for better search results<br/><br/>Press <span class=\"icon icon-arrow-up\"></span> and <span class=\"icon icon-arrow-down\"></span> to navigate.<br/><br/>Finally press <span class=\"icon icon-corner-down-left\"></span> to create the selected op",
    "opselect_typemore": "<h2>&nbsp;type some more!</h2>",
    "opselect_notfound": "<h2>&nbsp;404 - op not found</h2><br/><br/><a class=\"bluebutton\" onclick=\"gui.serverOps.createDialog(document.getElementById('opsearch').value);\">create your own op</a>",
    "opselect_addop": "Add",

    "preferences":
    {
        "title": "Preferences",

        "subtitle_glpatch_cursor": "use native cursor",
        "subtitle_glpatch_showboundings": "draw patch bounding",
        "subtitle_glpatch_linetype": "cables style",

        "head_glpatch": "Patch Editor",

        "title_snapToGrid": "Snap To Grid",
        "subtitle_snapToGrid": "Ops snap to an invisible grid, makes patches look much cleaner",

        "title_nobrowserWarning": "Hide Warning",
        "subtitle_nobrowserWarning": "Hide that red \"unsupported browser\" warning notification",

        "title_introCompleted": "Intro Tour",
        "subtitle_introCompleted": "Show Intro tour again (needs reload)",

        "title_helperMode": "Show Helper Meshes",
        "subtitle_helperMode": "Show helper, directions/boundaries etc, as in e.g. randomCluster",

        "title_forceWebGl1": "Force WebGL v1",
        "subtitle_forceWebGl1": "",

        "title_miniopselect": "Op Select Dialog Layout",
        "subtitle_miniopselect": "",

        "title_theme": "Theme",
        "subtitle_theme": "Bright theme is better when you work outside.",

        "title_hideSizeBar": "Icon Side Bar",
        "subtitle_hideSizeBar": "Shows a sidebar with icons of commands from command palette",

        "title_texpreviewSize": "Texture Preview",
        "subtitle_texpreviewSize": "After clicking an op that outputs an image/texture, it will be shown next to the canvas.",

        "title_bgpattern": "Background Pattern",
        "subtitle_bgpattern": "Background Pattern for transparent canvas/textures.",

        "title_wheelmultiplier": "Wheel Speed",
        "subtitle_wheelmultiplier": "Mouse/Touchpad scrollwheel speed higher number - faster zooming, default is 1",


        "title_noidlemode": "Idle Mode",
        "subtitle_noidlemode": "go into idle mode after some time (to save energy and less fan activity)",

        "title_tipps": "Tips",
        "subtitle_tipps": "Show tips when opening editor (needs reload)",

        "title_presentationmode": "Presentation Mode",
        "subtitle_presentationmode": "Show all key presses on the screen",

        "title_fontsize": "Text Size",
        "subtitle_fontsize": "Size Of Text and Icons in cables"
    },
    "tips":
    [
        {
            "descr":
                " To **add an op** press the `Esc`-key. In the popup you can now enter any text which is part of the op’s namespace (e.g. `MainLoop`). You can now navigate through the result-set using your arrow keys (`↓` and `↑`). \n\nWhen you press `Enter` the selected op will be added to the editor.descr:",
            "img": "a_add_op_new.gif"
        },
        {
            "descr": " To **add another op and connect it** to the one we just added you can now drag out a cable from one of the ports.  ",
            "img": "b_add_op_and_connect_it_new.gif"
        },
        {
            "descr": " To **add an op in between two ops** just press the circle in the middle of the cable (one of the existing ops must be highlighted for this).  ",
            "img": "c_add_op_between_other_ops.gif"
        },
        {
            "descr": " To **change one of the op-parameters** first select the op by clicking on it, then you will see the op-settings in the pane on the right. To change one of the number value inputs click and drag up or down.",
            "img": "d_change_op_parameter.gif"
        },
        {
            "descr": " To **access an op’s example patch** first select the op, then click **view example patches**.",
            "img": "e_view_example_patch.gif"
        },
        {
            "title": "Delete Links",
            "descr": " To **delete a cable** just press the `right mouse button` on one of the connected ports.",
            "img": "f_delete_link.gif"
        },
        {
            "descr": " To **reconnect a cable to another port** press and drag with the `right mouse button`.",
            "img": "g_reconnect_link.gif"
        },
        {
            "title": "Copy Paste",
            "descr": " Ops can be duplicated by making a selection with your `left mouse button`, pressing `CMD + c` or `CTRL + c` to copy, followed by `CMD + v` or `CTRL + v` to paste.  ",
            "img": "h_copy_paste_op.gif"
        },
        {
            "title": "Align Ops",
            "descr": " To bring some order into your patch you can align ops by making a selection with your `left mouse button` and pressing `a` to **horizontally align** or `SHIFT + a` to **vertically align**.   ",
            "img": "i_align_ops.gif"
        },
        {
            "descr": " To **unlink an op** hold it with the `left mouse button` and shake it.  ",
            "img": "j_disconnect_by_shaking.gif"
        },
        {
            "descr": " You can also **unlink ops** by selecting them and pressing `x`",
            "img": "k_disconnect_with_x_key.gif"
        },
        {
            "descr": "  Drag a cable to the center of an op to **see suggestions** of fitting ports. if there is only one the link will be connected automatically.",
            "img": "l_connect_with_drag_to_center.gif"
        },
        {
            "descr": " To **add an existing op between two other ops**, click and hold 'left mouse button' and drag the op to the middle of the cable and release.",
            "img": "m_add_existing_op_between.gif"
        },
        {
            "title": "Duplicating Links",
            "descr": " You can **duplicate a link** by pressing [alt] and the `right mouse button` and dragging the cable to another port",
            "img": "n_duplicate_link.gif"
        },
        {
            "title": "Flow Mode",
            "descr": " See data and function flow by pressing `f`",
            "img": "o_op_flow_with_f_key.gif"
        },
        {
            "descr": " Disable ops and its children by pressing `d`",
            "img": "p_disable_ops_with_d_key.gif"
        },
        {
            "descr": " You can **temporarily disconnect/bypass a selected op** by pressing `SHIFT + d`, pressing `SHIFT + d` again reconnects the cable",
            "img": "q_disable_op_with_shift_and_d_key.gif"
        },
        {
            "descr": " You can **upload files** by dragging them into the window",
            "img": "r_add_file_drag_and_drop.gif"
        },
        {
            "descr": " access the **command palette** by pressing `CMD + p` or `CTRL + p`. ",
            "img": "s_command_palette_ctrl_and_p.gif"
        },
        {
            "descr": " You can **set a custom title to an op** by clicking the title in the parameter panel (you can also select an op and press `t`)",
            "img": "t_change_op_title.gif"
        },
        {
            "descr": " organize huge patches by putting ops into subpatches",
            "img": "u_create_subpatch.gif"
        },
        {
            "descr": " to find **documentation and examples for an op**, click on the op and then click the link",
            "img": "v_op_documentation_link.gif"
        },
        {
            "descr": " set colors for ops for easier identification",
            "img": "colormarker.gif"
        },
        {
            "descr": " create and link new op by clicking parameter",
            "img": "linkparameter.gif"
        },
        {
            "descr": " use snap to grid for cleaner looking patches",
            "img": "snaptogrid.gif"
        },
        {
            "descr": " `Right mouse button` click while holding [alt] key and drag a cable from a port or the cable itself, to **copy the connection**.",
            "img": "rightclickdrag.gif"
        },

        {
            "descr": " To **move a cable connection to another port**, hold `SHIFT + alt` keyboard keys and `right mouse button` while over either end of the cable.",
            "img": "right_shift_alt.gif"
        },
        {
            "descr": " You can drag a cable from an operator port directly to a parameter name in a parameter panel of another op.",
            "img": "dragtoport.gif"
        },
        {
            "descr": " Press `CTRL + f` or `CMD + f` on your keyboard to **find operators in your project by name or by tag** - for example, unconnected or bookmarked.",
            "img": "ctrl_f.gif"
        },
        {
            "descr": " Click `left mouse button` on the patch preview and select the gizmo icon to enable or disable helpers and transforms. **Show All transforms** will show all moveable objects in your scene, click `left mouse button` on the circle to enable the object's gizmo.",
            "img": "gizmo.gif"
        },
        {
            "descr": " To **select DIV elements directly from the patch preview**, hover over your DIV elements while holding `CTRL` or `CMD` on your keyboard and clicking `left mouse button` on the DIV element.",
            "img": "inspecthtml.gif"
        },
        {
            "descr": " You can **jump to a connected operator** in the parameter panel by clicking `left mouse button` on it's name next to the parameter it is connected to.",
            "img": "jump_connected_op.gif"
        },
        {
            "descr": " Quickly **find your sidebar operators** in a patch by clicking `left mouse button` on a sidebar element while holding the `CTRL` or `CMD` key on your keyboard.",
            "img": "inspect_sidebar.gif"
        },
        {
            "descr": " You can **organize** your operators into colorful Area groups by selecting multiple ops and clicking Create Area. Move operators out of an area to separate them, group groups into groups, hold down [alt]to drag Area without ops!",
            "img": "area_create.gif"
        },
        {
            "descr": " You can click `left mouse button` on an output field in any operator's parameter panel to **copy it to your clipboard**. Great for saving arrays or generated outputs.",
            "img": "copyoutput.gif"
        }

    ]
};

export default text;