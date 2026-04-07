import * as http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let httpServer: any = null;
let ioServer: any = null

// Closes the servers and shit
export function stopBackend(): Promise<void> {
  return new Promise((resolve) => {
    // console.log(`[Server]: Stopping server`);
    if (ioServer) {
      ioServer.sockets.sockets.forEach((socket: any) => {
        socket.conn.close(); 
      });
      ioServer.close();
    }

    if (httpServer) {
      httpServer.unref(); 
      httpServer.close(() => {
        httpServer = null;
        ioServer = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
}

// Start the servers and shit
export function startBackend(onDataReceived: (event: string, data: any) => void, port = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    httpServer = http.createServer();
    ioServer = new SocketIOServer(httpServer, { cors: { origin: "*" }, serveClient: false });
    
    httpServer.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error('EADDRINUSE'));
      } else {
        reject(err);
      }
    });

    let spotifySocketId: string | null = null;

    // When a socket connects
    ioServer.on('connect', (socket: Socket) => {

      // When a socket connects
      // console.log(`[SERVER]: A new socket connected`)

      // When spotify connects
      socket.on('p2s-connect', (data) => {
        
        // Track socket
        spotifySocketId = socket.id;

        // Emit to spotify socket for data
        ioServer.to(spotifySocketId).timeout(2500).emit('s2p-current-track', (err: any, responseData: any) => {
          const data = responseData[0]; 
          onDataReceived('status-songchange', data);
          onDataReceived('status-playpause', data.isPaused);
          onDataReceived('status-update', true);
        });
        
        // Emit to everyone else that spotify has connected
        ioServer.emit('spotify-connect');
      });
      
      // When the song changes
      socket.on('p2s-songchange', (data: any) => {
        
        // Update UI
        onDataReceived('status-update', true);
        onDataReceived('status-songchange', data);
        onDataReceived('status-playpause', data.isPaused);
        
        // Emit to everyone that spotify has changed songs and its data
        ioServer.emit('spotify-songchange', data);
      });
      
      // When the playback pauses or resumes
      socket.on('p2s-playpause', (data) => {
        
        // Update UI
        onDataReceived('status-update', true);
        onDataReceived('status-playpause', data.isPaused);
        
        // Emit to everyone that spotify has either pauses or resumed
        ioServer.emit('spotify-playpause', data.isPaused)
      });
      
      // When the tracks' progress has changed
      socket.on('p2s-progress', (data) => {
        
        // Update UI
        onDataReceived('status-update', true);
        onDataReceived('status-progress', data);
        
        // Emit to everyone that the tracks' progress has changed
        ioServer.emit('spotify-progress', data)
      });
      
      // When a client requests the current track
      socket.on('spotify-current-track', async (callback) => {
        if (!spotifySocketId) return callback({ error: "Spotify client is not connected." });

        try {
          const response = await ioServer.to(spotifySocketId).timeout(2000).emitWithAck('s2p-current-track');
          callback(response.length > 0 ? response[0] : {error: 'no data in response?'});

        } catch (e) {
          console.error("Failed to fetch from Spotify client:", e);
          callback({ error: "Spotify client timed out or failed." });
        }
      });
      
      // When a client requests the current artist
      socket.on('spotify-current-artist', async (callback) => {
        if (!spotifySocketId) return callback({ error: "Spotify client is not connected." });

        try {
          const response = await ioServer.to(spotifySocketId).timeout(2000).emitWithAck('s2p-current-artist');
          callback(response.length > 0 ? response[0] : {error: 'no data in response?'});

        } catch (e) {
          console.error("Failed to fetch from Spotify client:", e);
          callback({ error: "Spotify client timed out or failed." });
        }
      });

      // When a client disconnects
      socket.on('disconnect', () => {
        
        // If the socket that disconnected was the spotify socket
        if(spotifySocketId === socket.id) {
          
          // Set it to null
          spotifySocketId = null;
          onDataReceived('status-update', false);

          // Emit to everyone that spotify has disconnected
          ioServer.emit('spotify-disconnected');
        }
      })

    });
  
    // Start listenin'
    httpServer.listen(port, () => {
      // console.log(`[Server]: Server running at http://localhost:${port}`);
      resolve();
    });
    
  })
}