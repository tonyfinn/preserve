# Preserve

Clementine/foobar2000 inspired music player frontend for Jellyfin

![Screenshot of version 0.2.0](screenshot-v0.2.png)

[Try it out here!][hosted]


## Features

* Plays any media from your jellyfin library your browser supports
* Efficient UI for creating on the fly playlists
* Keyboard controls
* Supports media keys (play/pause keyboard keys) for Chrome/Desktop
    * Firefox users can enable experimental support in your browser by
      enabling `dom.media.mediasession.enabled` in `about:config`


## Keyboard controls

### Play Queue

* Up/Down/Home/End - Change focused track
* Enter - Play focused track now
* Space - Select current track
* Delete - Remove selected tracks from playlist

### Library

* Up/Down/Left/Right - Navigate tree
* Space - Toggle selection
* Enter - Add artist/album/track to playlist and play now
* Shift-Enter - Add to playlist, don't play now


## Get Started

The easiest way to get started is to use the hosted instance
at [https://preserveplayer.com][hosted]. This requires your jellyfin instance is
accesssible from your web browser. If you want a desktop application, or your security
settings do not allow other web pages to access your jellyfin server, you can
also download a desktop version from the [releases page][releases]. 

Finally, users wishing to self host the web application can use one of the advanced
setup methods listed below.


## Advanced Setup (Unix)

### Building

Building the application locally requires [jq][] and [node] 12+.

Run `make dist` to build a local copy in the `dist/`

### Installation

Run `make install`. Files get installed to `/usr/local/share/webapps/preserve`
by default. This can be overridden with the prefix option, e.g. `make install
prefix=/srv/www`.

### Running

Have your preferred web server serve the files at `/usr/local/share/webapps/preserve`.
A built in web server for local use is available in `contrib/webserver-config/index.js`.
Alternatively, sample configs for nginx or Caddy are included. By default the application
will be available at http://localhost:5678/


## Advanced Setup (generic Node)

### Building

```
npm ci && npm run build:prod
```

### Installation

Copy the files from dist/ to your desired webroot, and configure your web
server. See the options in contrib/webserver-config.

### Running

Start your web server. For the local express server this can be done with `npm run
serve`. By default the application will be available at http://localhost:5678/


## Advanced Setup (docker)

### Running

```
docker run -p 5678:5678 tonyfinn/preserve:latest
```

Visit http://localhost:5678

Individual versions are also tagged, e.g. as `tonyfinn/preserve:0.2.3`. See [docker hub][]
for more versions.


## License

Preserve is (c) Tony Finn and licensed under GPLv2 or later. See LICENSE.txt for details.

[docker hub]: https://hub.docker.com/r/tonyfinn/preserve/tags
[hosted]: https://preserveplayer.com
[jq]: https://github.com/stedolan/jq
[node]: https://nodejs.org/en/
[releases]: https://gitlab.com/tonyfinn/preserve/-/releases
