# CAD · εκδόσεις και κατάσταση εργασίας · μέρος 1

**Ενεργή εγγραφή: CAD-S017, αναθεώρηση 0.10 (26/11/2026).** Για scope βλ. CAD_STATUS.

## CAD-S000 · Αρχικό πλάνο · 22/11/2026

**Έκδοση εγγράφων: 0.1. Έκδοση λογισμικού CAD: δεν υπάρχει ακόμη.**

### Παραδόθηκαν

- `CAD_PROJECT_INSTRUCTIONS.md`: κανόνες και οδηγίες project.
- `CAD_NEXT_STEPS.md`: στόχος, αρχιτεκτονική προς δοκιμή, στάδια, μικρή ουρά και μήνυμα συνέχειας.
- `CAD_DECISIONS_01.md`: απαιτήσεις χρήστη, προτάσεις και ανοιχτά.
- `CAD_SOURCES.md`: αρχικές δημόσιες πηγές και συγκεκριμένα αρχεία που λείπουν.
- Αυτό το αρχείο κατάστασης.

### Τι ελέγχθηκε

- Αναγνώστηκαν το repository, η δομή, βασικά αρχεία αρχιτεκτονικής/CI και το συνημμένο `Επόμενα-βήματα-αποφάσεις-14.md`.
- Τα 437 tracked αρχεία του main `0921221` συγκρίθηκαν με το τοπικό zip με Git blob SHA: κανένα διαφορετικό/ελλείπον αρχείο.
- Αναγνώστηκαν το ιστορικό και οι αλλαγές μέχρι το `lab-5.0.7` `59e3046`, μαζί με το §98 για την Python κονσόλα. Το παλιό zip δεν παρουσιάζεται ως η 5.0.7.
- Οι CI `44949970247` και `44958367249` επιβεβαιώθηκαν success στο `0921221`.
- Ο CI `44985321597` για το `59e3046` εμφανιζόταν in_progress στον τελευταίο έλεγχο. Απαιτείται νέα ανάγνωση στην έναρξη.
- Δεν εκτελέστηκε η σουίτα λογισμικού ή prototype CAD. Η διπλή επιβεβαίωση υλοποίησης παραμένει μελλοντικό κριτήριο.

### Git

Καμία αλλαγή, commit, push, PR ή CAD branch. Καμία βάση υλοποίησης δεν έχει δηλωθεί από τον Θάνο.

## CAD-S001 · Αναθεώρηση πλάνου 0.2 · 22/11/2026

- Ορίστηκε από τον Θάνο η αρχική βάση: **5.0.7 αφού περάσει το CI και ενσωματωθεί στη main** (CAD-D012).
- Η πρώτη συνομιλία κάνει πραγματικό wait για CI και ενσωμάτωση, επιβεβαιώνει επιτυχή CI στο τελικό SHA της main, δεσμεύει αυτό το SHA και ξεκινά αυτόματα μόνο το CAD-T001 με SOL. Αν αυτά έχουν ήδη ολοκληρωθεί, τα επαληθεύει και προχωρά.
- Ενημερώθηκαν οδηγίες, ενεργό πλάνο/μήνυμα πρώτης συνομιλίας, αποφάσεις, παρόν ιστορικό και μητρώο πηγών. Η παλαιότερη CAD-S000 παραμένει ιστορικό της αρχικής κατάστασης.
- Δεν έγινε νέος έλεγχος GitHub, εκτέλεση CI ή υλοποίηση CAD σε αυτή τη συνομιλία οργάνωσης. Δεν δημιουργήθηκε branch/commit/push και δεν δόθηκε εντολή για merge/push στη main.
- Το project δημιουργήθηκε από τον Θάνο. Η διαθέσιμη λίστα πηγών του project είναι κενή· δεν επιβεβαιώθηκε αυτόματη προσθήκη των πέντε εγγράφων. Χρειάζεται η προσθήκη τους ως αρχεία του project.
- Επόμενο βήμα: προσθήκη των πέντε εγγράφων στο project και χρήση του ενημερωμένου μηνύματος πρώτης συνομιλίας από το CAD_NEXT_STEPS.md.

## CAD-S007 · 22/11/2026 · SOL · CAD-T001

**Κατάσταση: BLOCKED πριν από commit/push — όχι ολοκληρωμένο T001.** Η παρούσα εγγραφή είναι η ενεργή κατάσταση, υπερισχύει των ιστορικών CAD-S000/S001. Ο Θάνος ανέφερε ότι στο προηγούμενο βήμα είχε δημιουργηθεί το branch αλλά δεν είχε δημοσιευθεί κανένα CAD commit· δεν απαιτήθηκε παλιό workspace.

- Βάση engine: 5.0.7, `dab82e5ff2e6da4bde09e4a38aab32edfffe6d51`. CAD branch `lab-cad-0.1.0-baseline`, remote HEAD πριν/μετά της παρούσας εργασίας: ίδιο SHA. Αρχικά και `main`/`lab-5.0.7` ταυτίζονταν. Στον τελικό έλεγχο main και `lab-5.0.8` προχώρησαν στο `dad0daf47fc892d478ea8728dfd995dc9b933807` (5.0.8, τέσσερα commits απόγονος). Ο νεότερος κώδικας υλοποιεί το §98 Python console και αλλάζει κοινό app/API/CI· χαρτογραφήθηκε από read-only fetch, όχι αλλαγή βάσης.
- CI: source 44995758236, main 45001873759, CAD 45011321787 (ήταν in_progress στην προηγούμενη συνομιλία, τώρα όλα τα jobs success). Επαληθεύτηκε το ακριβές SHA στα checkout logs. CAD unit: 1.174 tests, 1.163 passed, 11 skipped· 947 API entries, 512/512 verify, NN max διαφορά 0· UI success, Octave success (9 tests), package success.
- Νέο clone από Git, 437 tracked αρχεία· έκδοση στον engine και `/api/health` 5.0.7. Νέα, μη δημοσιευμένα τεκμήρια `docs/CAD_INTEGRATION_MAP.md` και `docs/CAD_BASELINE.md`, παραδοτέα project files ως `CAD_INTEGRATION_MAP.md` και `CAD_BASELINE.md`. Δεν έγινε αλλαγή runtime/solver. Τα drafts δεν υπάρχουν ακόμη στο απομακρυσμένο Git.
- Τοπικά: codemap/API pass (947), 152 tests από 12 συναφείς suites: 151 passed, 1 skipped (Parquet readback), 33.990 s. Νέο verify PASS 512/512 και NN weights PASS, 16.000 δείγματα, max διαφορά 0. UI `window_flow` και `dock_flow` επιχειρήθηκαν: blocked πριν από assertions, `socket() failed: Operation not permitted` κατά την εκκίνηση Chromium. Octave δεν εκτελέστηκε (λείπει executable) και δεν εκτελέστηκε ολόκληρη η local unit suite. Εντολές και υπόλοιπα αποτελέσματα στο `CAD_BASELINE.md`.
- Ιστορικά αποτελέσματα από την προηγούμενη συνομιλία, όπως τα δήλωσε ο Θάνος: 91 integration tests, 90 pass, 1 skip, codemap/API pass, verify 512/512, NN 16.000 δείγματα max διαφορά 0. Δεν αθροίζονται με τα νέα tests ως ανεξάρτητα.
- Απόρρητο: **δεν εκτελέστηκε ο απαιτούμενος checker**· ο checker και τα ιδιωτικά inputs δεν παρέχονται. Τα τρέχοντα engine πλάνα/αποφάσεις/εκδόσεις μετά 5.0.5 δεν παρέχονται. Το `Επόμενα-βήματα-αποφάσεις-14.md` αφορά μέχρι 5.0.5. Δεν έγινε commit/push. Πραγματικός nethash/ERR δεν εφαρμόζεται σε documentation-only T001· λείπει ακόμη από τις διαθέσιμες πηγές για μελλοντικές solver/netlib/parts αλλαγές.
- Ενημερώθηκαν CAD plan 0.3, αποφάσεις D014–D016, πηγές, οδηγίες/ενεργή κατάσταση. Δεν έγινε main/engine write, ούτε ξεκίνησε CAD-T002/kernel. Ακριβές επόμενο μήνυμα στο `CAD_NEXT_STEPS.md`, με βάση το πραγματικό απομακρυσμένο HEAD.
- Επόμενο: μόνο CAD-T001/SOL, αφού δοθούν/ελεγχθούν τα δύο υποχρεωτικά σύνολα υλικού (ενεργά engine docs, πραγματικός privacy checker και private inputs), εφαρμογή των draft docs από project files, μικρά commit/push στο CAD branch, επιτυχής CI στο νέο τελικό SHA. Καμία απαίτηση ZIP ή παλιού τοπικού workspace.

## CAD-S008 · 23/11/2026 · SOL · CAD-T001 — δημοσίευση και ανάκτηση

- Εγκεκριμένη βάση engine αμετάβλητη: 5.0.7/dab82e5ff2e6da4bde09e4a38aab32edfffe6d51.
- Δημοσιεύθηκαν τα 5660e9b (ανακατασκευή baseline/map/status), c169ffc (πολιτική νέου branch ανά CAD version) και f57d02f (πραγματική ανάκτηση S007 και εμπλουτισμός του χάρτη).
- Το c169ffc έχει CI 45093234600 success και στα τέσσερα jobs, επανελεγμένο απευθείας. Το f57d02f έχει CI 45101812370, που παρακολουθείται ως ενδιάμεσο checkpoint· δεν πιστοποιεί τον επόμενο νέο SHA.
- Ανακτήθηκαν τα πραγματικά αρχικά CAD-S007 map/baseline, η εγγραφή S007 και τα πέντε planning docs 0.3, μαζί με S006 checkpoint. Η ανάκτηση αυτή δεν μετατρέπει το παλαιότερο reconstructed checkpoint σε original draft.
- Τοπικά στη συνέχεια: CODEMAP/API PASS (947), NN weights PASS με μέγιστη διαφορά 0, verify 512/512 και 24 tests docking/live-program/recording PASS. Οι επανεκτελέσεις δεν αθροίζονται. Τοπικός browser μπλοκαρισμένος από socket permission πριν app assertions, Octave απόν.
- Στο f57d02f και τα 437 αρχικά tracked αρχεία της βάσης παρέμεναν byte-identical. Οι πραγματικές private-check και ενεργές engine handoff πύλες δεν λύθηκαν. T001 ανοιχτό.

## CAD-S009 · 23/11/2026 · SOL · CAD-T001 — πλήρες πλάνο στο Git

**Αναθεώρηση εγγράφων 0.4· ίδια έκδοση λογισμικού CAD/ίδιο branch lab-cad-0.1.0-baseline.**

- Ο ιδιοκτήτης ζήτησε να συντηρείται όλο το αναλυτικό CAD πλάνο στο Git για κοινή ανάγνωση και μελλοντική ενσωμάτωση, και το root README να παρουσιάζει το CAD tool (D020–D021).
- Προστέθηκαν σε κανονικά ονόματα τα CAD_PROJECT_INSTRUCTIONS, CAD_NEXT_STEPS, CAD_DECISIONS_01, CAD_VERSIONS_01, CAD_SOURCES από τα πραγματικά ανακτημένα 0.3 και επικαιροποιήθηκαν σε 0.4.
- Προστέθηκαν CAD_INDEX και CAD_PLAN_DETAILS με σειρά ανάγνωσης, πλήρη κριτήρια σταδίων, εξαρτήσεις, απόδοση, persistence/workers/playback όρια, μελλοντικό motion/AI και πρωτόκολλο ενσωμάτωσης.
- Ενημερώνονται baseline/map/status ώστε η νέα διευρυμένη άδεια δημόσιας τεκμηρίωσης να μη συγχέεται με γενική privacy εξαίρεση. Δεν δημοσιεύονται ιδιωτικά inputs ή νέο runtime.
- Το root README αλλάζει στο CAD branch κατόπιν εντολής· από τα 437 αρχικά tracked αρχεία της βάσης, 436 παραμένουν ίδια και μόνο το README αλλάζει ως τεκμηρίωση. Το αρχικό παραμένει διαθέσιμο στο approved SHA. Engine/version, κώδικας, dependencies, API και workflow παραμένουν ίδια.
- Το τελευταίο δημοσιευμένο HEAD πριν από αυτό το checkpoint είναι f57d02f07895dd0fa1fb73ec221dc70cdac566c1. Το νέο πραγματικό SHA προκύπτει από το commit/Git· η παράδοση οφείλει να δώσει το δικό του τελικό CI, όχι να δανειστεί το παλιό.
- Έλεγχοι παράδοσης: ενεργά docs/αποφάσεις ξαναδιαβάζονται, έλεγχος paths/links/συνοχής και diff/identity/source hashes, κατάλληλοι υπάρχοντες έλεγχοι και ενεργή αναμονή CI στο τελικό SHA. Ακριβές αποτέλεσμα δημοσίευσης/CI στην τελική παράδοση και σε επανέλεγχο Git.
- Τα δημόσια CAD docs συντηρούνται πλέον στο Git, οπότε δεν χρειάζεται νέα ανάρτησή τους στο project όταν επιβεβαιωθεί το remote SHA. Τα ενεργά engine docs και ο πραγματικός privacy checker/inputs παραμένουν απαραίτητα ιδιωτικά για κλείσιμο T001/κώδικα. Δεν άνοιξε CAD-T002 ή υλοποίηση renderer/kernel.

## CAD-S010 · 23/11/2026 · SOL · CAD-T001 — αυτοτελές Git handoff

- Incoming CAD HEAD f91ac3cd7852fdb7df651baad3992be91264674c, CI 45107396018: exact SHA, completed/success, 4/4 jobs, επανελεγμένα. Νέο documentation-only checkpoint στο ίδιο branch. Η βάση engine 5.0.7/dab82e5ff2e6da4bde09e4a38aab32edfffe6d51 παραμένει αμετάβλητη.
- Read-only παρατήρηση: main στο 5.0.9 b1b42b0, lab-5.0.10 στο 2160a13d7180745e80f7f3fefa07788d30b37d1f (CI 45102252449 success). Ο χάρτης ενσωμάτωσης εμπλουτίστηκε για layouts, δεύτερη οθόνη, κύκλο ζωής κάρτας και διαχωρισμό solver GPU* από CAD renderer. Δεν έγινε merge ή αλλαγή βάσης.
- Νέος κανόνας ιδιοκτήτη D023: κάθε επόμενη συνομιλία βρίσκει τη δημοσιεύσιμη συνέχεια στο Git, χωρίς επαναλαμβανόμενη αναζήτηση παλιών chats/Library/ZIP. Τα απαιτούμενα μη διαθέσιμα ιδιωτικά inputs καταγράφονται ως συγκεκριμένες εκκρεμότητες, δεν επινοούνται και δεν δημοσιεύονται.
- Φρέσκοι τοπικοί έλεγχοι: CODEMAP/API PASS (947), 24 dock/live-program/recording PASS, verify 512/512, NN weights max διαφορά 0, relative links/anchors και diff check PASS. 436 από 437 tracked base files αμετάβλητα· μοναδική αλλαγή παλιού αρχείου το owner-authorized README, δέκα νέα CAD docs. Καμία αλλαγή runtime/solver/workflow. Οι τοπικοί έλεγχοι και οι παλιές μετρήσεις δεν αθροίζονται.
- Δεν βρέθηκαν τα ενεργά ιδιωτικά engine handoff και privacy checker/inputs μετά την επανεξέταση. CAD-T001 παραμένει ανοιχτό όσο απαιτούνται οι δύο πύλες· δεν έγινε CAD-T002. Η ειδική άδεια δημόσιας τεκμηρίωσης δεν αντικαθιστά τον πραγματικό checker.
- Το πραγματικό τελικό SHA και το δικό του CI επιβεβαιώνονται στη δημοσίευση/παράδοση. Η επόμενη συνομιλία χρησιμοποιεί README/CAD_INDEX/CAD_STATUS από το Git, όχι τοπικά/παλιά snapshots.

## CAD-S011 · 23/11/2026 · SOL · CAD-T001 — τελικό documentation-only checkpoint

- Incoming δημοσιευμένο SHA b8fbc8abab4b02c8e01783dee10d0740a9bc32f2, CI 45122428998: ενδιάμεσο, δεν πιστοποιεί αυτό το checkpoint. Κατόπιν νέας ρητής έγκρισης D024 ολοκληρώνεται το T001 ως documentation-only με τελικό επιτυχές CI στο ακριβές νέο SHA. Οι δύο ιδιωτικές πύλες μεταφέρονται πριν από οποιαδήποτε CAD υλοποίηση, δεν θεωρούνται ελεγμένες.
- D025: κοινή ανάπτυξη engine με τον Θάνο πάνω στο repo 5.0.7, πιθανή ενίσχυση από Fable, ενδεικτική αρχιτεκτονική και τεχνικά θέματα αξιολόγησης στο CAD_PLAN_DETAILS. Δεν επιλέγεται αρχιτεκτονική οριστικά, δεν ξεκινά ανάπτυξη ή T002.
- Όλα τα ενεργά public CAD docs ενημερώνονται συνεκτικά με D023–D025. Οι προηγούμενες εγγραφές παραμένουν ιστορικό. Η προϋπόθεση τελικού CI δεν παρακάμπτεται. Ακριβές τελικό SHA/run στην παράδοση και από Git.
- Βάση dab82e5ff2e6da4bde09e4a38aab32edfffe6d51, ίδιο branch, αμετάβλητος runtime/solver/CI workflow. Οι έλεγχοι S010 παραμένουν στο ίδιο runtime tree· τελικός έλεγχος source diff, links και identity πριν από δημοσίευση.
- Επόμενη συνομιλία: README/CAD_INDEX/CAD_STATUS στο Git, χωρίς αναζήτηση παλιών αρχείων. Καμία αυτόματη εκκίνηση T002. Κώδικας μόνο με ρητή νέα εντολή και επίλυση των πραγματικών πυλών.

## CAD-S012 · 23/11/2026 · SOL · CAD-T002 — isolated kernel spike

- Incoming e997a3d24f29906be9768e6fc9fb8fce63f4895b (T001, CI 45124099619 4/4), νέο branch lab-cad-0.2.0-kernel, intermediate 7fbcc0d63d258f57afd31c0e42acfcf9285405ba. Βάση 5.0.7/dab82e5 αμετάβλητη. Δεν είναι CAD runtime release.
- D026–D027: συνθετικό benchmark CadQuery 2.7.0 / build123d 0.10.0, ίδιο OCP 7.8.1.1.post1· exact validation, τρεις παραλλαγές STEP round-trip, 15 builds και fresh tessellations ανά wrapper, pip check PASS. Μετρήσεις, source, architecture, Fable review: CAD_KERNEL_EVALUATION και experiments/cad_t002/benchmark.py.
- Επιλογή OCCT + αρχικός build123d adapter, δικό μας CAD document και GPU layer. Δεν εκτελέστηκε GPU benchmark ούτε fresh cross-platform installation. Ιδιωτικές πύλες ακόμη εκκρεμούν για υλοποίηση στο PCL, nethash/ERR δεν ενεργοποιείται αφού solver/netlib/parts δεν άλλαξαν.
- Pinned engine 5.0.7, local codemap/API 947, 24/24 dock/live-program/recording, 60 relative file links και diff integrity PASS. Existing PCL CI δεν τρέχει το isolated CAD benchmark· η επαλήθευσή του είναι τοπική.
- Επιτυχές CI στο πραγματικό τελικό SHA απαιτείται για κλείσιμο. Επόμενο χωριστά εγκεκριμένο T003/SOL neutral document/component contract, χωρίς ενσωμάτωση εφόσον λείπουν τα ιδιωτικά inputs. Fable backlog στο CAD_KERNEL_EVALUATION.

## CAD-S013 · 23/11/2026 · SOL · CAD-T003 — isolated document engine

- Incoming T002 `43f7fe301122c2942d61a4badc5fb4a4ccf461af`, CI 45135806207 completed/success, 4/4 jobs. Νέο `lab-cad-0.3.0-document`, approved 5.0.7/dab82e5 αμετάβλητη.
- D028: `experiments/cad_t003/document.py`, `demo.py`, `test_document.py` και CAD_DOCUMENT_CONTRACT. JSON schema 1, typed parameters, feature DAG, shaft/ports/material, atomic revisioned parameter edits, undo/redo, persistence snapshot. Δεν εκτελείται πραγματικό geometry build.
- Τοπικά (Python 3.12.14): 12/12 isolated unittest methods, demo parameter resolution/round-trip, CODEMAP/API 947, 24/24 υπάρχοντα dock/live-program/recording tests. CI workflow αμετάβλητο, δεν τρέχει το isolated T003 suite· απαιτείται επιτυχές CI του τελικού SHA για το pinned PCL. Τρέχον SHA/CI από remote, όχι self-referential commit.
- Πύλες: πραγματικό engine handoff/privacy procedure ακόμη εκκρεμούν πριν από PCL ενσωμάτωση· δεν χρησιμοποιήθηκαν ιδιωτικά inputs. nethash/ERR δεν ενεργοποιείται (solver/netlib/parts αμετάβλητα). Fable review στο CAD_DOCUMENT_CONTRACT. Επόμενο χωριστά εγκεκριμένο T004 worker/job contract, όχι ενσωμάτωση ή αυτόματη έναρξη.

## CAD-S014 · 25/11/2026 · SOL · CAD-T004 — isolated worker contract

- T003 τελικό `c9fe513eb984653741519b93ff177796150a66cd`, CI 45149843737 completed/success και 4/4 jobs, επιβεβαιωμένα. Νέο `lab-cad-0.4.0-workers` από το ακριβές remote SHA· approved 5.0.7/dab82e5 αμετάβλητη.
- D029: `experiments/cad_t004/worker.py`, `demo.py`, `test_worker.py`, CAD_WORKER_CONTRACT. Immutable requests, session/revision/current-content identity, conservative adapter/kernel/tolerance/dependency cache keys, bounded FIFO, LRU bytes/entries, cooperative cancellation και stale rejection πριν από delivery. Static logical live CPU/RAM reserve, χωρίς native geometry/process ή integration.
- Python 3.12.14: 11/11 T004 + 12/12 T003 tests, demo miss/miss/hit σε revisions 0/1/2 (radius 10/16/10 mm), work budget 28 MiB, 2 CAD slots, δύο cached results 304 bytes. CODEMAP/API 947 και 24/24 existing dock/live-program/recording tests PASS. Workflow unchanged, δεν τρέχει το isolated suite· τελικό πραγματικό SHA/CI απαιτείται για κλείσιμο.
- Οι δύο ιδιωτικές πύλες δεν εκτελέστηκαν ούτε παρακάμφθηκαν για PCL runtime. Καμία ιδιωτική είσοδος· μόνο public CAD docs/isolated experiment. nethash/ERR δεν εφαρμόζεται. Fable backlog στο CAD_WORKER_CONTRACT: process transport/cancel, scheduler fairness, incremental feature cache, dynamic solver arbitration και μετρήσεις. Επόμενο χωριστά εγκεκριμένο T005 native adapter, όχι αυτόματο.

## CAD-S015 · 25/11/2026 · SOL · CAD-T005 native adapter

- Νέο `lab-cad-0.5.0-native` από `1af4de0fba3f2b20ffd4c16cb276df6b9323d9aa`, CI 45561734591 4/4. Engine 5.0.7 αμετάβλητη. D030: T005 και T006 χωριστά branches/CI.
- Native OCCT BRep και αναλυτικός έλεγχος cylinder σε child process, T004 revision/cache/cancellation. 25/25 isolated tests, demo και CODEMAP/API 947 PASS. Αριθμοί και Fable review στο CAD_NATIVE_ADAPTER. CI υπάρχοντος PCL χωριστά από local tests· κλείσιμο στο πραγματικό SHA.
- Καμία ιδιωτική είσοδος, integration/runtime/main αλλαγή. Οι πραγματικές ιδιωτικές πύλες παραμένουν. T006 μόνο μετά από πιστοποιημένο T005 CI.

## CAD-S016 · 25/11/2026 · SOL · CAD-T006 viewport

- Parent T005 `fb25e821419831a109db4b9e5a043e4a9aabad9d` / CI 45599503711 independently verified completed/success, exact SHA, 4/4 jobs. Local tested T005 tree 07f2d1a9e9e6b24d5dcb074667bf085ca7bcd2b9 equals remote tree, author/committer verified; API transfer D031. New branch `lab-cad-0.6.0-viewport`, engine 5.0.7 unchanged.
- `experiments/cad_t006/`: actual T005 fixture, WebGL2 retained buffers, orbit/pan/zoom/fit, body selection, bounded JSON, resize/context recovery. 7/7 Node tests, 25/25 Python regression, CODEMAP/API 947 PASS. Local browser unavailable; CAD-conditional actual WebGL2 smoke added to existing UI job. Final CI required at actual T006 SHA.
- Only docs, isolated experiments, CAD-conditional CI step. No integration into PCL, no private inputs, no change to solver/netlib/parts; nethash not applicable. Two private gates still open. Fable backlog in CAD_VIEWPORT_CONTRACT and CAD_NATIVE_ADAPTER. No automatic T007.

## CAD-S017 · 26/11/2026 · SOL · T007

T007 isolated parametric GUI/Python transactions, native rebuild, undo/redo and save/open; parent T006 `68a465be` / CI 45649705613 (4/4). Final T007 CI required on actual HEAD. No PCL integration; both private gates remain open.

Branch created from exact T006 SHA. Reference code and tests in experiments/cad_t007, contract in CAD_PARAMETRIC_CONTRACT. Local clone DNS blocked; native/browser tests added to existing UI CI, pending final CI verification. No private inputs or engine changes.

## Πρότυπο επόμενης εγγραφής

```text
CAD-Sxxx · ημερομηνία · SOL/ASTRA · CAD-Txxx
Βάση engine: έκδοση / branch / ακριβές SHA, δηλωμένη από Θάνο.
CAD branch / HEAD πριν και μετά:
Συγκεκριμένο παραδοτέο και αρχεία:
Τοπικοί έλεγχοι: εντολές, αποτέλεσμα, περιβάλλον, log/artifact.
GitHub CI: run ID, SHA, status/conclusion.
Απόρρητο και nethash/ERR: αποτέλεσμα ή γιατί δεν εφαρμόζεται.
Μετρήσεις: δεδομένα και τρόπος αναπαραγωγής.
Τι ολοκληρώθηκε / τι έμεινε / εμπόδια:
Ενημερωμένα έγγραφα και νέες αποφάσεις:
Επόμενο μικρό βήμα, SOL/ASTRA και απαιτούμενες πηγές:
Ακριβές μήνυμα συνέχειας:
```
