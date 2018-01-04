var glmol = new GLmol("glmol");
var area = document.getElementById("glmol_src");
var selectedElement = null;

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


var test = function() {
    var demo = $("#test").val();

    if (demo == "caffeine") {
        testMoleculeCaffeine();
    } else if (demo == "fluoranteno") {
        testMoleculeFluoranteno();
    } else if (demo == "hemoglobin") {
        testMoleculeHemoglobin();
    }
}

if (true) {
    $("#button-check").on("click", test);
}

$(".vtoolbar > .toolbutton").not(".not-selectable").on("click", function() {
    $(".vtoolbar > .toolbutton").removeClass("vtoolbutton-selected");
    $(this).addClass("vtoolbutton-selected");
    selectedElement = $(this).text();
});

$("#toolbar-pad > .toolbutton").not(".not-selectable").on("click", function() {
    $("#toolbar-pad > .toolbutton").removeClass("htoolbutton-selected");
    $(this).addClass("htoolbutton-selected");
});

var getSelectedElement = function() {
    return selectedElement;
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
        console.log(this);
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
