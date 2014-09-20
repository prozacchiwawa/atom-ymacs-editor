var createPane = require('atom-pane');
var $ = require('jquery');

function postIframeMessage(iframe, message) {
    iframe.contentWindow.messageData = message;
    iframe.contentWindow.messageHandler();
}
function newEditor(dispose, edset, editor, iframe) {
    var oldPath = editor.getPath();
    postIframeMessage(
        iframe,
        {type: "new-buffer",
         file: editor.getPath(),
         text: editor.getText()});
    edset[oldPath] = editor;
    dispose.push(editor.onDidChangePath(function() {
        postIframeMessage(
            iframe,
            {type: "rename-buffer",
             file: editor.getPath(),
             last: oldPath});
        delete edset[oldPath];
        edset[editor.getPath()] = editor;
    }));
    dispose.push(editor.onDidStopChanging(function() {
        postIframeMessage(
            iframe,
            {type: "change-buffer",
             file: editor.getPath(),
             text: editor.getText()});
    }));
    oldPath = editor.getPath();
};

function sendDownEditorList(dispose, edset, iframe) {
    var editors = atom.workspace.getTextEditors();
    for (var i = 0; i < editors.length; i++) {
        var editor = editors[i];
        newEditor(dispose, edset, editor, iframe);
    }
}

module.exports.activate = function() {
    atom.workspaceView.command("ymacs-editor:create", function() {
        var ydiv = $(document.createElement('div'));
        var dispose = [];
        var editors = {};

        createPane(function(err, pane) {
            if (err)
                throw err;

            // Create a ymacs instance
            var yd = $(ydiv);
            var iframe = document.createElement('iframe');
            var ifr = $(iframe);
            ifr.css({'height':'100%',
                     'width':'100%',
                     'top':'0px',
                     'left':'0px',
                     'position':'absolute',
                     'margin':0,
                     'padding':0,
                     'border':0});
            ifr.attr('src', 'atom://ymacs-editor/resources/index.html');
            yd.append(ifr);

            // Messages from the emacs pane
            function messageListener(event) {
                var message = event.data;
                console.log("ymacs-editor:message", message);
                var type = message.type;
                if (type === "loaded") {
                    sendDownEditorList(dispose, editors, iframe);
                } else if (type === "save") {
                    // Since ymacs' container still has a reference
                    // to the editor, we'll save it on C-x C-s, because
                    // that's definitely least surprising :-)
                    var editor = editors[message.file];
                    editor.setText(message.text);
                    editor.save();
                } else if (type === "killed") {
                    delete editors[message.file];
                }
            };
            window.addEventListener("message", messageListener, false);
            dispose.push(function() {
                window.removeEventListener("message", messageListener, false)
            });

            // New editors from atom
            dispose.push(atom.workspace.onDidAddTextEditor(function(event) {
                newEditor(dispose, editors, event.textEditor, iframe);
            }));

            pane.append(yd);
            pane.addClass('ymacs-editor');
            pane.addClass('native-key-bindings');
            pane.addClass('ymacs-parent');
        }, function() {
            for (var i = 0; i < dispose.length; i++) {
                if (dispose[i].dispose)
                    dispose[i].dispose();
                else
                    dispose[i]();
            }
            ydiv.remove();
        });
    });
};
module.exports.deactivate = function() { };
module.exports.serialize = function() { };
module.exports.escape = function() {
    console.log('escape hit');
};
