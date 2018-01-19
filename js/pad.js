var canvas = document.getElementById("pad");
var ctx = canvas.getContext("2d");

var hoveredAtom = null;
var draggingAtom = null;
var bondAtom = null;
var tempBond = null;

var relativeDragPos = { x: null, y: null };
var mpos = { x: null, y: null };
var hover_radius = 25;
var r2 = Math.pow(hover_radius, 2);

var bondLength = 100;


var Tool = {
    MOVE: 0,
    RECTANGULAR_SELECTION: 1,
}

var BondType = {
    SIMPLE: 1,
    DOUBLE: 2,
    TRIPLE: 3,
}

function getMousePos(event) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;

    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
    }
}

function rectIntersect(a, b) {
    return (a.x <= b.x + b.width &&
            b.x <= a.x + a.width &&
            a.y <= b.y + b.height &&
            b.y <= a.y + a.height);
}

function setHoveredAtom(atom) {
    if (getSelectedTool() == null) {
        hoveredAtom = atom;

        if (atom !== null) {
            $("#pad").css("cursor", "pointer");
        } else {
            $("#pad").css("cursor", "default");
        }
    }
}

var Bond = function({begin=null, end=null, type=0} = {}) {
    return {
        begin: begin,
        end: end,
        type: type,

        its_me: function(atom1, atom2) {  // Mario!
            return (this.begin == atom1 && this.end == atom2) ||
                   (this.begin == atom2 && this.end == atom1);
        },

        copy: function() {
            return Bond({
                begin: this.begin,
                end: this.end,
                type: this.type,
            });
        }
    }
}

var Atom = function({name="", color="#000", x=0, y=0, charge=0} = {}) {
    return {
        name: name,
        color: color,
        x: x,
        y: y,
        respX: null,
        respY: null,
        selected: false,
        charge: charge,
    }
}

var Pad = function() {
    return {
        loaded: false,
        atoms: [],
        bonds: [],

        addAtom: function(atom) {
            this.atoms.push(atom);
            this.updateCtx();
        },

        addBond: function(bond) {
            for (var i=0; i<this.bonds.length; i++) {
                if ((this.bonds[i].begin == bond.begin && this.bonds[i].end == bond.end) ||
                    (this.bonds[i].end == bond.begin && this.bonds[i].begin == bond.end)) {

                    this.bonds[i].type = bond.type;
                    this.updateCtx();
                    return;
                }
            }

            this.bonds.push(bond);
            this.updateCtx();
        },

        deleteBond: function(bond) {
            var idx = this.bonds.indexOf(bond);
            if (idx !== - 1) {
                this.bonds.splice(idx, 1);
            }
        },

        deleteAllAtomBonds: function(atom) {
            var bond;
            for (var i=0; i<this.bonds.length; i++) {
                bond = this.bonds[i];
                if (bond.begin == atom || bond.end == atom) {
                    this.deleteBond(bond);
                    this.deleteAllAtomBonds(atom);
                    break;
                }
            }
        },

        deleteAtom: function(atom) {
            if (this.atoms.indexOf(atom) === null) {
                return;
            }

            this.atoms.splice(this.atoms.indexOf(atom), 1);
            this.deleteAllAtomBonds(atom);
        },

        deleteSelectedAtoms: function() {
            for (var i=0; i<this.atoms.length; i++) {
                if (this.atoms[i].selected) {
                    this.deleteAtom(this.atoms[i]);

                    // It's necessary because if I delete an object and I keep the
                    // foreach, it will limited at the first this.atoms.length, and
                    // it will probably skip some atoms, so I stop this foreach
                    // and I start a new one.
                    this.deleteSelectedAtoms();
                    break;
                }
            }

            this.updateCtx();
        },

        selectAll: function() {
            for (var i=0; i<this.atoms.length; i++) {
                this.atoms[i].selected = true;
            }

            this.updateCtx();
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
            if (hoveredAtom !== null && this.atoms.indexOf(hoveredAtom) !== -1) {
                ctx.fillStyle = "#0f0";

                ctx.beginPath();
                ctx.arc(hoveredAtom.x, hoveredAtom.y, hover_radius, 0, 2 * Math.PI);
                ctx.fill();

                return;
            }
        },

        drawAtom: function(atom) {
            if (!this.loaded) {
                return;
            }

            ctx.font = "bold 35px Papyrus, sans-Serif";
            ctx.fillStyle = atom.color;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.fillText(atom.name, atom.x, atom.y);
        },

        drawAtoms: function() {
            for (var i=0; i<this.atoms.length; i++) {
                this.drawAtom(this.atoms[i]);
            }
        },

        drawSelectedCircle: function(atom) {
            ctx.fillStyle = "#4c90dd";
            ctx.beginPath();
            ctx.arc(atom.x, atom.y, hover_radius, 0, 2 * Math.PI);
            ctx.fill();
        },

        drawBond: function(bond) {
            ctx.strokeStyle = "#f00";
            ctx.lineWidth = "5";

            var simpleBond = function() {
                ctx.beginPath();
                ctx.moveTo(bond.begin.x, bond.begin.y);
                ctx.lineTo(bond.end.x, bond.end.y);
                ctx.stroke();
            }

            var doubleBond = function(sep) {
                if (sep === undefined) {
                    sep = 5;
                }

                // The line that contains both atoms:
                var line1 = Line(
                    { x: bond.begin.x, y: bond.begin.y },
                    { x: bond.end.x, y: bond.end.y }
                );

                // Perpendicular to line1 from the second atom:
                var line2 = line1.getPerpendicularAt({x: bond.begin.x, y: bond.begin.y});

                // Perpendicular to line1 from the second atom:
                var line3 = line1.getPerpendicularAt({x: bond.end.x, y: bond.end.y});

                var ps1 = line2.getPointsByDistance({x: bond.begin.x, y: bond.begin.y}, sep);
                var ps2 = line3.getPointsByDistance({x: bond.end.x, y: bond.end.y}, sep);

                ctx.beginPath();
                ctx.moveTo(ps1[0].x, ps1[0].y);
                ctx.lineTo(ps2[0].x, ps2[0].y);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(ps1[1].x, ps1[1].y);
                ctx.lineTo(ps2[1].x, ps2[1].y);
                ctx.stroke();
            }

            if (bond.type === BondType.SIMPLE) {
                simpleBond();
            } else if (bond.type === BondType.DOUBLE) {
                doubleBond();
            } else if (bond.type == BondType.TRIPLE) {
                simpleBond();
                doubleBond(10);
            }
        },

        drawBonds: function() {
            if (bondAtom !== null) {
                var lines = get60DegreesLines(bondAtom);
                var ps;
                var p;
                var d = 1000;
                var d1, d2;

                for (var i=0; i<lines.length; i++) {
                    ps = lines[i].getPointsByDistance(bondAtom, bondLength);
                    d1 = distance2Points(mpos, ps[0]);
                    d2 = distance2Points(mpos, ps[1]);
                    d = Math.min(d1, d2, d);

                    if (d == d1) {
                        p = ps[0];
                    } else if (d == d2) {
                        p = ps[1];
                    }
                }

                tempBond = Bond({
                    begin: bondAtom,
                    end: Atom({name: "C", x: p.x, y: p.y}),
                    type: getSelectedBond(),
                });

                this.drawBond(tempBond);
            }

            for (var i=0; i < this.bonds.length; i++) {
                this.drawBond(this.bonds[i]);
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

            for (var i=0; i<this.atoms.length; i++) {
                if (this.atoms[i].selected) {
                    this.drawSelectedCircle(this.atoms[i]);
                }
            }

            this.drawAtoms();
            this.drawBonds();

            if (getSelectedTool() == Tool.RECTANGULAR_SELECTION && relativeDragPos.x !== null) {
                ctx.fillStyle = "#4c90dd2d";
                ctx.strokeStyle = "#4c90ddbb";
                ctx.lineWidth = "2";
                var w = relativeDragPos.x - mpos.x;
                var h = relativeDragPos.y - mpos.y;

                ctx.beginPath();
                var x1 = mpos.x;
                var y1 = mpos.y;
                ctx.rect(mpos.x, mpos.y, w, h);
                ctx.fill();
                ctx.stroke();
            }
        },

        clear: function() {
            this.atoms = [];
            this.bonds = [];
        },

        center: function() {
            var minX, minY, maxX, maxY;

            for (var i=0; i<this.atoms.length; i++) {
                if (i > 0) {
                    minX = Math.min(minX, this.atoms[i].x);
                    minY = Math.min(minY, this.atoms[i].y);
                    maxX = Math.max(maxX, this.atoms[i].x);
                    maxY = Math.max(maxY, this.atoms[i].y);
                } else if (i == 0) {
                    minX = this.atoms[i].x;
                    minY = this.atoms[i].y;
                    maxX = this.atoms[i].x;
                    maxY = this.atoms[i].y;
                }
            }

            var a = (maxX - minX);
            var b = (maxY - minY);

            for (var i=0; i<this.atoms.length; i++) {
                this.atoms[i].x += (canvas.width - a) / 2 - minX;
                this.atoms[i].y += (canvas.height - b) / 2 - minY;
            }

            this.updateCtx();
        },

        makeKMolecule() {
            var mol = new Kekule.Molecule();
            var atoms = [];
            var katoms = [];

            var factor = 1.5;

            for (var i=0; i<this.bonds.length; i++) {
                // FIXME: Only works when there is a bond

                var bond = this.bonds[i];
                var atom1, atom2;
                if (atoms.indexOf(bond.begin) === -1) {
                    atom1 = mol.appendAtom(bond.begin.name);
                    atom1.set2DX(canvas.width / 2 - bond.begin.x / bondLength * factor);
                    atom1.set2DY(canvas.height / 2 - bond.begin.y / bondLength * factor);
                    atoms.push(bond.begin);
                    katoms.push(atom1)
                } else {
                    atom1 = katoms[atoms.indexOf(bond.begin)];
                }

                if (atoms.indexOf(bond.end) === -1) {
                    atom2 = mol.appendAtom(bond.end.name);
                    atom2.set2DX(canvas.width / 2 - bond.end.x / bondLength * factor);
                    atom2.set2DY(canvas.height / 2 - bond.end.y / bondLength * factor);
                    atoms.push(bond.end);
                    katoms.push(atom2);
                } else {
                    atom2 = katoms[atoms.indexOf(bond.end)];
                }

                mol.appendBond([atom1, atom2], bond.type);
            }

            mol.setName("Unnamed");
            return mol;
        },

        getSMILES: function() {
            var kmol = this.makeKMolecule();
            return Kekule.IO.saveFormatData(kmol, "smi");
        },

        generateMOL: function() {
            var mol = this.makeKMolecule();

            calculator = Kekule.Calculator.generate3D(mol, {"forceField": ""},
            function(generatedMol) {
                area.value = generatedMol.__$srcInfo.data;
                glmol.loadMolecule();
            },

            function(err) {
                if (err) {
                    //Kekule.error(err);
                    console.log(err);
                }
            },

            function(msgData) {
                if (msgData.type === "print" || msgData.type === "printErr") {
                    msgs.push("[" + (new Date()).toLocaleTimeString() + "][" + msgData.type + "]" + msgData.data);
                    return msgs.join('\n');
                }
            });
        },

        loadMOL: function(mol) {
            // TODO
        }
    }
}


var pad = Pad();

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
    if (getSelectedTool() == Tool.MOVE) {
        // Relative to (0; 0)
        relativeDragPos = { x: mpos.x, y: mpos.y };

        for (var i=0; i<pad.atoms.length; i++) {
            pad.atoms[i].respX = pad.atoms[i].x;
            pad.atoms[i].respY = pad.atoms[i].y;
        }
    } else if (getSelectedTool() == Tool.RECTANGULAR_SELECTION) {
        relativeDragPos = { x: mpos.x, y: mpos.y };
    } else if (hoveredAtom !== null) {
        if (getSelectedBond() === null) {
            hoveredAtom.respX = hoveredAtom.x;
            hoveredAtom.respY = hoveredAtom.y;
            mpos = getMousePos(event);

            // Relative to atom coords
            relativeDragPos = { x: mpos.x - hoveredAtom.x, y: mpos.y - hoveredAtom.y };

            for (var i=0; i<pad.atoms.length; i++) {
                pad.atoms[i].selected = pad.atoms[i] == hoveredAtom;
            }
            draggingAtom = hoveredAtom;
            pad.updateCtx();
        } else {
            bondAtom = hoveredAtom;
        }
    }
}

canvas.onmouseup = function(event) {
    relativeDragPos = { x: null, y: null };

    if (getSelectedTool() == Tool.MOVE) {
        for (var i=0; i<pad.atoms.length; i++) {
            pad.atoms[i].respX = null;
            pad.atoms[i].respY = null;
        }
    } else if (getSelectedTool() == Tool.RECTANGULAR_SELECTION) {
        pad.updateCtx();
    }

    if (bondAtom !== null) {
        if (hoveredAtom !== null) {
            var createBond = true;
            var type = getSelectedBond();  // FIXME

            for (var i=0; i < pad.bonds.length; i++) {
                if (pad.bonds[i].its_me(bondAtom, hoveredAtom)) {
                    createBond = false;
                    pad.bonds[i].type = type;
                    break;
                }
            }

            if (createBond) {
                var bond = Bond({
                    begin: bondAtom,
                    end: hoveredAtom,
                    type: type,
                });

                pad.addBond(bond);
            }
        } else {
            var _b = tempBond.copy();
            var addEnd = true;

            var margin = 5;
            var rect1 = { x: _b.end.x - margin / 2, y: _b.end.y - margin / 2, width: margin, height: margin };
            var rect2;

            for (var i=0; i<pad.atoms.length; i++) {
                var atom = pad.atoms[i];
                rect2 = { x: atom.x - margin / 2, y: atom.y - margin / 2, width: margin, height: margin };
                if (rectIntersect(rect1, rect2)) {
                    _b.end = atom;
                    addEnd = false;
                }
            }

            if (getSelectedElement() !== null) {
                _b.end.name = getSelectedElement();
            } else {
                _b.end.name = "C";
            }

            pad.addBond(_b);

            if (addEnd) {
                pad.addAtom(_b.end);
            }

            tempBond = null;
        }

        bondAtom = null;
        pad.updateCtx();
        return;
    } else if (draggingAtom !== null) {
        if (getSelectedElement() !== null) {
            if (hoveredAtom.respX == hoveredAtom.x && hoveredAtom.respY == hoveredAtom.y) {
                draggingAtom.name = getSelectedElement();
                pad.updateCtx();
            }
        }

        hoveredAtom.respX = null;
        hoveredAtom.respY = null;
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
    } else if (relativeDragPos.x !== null && getSelectedTool() !== null) {
        if (getSelectedTool() == Tool.MOVE) {
            for (var i=0; i<pad.atoms.length; i++) {
                pad.atoms[i].x = (mpos.x - relativeDragPos.x) + pad.atoms[i].respX;
                pad.atoms[i].y = (mpos.y - relativeDragPos.y) + pad.atoms[i].respY;
            }
            pad.updateCtx();
        } else if (getSelectedTool() == Tool.RECTANGULAR_SELECTION) {
            for (var i=0; i<pad.atoms.length; i++) {
                var atom = pad.atoms[i];
                var margin = 20;

                var rect = { x: null, y: null, width: null, height: null }
                if (mpos.x <= relativeDragPos.x) {
                    rect.x = mpos.x;
                    rect.width = relativeDragPos.x - mpos.x;
                } else {
                    rect.x = relativeDragPos.x;
                    rect.width = mpos.x - relativeDragPos.x;
                }

                if (mpos.y <= relativeDragPos.y) {
                    rect.y = mpos.y;
                    rect.height = relativeDragPos.y - mpos.y;
                } else {
                    rect.y = relativeDragPos.y;
                    rect.height = mpos.y - relativeDragPos.y;
                }

                atom.selected = rectIntersect({
                    x: atom.x - margin,
                    y: atom.y - margin,
                    width: margin * 2,
                    height: margin * 2,
                }, rect);
            }
            pad.updateCtx();
        }
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

$(window).on("keyup", function(event) {
    if (event.originalEvent.key == "Delete") {
        pad.deleteSelectedAtoms();
    } else if (event.originalEvent.key == "1") {
        setSelectedBond(1);
    } else if (event.originalEvent.key == "2") {
        setSelectedBond(2);
    } else if (event.originalEvent.key == "3") {
        setSelectedBond(3);
    } else if (event.originalEvent.key == "a" && event.ctrlKey) {
        pad.selectAll();
    }
});
