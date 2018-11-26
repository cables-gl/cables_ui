CABLES=CABLES || {};
CABLES.UI=CABLES.UI || {};

/* After adding a text add jQuery-hover-definition in ui.js + add data-info="{{ texts.foo }}" to the template */

CABLES.UI.TEXTS=
{
    /* Menu ------------------ */
    /* Patch */

    save_screenshot:"## save screenshot\n\ndownload renderer output as an image file",
    toggle_sound:"## toggle sound\n\nturn sound on or off",
    renderer_maximize:"## maximize_renderer",
    renderer_setsize:"## Renderer Size \n\n* click to et renderer size",
    infoarea:"## infoarea\n\nlook here for contextual information",

    nav_patch_new: "## New Patch\n\nCreates a new patch",
    nav_patch_open: "## Open Patch\n\nLoad an existing patch",

    linkAddCircle:"## Link \n\n* `[left click]` - insert op \n* `[right click]` - delete link \n* `[shift+left click]` - insert op",

    timeLineToggle:"toggle timeline / keyframing panel",
    timeLineTime:"* shows current frame/time in seconds\n\n * click to enter frame to go to",

    portFloatInput:"* use mousewheel or up/down keys to inc/decrement by 0.1",
    portFloatDrag:"* hold left mouse button and drag to change value. \n\n* hold shift to for smaller increase.",
    portUnlink:"Click to unlink port",
    portCreateOp:"create and connect new texture op",
    portAnimKeep:"keep in keyframing view",
    portAnimToggle:"toggle parameter animation. enable to keyframe parameter",

    portDirIn:'## Input Port \n\n',
    portDirOut:'## Output Port\n\n',
    portMouseUnlink:'* press right mouse button to unlink port\n* drag while holding right mouse button to move link\n* `[del]` - delete link\n* [ALT]+drag while holding right mouse button to copy link',
    portMouseCreate:'* press left mousebutton (or press and drag) to create and link new op',
    portObjectSnapshot:'see at object data snapshot',

    patchSelectedMultiOps:'## Selected Multiple Ops\n\n* `[d]` disable ops and their childs\n* `[a]` align ops left\n* `[c]` center ops\n* `[shift+a]` reduce vertical spacing\n* `[del]` delete selcted ops\n* `[mod] + c`: Copy selected op ',
    patchSelectedOp:'## Selected Single Op\n\n* `[t]` set op title\n* `[d]` disable op and childs\n* `[shift+d]` temporary unlink op \n* `[x]` unlink op \n* `[del]` delete op\n* `[page up/down]` snap to parent/child op',

    projectSettingsPublic:"make patch public - everyone can see it",
    projectSettingsTitle:"## Patch Name \n\nIf this is your op, click to edit",
    projectSettingsExample:"ADMIN: patch will be listed as example",

    projectExportNotSaved:"patch not saved - save patch before exporting",

    editor: "## Code editor \n\nHere you can edit the code of your ops, write op descriptions, as well as edit objects / arrays.",
    patch: "## Patch-Panel \n\nHere you can connect ops and make cables do things. \n\n* `[esc]: Quick-add op` \n* `[space] + mouse drag:`: Scroll \n* `[right click] + mouse drag:`: Scroll \n* `[mod] + s`: Save patch \n* `[mod] + v`: Paste \n* `[mod] + a`: Select all ops",
    canvas: "## Renderer \n\nHere you can see the visual output of your patch.\n\n[CMD] + [ENTER] - Maximize renderer",
    projectFiles: "## Project Files \n\nOverview over your uploaded files",
    undevLogo: "## UNDEV \n\nCables was made by **undefined development**, come visit us in our office in Berlin and have a coffee with us! ",

    tab_files: "## Files \n\nUpload and manage your files",
    tab_code: "## Code\n\noperator code",
    tab_doc: "## Documentation\n\noperator documentation",
    tab_preview: "## Preview\n\npreview you generated textures",
    tab_keyframes: "## Keyframes\n\n",
    tab_variables: "## Variables\n\n",
    tab_patchconnection: "## Patch Connection\n\n",
    tab_profiler: "## Profiler \n\nFind out which ops require most processing time",
    tab_bookmarks: "## Bookmarks \n\nBookmark ops in a big patch to easily locate them",
    tab_debug: "## Debug \n\n",
    tab_screen: "## Screen \n\n",

    download_screenshot: "## Download screenshot \n\nDownload a HD-image (1920 x 1080) of your patch",
    minimapContainer: "## Minimap \n\nShows an overview over your patch. Click inside the map to navigate.",
    project_settings_btn: "## project Settings \n\nEdit project name, make it private / public, add collaborators.",
    timelineui: "## Timeline \n\nIn the timeline you can animate ports over time.",
    op_background: "## Op \n\n",
    op_title:'## Op Title \n\n* click to edit title',

    bookmark_added: "Bookmark added!",
    bookmark_removed: "Bookmark removed!",
    sidebarMenu: "## Customize sidebar \n\nOpen the sidebar customizer to add / remove menu items by dragging them to / from the sidebar. \nDrag menu items vertically to change their order. \nYou can also press `cmd + p` to show the command pallet – there you can press the bookmark icon to add / remove menu items as well. ",

    timeline_overview:"## timeline overview \n\nshows the current visible area\n\ndrag borders to resize\n\n* `[drag left click]` move area\n* `[drag right click]` move area and change time\n* `[double click]` toggle show full project length",
    timeline_frames:"## timeline \n\n* `[click]` move cursor",
    timeline_time:"`[click]` jump to frame",
    timeline_progress:"`[click]` set project duration",
    timeline_keys:"## timeline  \n\n* `[drag right click]` move visible area\n* `[drag left click]` select keys\n* `[h]` center all keys\n* `[j/k]` jump to next/previous key\n* `[DEL]` delete selected keys",

    usersettings:"## User Settings\n\nchange editor settings ",

    valueChangerHover:'## Number Input \n\n* [drag mouse left right] - change value slowly \n* [shift + drag mouse left right] - change value fast',
    valueChangerInput:'## Number Input Focussed \n\n* [up / down / mousewheel] - change value +/- 0.1\n* [shift + up / down / mousewheel] - change value +/- 0.01\n* [alt + up / down / mousewheel] - change value +/- 1',
    open_new_window:'## View Patch\n\nopen patch viewer in new window',
    settings:'## Patch Settings\n\nrename,publish your patch\n\ninvite users to collaborate',
};
