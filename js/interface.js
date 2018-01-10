var glmol = new GLmol("glmol");
var area = document.getElementById("glmol_src");
var selectedElement = null;
var selectedTool = null;
var selectedBond = null;

var showMainchain = true;
var showNonBonded = false;
var doNotSmoothen = false;
var line = false;
var showBases = true;
var showHetatms = true;
var cell = false;
var biomt = false;
var packing = false;
var bgcolor = 0;

var keepBoundButton = false;
var onBondsToolbar = false;
var bondsTimeout = null;


$("#button-check").on("click", function() {
    area.value = pad.getMOL();
    glmol.loadMolecule();
});

var unselectButton = function() {
    $(".toolbutton").removeClass("toolbutton-selected");
}

$(".toolbutton.unselectable").not(".not-selectable").on("click", function() {
    var selected = $(this).hasClass("toolbutton-selected");
    var id = $(this).get()[0].id;
    var parentId = $(this).parent().attr("id");

    if ((id == "button-bonds" && !keepBoundButton) ||
         id != "button-bonds") {
        unselectButton();
    }

    selectedElement = null;
    selectedBond = null;
    selectedTool = null;

    $("#pad").css("cursor", "default");

    if (!selected) {
        // now it's selected
        $(this).addClass("toolbutton-selected");

        if (parentId == "toolbar-pad") {
            if ($(this).hasClass("tool")) {
                var id = $(this).attr("id");
                if (id.includes("move")) {
                    selectedTool = Tool.MOVE;
                    $("#pad").css("cursor", "move");

                } else if (id.includes("selection-rectangle")) {
                    selectedTool = Tool.RECTANGULAR_SELECTION;
                }
            }
        } else if (parentId == "toolbar-elements") {
            if (id == "button-bonds") {
                // FIXME: I probably will use icons in the future, so it will no work anymore:
                selectedBond = $(this).text().length;
                selectedTool = null;
            }
        }
    }

    keepBoundButton = false;
});

$(".toolbutton").not(".not-selectable").on("click", function() {
    var parentId = $(this).parent().attr("id");

    if ($(this).hasClass("unselectable")) {
        return;
    }

    selectedTool = null;
    selectedBond = null;

    unselectButton();
    $(this).addClass("toolbutton-selected");

    if (parentId == "toolbar-elements") {
        if ($(this).hasClass("atom")) {
            selectedElement = $(this).text();
        }
    }
});

$("#button-upload").on("click", function() {
    $("#upload-file").trigger("click");
});

$("#upload-file").change(function(event) {
    var file = event.target.files[0];

    if (file === undefined) {
        return;
    }

    var reader = new FileReader();

    reader.onload = (function(_file) {
        return function(e) {
            var base64 = e.target.result;
            area.value = atob(base64.split("base64,")[1]);

            glmol.loadMolecule();
            glmol.show();
        }
    })(file);

    reader.readAsDataURL(file);
});

var hideBondsToolbar = function(force) {
    if (!onBondsToolbar || force) {
        onBondsToolbar = false;
        $("#toolbar-bonds").css("display", "none");
        $("#button-bonds").removeClass("thover");
    }
}

var hideBondsToolbarTimeout = function() {
    if (bondsTimeout !== null) {
        clearTimeout(bondsTimeout);
    }

    bondstimeout = setTimeout(hideBondsToolbar(), 200);
}

$("#button-bonds, #toolbar-bonds").on("mouseenter", function() {
    onBondsToolbar = true;
    $("#toolbar-bonds").css("display", "block");
    $("#button-bonds").addClass("thover");
});

$("#button-bonds, #toolbar-bonds").on("mouseleave", function() {
    onBondsToolbar = false;
    hideBondsToolbarTimeout();
});

$("#toolbar-bonds > .toolbutton").on("click", function() {
    keepBoundButton = true;
    $("#button-bonds").text($(this).text());
    $("#button-bonds").trigger("click");
    hideBondsToolbar(true);
});

var getSelectedElement = function() {
    return selectedElement;
}

var getSelectedTool = function() {
    return selectedTool;
}

var getSelectedBond = function() {
    return selectedBond;
}

var setSelectedBond = function(bondType) {
    selectedBond = bondType;

    if (selectedBond == 1 && !$("#button-simple-bond").hasClass("toolbutton-selected")) {
        $("#button-simple-bond").trigger("click");
    } else if (selectedBond == 2 && !$("#button-double-bond").hasClass("toolbutton-selected")) {
        $("#button-double-bond").trigger("click");
    } else if (selectedBond == 3 && !$("#button-triple-bond").hasClass("toolbutton-selected")) {
        $("#button-triple-bond").trigger("click");
    }
}

function defineRepFromController() {
    var all = this.getAllAtoms();
    if (biomt && this.protein.biomtChains != "") {
        all = this.getChain(all, this.protein.biomtChains);
    }

    var allHet = this.getHetatms(all);
    var hetatm = this.removeSolvents(allHet);

    this.colorByAtom(all, {});

    var colorMode = $("#color").val();
    if (colorMode == "ss") {
        this.colorByStructure(all, 0xcc00cc, 0x00cccc);
    } else if (colorMode == "chain") {
        this.colorByChain(all);
    } else if (colorMode == "chainbow") {
        this.colorChainbow(all);
    } else if (colorMode == "b") {
        this.colorByBFactor(all);
    } else if (colorMode == "polarity") {
        this.colorByPolarity(all, 0xcc0000, 0xcccccc);
    }

    var asu = new THREE.Object3D();
    var mainchainMode = $("#main-chain-mode").val();
    if (showMainchain) {
        if (mainchainMode == "ribbon") {
            this.drawCartoon(asu, all, doNotSmoothen);
            this.drawCartoonNucleicAcid(asu, all);
        } else if (mainchainMode == "thickRibbon") {
            this.drawCartoon(asu, all, doNotSmoothen, this.thickness);
            this.drawCartoonNucleicAcid(asu, all, null, this.thickness);
        } else if (mainchainMode == "strand") {
            this.drawStrand(asu, all, null, null, null, null, null, doNotSmoothen);
            this.drawStrandNucleicAcid(asu, all);
        } else if (mainchainMode == "chain") {
            this.drawMainchainCurve(asu, all, this.curveWidth, "CA", 1);
            this.drawMainchainCurve(asu, all, this.curveWidth, "O3\'", 1);
        } else if (mainchainMode == "cylinderHelix") {
            this.drawHelixAsCylinder(asu, all, 1.6);
            this.drawCartoonNucleicAcid(asu, all);
        } else if (mainchainMode == "tube") {
            this.drawMainchainTube(asu, all, "CA");
            this.drawMainchainTube(asu, all, "O3\'");  // FIXME: 5' end problem!
        } else if (mainchainMode == "bonds") {
            this.drawBondsAsLine(asu, all, this.lineWidth);
        }
    }

    if (line) {
        this.drawBondsAsLine(this.modelGroup, this.getSidechains(all), this.lineWidth);
    }

    //var hetatmMode1 = $("#base").val();
    var hetatmMode1 = $("nuclStick");
    if (showBases) {
        if (hetatmMode1 == "nuclStick") {
            this.drawNucleicAcidStick(this.modelGroup, all);
        } else if (hetatmMode1 == "nuclLine") {
            this.drawNucleicAcidLine(this.modelGroup, all);
        } else if (hetatmMode1 == "nuclPolygon") {
            this.drawNucleicAcidLadder(this.modelGroup, all);
        }
    }

    var target = this.modelGroup;
    var nbMode = $("nbMode").val();
    var nonBonded = this.getNonbonded(allHet);
    if (nbMode == "nb_sphere") {
        this.drawAtomsAsIcosahedron(target, nonBonded, 0.3, true);
    } else if (nbMode == "nb_cross") {
        this.drawAsCross(target, nonBonded, 0.3, true);
    }

    var hetatmMode2 = $("#hetatm").val();
    if (showHetatms) {
        if (hetatmMode2 == "stick") {
            this.drawBondsAsStick(target, hetatm, this.cylinderRadius, this.cylinderRadius, true);
        } else if (hetatmMode2 == "sphere") {
            this.drawAtomsAsSphere(target, hetatm, this.sphereRadius);
        } else if (hetatmMode2 == "line") {
            this.drawBondsAsLine(target, hetatm, this.curveWidth);
        } else if (hetatmMode2 == "icosahedron") {
            this.drawAtomsAsIcosahedron(target, hetatm, this.sphereRadius);
        } else if (hetatmMode2 == "ballAndStick") {
            this.drawBondsAsStick(target, hetatm, this.cylinderRadius / 2.0, this.cylinderRadius, true, false, 0.3);
        } else if (hetatmMode2 == "ballAndStick2") {
            this.drawBondsAsStick(target, hetatm, this.cylinderRadius / 2.0, this.cylinderRadius, true, true, 0.3);
        }
    }

    /*
    if (projectionMode == "perspective") {
        this.camera = this.perspectiveCamera;
    } else if (projectionMode == "orthoscopic") {
        this.camera = this.orthoscopicCamera;
    }
    */

    this.setBackground(bgcolor);

    /*
    if (cell) {
        this.drawUnitcell(this.modelGroup);
    }

    if (biomt) {
        this.drawSymmetryMates2(this.modelGroup, asu, this.protein.biomtMatrices);
    }

    if (packing) {
        this.drawSymmetryMatesWithTranslation2(this.modelGroup, asu, this.protein.symMat);
    }
    */

    this.modelGroup.add(asu);
};

glmol.defineRepresentation = defineRepFromController;


reloadMolecule = function() {
    glmol.defineRepresentation = defineRepFromController;
    glmol.rebuildScene();
    glmol.show();
}

$("#toolbar-3d > select").on("change", reloadMolecule);

$("#test").on("change", function() {
    var demo = $(this).val();

    if (demo == "caffeine") {
        testMoleculeCaffeine();
    } else if (demo == "fluoranteno") {
        testMoleculeFluoranteno();
    } else if (demo == "hemoglobin") {
        testMoleculeHemoglobin();
    }
});
