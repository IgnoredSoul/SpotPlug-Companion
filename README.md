# SpotPlug Companion

SpotPlug Companion is a small tool that creates a socket and http server, allowing [SpotPlug](https://github.com/IgnoredSoul/SpotPlug) to connect.  
From there, your own socket client can connect and receive events from the server socket.

# Communication

### `spicetify-connected`
#### notifies your client that SpotPlug has connected

| key | desc | type |
| :--- | :--- | :--- |
| `title` | Title of the song | `string` |
| `album` | Title of the album | `string` |
| `artUrl` | Spotify URL to the cover art | `string` |
| `durationMs` | How long the song is in milliseconds | `int` |
| `isPaused` | Current playback state of the song | `bool` |

---

### `spicetify-disconnected`
#### notifies your client that spicetify has disconnected

---

### `spicetify-songchange`
#### notifies your client that SpotPlug has changed songs


| key | desc | type |
| :--- | :--- | :--- |
| `title` | Title of the song | `string` |
| `album` | Title of the album | `string` |
| `artUrl` | Spotify URL to the cover art | `string` |
| `durationMs` | How long the song is in milliseconds | `int` |
| `isPaused` | Current playback state of the song | `bool` |

---

### `spicetify-progress`
#### notifies your client about the current playback time

| key | desc | type |
| :--- | :--- | :--- |
| `milliseconds` | The playback time in milliseconds | `int` |
| `percentage` | The playback time as a percentage | `float` |

---

### `spicetify-playpause`
#### notifies your client that SpotPlug has paused/resumed the current song

| key | desc | type |
| :--- | :--- | :--- |
| `isPaused` | Current playback state of the song | `bool` |



# Note on Development

This tool was created as a personal project with the goal of creating a standalone application using the data from Spicetify.  
Some things to note:

**__I am not__** a professional. The current state of the code is a reflection of my current skill level with TypeScript.


Electron was chosen as it is known to create a standalone application, even though I am aware it is not the most efficient framework.

**__Expect bugs and issues__** with this application, and if you'd like, please contribute to help improve SpotPlug Companion