# 0.5.3
## New Features

* New fields in track listing (genre, year)
* Show album art of currently playing track.


# 0.5.2

## New Features

* If the URL does not have http/https prefix, the login screen will try connect using both and report the status

## Bug fixes

* If shuffle mode is saved, the shuffle order on load would not include all tracks.

# 0.5.1

## New Features

* Indicate in library tree when loading is occuring that you can search for unloaded items

# 0.5.0

## New Features

* Background loading - Server side browsing/search will be used initially while all data loads
  in the background. Once loaded, browsing/search will then be performed locally for fast results as before.

## Bug fixes

* Logging in to the same server again will replace existing entries, rather than duplicate the server
  causing excessive notifications.
* Fixed issues logging into Jellyfin 10.7.0 servers.


## Tech changes

* Moved to official `@jellyfin/axios-client` rather than self-generated client.

# 0.4.2

## Tech changes

* Docker images are now built ahead of time for faster builds and less dependency on external servers.

# ~~0.4.1~~

## Bug fixes

* Sorting by album artist now works correctly again.

# 0.4.0

## New Features

* Play Queue picker now has ARIA-compliant keyboard controls.
  * Left/Right for next/previous tabs
  * Home/End for first/last tab
  * Delete to remove tab
  * F2 to rename tab
* Play Queue tabs now scroll tabs rather than break layout
* Volume and Shuffle/Repeat mode is now remembered
* Playback is reported to the jellyfin server
* Accessiblity: Table cells are now focusable to read their contents

## Tech changes

* All communication with the jellyfin server has been rewritten from jellyfin-apiclient
  to a autogenerated axios client from the API swagger docs. This should result in no behaviour
  changes for the user, but makes testing/eventual multi-server support easier.

## Bug fixes

* In some cases, the play queue was not successfully saved on rename/adding new
  tracks with multiple queues.


# 0.3.6

## New features

* Tree sorting dropdown now added to tree itself.

## Bugfixes

* The tree now remembers the sort when you clear a search

# 0.3.5

* Scrub to specific point in song
* Custom Tree Layout
* Add support for exporting playlists to JSON, m3u and XSPF files.
  * Note: This is mostly only useful for players that support fuzzy lookup
    of tracks in their libraries as these players cannot play from the jellyfin
    URIs.

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
