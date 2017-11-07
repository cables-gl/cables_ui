const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const { Menu, dialog } = electron;

const fs = require('fs');
const path = require('path');
const url = require('url');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow(
    {
      width: 1480, 
      height: 720
    });
  mainWindow.setFullScreen(true);



  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

const menuTemplate = [
  {
      label: 'cables', /* the name is only correct when building / bundling the app */
      submenu: [
          {label: 'About'},
          {
              label: 'Greet',
              click: () => { console.log('Hi'); },
              accelerator: 'Shift+Alt+g',
          },
          {
              label: 'Greet in Renderer',
              click: () => { 
                  mainWindow.webContents.send('ping', 'whoooooooh!'); 
              },
              accelerator: 'Shift+Alt+e',
          },
      ],
  },
  {
    label: 'Patch',
    submenu: [
      {
        label: 'New',
        enabled: false,
        click: () => {
          console.log('New patch clicked');
        },
      },
      { type: 'separator' },
      {
        label: 'Open',
        click: () => {
          console.log('open clicked');
          openPatch();
        },
      },
      { type: 'separator' },
      {
        label: 'Save',
        enabled: false,
        click: () => {
          console.log('Save patch clicked');
          newPatch();
        },
      },
      {
        label: 'Save As',
        enabled: false,
        click: () => {
          console.log('Save patch as clicked');
        },
      },
      { type: 'separator' },
      {
        label: 'Settings',
        enabled: false,
        click: () => {
          console.log('Settings clicked');
        },
      },
    ],
  },
  {
      label: 'edit',
      submenu: [
          {label: 'Copy'},
          {label: 'Paste'},
      ],
  },
];

function openPatch() {
  dialog.showOpenDialog(
    {
        filters: [{
            name: 'cables',
            extensions: ['cables']
        }]
    },
    function(filePathes) {
        if(filePathes && filePathes.length > 0) {
          console.log('Opening patch: ', filePathes);
          var filePath = filePathes[0]
          if (filePath) {
            fs.readFile(filePath, function(err, fileContent) {
              if(err) {
                  CABLES.UI.notifyError('Error loading patch');
                  return console.log(err);
              }
              if(fileContent) {
                // var patch = JSON.parse(fileContent); // to reduce chances of errors with ipc-sending, we send the patch as string
                mainWindow.webContents.send('loadPatch', fileContent); 
              }
            }); 
          }
        }
      }
  );
}

let mainMenu = Menu.buildFromTemplate(menuTemplate);

function createMenu() {
  Menu.setApplicationMenu(mainMenu);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
// app.on('ready', createWindow);

app.on('ready', function()
{
  createWindow();
  createMenu();
  // const ret = electron.globalShortcut.register(
  //   'Escape',
  //   function()
  //   {
  //     mainWindow.setFullScreen(false);
  //   });
});

// app.on('will-quit', function(){

//   electron.globalShortcut.unregister('Escape');

//   electron.globalShortcut.unregisterAll();
// });





// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
