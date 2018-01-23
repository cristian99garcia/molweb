var canvas = document.getElementById("pad");
var ctx = canvas.getContext("2d");

var hoveredAtom = null;
var draggingAtom = null;
var bondAtom = null;
var tempBond = null;
var shift = false;

var relativeDragPos = { x: null, y: null };
var mpos = { x: null, y: null };
var hoverRadius = 25;
var r2 = Math.pow(hoverRadius, 2);

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

function getElementColor(name) {
    var colors = {
        "h": "#4C4C4C",
        "c": "#000000",
        "o": "#CC0000",
        "n": "#0000CC",
        "s": "#CCCC00",
        "p": "#6622CC",
        "f": "#00CC00",
        "cl": "#00CC00",
        "br": "#882200",
        "i": "#6600AA",
        "fe": "#CC6600",
        "ca": "#8888AA"
    };

    if (name == null) {
        return colors["c"];
    }

    return colors[name.toLowerCase()] || colors["c"];
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
    if (name !== "C" && (color === "#000" || color === "#000000")) {
        color = getElementColor(name);
    }

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

        addAtom: function(atom, update) {
            this.atoms.push(atom);

            if (update === undefined || update) {
                this.updateCtx();
            }
        },

        addBond: function(bond, update) {
            for (var i=0; i<this.bonds.length; i++) {
                if ((this.bonds[i].begin == bond.begin && this.bonds[i].end == bond.end) ||
                    (this.bonds[i].end == bond.begin && this.bonds[i].begin == bond.end)) {

                    this.bonds[i].type = bond.type;

                    if (update === undefined || update) {
                        this.updateCtx();
                    }

                    return;
                }
            }

            this.bonds.push(bond);

            if (update === undefined || update) {
                this.updateCtx();
            }
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
                ctx.arc(hoveredAtom.x, hoveredAtom.y, hoverRadius, 0, 2 * Math.PI);
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
            ctx.arc(atom.x, atom.y, hoverRadius, 0, 2 * Math.PI);
            ctx.fill();
        },

        drawBond: function(bond) {
            var _p1 = {x: bond.begin.x, y: bond.begin.y}
            var _p2 = {x: bond.end.x, y: bond.end.y};

            var line = Line(_p1, _p2);
            var p1 = line.getOnePointByDistance(_p1, _p2, hoverRadius + 5);
            var p2 = line.getOnePointByDistance(_p2, _p1, hoverRadius + 5);

            var gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);

            gradient.addColorStop(0.40, bond.begin.color);
            gradient.addColorStop(0.60, bond.end.color);

            ctx.strokeStyle = gradient;
            ctx.lineWidth = "5";
            ctx.lineCap = "round";

            var simpleBond = function() {
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
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
                var line2 = line1.getPerpendicularAt(_p1);

                // Perpendicular to line1 from the second atom:
                var line3 = line1.getPerpendicularAt(_p2);

                var ps1 = line2.getPointsByDistance(_p1, sep);
                var ps2 = line3.getPointsByDistance(_p2, sep);

                var line4 = Line(ps1[0], ps2[0]);
                var line5 = Line(ps1[1], ps2[1]);

                var s = line4.getOnePointByDistance(ps1[0], ps2[0], hoverRadius + 5);
                var e = line4.getOnePointByDistance(ps2[0], ps1[0], hoverRadius + 5);

                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(e.x, e.y);
                ctx.stroke();

                s = line5.getOnePointByDistance(ps1[1], ps2[1], hoverRadius + 5);
                e = line5.getOnePointByDistance(ps2[1], ps1[1], hoverRadius + 5);

                ctx.beginPath();
                ctx.moveTo(s.x, s.y);
                ctx.lineTo(e.x, e.y);
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
                var p;

                if (shift) {
                    var points = getHelpPoints(bondAtom);
                    var dist = 1000;
                    var _dist;

                    for (var i=0; i<points.length; i++) {
                        _dist = distance2Points(mpos, points[i]);
                        dist = Math.min(_dist, dist);

                        if (_dist == dist) {
                            p = points[i];
                        }
                    }
                } else {
                    p = mpos;
                }

                tempBond = Bond({
                    begin: bondAtom,
                    end: Atom({name: getSelectedElement(), x: p.x, y: p.y}),
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

            // var factor = 1.5;

            for (var i=0; i<this.bonds.length; i++) {
                // FIXME: Only works when there is a bond

                var bond = this.bonds[i];
                var atom1, atom2;
                if (atoms.indexOf(bond.begin) === -1) {
                    atom1 = mol.appendAtom(bond.begin.name);
                    // atom1.set2DX(canvas.width / 2 - bond.begin.x / bondLength * factor);
                    // atom1.set2DY(canvas.height / 2 - bond.begin.y / bondLength * factor);
                    atoms.push(bond.begin);
                    katoms.push(atom1)
                } else {
                    atom1 = katoms[atoms.indexOf(bond.begin)];
                }

                if (atoms.indexOf(bond.end) === -1) {
                    atom2 = mol.appendAtom(bond.end.name);
                    // atom2.set2DX(canvas.width / 2 - bond.end.x / bondLength * factor);
                    // atom2.set2DY(canvas.height / 2 - bond.end.y / bondLength * factor);
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
                glmol.loadMolecule(true);
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

            _b.end.color = getElementColor(_b.end.name);
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
                draggingAtom.color = getElementColor(draggingAtom.name);
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

var elementKeys = {
    "a": "Al",
    "b": "Br",
    "c": "C",
    // "d": "Db",
    // "e": null,
    "f": "F",
    "g": "Ga",
    "h": "H",
    "i": "I",
    // "j": null,
    "k": "K",
    "l": "Cl",
    "m": "Mg",
    "n": "N",
    "o": "O",
    "p": "P",
    "r": "Rb",
    "s": "S",
    "t": "Ti",
    "u": "U",
    "v": "V",
    "w": "W",
    // "x": null
    "y": "Y",
    "z": "Zn",
}

$(window).on("keyup", function(event) {
    if (event.key === "Delete") {
        pad.deleteSelectedAtoms();
    } else if (event.key === "1") {
        setSelectedBond(1);
    } else if (event.key === "2") {
        setSelectedBond(2);
    } else if (event.key === "3") {
        setSelectedBond(3);
    } else if (event.key === "a" && event.ctrlKey) {
        pad.selectAll();
    } else if (event.key === "Enter") {
        pad.generateMOL();
    } else if (elementKeys[event.key] !== undefined) {
        var objects = $("#toolbar-elements > div:contains(" + elementKeys[event.key] + ")");
        objects.each(function (index) {
            if ($(this).text !== undefined && $(this).text() === elementKeys[event.key]) {
                $(this).trigger("click");
                return false;
            }
        });
    } else if (event.key === "Shift") {
        shift = false;
    }
});

$(window).on("keydown", function(event) {
    if (event.key === "Shift") {
        shift = true;
        if (bondAtom === null) {
            pad.updateCtx();
        }
    }
});