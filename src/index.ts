import { app, BrowserWindow, ipcMain } from 'electron';
import {IpcChannelInterface} from "./IPC/IpcChannelInterface";
import {SystemInfoChannel} from "./IPC/SystemInfoChannel";

declare const MAIN_WINDOW_WEBPACK_ENTRY: any;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: any;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

class Main {
  private mainWindow: BrowserWindow;

  public init(ipcChannels: IpcChannelInterface[]) {
    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    app.on('ready', this.createWindow);

    app.on('window-all-closed', this.onWindowAllClosed);
    app.on('activate', this.onActivate);

    // Register the IPC channels
    this.registerIpcChannels(ipcChannels);
  }

  private createWindow = (): void => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
      height: 900,
      width: 800,
      webPreferences: {
        nodeIntegration: false, // is default value after Electron v5
        contextIsolation: true, // protect against prototype pollution
        enableRemoteModule: false, // turn off remote
        preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY // use a preload script
      }
    });
  
    // and load the index.html of the app.
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  
    // Open the DevTools.
    if (process.env.NODE_ENV === 'development') {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  };

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  private onWindowAllClosed() {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }

  private onActivate() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      this.createWindow();
    }
  }

  private registerIpcChannels(ipcChannels: IpcChannelInterface[]) {
    ipcChannels.forEach(channel => ipcMain.on(channel.getName(), (event, request) => channel.handle(event, request)));
  }
}

(new Main()).init([
  new SystemInfoChannel()
]);
