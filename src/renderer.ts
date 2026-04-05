interface Window {
  electronAPI: {
    minimize: () => void;
    close: () => void;
    updateSettings: (settings: { port: number }) => Promise<{ success: boolean }>;
    getInitialSettings: () => Promise<{ port: number; isRunning: boolean; error: string | null }>;
    toggleServer: () => Promise<boolean>;
    onSongChange: (callback: (data: any) => void) => void;
    onStatusUpdate: (callback: (connected: boolean) => void) => void;
    onPlayPause: (callback: (paused: boolean) => void) => void;
    onProgress: (callback: (data: any) => void) => void;
  };
}

const dot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const trackInfo = document.getElementById('track-info');
const playState = document.getElementById('play-state-icon');
const connectionUrl = document.getElementById('connection-url');
const progressBar = document.getElementById('progress-bar');
const serverBtn = document.querySelector('.server-state') as HTMLButtonElement;
const portInput = document.querySelector('.server-port') as HTMLInputElement;

document.getElementById('min-btn')?.addEventListener('click', window.electronAPI.minimize);
document.getElementById('close-btn')?.addEventListener('click', window.electronAPI.close);

// When spicetify connects/disconnects
window.electronAPI.onStatusUpdate((connected) => {
  if (connected) {
    dot.style.background = '#1db954';
    dot.style.boxShadow = '0 0 8px #1db954';
    if (statusText) statusText.innerText = 'Connected';
  } else {
    dot.style.background = '#ff453a';
    dot.style.boxShadow = '0 0 5px #ff453a';
    if (statusText) statusText.innerText = 'Disconnected';
    if (trackInfo) trackInfo.innerText = 'Waiting for data...';
  }
});

// When the progress has changed
window.electronAPI.onProgress((data: any) => {
  progressBar.style.width = data.percentage + '%';
})

// When spicetify changes song
window.electronAPI.onSongChange((data: any) => {
  if (trackInfo) {
    trackInfo.innerText = `${data.title} — ${data.artists}`;
  }
});

// When spicetify pause/resume
window.electronAPI.onPlayPause((paused: boolean) => {
  if (playState) playState.innerText = paused ? '⏸' : '▶';
});

// Lets the function be callable via js or some shit
(window as any).toggle_app_state = async () => {
  try {

    // Toggle the server, returns a yeah or nah
    const newState = await window.electronAPI.toggleServer();

    // Update the UI
    updateServerUI(newState);

    // Log 'cause its helpful
    console.log(`[Server]: Server is now: ${newState ? 'Running' : 'Stopped'}`);
  } catch (err) {

    // Convert err to string. Idk I had an error if I didn't do this.
    const errorMessage = err.message || String(err);

    // Log that shit
    console.error("Toggle failed:", errorMessage);

    // If it's because the port is in use
    if (errorMessage.includes('EADDRINUSE')) {

      // Tell the user that they fucked up a little
      alert("Error: Port is already in use by another application. Please try a different port in Settings.");
    } else {

      // Tell the user that we have no idea why the fuck we errored
      alert(`Server Error: ${errorMessage}`);
    }

    // Force UI back to 'Start' state
    updateServerUI(false);
  }
};

// Updates the connection text up in the status box shit
function updateConnectionText(port: number | string) {
  if (connectionUrl) {
    connectionUrl.innerText = `http://localhost:${port}`;
  }
}

// Force update
updateConnectionText(portInput.value || 8000);

// Update the start/stop server button
function updateServerUI(isRunning: boolean) {

  if (isRunning) {
    serverBtn.innerText = "Stop Server";
    serverBtn.style.backgroundColor = "#ff453a"; // Red
    portInput.disabled = true;
    portInput.style.opacity = "0.5";
  } else {
    serverBtn.innerText = "Start Server";
    serverBtn.style.backgroundColor = "#1db954"; // Green
    portInput.disabled = false;
    portInput.style.opacity = "1";
  }
}

// Force update
updateServerUI(true);

// When the port input changes
portInput?.addEventListener('change', async () => {

  // Get that value
  const newPort = parseInt(portInput.value);

  // If the port number is between these
  if (newPort > 1024 && newPort < 65535) {

    // Update settings
    await window.electronAPI.updateSettings({ port: newPort });

    // Update UI
    updateConnectionText(newPort);

    // Log it
    console.log(`[Server]: Updated port to ${newPort}`)
  }
});

// When the app starts
const initApp = async () => {
  try {

    // Get existing data
    const data = await window.electronAPI.getInitialSettings();
    
    // Set the port input value
    if (portInput) {
      portInput.value = data.port.toString();
      updateConnectionText(data.port);
    }

    // Update the Button UI based on actual server state
    updateServerUI(data.isRunning);

    if (data.error === 'EADDRINUSE') {
      // Notify the user it failed 'cause of the port
      alert(`Warning: Could not start server on port ${data.port}. The port is already in use. Please change the port in settings and click Start.`);
    } else if (data.error) {
      // Notify the user that shit is fucked up
      alert(`Server Error: ${data.error}`);
    }

  } catch (err) {
    console.error("Failed to initialize app settings:", err);
  }
};

initApp();