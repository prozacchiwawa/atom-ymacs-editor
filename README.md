# Ymacs in atom

I like atom a lot in concept and in practice, but I'm an emacs user primarily.  To
help me transition, I've written this thin wrapper around the wonderful ymacs editing
widget https://github.com/mishoo/ymacs .  This will keep me in atom long enough to
learn to script and use it.  Maybe it will be of value to someone else, too.

Features:

- ymacs will automatically attach to your current atom buffers.
- C-x C-s in ymacs will transfer text back to your atom buffers.
- Opening a new file in atom will open it in ymacs too if ymacs is open.
- Killing a buffer in ymacs will release the edit object in atom.

![ymacs screenshot in atom](https://raw.githubusercontent.com/prozacchiwawa/atom-ymacs-editor/master/ymacs-screen.png)
