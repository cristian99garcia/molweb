var canvas = document.getElementById("pad");
var ctx = canvas.getContext("2d");

var hoveredAtom = null;
var draggingAtom = null;
var bondAtom = null;

var relativeDragPos = { x: 0, y: 0 };
var mpos = { x: null, y: null };
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

                ctx.beginPath();
                ctx.arc(hoveredAtom.x, hoveredAtom.y, hover_radius, 0, 2 * Math.PI);
                ctx.fill();

                return;
            }
        },

        drawBond: function(pos1, pos2) {
            ctx.strokeStyle = "#f00";
            ctx.lineWidth = "5";

            //console.log("from", pos1.x, pos1.y, "to", pos2.x, pos2.y);
            ctx.beginPath();
            ctx.moveTo(pos1.x, pos1.y);
            ctx.lineTo(pos2.x, pos2.y);
            ctx.stroke();
        },

        drawBonds: function() {
            if (bondAtom !== null) {
                this.drawBond(mpos, {
                    x: bondAtom.x,
                    y: bondAtom.y,
                });
            }

            var bonds = [];
            var bond = null;
            for (var i=0; i < this.atoms.length; i++) {
                for (var j=0; j < this.atoms[i].bonds.length; j++) {
                    bond = this.atoms[i].bonds[j];
                    if (bonds.indexOf(bond) === -1) {
                        this.drawBond(
                            { x: bond.start.x, y: bond.start.y },
                            { x: bond.end.x, y: bond.end.y }
                        );

                        bonds.push(bond);
                    }
                }
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
            this.drawBonds();
        }
    }
}


var pad = Pad();

var Bond = function() {
    return {
        start: null,
        end: null,
        electrons: 0,

        its_me: function(atom1, atom2) {  // Mario!
            return (this.start == atom1 && this.end == atom2) ||
                   (this.start == atom2 && this.end == atom1);
        }
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
        bonds: [],
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

canvas.onmousedown = function(event) {
    if (hoveredAtom === null) {
        return;
    }

    if (getSelectedTool() === null) {
        relativeDragPos = { x: mpos.x - hoveredAtom.x, y: mpos.y - hoveredAtom.y };
        hoveredAtom.selected = true;
        draggingAtom = hoveredAtom;
    } else {
        bondAtom = hoveredAtom;
    }
}

canvas.onmouseup = function(event) {
    relativeDragPos = { x: null, y: null };

     if (bondAtom !== null) {
        if (hoveredAtom !== null) {
            var createBond = true;

            for (var i=0; i < bondAtom.bonds.length; i++) {
                var _bond = bondAtom.bonds[i];
                if (_bond.its_me(bondAtom, hoveredAtom)) {  // Mario!
                    createBond = false;
                    break;
                }
            }

            if (createBond) {
                var bond = Bond();
                bond.start = bondAtom;
                bond.end = hoveredAtom;
                bond.electrons = 1;

                bondAtom.bonds.push(bond);
                hoveredAtom.bonds.push(bond);
            }
        }

        bondAtom = null;
        pad.updateCtx();
        return;
    } else if (draggingAtom !== null) {
        draggingAtom = null;
        return;
    } else if (getSelectedElement() === null) {
        return;
    } else if (hoveredAtom !== null) {
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
    if (draggingAtom !== null) {
        draggingAtom.x = mpos.x - relativeDragPos.x;
        draggingAtom.y = mpos.y - relativeDragPos.y;

        pad.updateCtx();
    } else {
        var atom = pad.getHoveredAtom();

        if (atom !== hoveredAtom) {
            setHoveredAtom(atom);
            pad.updateCtx();
        } else if (bondAtom !== null) {
            pad.updateCtx();
        }
    }
}

$(window).on("resize", resize);
