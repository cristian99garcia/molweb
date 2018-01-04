var canvas = document.getElementById("pad");
var ctx = canvas.getContext("2d");

var hoveredAtom = null;
var mpos = { x: 0, y: 0 };
var hover_radius = 25;
var r2 = Math.pow(hover_radius, 2);


function getMousePos(event) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;

    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
    }
}

function setHoveredAtom(atom) {
    hoveredAtom = atom;

    if (atom !== null) {
        $("#pad").css("cursor", "pointer");
    } else {
        $("#pad").css("cursor", "default");
    }
}

var Pad = function() {
    return {
        loaded: false,
        atoms: [],

        addAtom: function(atom) {
            this.atoms.push(atom);

            if (this.loaded) {
                this.drawHoverCircle();
                this.drawAtom(atom);
            }
        },

        drawAtom: function(atom) {
            if (!this.loaded) {
                return;
            }

            ctx.font = "bold 35px Papyrus, sans-Serif";
            ctx.fillStyle = atom.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.fillText(atom.name, atom.x, atom.y);
        },

        drawAtoms: function() {
            for (var i=0; i<this.atoms.length; i++) {
                this.drawAtom(this.atoms[i]);
            }
        },

        getHoveredAtom: function() {
            for (var i=this.atoms.length - 1; i>=0; i--) {
                var atom = this.atoms[i];

                // (x - x0)**2 + (y - y0)**2 <= r**2
                if (Math.pow(atom.x - mpos.x, 2) + Math.pow(atom.y - mpos.y, 2) <= r2) {
                    return atom;
                }
            }

            return null;
        },

        drawHoverCircle: function() {
            if (hoveredAtom !== null) {
                ctx.fillStyle = "#0f0";
                ctx.arc(hoveredAtom.x, hoveredAtom.y, hover_radius, 0, 2 * Math.PI);
                ctx.fill();

                return;
            }
        },

        updateCtx: function() {
            if (!this.loaded) {
                return;
            }

            var rect = canvas.parentNode.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;

            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            this.drawHoverCircle();
            this.drawAtoms();
        }
    }
}


var pad = Pad();

var Connection = function() {
    return {
        start: null,
        end: null,
        electrons: 0,
    }
}

var Atom = function({name="", color="#000", x=0, y=0} = {}) {
    /*var name = "";
    var color = "#000";
    var x = 0;
    var y = 0;*/

    return {
        name: name,
        color: color,
        x: x,
        y: y,
        connections: [],
        selected: false,
    }
}

var resize = function() {
    var rect = document.getElementById("view-wrapper").getBoundingClientRect();   // actual size of canvas el. itself
    canvas.width = rect.width - 40;
    canvas.height = rect.height;

    pad.updateCtx();
}

window.onload = function() {
    pad.loaded = true;
    resize();

    var test = true;
    if (test) {
        testMoleculeCaffeine();
    }
}

canvas.onclick = function(event) {
    if (getSelectedElement() === null) {
        return;
    } else if (hoveredAtom !== null) {
        hoveredAtom.selected = true;
        return;
    }

    for (var i=0; i<pad.atoms.length; i++) {
        pad.atoms[i].selected = false;
    }

    var pos = getMousePos(event);

    var rect = canvas.getBoundingClientRect();
    var atom = Atom({
        name: getSelectedElement(),
        x: pos.x,
        y: pos.y
    });

    setHoveredAtom(atom);
    pad.addAtom(atom);
}

canvas.onmousemove = function(event) {
    mpos = getMousePos(event);
    var atom = pad.getHoveredAtom();

    if (atom !== hoveredAtom) {
        setHoveredAtom(atom);
        pad.updateCtx();
    }
}

$(window).on("resize", resize);
