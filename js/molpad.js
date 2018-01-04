var molpad = document.getElementById("molpad");
var ctx = molpad.getContext("2d");

ctx.font = "30px Arial";


var Pad = function() {
    return {
        loaded: false,

        atoms: [],

        addAtom: function(atom) {
            this.atoms.push(atom);

            if (this.loaded) {
                this.drawAtom(atom);
            }
        },

        drawAtom: function(atom) {
            if (!this.loaded) {
                return;
            }

            console.log("DRAWATOM", atom.name, atom.x, atom.y);
            if (atom.name != null) {
                ctx.fillText(atom.name, atom.x, atom.y);
            }
        },

        drawAtoms: function() {
            for (var i=0; i<this.atoms.length; i++) {
                this.drawAtom(this.atoms[i]);
            }
        },

        updateCtx: function() {
            if (!this.loaded) {
                return;
            }

            ctx.fillStyle = "#FFF";
            ctx.fillRect(0, 0, molpad.width, molpad.height);

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

var Atom = function() {
    return {
        name: null,
        color: null,
        x: 0,
        y: 0,
        connections: [],
    }
}


window.onload = function() {
    pad.loaded = true;

    var atom = Atom();
    atom.name = "H";
    atom.color = "#0F0";
    atom.x = 40;
    atom.y = 40;
    pad.addAtom(atom)
}


$("")