# Power & Control Lab · CAD και custom components

Έκδοση πλάνου: 0.10 · 26/11/2026 · Ιδιοκτήτης: Thanos Zr.

## Τρέχουσα κατάσταση

**Ενεργό CAD-T007 / SOL (D033)** στο `lab-cad-0.7.0-parametric`. T007 isolated parametric GUI/Python transactions, native rebuild, undo/redo and save/open; parent T006 `68a465be` / CI 45649705613 (4/4). Final T007 CI required on actual HEAD. No PCL integration; both private gates remain open. [Parametric contract](CAD_PARAMETRIC_CONTRACT.md).

**Προηγούμενα checkpoints:** T001 στο e997a3d2, CI 45124099619, T002 στο 43f7fe3, CI 45135806207, T003 στο c9fe513, CI 45149843737, T004 στο 1af4de0, CI 45561734591 (4/4). Εγκεκριμένη βάση engine 5.0.7 στο dab82e5ff2e6da4bde09e4a38aab32edfffe6d51. Τα προηγούμενα contract docs παραμένουν ενεργές πηγές.

Τα αρχικά CAD-S007 drafts και τα planning docs 0.3 ανακτήθηκαν από προηγούμενα παραδοτέα και αντιπαραβλήθηκαν με τον pinned κώδικα. Η δημοσιευμένη ανακατασκευή και η μεταγενέστερη πραγματική ανάκτηση παραμένουν διακριτές στο [CAD_BASELINE.md](CAD_BASELINE.md).

| Περιοχή | Ενεργή καταγραφή |
| --- | --- |
| Git ως πηγή συνέχειας | Τα CAD docs συντηρούνται στο docs/ αυτού του branch· [οδηγός ανάγνωσης](CAD_INDEX.md). |
| Κώδικας και baseline | Ο engine παραμένει 5.0.7. Το README του branch παρουσιάζει τον στόχο CAD tool· αυτό δεν αλλάζει τον runtime. |
| Ήδη δημοσιευμένα checkpoints | 5660e9b: ανακατασκευή· c169ffc: πολιτική branches· f57d02f: πραγματική ανάκτηση και εμπλουτισμένος χάρτης· f91ac3c: πλήρες CAD πλάνο/README (S009). |
| CI | T001–T005 πιστοποιημένα 4/4, T005 `fb25e82` / 45599503711· T006 απαιτεί το πραγματικό νέο SHA/CI. Βλ. CAD_STATUS. |
| Παράλληλος engine (read-only, S010) | main 5.0.9· lab-5.0.10 στο 2160a13d7180745e80f7f3fefa07788d30b37d1f, CI 45102252449 success. Νέα layouts/δεύτερη οθόνη, όχι νέα βάση CAD. Βλ. [χάρτη](CAD_INTEGRATION_MAP.md#cad-s010-coordination-with-the-5010-workspace-changes). |
| Τοπικοί έλεγχοι αυτής της συνέχειας | T003–T005 25/25 Python tests, T006 7/7 Node tests, native demo/fixture, CODEMAP/API 947 PASS· real browser smoke στο CAD-conditional existing UI CI job. |
| Εκκρεμείς πύλες πριν από CAD υλοποίηση (D024/D026) | Ενεργά engine next-steps/decisions/versions και πραγματικός privacy checker με ιδιωτικά inputs/οδηγίες. Το απομονωμένο συνθετικό spike επιτρέπεται, δεν αποτελούν λυμένες πύλες. |
| Τωρινή άδεια δημοσίευσης | Δημόσια CAD docs/README, isolated T002 D026 έως T006 D030. Κώδικας ενσωμάτωσης και ιδιωτικά inputs δεν καλύπτονται. |

## Επόμενη ενέργεια — κλείσιμο T007 και στάση

1. Επαλήθευσε πραγματικό HEAD, CI 4/4 και T007 native/browser step.
2. Επόμενο μόνο με νέα έγκριση: προτεινόμενο CAD-T008/C2, isolated sketch/constraint contract· C1 integration, STEP UI exchange και transforms παραμένουν ανοικτά.
3. Οι δύο ιδιωτικές πύλες πριν από PCL integration παραμένουν υποχρεωτικές. Opus/Fable review στο CAD_PARAMETRIC_CONTRACT.

Το [CAD_PLAN_DETAILS.md](CAD_PLAN_DETAILS.md) εξειδικεύει τα στάδια, τις εξαρτήσεις, την απόδοση, τις δοκιμές και το πρωτόκολλο ενσωμάτωσης. Οι παρακάτω πίνακες είναι το ενεργό πλάνο προϊόντος, όχι κατάλογος υλοποιημένων δυνατοτήτων.

## Τελικός στόχος

Πλήρες παραμετρικό μηχανολογικό CAD μέσα στο PCL: sketches με constraints και διαστάσεις, στερεά με ιστορικό features, συναρμολογήσεις, τεχνικές όψεις/τομές/μετρήσεις και ανταλλαγή CAD αρχείων. GUI και κώδικας δουλεύουν πάνω στο ίδιο έγγραφο.

Custom components με templates: γεωμετρία, υλικά, ιδιότητες, ορίσματα με τύπους/μονάδες/όρια, τοπικά συστήματα συντεταγμένων, συνδέσεις και φυσική συμπεριφορά σε Python ή Java. Σύνδεση με MATLAB και υπάρχοντα συστήματα ελέγχου/προσομοίωσης. Η παραγωγή κώδικα MCU προβλέπεται μέσω κατάλληλης κοινής αναπαράστασης για τα υποστηριζόμενα μοντέλα.

Η λέξη «πλήρες» ορίζει τον στόχο προϊόντος, όχι ολοκλήρωση όλων σε μία έκδοση. FEA, CFD, CAM και επαγγελματικές μορφές ανταλλαγής δεν θεωρούνται αυτόματα υλοποιημένες από τη δημιουργία CAD σωμάτων· απαιτούν δικά τους συγκεκριμένα στάδια όταν προσδιοριστούν.

## Αρχιτεκτονική προς διερεύνηση

- Εξειδικευμένος, αποδοτικός renderer χωρίς Three.js. OCCT exact kernel με αρχικό build123d adapter, OCP/native escape path, ανεξάρτητο PCL document/API και portable GPU compute/rendering. WebGPU/wgpu πρώτοι υποψήφιοι, όχι τελικά επιλεγμένη backend υλοποίηση· βλ. CAD_KERNEL_EVALUATION.
- Το CAD document/feature graph είναι η πηγή παραμετρικών δεδομένων. Το ακριβές BRep ανήκει στον kernel. Το mesh του browser είναι αναπαράσταση προβολής, με σύνδεση triangles/edges σε geometry IDs και revision.
- Προτεινόμενα νέα modules: `pcl/cad/`, `web/cad/` και `tests/cad/`. Δεν υπάρχουν ακόμη στον PCL. T003 reference βρίσκεται αποκλειστικά στο `experiments/cad_t003/`· τελικές διαδρομές μετά τις πύλες.
- Δημόσιο CAD/component API από νωρίς, κοινό για GUI, Python, Java bridge και MATLAB. GUI εντολές και κώδικας μεταβάλλουν το ίδιο έγγραφο· δεν υποσχόμαστε αυτόματη μετατροπή αυθαίρετου κώδικα σε επεξεργάσιμο feature tree.
- Ενσωμάτωση στα υφιστάμενα `panels.js`/`dock.js`, inspector και μενού. Μικροί adapters στα κοινά αρχεία. Δεν ξαναγράφεται ο editor κυκλωμάτων ή ο διαχειριστής παραθύρων.
- Το τρέχον `PCL.python` των add-ons εκτελεί Python σε Pyodide. Δεν θεωρείται native εκτέλεση του CAD kernel. Η γεωμετρία χρειάζεται συμφωνημένη native υπηρεσία και η κονσόλα συνδέεται με το §98, χωρίς δεύτερο ανταγωνιστικό command window.
- Μάζα/αδράνεια προκύπτουν από γεωμετρία και υλικό. Αντιστάσεις, απώλειες, τριβή, μαγνητισμός και συντακτικές σχέσεις χρειάζονται συγκεκριμένα φυσικά μοντέλα. Δεν παράγονται όλα αυτόματα από ένα 3D σχήμα.

## Στάδια και κριτήρια ολοκλήρωσης

| ID | Περιεχόμενο | Ολοκληρώνεται όταν | Δύσκολα υποβήματα |
|---|---|---|---|
| C0 | Βάση, συμβόλαια, επιλογή kernel και workers | Καταγράφονται επιλεγμένο SHA, έλεγχοι, interface, δοκιμή γεωμετρίας και πραγματικές μετρήσεις. | ASTRA |
| C1 | Έγγραφο CAD, primitives, viewport, Python API | Σώμα δημιουργείται/επιλέγεται/μετακινείται/παραμετροποιείται, αποθηκεύεται, ξανανοίγει, αναιρείται και εξάγεται σε STEP. Η βαριά πράξη τρέχει στο background. | SOL μετά το C0 |
| C2 | Sketch editor και γεωμετρικοί περιορισμοί | Διαστάσεις, συνευθειακότητα, καθετότητα, εφαπτομένη κ.λπ. λύνονται· υπό/υπερκαθορισμένα sketches εξηγούνται χωρίς σιωπηρή αλλοίωση. | ASTRA για solver/diagnostics |
| C3 | Feature tree | Extrude/revolve/sweep/loft, booleans, fillet/chamfer, patterns, mirror, shell υλοποιούνται σε χωριστά βήματα με regeneration και έλεγχο εγκυρότητας. Αποτυχημένη πράξη δεν καταστρέφει το τελευταίο έγκυρο μοντέλο. | ASTRA για naming/regeneration |
| C4 | Assemblies | Instances, τοπικά frames, mates, βαθμοί ελευθερίας και βασική κινηματική επαληθεύονται. Κινηματική και δυναμική έχουν χωριστή σημασία. | ASTRA για constraints |
| C5 | Μετρήσεις, ιδιότητες, σχέδια και ανταλλαγή | Μονάδες, όγκος, κέντρο μάζας, τανυστής αδράνειας, όψεις/τομές/διαστάσεις και STEP/DXF/STL ελέγχονται ανά δυνατότητα. STEP import δεν υπόσχεται ανάκτηση του αρχικού feature history. | SOL/ASTRA ανά μορφή |
| C6 | Custom component builder και templates | Το ίδιο εξάρτημα ορίζεται από GUI ή κώδικα με versioned schema, παραμέτρους, υλικά, γεωμετρία, θύρες, μοντέλο και παραδείγματα. Αποθήκευση, επαναχρησιμοποίηση και αναβάθμιση template είναι ελέγξιμες. | ASTRA για συμβόλαιο, SOL για templates |
| C7 | Python/Java runtimes και φυσική συμπεριφορά | Σταδιακά causal blocks και φυσικά μοντέλα, αρχικοποίηση/καταστάσεις/συμβάντα, μονάδες και συμβάσεις effort/flow. Ελεγχόμενα native runtimes με μετρημένο overhead. | ASTRA |
| C8 | Σύζευξη με PCL και φυσικούς τομείς | Σύνδεση με ταυτότητες στοιχείων και ρητό mapping σε μοντέλα κινητήρα/άξονα/φορτίου· στη συνέχεια οι επιλεγμένοι επιπλέον τομείς. Επαλήθευση ενέργειας, πρόσημων και κοινών χρονικών συμβάντων. Γενικό multibody/DAE είναι χωριστά υποβήματα. | ASTRA |
| C9 | MATLAB και κοινή κονσόλα | Υποστηριζόμενες πράξεις CAD/component δουλεύουν από MATLAB και Python, με ορατό backend και αναπαραγώγιμα παραδείγματα. Επαναχρησιμοποίηση `pcl.link`/υφιστάμενων `.m` όπου ταιριάζουν. | SOL πάνω σε συμφωνημένα APIs |
| C10 | Υποστηριζόμενο code generation | Ρητό υποσύνολο block/IR σε C για συγκεκριμένο target· σύγκριση με simulation και μετρημένος χρόνος/μνήμη. Αυθαίρετη Python ή Java δεν θεωρείται αυτομάτως μετατρέψιμη σε MCU κώδικα. | ASTRA για IR, SOL για adapters |

Τα stages δεν είναι ένα chat το καθένα. Σπάνε σε μικρά κάθετα παραδοτέα. Το schema/API και η απόδοση σχεδιάζονται νωρίς και εξελίσσονται μαζί με τις λειτουργίες.

## Απόδοση από την πρώτη λειτουργία

- Native CAD σε worker processes με έλεγχο thread safety/affinity του επιλεγμένου kernel. Browser Workers για κατάλληλες εργασίες. Όχι βαριές γεωμετρικές πράξεις στο κύριο thread.
- Jobs με ID, revision, ακύρωση και απόρριψη παλιών αποτελεσμάτων. Το έγγραφο δέχεται μόνο αποτέλεσμα της σωστής έκδοσης. Ακύρωση σημαίνει ό,τι πράγματι υποστηρίζει το native job, όχι μόνο κρυμμένο spinner.
- Cache από παραμέτρους, topology/feature dependencies και έκδοση kernel. Incremental rebuild όπου είναι ασφαλές. Παραλληλισμός σε πραγματικά ανεξάρτητες εργασίες και sweeps.
- Κοινό όριο CPU/RAM με τον solver· όχι ανεξέλεγκτα nested pools. Απομόνωση των live simulation/control deadlines από τη γεωμετρία.
- Μεταφορά mesh/αποτελεσμάτων με μετρημένο κόστος· transferable buffers όπου ταιριάζει. Instancing και επίπεδα λεπτομέρειας για προβολή, χωρίς υποβάθμιση των ακριβών φυσικών ιδιοτήτων.
- Render όταν αλλάζει η σκηνή, σωστό resize/docking, καθαρισμός GPU resources, έλεγχος μεγάλων assemblies και μακράς χρήσης. Το animation ακολουθεί τον χρόνο προσομοίωσης.
- Benchmarks: build/rebuild/tessellation, IPC, p50/p95 απόκρισης και frame times, peak memory, cache, cancellation και ταυτόχρονη προσομοίωση. Τα αποδεκτά όρια καθορίζονται μετά το πρώτο baseline στο δηλωμένο μηχάνημα.

## Μικρά πρώτα βήματα

| Εργασία | Μοντέλο | Ένα παραδοτέο |
|---|---|---|
| CAD-T001 | SOL | Documentation-only ολοκλήρωση D024: επιβεβαίωση/δέσμευση βάσης, χάρτης κοινών αρχείων και baseline ελέγχων· τελική πιστοποίηση CI. |
| CAD-T002 | SOL | Απομονωμένο συνθετικό benchmark με exact checks/STEP/tessellation/μετρήσεις, OCCT + build123d αρχικός adapter, Fable review. |
| CAD-T003 | SOL | Isolated versioned CAD document/component API v1 και shaft template, βλ. CAD_DOCUMENT_CONTRACT. Ιδιωτικές πύλες πριν από ενσωμάτωση. |
| CAD-T004 | SOL | Isolated revisioned worker/job contract με cache/cancellation και logical resource reservations· βλ. CAD_WORKER_CONTRACT και Fable review. Native process/real solver arbitration εκκρεμούν. |
| CAD-T005 | SOL | Μία native πράξη δημιουργίας σώματος από το API, στο background, με έλεγχο αποτελέσματος. |
| CAD-T006 | SOL | Ένα 3D panel στην υπάρχουσα αισθητική, με camera/selection/resize/docking. |
| CAD-T007 | SOL | Μία αλλαγή διαστάσεων από GUI και Python με ίδιο αποτέλεσμα, undo και save/open. |

Η σειρά επανεκτιμάται με πραγματικά ευρήματα. Μην ξεκινάς ASTRA υποβήμα χωρίς να έχει ο χρήστης την ευκαιρία να επιλέξει μοντέλο. Δεν αναθέτεις αυτόματα σε δεύτερους agents.

## Τι μένει να οριστεί κατά την έναρξη

- Το ακριβές SHA βάσης έχει δεσμευτεί (βλ. κατάσταση). Εκκρεμεί ο ενεργός κλάδος Opus για συντονισμό, όχι νέα επιλογή βάσης.
- Τα τρέχοντα έγγραφα engine και τα πραγματικά εργαλεία απορρήτου/nethash με baselines.
- Πρώτο χαρακτηριστικό δοκίμιο και μηχάνημα αναφοράς. Πρόταση: άξονας ή βάση εδράνου με οπές και υλικό.
- Ακριβή υποσύνολα φυσικών τομέων, component runtimes και targets MCU ανά στάδιο.

## Μελλοντικές κατευθύνσεις, χωρίς υλοποίηση τώρα

- Γενική κινηματική και δυναμική, περιλαμβανομένων robots που ορίζονται από CAD και εξετάζονται σε διαφορετικά σενάρια. Χρειάζονται ρητά μηχανικά μοντέλα, joints, constraints και επαλήθευση.
- AI-assisted acceleration. Τα PINNs είναι υποψήφια προσέγγιση προς αξιολόγηση, όχι επιλεγμένος γενικός accelerator.
- Time-scaled playback: ανεξάρτητοι χρόνοι προσομοίωσης και προβολής, χρονικό zoom, pause/step/replay και συγχρονισμένα αποτελέσματα. Η αλλαγή ρυθμού προβολής δεν αλλάζει το φυσικό βήμα επίλυσης.
- Οι κατευθύνσεις αυτές συμπληρώνουν τον τελικό στόχο, χωρίς να ανοίγουν νέο task στην παρούσα συνομιλία.

## Μήνυμα συνέχειας

Από `lab-cad-0.7.0-parametric`, επιβεβαίωσε πραγματικό HEAD και CI στο Git. Διάβασε README, CAD_INDEX, CAD_STATUS, CAD_PARAMETRIC_CONTRACT και ενεργά CAD docs. Με νέα έγκριση, CAD-T008/C2 isolated sketch/constraint contract, χωρίς PCL integration. Engine 5.0.7 στο dab82e5ff2e6da4bde09e4a38aab32edfffe6d51 αμετάβλητη. Δύο ιδιωτικές πύλες πριν από ενσωμάτωση, καμία main αλλαγή. Νέο branch ανά έκδοση, διπλή επαλήθευση, Git-first.
