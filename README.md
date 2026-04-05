# SpotPlug Companion

SpotPlug Companion is a small tool that creates a socket and http server, allowing [SpotPlug](https://github.com/IgnoredSoul/SpotPlug) to connect.  
From there, your own socket client can connect and receive events from the server socket.

# Communication

Just use the [logging.html](/logging.html) and read [SpotPlug](https://github.com/IgnoredSoul/SpotPlug)'s docs to understand.  
Honestly cannot be arsed to write it all.



# Note on Development

This tool was created as a personal project with the goal of creating a standalone application using the data from Spicetify.  
Some things to note:

**__I am not__** a professional. The current state of the code is a reflection of my current skill level with TypeScript.


Electron was chosen as it is known to create a standalone application, even though I am aware it is not the most efficient framework.

**__Expect bugs and issues__** with this application, and if you'd like, please contribute to help improve SpotPlug Companion