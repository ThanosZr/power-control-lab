# CAD · πηγές και αρχεία project

Έκδοση 0.9 · 25/11/2026. Νέες εκτελέσιμες πηγές: [CAD_NATIVE_ADAPTER](CAD_NATIVE_ADAPTER.md) και `experiments/cad_t005/` (build123d 0.10.0/OCP 7.8.1.1.post1), [CAD_VIEWPORT_CONTRACT](CAD_VIEWPORT_CONTRACT.md) και `experiments/cad_t006/` (WebGL2/JavaScript, isolated), με πραγματικό native fixture και αναπαραγωγή του. Κανονική θέση: lab-cad-0.6.0-viewport.

## Κανονικές πηγές και εκκρεμή ιδιωτικά inputs

Ο ιδιοκτήτης ζήτησε να συντηρείται όλο το δημόσιο CAD πλάνο στο Git. Τα ενεργά αρχεία είναι προσβάσιμα μέσω του [CAD_INDEX.md](CAD_INDEX.md), στο lab-cad-0.6.0-viewport. Δεν απαιτείται συνεχής ανάρτηση των ίδιων CAD docs στο project. Κανόνας D023: δεν επαναλαμβάνεται αναζήτηση σε chats/Library/ZIP για ήδη καταγεγραμμένα ή ελλείποντα inputs. Τα δύο ιδιωτικά σύνολα επανελέγχθηκαν στο S010 και δεν βρέθηκαν ούτε σε διαθέσιμο ιστορικό CAD συνομιλιών. Χρειάζονται νέο ιδιωτικό input ή ρητή απόφαση του ιδιοκτήτη· η απουσία δεν θεραπεύεται με επινοημένο αρχείο.

| Υλικό | Τρέχουσα θέση/κατάσταση | Πότε απαιτείται |
| --- | --- | --- |
| CAD_PROJECT_INSTRUCTIONS, CAD_NEXT_STEPS, CAD_DECISIONS_01, CAD_VERSIONS_01, CAD_SOURCES | Κανονικά ονόματα στο docs/, αναθεώρηση 0.4 από τα ανακτημένα 0.3, με διατήρηση ιστορικού | Κάθε συνέχεια από Git |
| CAD_STATUS, CAD_BASELINE, CAD_INTEGRATION_MAP | Ενεργό handoff, ακριβείς έλεγχοι/βάση και χαρτογράφηση στο Git | Πριν από εργασία/παράδοση |
| CAD_INDEX, CAD_PLAN_DETAILS, README branch | Οδηγός ανάγνωσης, αναλυτικά κριτήρια και στόχος CAD tool | Για υλοποίηση και συντονισμό ενσωμάτωσης |
| CAD_DOCUMENT_CONTRACT και experiments/cad_t003 | Αυτοτελές συνθετικό T003, normative executable validator και tests. Μόνο standard library | Για contract και T004 σχεδιασμό· όχι άδεια ενσωμάτωσης |
| CAD_WORKER_CONTRACT και experiments/cad_t004 | Αυτοτελές συνθετικό T004, coordinator, tests και demo. Standard library, επαναχρησιμοποίηση T003 | Για T005 native adapter και Fable review· όχι άδεια ενσωμάτωσης |
| Πραγματικά CAD-S007 drafts | Ανακτήθηκαν και διαβάστηκαν από προηγούμενα παραδοτέα στις 23/11/2026. Ευρήματα και ιστορικό στα CAD_BASELINE/CAD_INTEGRATION_MAP/CAD_VERSIONS_01 | Η ανάκτησή τους δεν εκκρεμεί |
| Ενεργά engine Επόμενα-βήματα, τελευταίες αποφάσεις και εκδόσεις | Δεν παρέχονται ακόμη μετά τον επανέλεγχο S010. Το διαθέσιμο αποφάσεις-14 σταματά στην 5.0.5. Η παρατήρηση του δημόσιου 5.0.10 δεν αποτελεί ιδιωτικό handoff | Πριν από CAD υλοποίηση στο PCL (D024/D026), όχι για την isolated T002 αξιολόγηση |
| Πραγματικός privacy checker, οδηγίες και ιδιωτικά inputs | Δεν εντοπίστηκαν μετά τον επανέλεγχο S010, δεν εκτελέστηκαν. Ιδιωτική χρήση, εκτός δημόσιου repository | Πριν από CAD υλοποίηση στο PCL (D024/D026). Η ειδική άδεια T002 δεν αντικαθιστά τον checker |
| Πραγματικό nethash/nethash3, baselines και οδηγίες ERR | Δεν εντοπίστηκαν στις διαθέσιμες πηγές. Δεν εφαρμόζεται σε αυτή την τεκμηρίωση | Πριν από αλλαγή solver/netlib/parts που απαιτεί τον έλεγχο |
| Ενδεικτικό εξάρτημα και μηχάνημα αναφοράς | Πρόταση ουδέτερου συνθετικού άξονα ή βάσης εδράνου, χωρίς τελική επιλογή | CAD-T002/CAD-T003 και μετρήσεις, όταν εγκριθεί το αντίστοιχο στάδιο |

Η βάση παραμένει engine 5.0.7 στο dab82e5ff2e6da4bde09e4a38aab32edfffe6d51. Τα αρχικά source/main/CAD CI IDs είναι στο CAD_BASELINE. Νεότερο tree του engine διαβάζεται για συντονισμό μόνο. Η παρακολούθηση της main δεν είναι αλλαγή βάσης ή άδεια merge.

Τα πέντε αρχεία στο ZIP 0.3 είναι ανακτημένο ιστορικό στιγμιότυπο. Η κανονική 0.4 συντηρείται στο Git. Η αποθήκευση σε Git επιβεβαιώνεται με remote SHA· δεν βαφτίζεται ενημέρωση συνημμένων project. Για υλικό που όντως πρέπει να δοθεί ιδιωτικά, δηλώνεται ρητά αν η προσθήκη του επιβεβαιώθηκε ή ποιο συγκεκριμένο αρχείο εξακολουθεί να λείπει.

## Δημόσιες τεχνικές πηγές για την αρχή

| ID | Τίτλος και σύνδεσμος | Χρήση |
|---|---|---|
| CAD-R001 | [CadQuery Documentation — Introduction](https://cadquery.readthedocs.io/en/stable/intro.html) | Παραμετρική γεωμετρία, Open CASCADE και χρήση μέσα σε άλλη εφαρμογή. |
| CAD-R002 | [CadQuery Documentation — Installing CadQuery](https://cadquery.readthedocs.io/en/stable/installation.html) | Συμβατότητα και εγκατάσταση στο περιβάλλον βάσης. Οι εκδόσεις επανελέγχονται στο τεχνικό spike. |
| CAD-R003 | [CadQuery Documentation — QuickStart](https://cadquery.readthedocs.io/en/stable/quickstart.html) | Δοκίμιο βάσης εδράνου με παραμέτρους και οπές. |
| CAD-R004 | [CadQuery Documentation — Importing and Exporting Files](https://cadquery.readthedocs.io/en/stable/importexport.html) | STEP/DXF, mesh μορφές και τα όρια μεταφοράς παραμετρικού ιστορικού. |
| CAD-R005 | [build123d Documentation — About](https://build123d.readthedocs.io/en/stable/) | Εναλλακτικό Python API πάνω στο Open CASCADE. |
| CAD-R006 | [Open CASCADE Technology Reference Manual — BRepGProp](https://dev.opencascade.org/doc/refman/html/class_b_rep_g_prop.html) | Γεωμετρικές και αδρανειακές ιδιότητες. Χρήση τεκμηρίωσης της έκδοσης kernel που θα επιλεγεί. |
| CAD-R007 | [Three.js Documentation — OrbitControls](https://threejs.org/docs/pages/OrbitControls.html) | Ιστορική πρόταση, αποσύρθηκε ως επιλογή στις 23/11: ο renderer δεν θα χρησιμοποιεί Three.js. |
| CAD-R008 | [Three.js Documentation — TransformControls](https://threejs.org/docs/pages/TransformControls.html) | Ιστορική αναφορά Three.js, αποσύρθηκε ως επιλογή· δεν αποτελεί dependency ή εγκεκριμένο backend. |
| CAD-R009 | [Three.js Documentation — Raycaster](https://threejs.org/docs/pages/Raycaster.html) | Ιστορική αναφορά Three.js, αποσύρθηκε ως επιλογή· ο μηχανισμός selection θα αξιολογηθεί για τον εξειδικευμένο renderer. |
| CAD-R010 | [PCL — docs/ARCHITECTURE.md](https://github.com/ThanosZr/power-control-lab/blob/dab82e5ff2e6da4bde09e4a38aab32edfffe6d51/docs/ARCHITECTURE.md) | Υφιστάμενη αρχιτεκτονική, δεσμευμένο SHA 5.0.7. |
| CAD-R011 | [PCL — docs/ADDONS.md](https://github.com/ThanosZr/power-control-lab/blob/dab82e5ff2e6da4bde09e4a38aab32edfffe6d51/docs/ADDONS.md) | Όρια add-ons/Pyodide, link και διαθέσιμες μέθοδοι. |
| CAD-R012 | [PCL — docs/ROADMAP.md](https://github.com/ThanosZr/power-control-lab/blob/dab82e5ff2e6da4bde09e4a38aab32edfffe6d51/docs/ROADMAP.md) | §94 χώρος εργασίας, §98 Python κονσόλα (πρόταση), κοινό μοντέλο/ταυτότητες. |
| CAD-R013 | [PCL — matlab/](https://github.com/ThanosZr/power-control-lab/tree/dab82e5ff2e6da4bde09e4a38aab32edfffe6d51/matlab) | Υφιστάμενα MATLAB/Octave wrappers, προς επαναχρησιμοποίηση όπου ταιριάζουν. |
| CAD-R014 | [CAD CI 45011321787](https://github.com/ThanosZr/power-control-lab/actions/runs/45011321787) | Επιτυχές baseline unit/UI/Octave/package στη βάση, όχι σε νέο CAD commit. |
| CAD-R015 | [PCL — CI workflow](https://github.com/ThanosZr/power-control-lab/blob/dab82e5ff2e6da4bde09e4a38aab32edfffe6d51/.github/workflows/ci.yml) | Ακριβείς εντολές/εξαρτήσεις CI· `lab-*` triggers. |
| CAD-R016 | [PCL — 5.0.10 ROADMAP §94](https://github.com/ThanosZr/power-control-lab/blob/2160a13d7180745e80f7f3fefa07788d30b37d1f/docs/ROADMAP.md) · [GUIDE §48](https://github.com/ThanosZr/power-control-lab/blob/2160a13d7180745e80f7f3fefa07788d30b37d1f/docs/GUIDE.md) | Read-only σύγκριση της νεότερης διαχείρισης layout/δεύτερης οθόνης· όχι αλλαγή βάσης. |
| CAD-R017 | [PCL — 5.0.10 dock.js](https://github.com/ThanosZr/power-control-lab/blob/2160a13d7180745e80f7f3fefa07788d30b37d1f/web/studio/dock.js) · [screen.js](https://github.com/ThanosZr/power-control-lab/blob/2160a13d7180745e80f7f3fefa07788d30b37d1f/web/studio/screen.js) | Κύκλος ζωής κάρτας σε δεύτερο browser window. Μελλοντική ενσωμάτωση CAD: επαλήθευση GPU/input/resize και διατήρηση state. |
| CAD-R018 | [CAD CI 45107396018](https://github.com/ThanosZr/power-control-lab/actions/runs/45107396018) · [engine 5.0.10 CI 45102252449](https://github.com/ThanosZr/power-control-lab/actions/runs/45102252449) | Χωριστά commits και runs: CAD f91ac3c, engine 2160a13. Και τα δύο ολοκληρώθηκαν επιτυχώς· κανένα δεν πιστοποιεί επόμενο CAD commit. |
| CAD-R019 | [T003 CI 45149843737](https://github.com/ThanosZr/power-control-lab/actions/runs/45149843737) | Επαληθευμένο `c9fe513eb984653741519b93ff177796150a66cd`, 4/4 success, όχι πιστοποίηση T004. |

## Πηγές που προστίθενται στο αντίστοιχο στάδιο

T002 (D026–D027) — [CAD_KERNEL_EVALUATION](CAD_KERNEL_EVALUATION.md) και [συνθετικό benchmark](../experiments/cad_t002/benchmark.py). Πρόσθετες επίσημες τεχνικές πηγές: [CadQuery assemblies](https://cadquery.readthedocs.io/en/stable/assy.html), [build123d direct API](https://build123d.readthedocs.io/en/stable/direct_api_reference.html), [algebra mode](https://build123d.readthedocs.io/en/stable/key_concepts_algebra.html), [joints](https://build123d.readthedocs.io/en/stable/joints.html), [wgpu backend matrix](https://wgpu.rs/doc/wgpu/struct.Backends.html), [WebGPU adapter](https://developer.mozilla.org/en-US/docs/Web/API/GPUAdapter). Η online τεκμηρίωση μπορεί να αφορά νεότερη έκδοση από αυτή του synthetic spike. GPU/packaging validation εκκρεμούν· οι πραγματικές ιδιωτικές είσοδοι παραμένουν πύλες πριν από υλοποίηση στο PCL.

- **Sketch constraints:** επίσημη τεκμηρίωση/κώδικας των υποψήφιων constraint solvers, tests αναφοράς και άδειες διανομής. Δεν έχει επιλεγεί solver.
- **Regeneration και assemblies:** πρωτογενής τεκμηρίωση OCCT/επιλεγμένης βιβλιοθήκης για topology, naming, boolean robustness, placements και constraints.
- **Custom physics:** βιβλιογραφία για το συγκεκριμένο μοντέλο, συμβάσεις θυρών και solver. Για κάθε νέο φυσικό φαινόμενο ζητείται συγκεκριμένος τίτλος/κεφάλαιο ή δημόσιο benchmark πριν αποδοθεί ως επαληθευμένο.
- **Python/Java:** επίσημες προδιαγραφές runtime/API των εκδόσεων που επιλέγονται, διεργασίες/IPC και ακύρωση. Μετρήσεις κόστους, όχι υπόθεση ότι τρέχουν μέσα στο browser.
- **MATLAB:** επίσημη τεκμηρίωση των διαύλων/μορφών που πράγματι θα χρησιμοποιηθούν, μαζί με τα ήδη διαθέσιμα wrappers του PCL.
- **MCU/code generation:** επίσημο reference manual/SDK του target και τεκμηρίωση toolchain αφού οριστεί πλακέτα/MCU.

Για την πρώτη τεχνική διερεύνηση δεν απαιτείται αγορά ή ανέβασμα βιβλίου. Αν κάποια πηγή χρειαστεί και δεν είναι δημόσια διαθέσιμη, ζητείται τότε με ακριβή τίτλο, έκδοση/κεφάλαιο και τον λόγο χρήσης της. Ιδιωτικές πηγές δεν αντιγράφονται στο GitHub.

## CAD-T007 source register

- Parent T006 `68a465be4df460e7918fa0d849a0bddc8f931a8d`, CI [45649705613](https://github.com/ThanosZr/power-control-lab/actions/runs/45649705613) verified exact SHA and 4/4. Reused actual T003/T004/T005/T006 contracts and source from Git; [T007 contract](CAD_PARAMETRIC_CONTRACT.md). No private inputs obtained or published.

## CAD-T009 source register

- Parent T008 `9abc985db1e6fa68c83f9bb4a8808afe2d6d3d56`, [CI 45747371669](https://github.com/ThanosZr/power-control-lab/actions/runs/45747371669) exact SHA and 4/4 verified. Reuse [T008 solver](../experiments/cad_t008/sketch.mjs), T005 native pattern and existing T007 dependency pins/viewport. [T009 contract](CAD_FEATURE_HISTORY_CONTRACT.md). No private inputs obtained or published.

## CAD-R020 — Field Reconstruction for Transient PMSM Faults

S. Attestog, H. Van Khang and K. G. Robbersmyr, “Field Reconstruction for Modeling Multiple Faults in Permanent Magnet Synchronous Motors in Transient States,” *IEEE Access*, vol. 9, pp. 127131–127140, 2021. [DOI: 10.1109/ACCESS.2021.3112224](https://doi.org/10.1109/ACCESS.2021.3112224) · [ResearchGate (πηγή που πρότεινε ο ιδιοκτήτης)](https://www.researchgate.net/publication/354568078_Field_Reconstruction_for_Modeling_Multiple_Faults_in_Permanent_Magnet_Synchronous_Motors_in_Transient_States).

Η εργασία επεκτείνει το field reconstruction model (FRM) για PMSM, συνδυάζοντας μοντέλα ελαττωμάτων μαγνητών και inter-turn short-circuit σε μεταβατική λειτουργία. Ανακατασκευάζει τη μαγνητική κατανομή στο διάκενο με δεδομένα αναφοράς από FEA και συγκρίνει τα αποτελέσματα με μεταβατική FEA. Η δημοσίευση αναφέρει σημαντική επιτάχυνση στο συγκεκριμένο παράδειγμα, όχι γενική εγγύηση για άλλα μοντέλα. Διαβάστηκαν η περίληψη και η περιγραφή της μεθόδου, όχι ανεξάρτητη αναπαραγωγή.

**Χρήση στο project:** υποψήφια ερευνητική προσέγγιση για fast field-level electromagnetic simulation (FRM/ROM), transient fault diagnostics και συνεπή σύζευξη με κυκλωματική, θερμική και μηχανική προσομοίωση. Αργότερα benchmark έναντι FEA σε δηλωμένες συνθήκες, έλεγχος περιορισμών/κορεσμού/απωλειών και σφάλματος, αξιολόγηση online real-time δυνατότητας. Συνδέεται με [C7–C8 και EV powertrain](CAD_PLAN_DETAILS.md#πολυφυσική-ηλεκτρομηχανική-προσομοίωση-και-ev-powertrain), χωρίς επιλογή solver ή άδεια άμεσης υλοποίησης.

## CAD-T010 source register

- Parent T009 exact `5490370c8cf7a4ae09ae87a4d0d9888c805a8e8d`, [CI 45821459611](https://github.com/ThanosZr/power-control-lab/actions/runs/45821459611) verified 4/4 and dedicated native/browser step. Reuses the pinned build123d/OCP environment, actual T008 solver, T009 history, profile checks and loopback demo, T006 retained viewport. [T010 contract](CAD_NATIVE_FEATURES_CONTRACT.md). Native API signatures inspected directly from installed build123d 0.10.0; validated by real geometry rather than unverified example code. No private inputs obtained or published.

- T011-A native APIs: OCCT BRepOffsetAPI_MakePipe, BRepOffsetAPI_ThruSections, BRepCheck_Analyzer and BRepGProp; direct OCP locally exercised. T010 CI 45991092618 exact parent. No new private material. See CAD_SWEEP_LOFT_CONTRACT.md.

- T011 continuation: actual checkout of T011-A exact SHA/tree and CI 46010285091 checked; direct pinned build123d 0.10.0 / cadquery-ocp 7.8.1.1.post1 signatures and actual native BReps, existing T008 solve and T009 transaction/worker, T006/T007 viewport. Arc radius/tangent and centroid volume validation use analytic geometry and native surface integrals. No external proprietary/private materials or new dependencies. [T011 contract](CAD_SWEEP_LOFT_CONTRACT.md).

- T012: actual checkout T011 `c7b4fe077d35d8a73c3207b3d70bd18db13fb2a4` / exact tree `e19d036ef31afe01644631554d65d602fee4811b`; [CI 46018201004](https://github.com/ThanosZr/power-control-lab/actions/runs/46018201004), four jobs and dedicated native/browser log PASS. Pinned OCP native `BRepFilletAPI_MakeFillet`, `BRepFilletAPI_MakeChamfer`, `TopExp.MapShapesAndAncestors_s` and `TopoDS` wrappers inspected and executed; actual T011 replay/T009 transaction, T008 model IDs, T006/T007 retained renderer. Analytic block/cylinder tests independently verify geometry. No new dependency or private inputs. [T012 contract](CAD_EDGE_FEATURES_CONTRACT.md).
