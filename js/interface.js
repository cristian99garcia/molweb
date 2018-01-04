var glmol = new GLmol("glmol01");
var area = document.getElementById("glmol01_src");
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

var colorMode = [
    "chain",
    "chainbow",
][1];

var mainchainMode = [
    "ribbon",
    "thickRibbon",
    "strand",
    "chain",
    "cylinderHelix",
    "tube",
    "bonds",
][1];

var hetatmMode1 = [
    "nuclStick",
    "nuclLine",
    "nuclPolygon",
][1];

var hetatmMode2 = [
    "stick",
    "sphere",
    "line",
    "icosahedron",
    "ballAndStick",
    "ballAndStick2",
][5];

var nbMode = [
    "nb_sphere",
    "nb_cross",
][0];

var projectionMode = [
    "perspective",
    "orthoscopic",
][0];

$(".vtoolbar > .toolbutton").not(".no-selectable").on("click", function() {
    $(".vtoolbar > .toolbutton").removeClass("vtoolbutton-selected");
    $(this).addClass("vtoolbutton-selected");
    selectedElement = $(this).text();
    pad.updateCtx();
});

$("#toolbar-pad > .toolbutton").not(".no-selectable").on("click", function() {
    $("#toolbar-pad > .toolbutton").removeClass("htoolbutton-selected");
    $(this).addClass("htoolbutton-selected");

    pad.updateCtx();
});

var getSelectedElement = function() {
    return selectedElement;
}

$("#button-check").on("click", function() {
    // TODO: generate mol file form user creation.
    // Caffeine molecule:
    area.value = "2519\n\
  -OEChem-01011811373D\n\
\n\
 24 25  0     0  0  0  0  0  0999 V2000\n\
    0.4700    2.5688    0.0006 O   0  0  0  0  0  0  0  0  0  0  0  0\n\
   -3.1271   -0.4436   -0.0003 O   0  0  0  0  0  0  0  0  0  0  0  0\n\
   -0.9686   -1.3125    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0\n\
    2.2182    0.1412   -0.0003 N   0  0  0  0  0  0  0  0  0  0  0  0\n\
   -1.3477    1.0797   -0.0001 N   0  0  0  0  0  0  0  0  0  0  0  0\n\
    1.4119   -1.9372    0.0002 N   0  0  0  0  0  0  0  0  0  0  0  0\n\
    0.8579    0.2592   -0.0008 C   0  0  0  0  0  0  0  0  0  0  0  0\n\
    0.3897   -1.0264   -0.0004 C   0  0  0  0  0  0  0  0  0  0  0  0\n\
    0.0307    1.4220   -0.0006 C   0  0  0  0  0  0  0  0  0  0  0  0\n\
   -1.9061   -0.2495   -0.0004 C   0  0  0  0  0  0  0  0  0  0  0  0\n\
    2.5032   -1.1998    0.0003 C   0  0  0  0  0  0  0  0  0  0  0  0\n\
   -1.4276   -2.6960    0.0008 C   0  0  0  0  0  0  0  0  0  0  0  0\n\
    3.1926    1.2061    0.0003 C   0  0  0  0  0  0  0  0  0  0  0  0\n\
   -2.2969    2.1881    0.0007 C   0  0  0  0  0  0  0  0  0  0  0  0\n\
    3.5163   -1.5787    0.0008 H   0  0  0  0  0  0  0  0  0  0  0  0\n\
   -1.0451   -3.1973   -0.8937 H   0  0  0  0  0  0  0  0  0  0  0  0\n\
   -2.5186   -2.7596    0.0011 H   0  0  0  0  0  0  0  0  0  0  0  0\n\
   -1.0447   -3.1963    0.8957 H   0  0  0  0  0  0  0  0  0  0  0  0\n\
    4.1992    0.7801    0.0002 H   0  0  0  0  0  0  0  0  0  0  0  0\n\
    3.0468    1.8092   -0.8992 H   0  0  0  0  0  0  0  0  0  0  0  0\n\
    3.0466    1.8083    0.9004 H   0  0  0  0  0  0  0  0  0  0  0  0\n\
   -1.8087    3.1651   -0.0003 H   0  0  0  0  0  0  0  0  0  0  0  0\n\
   -2.9322    2.1027    0.8881 H   0  0  0  0  0  0  0  0  0  0  0  0\n\
   -2.9346    2.1021   -0.8849 H   0  0  0  0  0  0  0  0  0  0  0  0\n\
  1  9  2  0  0  0  0\n\
  2 10  2  0  0  0  0\n\
  3  8  1  0  0  0  0\n\
  3 10  1  0  0  0  0\n\
  3 12  1  0  0  0  0\n\
  4  7  1  0  0  0  0\n\
  4 11  1  0  0  0  0\n\
  4 13  1  0  0  0  0\n\
  5  9  1  0  0  0  0\n\
  5 10  1  0  0  0  0\n\
  5 14  1  0  0  0  0\n\
  6  8  1  0  0  0  0\n\
  6 11  2  0  0  0  0\n\
  7  8  2  0  0  0  0\n\
  7  9  1  0  0  0  0\n\
 11 15  1  0  0  0  0\n\
 12 16  1  0  0  0  0\n\
 12 17  1  0  0  0  0\n\
 12 18  1  0  0  0  0\n\
 13 19  1  0  0  0  0\n\
 13 20  1  0  0  0  0\n\
 13 21  1  0  0  0  0\n\
 14 22  1  0  0  0  0\n\
 14 23  1  0  0  0  0\n\
 14 24  1  0  0  0  0\n\
M  END\n\
> <PUBCHEM_COMPOUND_CID>\n\
2519\n\
\n\
> <PUBCHEM_CONFORMER_RMSD>\n\
0.4\n\
\n\
> <PUBCHEM_CONFORMER_DIVERSEORDER>\n\
1\n\
\n\
> <PUBCHEM_MMFF94_PARTIAL_CHARGES>\n\
15\n\
1 -0.57\n\
10 0.69\n\
11 0.04\n\
12 0.3\n\
13 0.26\n\
14 0.3\n\
15 0.15\n\
2 -0.57\n\
3 -0.42\n\
4 0.05\n\
5 -0.42\n\
6 -0.57\n\
7 -0.24\n\
8 0.29\n\
9 0.71\n\
\n\
> <PUBCHEM_EFFECTIVE_ROTOR_COUNT>\n\
0\n\
\n\
> <PUBCHEM_PHARMACOPHORE_FEATURES>\n\
5\n\
1 1 acceptor\n\
1 2 acceptor\n\
3 4 6 11 cation\n\
5 4 6 7 8 11 rings\n\
6 3 5 7 8 9 10 rings\n\
\n\
> <PUBCHEM_HEAVY_ATOM_COUNT>\n\
14\n\
\n\
> <PUBCHEM_ATOM_DEF_STEREO_COUNT>\n\
0\n\
\n\
> <PUBCHEM_ATOM_UDEF_STEREO_COUNT>\n\
0\n\
\n\
> <PUBCHEM_BOND_DEF_STEREO_COUNT>\n\
0\n\
\n\
> <PUBCHEM_BOND_UDEF_STEREO_COUNT>\n\
0\n\
\n\
> <PUBCHEM_ISOTOPIC_ATOM_COUNT>\n\
0\n\
\n\
> <PUBCHEM_COMPONENT_COUNT>\n\
1\n\
\n\
> <PUBCHEM_CACTVS_TAUTO_COUNT>\n\
1\n\
\n\
> <PUBCHEM_CONFORMER_ID>\n\
000009D700000001\n\
\n\
> <PUBCHEM_MMFF94_ENERGY>\n\
22.901\n\
\n\
> <PUBCHEM_FEATURE_SELFOVERLAP>\n\
25.487\n\
\n\
> <PUBCHEM_SHAPE_FINGERPRINT>\n\
10967382 1 18338799025773621285\n\
11132069 177 18339075025094499008\n\
12524768 44 18342463625094026902\n\
13140716 1 17978511158789908153\n\
16945 1 18338517550775811621\n\
193761 8 15816500986559935910\n\
20588541 1 18339082691204868851\n\
21501502 16 18338796715286957384\n\
22802520 49 18128840606503503494\n\
2334 1 18338516344016692929\n\
23402539 116 18270382932679789735\n\
23552423 10 18262240993325675966\n\
23559900 14 18199193898169584358\n\
241688 4 18266458702623303353\n\
2748010 2 18266180539182415717\n\
5084963 1 17698433339235542986\n\
528886 8 18267580380709240570\n\
53812653 166 18198902694142226312\n\
66348 1 18339079396917369615\n\
\n\
> <PUBCHEM_SHAPE_MULTIPOLES>\n\
256.45\n\
4.01\n\
2.83\n\
0.58\n\
0.71\n\
0.08\n\
0\n\
-0.48\n\
0\n\
-0.81\n\
0\n\
0.01\n\
0\n\
0\n\
\n\
> <PUBCHEM_SHAPE_SELFOVERLAP>\n\
550.88\n\
\n\
> <PUBCHEM_SHAPE_VOLUME>\n\
143.9\n\
\n\
> <PUBCHEM_COORDINATE_TYPE>\n\
2\n\
5\n\
10\n\
\n\
$$$$\n";
    glmol.loadMolecule();
});

function defineRepFromController() {
   var all = this.getAllAtoms();
   if (biomt && this.protein.biomtChains != "") all = this.getChain(all, this.protein.biomtChains);

   var allHet = this.getHetatms(all);
   var hetatm = this.removeSolvents(allHet);

   this.colorByAtom(all, {});
   if (colorMode == 'ss') {
      this.colorByStructure(all, 0xcc00cc, 0x00cccc);
   } else if (colorMode == 'chain') {
      this.colorByChain(all);
   } else if (colorMode == 'chainbow') {
      this.colorChainbow(all);
   } else if (colorMode == 'b') {
      this.colorByBFactor(all);
   } else if (colorMode == 'polarity') {
      this.colorByPolarity(all, 0xcc0000, 0xcccccc);
   }

   var asu = new THREE.Object3D();
   if (showMainchain) {
      if (mainchainMode == 'ribbon') {
         this.drawCartoon(asu, all, doNotSmoothen);
         this.drawCartoonNucleicAcid(asu, all);
      } else if (mainchainMode == 'thickRibbon') {
         this.drawCartoon(asu, all, doNotSmoothen, this.thickness);
         this.drawCartoonNucleicAcid(asu, all, null, this.thickness);
      } else if (mainchainMode == 'strand') {
         this.drawStrand(asu, all, null, null, null, null, null, doNotSmoothen);
         this.drawStrandNucleicAcid(asu, all);
      } else if (mainchainMode == 'chain') {
         this.drawMainchainCurve(asu, all, this.curveWidth, 'CA', 1);
         this.drawMainchainCurve(asu, all, this.curveWidth, 'O3\'', 1);
      } else if (mainchainMode == 'cylinderHelix') {
         this.drawHelixAsCylinder(asu, all, 1.6);
         this.drawCartoonNucleicAcid(asu, all);
      } else if (mainchainMode == 'tube') {
         this.drawMainchainTube(asu, all, 'CA');
         this.drawMainchainTube(asu, all, 'O3\''); // FIXME: 5' end problem!
      } else if (mainchainMode == 'bonds') {
         this.drawBondsAsLine(asu, all, this.lineWidth);
      }
   }

   if (line) {
      this.drawBondsAsLine(this.modelGroup, this.getSidechains(all), this.lineWidth);
   }

    if (showBases) {
      if (hetatmMode1 == 'nuclStick') {
         this.drawNucleicAcidStick(this.modelGroup, all);
      } else if (hetatmMode1 == 'nuclLine') {
         this.drawNucleicAcidLine(this.modelGroup, all);
      } else if (hetatmMode1 == 'nuclPolygon') {
         this.drawNucleicAcidLadder(this.modelGroup, all);
     }
   }

   var target = this.modelGroup;
   if (showNonBonded) {
      var nonBonded = this.getNonbonded(allHet);
      if (nbMode == 'nb_sphere') {
         this.drawAtomsAsIcosahedron(target, nonBonded, 0.3, true);
      } else if (nbMode == 'nb_cross') {
         this.drawAsCross(target, nonBonded, 0.3, true);
      }
   }

   if (showHetatms) {
      if (hetatmMode2 == 'stick') {
         this.drawBondsAsStick(target, hetatm, this.cylinderRadius, this.cylinderRadius, true);
      } else if (hetatmMode2 == 'sphere') {
         this.drawAtomsAsSphere(target, hetatm, this.sphereRadius);
      } else if (hetatmMode2 == 'line') {
         this.drawBondsAsLine(target, hetatm, this.curveWidth);
      } else if (hetatmMode2 == 'icosahedron') {
         this.drawAtomsAsIcosahedron(target, hetatm, this.sphereRadius);
     } else if (hetatmMode2 == 'ballAndStick') {
         this.drawBondsAsStick(target, hetatm, this.cylinderRadius / 2.0, this.cylinderRadius, true, false, 0.3);
     } else if (hetatmMode2 == 'ballAndStick2') {
         this.drawBondsAsStick(target, hetatm, this.cylinderRadius / 2.0, this.cylinderRadius, true, true, 0.3);
     }
   }

   if (projectionMode == 'perspective') this.camera = this.perspectiveCamera;
   else if (projectionMode == 'orthoscopic') this.camera = this.orthoscopicCamera;

   this.setBackground(bgcolor);

   if (cell) {
      this.drawUnitcell(this.modelGroup);
   }

   if (biomt) {
      this.drawSymmetryMates2(this.modelGroup, asu, this.protein.biomtMatrices);
   }

   if (packing) {
      this.drawSymmetryMatesWithTranslation2(this.modelGroup, asu, this.protein.symMat);
   }

   this.modelGroup.add(asu);
};

glmol.defineRepresentation = defineRepFromController;
