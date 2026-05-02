# Ambient music

Drop `.mp3` (or `.m4a`, `.ogg`, `.wav`, `.webm`) files in this folder.

The ambient player on every page reads this directory at request time
via `/api/ambient/tracks`. Filenames become track titles
(`bell-meditation-01.mp3` → "Bell Meditation 01"). No manifest to
maintain — add a file, redeploy, it shows up.

User preferences (liked / disliked / mode / volume) live in
`localStorage` per device, so they survive across sessions but stay
private to the device.
