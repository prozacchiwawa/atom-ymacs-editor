/*

 Original author's note;

  Note that this file is just an example.  It should not be treated as
  part of Ymacs itself.  Ymacs is just an editing platform and as such
  it has no menus, no toolbar etc.  These can be easily added using
  other DynarchLIB widgets, as this file demonstrates.

  If a collection of useful menus/toolbars will emerge, a new compound
  widget will be defined.

 -- This test has been pared down and adapted to host ymacs in atom
 (or more generally, anything that can receive events as the parent
 window).  For other ymacs users, the below code is a fairly robust
 example of how to embed ymacs in only part of the DOM.  It will take
 the size of the div that parents the desktop element, although that
 capability isn't used here, as we're in an iframe anyway.

*/

var messageHandler;
var messageData;

function save_buffer() {
    var text = this.code.join("\n");
    window.parent.postMessage(
        {type: "save",
         file: this.name,
         text: text}, "file://");
};

$(document).ready(function() {
    Ymacs_Buffer.newCommands({
        save_buffer: Ymacs_Interactive(save_buffer)
    });

    var desktop = new DlDesktop({});
    var desktopElement = desktop.getElement();
    desktopElement.parentNode.removeChild(desktopElement);
    document.getElementById('ymacs-in-a-div').appendChild(desktopElement);
    desktop.fullScreen();
    desktopElement.id = "ymacs-desktop";

    var layout = new DlLayout({ parent: desktop });

    var empty = new Ymacs_Buffer({ name: "empty" });
    var ymacs = window.ymacs = new Ymacs({ buffers: [ empty ]});
    ymacs.setColorTheme([ "dark", "y" ]);

    try {
        ymacs.getActiveBuffer().cmd("eval_file", ".ymacs");
    } catch(ex) {}

    messageHandler = function(event) {
        var message;
        if (event)
            message = event.data;
        else
            message = window.messageData;

        console.log("ymacs-iframe:message", message);
        var type = message.type;
        if (message.type === "new-buffer") {
            var code = message.text;
            var buf = ymacs.getBuffer(message.file) || ymacs.createBuffer({name:message.file});
            buf.COMMANDS.kill_buffer = Ymacs_Interactive(function() {
                this.whenYmacs(function(ymacs) {
                    ymacs.killBuffer(this);
                });
                window.parent.postMessage({type: "killed", file:message.file}, "file://");
            });
            buf.setCode(code);

            // XXX arty set mode by file type
            if (message.file.endsWith('.js'))
                buf.cmd("javascript_mode");

            ymacs.switchToBuffer(buf);
            buf.keymap[0].defineKey("C-x C-s", save_buffer, "");
        } else if (message.type === "change-buffer") {
            var buf = ymacs.getBuffer(message.file);
            if (buf) {
                buf.setCode(message.text);
            }
        } else if (message.type === "delete-buffer") {
            var buf = ymacs.getBuffer(message.file);
            if (buf) {
                ymacs.killBuffer(buf);
            }
        }
    };

    window.addEventListener("message", messageHandler);

    layout.packWidget(ymacs, { pos: "bottom", fill: "*" });

    $('#ymacs-desktop').css({'position':'relative'});
    var ydiv = $('#ymacs-in-a-div');
    function ymacs_size() {
        console.log('size?');
        var size = {x:ydiv.width(), y:ydiv.height()};
        $('#ymacs-desktop').css('width',size.x+'px');
        $('#ymacs-desktop').css('height',size.y+'px');
        desktop.setSize(size);
    };
    $('#ymacs-in-a-div').resize(ymacs_size);
    $(window).resize(ymacs_size);
    ymacs_size();

    DynarchDomUtils.trash(document.getElementById("x-loading"));

    window.parent.postMessage({type: "loaded"}, "file://");
});
