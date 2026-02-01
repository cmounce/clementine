# Clementine

Clementine is a no-frills, self-hosted plain text editor.
It doesn't do fancy Markdown formatting or hyperlinks, though you can certainly still use it to write Markdown!
All it does is get out of your way and give you a place to type.
If that's all you wanted, Clementine might be for you.

Users beware: Clementine is currently at a very early stage of development!
I can't guarantee it won't eat your work, and it (just barely) meets my own needs.

## Planned features

Clementine is already architected to be offline-friendly: all data is in IndexedDB.
It's not a proper PWA yet, so you do need an internet connection on mobile in order to initially load the page.
But once loaded, no further connection is needed.

In order to support cross-device sync in the future, all data is represented using CRDTs (specifically, [Yjs](https://yjs.dev/)).
When you host Clementine, your server will track the various CRDT deltas in a SQLite database file, and your clients will periodically sync themselves with the contents of that database.
The intent is to allow "collaboration with yourself".
For example, you ought to be able to go back and forth between writing on your phone and revising on your laptop, without fear of the two devices accidentally overwriting each other's changes.

The sync system is architected so the server does not need to run Yjs itself; all the server needs to do is pass opaque blobs among the clients.
This restriction means the backend can potentially be very lightweight and have implementations in other languages besides JS.
It also allows the data to be encrypted client-side, using a key the server doesn't have.
(The amount of security this actually adds depends on your threat model. But if you sleep better with a padlock on your diary, this might give you some peace of mind.)
