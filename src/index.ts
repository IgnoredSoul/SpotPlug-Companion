import { app, BrowserWindow, Menu, ipcMain, Tray, nativeImage } from 'electron';
import { startBackend, stopBackend } from './socket-server';
import Store from 'electron-store';
import * as path from 'path';

const store = new (Store as any)({
  defaults: {
    serverPort: 8000
  }
});

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
let mainWindow: BrowserWindow | null;
let tray: Tray | null = null;
let isQuitting = false;
let isRunning = false;
let startupError: string | null = null;
const trayIco = path.join(app.isPackaged ? process.resourcesPath : path.join(__dirname, '../..', 'src'), 'icons', 'SpotPlugCompanion_Tray.ico');
const appIco = path.join(app.isPackaged ? process.resourcesPath : path.join(__dirname, '../..', 'src'), 'icons', 'SpotPlugCompanion.ico');

if (require('electron-squirrel-startup')) { app.quit(); }

const createWindow = (): void => {

  // Remove the alt menu stuff
	Menu.setApplicationMenu(null);
	mainWindow = new BrowserWindow({
		height: 600,
		width: 700, 
		frame: false,
    icon: appIco,
		backgroundColor: '#121212',
		webPreferences: {
			preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
		},
	});

  // Load the index
	mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  
  // This
	mainWindow.on('close', (event: Electron.Event) => {
    if(!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
    return false;
	});

  mainWindow.on('closed', () =>{
    mainWindow = null;
  })

  // Ass
	const currentWindow = mainWindow; 
	currentWindow.webContents.on('did-finish-load', () => {
		const savedPort = store.get('serverPort') || 8000;
		currentWindow.webContents.send('init-settings', { port: savedPort });
	});
};

const createTray = () => {
  const icon = nativeImage.createFromPath(trayIco);
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Show App', 
      click: () => mainWindow?.show() 
    },
    { 
      label: 'Quit', 
      click: () => {
        isQuitting = true;
        app.quit();
      } 
    }
  ]);

  tray.setToolTip('SpotPlug Companion');
  tray.setContextMenu(contextMenu);

  // Optional: Show window when clicking the tray icon
  tray.on('click', () => {
    mainWindow?.isVisible() ? mainWindow.hide() : mainWindow?.show();
  });
};

// When the app opens
app.on('ready', async () => {

    // Get port
    const savedPort = store.get('serverPort') as number || 8000;

    try {
        // Start the Socket & Http server with callback stuff
        await startBackend((eventName, data) => {
            mainWindow?.webContents.send(eventName, data);
        }, savedPort);

        // Yep
        isRunning = true;
    } catch (error: any) {

        // Nah
        isRunning = false;

        // Stores "EADDRINUSE" or other shit
        startupError = error.message; 
        console.error("Startup Server Error:", startupError);
    }
    createTray();
    createWindow();
});

// Close the app
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

app.on('before-quit', () => isQuitting = true);

// Custom minimize
ipcMain.on('window-minimize', () => {
	BrowserWindow.getFocusedWindow()?.minimize();
});

// Custom close
ipcMain.on('window-close', () => {
	BrowserWindow.getFocusedWindow()?.close();
});

// Toggle the Socket && Http server shit
ipcMain.handle('toggle-server', async () => {

  // Runnin
  if (isRunning) {

    // Fuck off server
    await stopBackend();

    // Yeah nah
    isRunning = false;
  } else {
    try {
      // Get da portie
      const savedPort = store.get('serverPort') || 8000;

      // Same shit in the 'ready' thingo
      await startBackend((eventName, data) => {
        mainWindow?.webContents.send(eventName, data);
      }, savedPort as number);

      // Nah yea
      isRunning = true;
    } catch (error: any) {

      // Absolutely not
      isRunning = false;

      // Safe yeet
      throw new Error('EADDRINUSE');
    }
  }

  // Yeah nah yeah?
  return isRunning;
});

// Handle UI call to update the god damn settings
ipcMain.handle('update-settings', async (event, { port }) => {
  // console.log("Saving new port:", port);

  // Store that shit
  store.set('serverPort', port);

  // Yer
  return { success: true };
});

// Handle UI getting the fucking settings
ipcMain.handle('get-initial-settings', async () => {
  return {
    port: store.get('serverPort') || 8000,
    isRunning: isRunning,
    error: startupError 
  };
});
