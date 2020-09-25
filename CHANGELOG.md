# 0.3.4

## Bugfixes

* Load app after login without refresh

# 0.3.3

## Tech changes

* The version number can now be ctrl-clicked to display the exact git commit.

## Bugfixes

* Fix loading screen can block login
* Playlists are now saved after renaming

# 0.3.2

## Tech Changes

* Automate release creation
* Display version number in header bar

# 0.3.1

* Paginated loading
* Progress bar on loading

# 0.3.0

Public Alpha release (unchanged from 0.2.10)

# 0.2.4 - 0.2.10

## New features
* Electron
* Fix notification display on narrower monitors

## Tech changes
* Build a docker image in pipeline

# 0.2.3

## New features
* Multiple play queues
* Control columns displayed in play queue
* Muting of playback


# 0.2.2

## New features
* Adding a track to the playlist by double clicking now plays it unless
  a modifier key is pressed.
* Keyboard controls for the tree widget

## Bug fixes
* Dragging from a specific node now first selects that node
  according to selection modifiers.

# 0.2.1

## New features

- Show now playing track in title.
- Keyboard controls for play queue

## Tech changes
- Makefile now supports some standard overrides (prefix/DESTDIR)

# 0.2.0

## New features

- Remove tracks from play queue (select and press delete)
- View albums under an artist where they have songs but are not an album artist.
- Drag and drop tracks from library to play queue.
- Remember play queue across page visits.
- Add repeat, repeat and shuffle song modes.
- Highlight currently playing track in play queue.
- Search library tree.

## Bug fixes

- Send to main screen on login

## Tech changes

- Add CI config
- Add makefiles

# 0.1.0

## New features

- Connect to Jellyfin server
- Browse library
- Add items to play queue
- Play music!

## Limitations

- Cannot remove from play queue
- Items only show up under the album artist, artists who are not the album artist will have no data underneath them.
- Refreshing is required after login
