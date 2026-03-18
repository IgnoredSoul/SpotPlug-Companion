import { Socket } from 'dgram';
import * as http from 'http';
import { Server as SocketIOServer } from 'socket.io';

let httpServer: any = null;
let ioServer: any = null

// Closes the servers and shit
export function stopBackend(): Promise<void> {
  return new Promise((resolve) => {
    console.log(`[Server]: Stopping server`);
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

    let spotify_socket: any = null;
    let existing_data: any = null;

    ioServer.on('connection', (socket: Socket) => {

      console.log("[SERVER]: A new socket connected");

      // Tell the client they've connected and we need their initial data
      socket.emit('connected');
      socket.on('connected', (data: any) => {

        // We know there is no data, so it must not be spicetify
        if(!data) {
          if(existing_data) {
            ioServer.emit('spicetify-connected', existing_data);
          }
          return;
        }
        
        // Tell the UI to update its information
        onDataReceived('status-update', true);
        onDataReceived('status-songchange', data);
        onDataReceived('status-playpause', data.isPaused);

        // If there is any clients, tell them that spicetify connected
        ioServer.emit('spicetify-connected', data)

        // A reserved space for the spicetify socket
        if(spotify_socket == null) spotify_socket = socket;
        existing_data = data;
      })

      // When spicetify changes song
      socket.on('songchange', (data: any) => {
        onDataReceived('status-update', true);
        onDataReceived('status-songchange', data);
        onDataReceived('status-playpause', data.isPaused);

        ioServer.emit('spicetify-songchange', data)

        if(spotify_socket == null) spotify_socket = socket;
        existing_data = data; 
      });

      // When spicetify resumes/pauses the song
      socket.on('playpause', (data: any) => {
        onDataReceived('status-playpause', data?.isPaused);
        
        ioServer.emit('spicetify-playpause', data?.isPaused)
      });

      // Progress of the current song
      socket.on('progress', (data: any) => {
        onDataReceived('status-progress', data);
        ioServer.emit('spicetify-progress', data);
      });

      // When a client disconnects
      socket.on('disconnect', () => {

        // If the socket that disconnected is the same socket as our reserved spotify socket,
        // let the other sockets know that spicetify has disconnected and update the UI
        if(socket == spotify_socket) {
          onDataReceived('status-playpause', true);
          onDataReceived('status-update', false);

          ioServer.emit('spicetify-disconnected');
          
          spotify_socket = null;
        }
      });

    });
  
    // Start listenin'
    httpServer.listen(port, () => {
      console.log(`[Server]: Server running at http://localhost:${port}`);
      resolve();
    });
    
  })
}