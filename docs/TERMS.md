# Λίστα όρων (4.6, αποφάσεις 51 και 54)

Οι όροι που χρησιμοποιεί η εφαρμογή, τα tutorials, οι κάρτες θεωρίας και τα έγγραφα. Κανόνας (ROADMAP §1): ο καθιερωμένος ελληνικός όρος, όχι κατά λέξη μετάφραση από τα αγγλικά· ο αγγλικός σε παρένθεση την πρώτη φορά όπου βοηθά· όπου δεν υπάρχει καθιερωμένος ελληνικός όρος μένει ο αγγλικός. Κάθε λάθος που βρίσκεται διορθώνεται παντού (`git grep`) και μπαίνει εδώ.

## Διορθώσεις (τι γράφουμε, τι όχι)

| Αγγλικά | Γράφουμε | Όχι | Από |
|---|---|---|---|
| plant | σύστημα υπό έλεγχο (plant) | φυτό | 4.5 |
| duty ratio, duty cycle | λόγος κατάτμησης D | duty, «το duty» | 4.6 |
| feedforward | πρόσθια τροφοδότηση (feedforward) | feedforward σκέτο σε ελληνικό κείμενο | 4.6 |
| knee voltage (δίοδος) | τάση κατωφλίου V_f | τάση γονάτου | 4.6 |
| inverse-Γ equivalent circuit | ισοδύναμο αντίστροφου Γ | ανάστροφο-Γ | 4.6 |
| switched reluctance machine | μηχανή μεταβλητής μαγνητικής αντίστασης (SRM) | μηχανή μαγνητικής αντίστασης με διακόπτες | 4.6 |
| rate transition | αλλαγή ρυθμού δειγματοληψίας | μετάβαση ρυθμού | 4.6 |
| turn-on / turn-off energy | ενέργεια έναυσης E_on / σβέσης E_off | ενέργεια ανοίγματος | 4.6 |
| latch | μανδαλωτής (latch) | latch σκέτο | 4.6 |
| sample and hold | δειγματοληψία και συγκράτηση (S&H) | Sample & Hold σε ελληνικό κείμενο | 4.6 |
| full bridge | πλήρης γέφυρα | full-bridge | 4.6 |
| DC offset | συνεχής συνιστώσα (DC offset) | | 4.6 |
| multilayer perceptron (MLP) | νευρωνικό δίκτυο πολλών στρωμάτων (MLP) | perceptron σκέτο | 4.7 |
| learning rate | ρυθμός μάθησης η | learning rate σε ελληνικό κείμενο | 4.7 |
| feedback-error learning | μάθηση από το σήμα σφάλματος (feedback-error learning): το δίκτυο μαθαίνει από ό,τι δίνει ακόμη ο ελεγκτής ανάδρασης | | 4.7 |
| inverse model | αντίστροφο μοντέλο (ποια είσοδος δίνει την επιθυμητή έξοδο) | ανάστροφο | 4.7 |
| online / offline training | εκπαίδευση μέσα στην προσομοίωση (online) / από δεδομένα, πριν (offline) | | 4.7 |
| freeze (learning) | πάγωμα της μάθησης | πάγωσε τα βάρη ως «freeze» | 4.7 |
| weights, biases | βάρη, πολώσεις | | 4.7 |
| multiplexer / demultiplexer | πολυπλέκτης (Mux) / αποπολυπλέκτης (Demux) | | 4.6 |
| grid-forming / grid-following | μετατροπέας που σχηματίζει την τάση (grid-forming) / που ακολουθεί το δίκτυο (grid-following)· στους τίτλους και στην ομάδα των tutorials ο αγγλικός όρος, όπως στη βιβλιογραφία | «διαμόρφωσης δικτύου» (μπερδεύεται με τη διαμόρφωση PWM) | 4.18 |
| frequency nadir | βύθισμα της συχνότητας (η μεγαλύτερη απόκλιση μετά από διαταραχή) | «ναδίρ» | 4.18.1 |
| continuation power flow | συνεχιζόμενη ροή φορτίου | «ροή φορτίου συνεχούς παραμέτρου», «ροή συνεχούς παραμέτρου» (έτσι γράφτηκε στην 4.19.1) | 4.19.5 |
| RoCoF (rate of change of frequency) | ρυθμός μεταβολής της συχνότητας (RoCoF), σε παράθυρο T | — | 4.18.1 |
| robust vector current control | στιβαρός έλεγχος ρεύματος (για κάθε ισχύ δικτύου) | «εύρωστος» | 4.18.1 |
| droop (P–f, Q–V) | στατικότητα P–f, Q–V | «πτώση», droop σκέτο | 4.18 |
| virtual synchronous machine (VSM), synchronverter | εικονική σύγχρονη μηχανή (VSM)· synchronverter το σχήμα των Zhong & Weiss | «εικονική γεννήτρια» για το σχήμα των Zhong & Weiss | 4.18 |
| power-synchronization control (PSC) | συγχρονισμός μέσω ισχύος (PSC) | «έλεγχος συγχρονισμού ισχύος» | 4.18 |
| virtual impedance | εικονική εμπέδηση (R_v + jX_v) | | 4.18 |
| refactorization | επαναπαραγοντοποίηση (με τους ίδιους οδηγούς) | αναπαραγοντοποίηση | 4.19 |
| pivot, pivoting | οδηγός, οδήγηση (pivot την πρώτη φορά) | περιστροφή, άξονας | 4.19 |
| factorization path | διαδρομή παραγοντοποίησης | μονοπάτι factorization | 4.19 |
| digital twin | ψηφιακό δίδυμο (digital twin την πρώτη φορά) | ψηφιακός δίδυμος | 4.19 |
| GIS (geographic) / GIS (gas-insulated) | GIS (γεωχωρικό) / υποσταθμός GIS (SF6) | σκέτο «GIS» όπου μπερδεύεται | 4.19 |
| optimal power flow (OPF) | βέλτιστη ροή φορτίου (OPF) | βέλτιστη ροή ισχύος | 4.19.1 |
| power flow (ως συνώνυμο του load flow) | ροή φορτίου | ροή ισχύος για τη μελέτη (η «ροή ισχύος» ενός κλάδου μένει) | 4.19.1 |
| mismatch (power, current) | υπόλοιπο (ισχύος, ρεύματος) | ασυμφωνία, αναντιστοιχία | 4.19.1 |
| contingency, outage (N−1) | διαταραχή, απώλεια (κλάδου)· ανάλυση N−1 | ενδεχόμενο, έκτακτο γεγονός | 4.19.1 |
| binding constraint | περιορισμός που δεσμεύει | ενεργός περιορισμός χωρίς εξήγηση, δεσμευτικός | 4.19.1 |
| dispatch | κατανομή (της παραγωγής) | αποστολή, dispatch | 4.19.1 |
| batch (of scenarios) | παρτίδα (σεναρίων) | δέσμη, batch | 4.19.1 |
| slack variable | χαλαρή μεταβλητή (slack την πρώτη φορά) | μεταβλητή χαλαρότητας· να μην μπερδεύεται με τον ζυγό ταλάντωσης (slack bus) | 4.19.1 |
| globalization (of Newton's method) | σφαιρικοποίηση | παγκοσμιοποίηση | 4.19.1 |
| report object | αντικείμενο αναφοράς | report object, αντικείμενο report | 4.19.1 |
| warm start | θερμή εκκίνηση (warm start την πρώτη φορά)· «από την πρόταση» στο περιβάλλον | ζεστή εκκίνηση, warm-start σημείο | 4.19.2 |
| cold start (of a solver) | κανονική εκκίνηση· «κρύα» μόνο σε αντιπαράθεση με τη θερμή | ψυχρή εκκίνηση (είναι όρος των μονάδων παραγωγής) | 4.19.2 |
| starting point (learned) | αρχικό σημείο· νευρωνικό αρχικό σημείο | αρχική εκτίμηση, initial guess, σημείο εκκίνησης | 4.19.2 |
| experimental | πειραματικό (με αστερίσκο και υποσημείωση όπου φαίνεται στον χρήστη) | δοκιμαστικό, beta | 4.19.2 |
| accelerator | επιταχυντής | accelerator, επιταχυντής υλικού | 4.19.2 |
| fingerprint (of a network) | αποτύπωμα | υπογραφή, hash, δακτυλικό αποτύπωμα | 4.19.2 |
| explicit inverse | ρητός αντίστροφος | άμεσος αντίστροφος, πλήρης αντίστροφος | 4.19.2 |
| level scheduling | τριγωνικές λύσεις ανά επίπεδο | χρονοπρογραμματισμός επιπέδων | 4.19.2 |
| DC load flow (of a DC grid) | ροή φορτίου του δικτύου DC· μαζί με το AC: ροή φορτίου AC/DC | «ροή φορτίου DC» σκέτο: είναι η γραμμική προσέγγιση της ροής AC (`dc_flow`, μελέτη `dc`) | 4.20 |
| DC voltage droop (control) | στατικότητα τάσης DC (droop): P–U ή I–U | πτώση τάσης, «droop» σκέτο σε ελληνικό κείμενο | 4.20 |

## Καθιερωμένοι όροι που ήδη χρησιμοποιούνται

| Αγγλικά | Ελληνικά |
|---|---|
| gain | κέρδος |
| carrier | φέρον (σήμα) |
| gate (διακόπτη), firing | πύλη, έναυση |
| dead time | νεκρός χρόνος |
| armature | τύμπανο (μηχανή ΣΡ) |
| leakage / magnetizing inductance | αυτεπαγωγή σκέδασης / μαγνήτισης |
| no-load current / losses | ρεύμα κενού / απώλειες σιδήρου |
| short-circuit voltage, copper losses | τάση βραχυκύκλωσης u_k, απώλειες χαλκού |
| fault, circuit breaker | σφάλμα, διακόπτης ισχύος |
| travelling waves, surge impedance | οδεύοντα κύματα, κυματική αντίσταση |
| modes (of a line) | ρυθμοί |
| solver, time step | λύτης, βήμα |
| trapezoidal rule, backward Euler | τραπεζοειδής κανόνας, προς τα πίσω Euler (BE) |
| stiff | άκαμπτο (σύστημα) |
| event | συμβάν |
| subcircuit, bus, wire, pin, port | υποκύκλωμα, δίαυλος, σύρμα, ακροδέκτης, θύρα |
| add-on | πρόσθετο |
| live parameter | ζωντανή παράμετρος |
| steady state, transient | μόνιμη κατάσταση, μεταβατικό |
| rise time, overshoot, settling time | χρόνος ανόδου t_r, υπερύψωση, χρόνος αποκατάστασης t_s |
| cutoff frequency, bandwidth, damping | συχνότητα αποκοπής, εύρος ζώνης, απόσβεση |
| low-pass / high-pass / band-pass | βαθυπερατό / υψηλοπερατό / ζωνοπερατό |
| rated power / voltage | ονομαστική ισχύς / τάση |
| per unit | ανά μονάδα (pu) |
| load flow | ροή φορτίου |
| frequency-dependent line | γραμμή με εξάρτηση από τη συχνότητα |
| tile, watch panel | πλακίδιο, πάνελ «Σήματα» (σήματα και έλεγχοι πάνω στο σχέδιο) |
| façade (of a block) | πρόσοψη (το παράθυρο ενός μπλοκ με τους τρόπους, τις τιμές και τα κουμπιά του) |
| emulator (neural), specialized inverse learning | εξομοιωτής, αντίστροφος έλεγχος με εξομοιωτή |
| reference governor | ρυθμιστής αναφοράς |
| torque allocation, keep | κατανομή ροπής, κράτηση ροπής |
| slew rate | ρυθμός μεταβολής |
| regenerative braking | ανάκτηση (πέδηση με ανάκτηση) |
| road load, grade | φορτίο δρόμου, κλίση |
| driving cycle | κύκλος οδήγησης |
| state of charge (SOC) | κατάσταση φόρτισης (SOC) |
| logging to a file, recording resolution | καταγραφή σε αρχείο, ανάλυση καταγραφής |
| exciter, excitation system, AVR | διεγέρτρια, σύστημα διέγερσης, αυτόματος ρυθμιστής τάσης (AVR) |
| power system stabilizer (PSS) | σταθεροποιητής συστήματος ισχύος (PSS) |
| governor, speed droop, permanent / transient droop | ρυθμιστής στροφών, στατικότητα, μόνιμη / μεταβατική στατικότητα |
| reheater, steam chest, crossover | αναθερμαντήρας, θάλαμος ατμού, σωλήνας μεταφοράς (crossover) |
| penstock, water starting time, gate | αγωγός πτώσης, χρόνος εκκίνησης νερού T_W, θυρόφραγμα |
| transient gain reduction | μείωση μεταβατικού κέρδους |
| policy search, evolution strategies | αναζήτηση πολιτικής, στρατηγικές εξέλιξης (ES) |
| transient recovery voltage (TRV), rate of rise (RRRV) | μεταβατική τάση επαναφοράς (TRV), ρυθμός ανόδου της TRV (RRRV) |
| terminal fault, short-line fault (SLF) | σφάλμα ακροδεκτών, σφάλμα κοντινής γραμμής (SLF) |
| first-pole-to-clear factor k_pp, amplitude factor k_af | συντελεστής πρώτου πόλου k_pp, συντελεστής πλάτους k_af |
| reference line, delay line, envelope | γραμμή αναφοράς, γραμμή καθυστέρησης, περιβάλλουσα |
| contact separation, current zero, post-arc current | χωρισμός επαφών, μηδέν του ρεύματος, ρεύμα μετά το τόξο |
| thermal / dielectric reignition | θερμική / διηλεκτρική επανέναυση |
| black-box arc model, cooling power | μοντέλο τόξου μαύρου κουτιού, ισχύς ψύξης |
| backflashover | ανάστροφη υπερπήδηση |
| shielding failure | αστοχία θωράκισης |
| footing resistance, soil ionization | αντίσταση γείωσης του πύργου (της βάσης), ιονισμός του εδάφους |
| insulator string, critical flashover voltage (CFO, U₅₀) | αλυσίδα μονωτήρων, τάση διάσπασης 50 % |
| lightning impulse withstand level (LIWL, BIL) | επίπεδο αντοχής σε κεραυνό |
| insulation coordination, safety factor | συντονισμός μόνωσης, συντελεστής ασφαλείας |
| protective distance | απόσταση προστασίας |
| bushing, gas-insulated substation (GIS), bus duct | διαπεραστής, υποσταθμός με μόνωση αερίου (GIS), ζυγός GIS |
| note (on the drawing) | σημείωση |
| implementation: fast / detailed (from elements) | υλοποίηση: γρήγορη / αναλυτική (από στοιχεία) |
| expand into a subcircuit, look inside | ανάπτυξη σε υποκύκλωμα, «τι έχει μέσα» |
| leader progression model (LPM), disruptive effect | μοντέλο προόδου οχετού (LPM), ολοκληρωτική μέθοδος (ενέργεια διάσπασης) |
| volt–time curve | καμπύλη τάσης–χρόνου |
| black-box component (locked model) | στοιχείο «μαύρο κουτί» (κλειδωμένο μοντέλο) |
| policy (RL), episode | πολιτική, επεισόδιο |
| modular multilevel converter (MMC), cascaded H-bridge (CHB), cell / submodule | αρθρωτός πολυεπίπεδος μετατροπέας, γέφυρες H σε σειρά, υπομονάδα |
| nearest level control (NLC), capacitor voltage balancing (sorting) | διαμόρφωση πλησιέστερης στάθμης, εξισορρόπηση τάσεων πυκνωτών (ταξινόμηση) |
| reduced switching frequency | μειωμένη συχνότητα μεταγωγής |
| static synchronous series compensator (SSSC), modular SSSC (m-SSSC) | στατός σύγχρονος αντισταθμιστής σειράς, αρθρωτός SSSC |
| second-order generalized integrator (SOGI) | γενικευμένος ολοκληρωτής δεύτερης τάξης |
| central (three-phase) controller | κεντρικός ελεγκτής (των τριών φάσεων) (4.17) |
| inter-phase (cluster) balancing | εξισορρόπηση ανάμεσα στις φάσεις (4.17) |
| reference advance (sampling-delay compensation) | προπορεία της αναφοράς (4.17) |
| converter-controlled series capacitor (CCSC, εδώ του m-SSSC· όχι η καταστολή του κυκλοφορούντος ρεύματος του MMC) | πυκνωτής σειράς ελεγχόμενος από μετατροπέα (CCSC) (4.17) |
| natural point, boost mode (CCSC) | φυσικό σημείο, boost (4.17) |
| state-space averaging, averaged model | μέσο μοντέλο χώρου κατάστασης, μέσο μοντέλο (4.17) |
| crossover frequency f_c | συχνότητα διέλευσης f_c (4.17) |
| phase margin, gain margin | περιθώριο φάσης, περιθώριο κέρδους (4.17) |
| peak sensitivity M_s | μέγιστη ευαισθησία M_s (4.17) |
| right-half-plane (RHP) zero | μηδενικό στο δεξί ημιεπίπεδο (4.17) |
| role (of an element in a topology) | ρόλος (στοιχείου στο πρότυπο), λίστα ρόλων (4.17) |
| guard band / out-of-band samples (of a rational fit) | ζώνη ασφαλείας, δείγματα ασφαλείας (4.17) |
| convergence method (adaptation factor) | μέθοδος σύγκλισης (παράγοντας προσαρμογής s) (4.17.4) |
| parameter drift | εκτροπή των βαρών (4.17.4) |
| technical look / classic look | τεχνική όψη / κλασική όψη (4.17.3) |
| crisp edges (no antialiasing) | γραμμές σε ακέραια pixel, χωρίς εξομάλυνση (4.17.3) |
| steady autoscale | σταθερή αυτόματη κλίμακα (4.17.2) |
| min–max shade, mean line | σκιά min–max, γραμμή της μέσης (4.17.2) |
| circuit input (global parameter) | είσοδος του κυκλώματος (4.17.1) |
| parameter expression | παράμετρος από έκφραση («= …») (4.17.1) |
| coupling transformer / coupling inductance | μετασχηματιστής / αυτεπαγωγή σύζευξης |
| compensator placement, Pareto front | θέση του αντισταθμιστή, μέτωπο Pareto |
| steady-state initialization (of a line) | εκκίνηση από μόνιμη κατάσταση (4.12) |
| transposition sections, perfect transposition | μεταθέσεις σε (χωριστά) τμήματα, τέλεια μετάθεση (μέσος όρος) (4.12) |
| sensitivity (of the sequence parameters) | ευαισθησία (των παραμέτρων ακολουθιών) (4.12) |
| temperature coefficient of resistance | θερμικός συντελεστής της αντίστασης, α (4.12) |
| reference (kept) scan | αναφορά, κρατημένη σάρωση (4.12) |
| recording viewer | παράθυρο προβολής της καταγραφής (4.12) |
| operating voltage | τάση λειτουργίας (4.12) |
| wideband model, universal line model (ULM) | μοντέλο wideband (WB), ULM, στο πεδίο των φάσεων (4.13) |
| propagation function, characteristic admittance | συνάρτηση διάδοσης H, χαρακτηριστική αγωγιμότητα Y_c (4.13) |
| (relaxed) vector fitting, pole relocation | (χαλαρωμένο) vector fitting, μετακίνηση πόλων (4.13) |
| modal group, time delay | ομάδα ρυθμών, καθυστέρηση (4.13) |
| frequency dependent cable model (FDCM), cable model correction | διόρθωση για καλώδια (FDCM) (4.13) |
| DC correction, partitioned fitting | διόρθωση DC, προσαρμογή σε διαμερισμένη ζώνη (4.13) |
| passivity check / enforcement, residue perturbation | έλεγχος / επιβολή παθητικότητας, διαταραχή των υπολοίπων (4.13) |
| nodal admittance (of a line) | αγωγιμότητα κόμβων (4.13) |
| low-frequency weighting | βάρος στις χαμηλές συχνότητες (4.13) |
| cross-bonding, major / minor section, link box | cross-bonding, μείζον / ελάσσον τμήμα, link box (κιβώτιο σύνδεσης) (4.13) |
| solid bonding, single-point bonding | solid bonding (γείωση στα δύο άκρα), γείωση σε ένα σημείο (4.13) |
| standing sheath voltage, sheath voltage limiter (SVL) | τάση στάσης του μανδύα, απαγωγός μανδύα (SVL) (4.13) |
| homogeneous (cross-bonded) model | ομογενές μοντέλο (4.13) |
| blocking / deblocking (of a converter) | μπλοκάρισμα / απεμπλοκή (του μετατροπέα) (4.14) |
| submodule (SM), arm, arm inductor | υπομονάδα, βραχίονας, αυτεπαγωγή βραχίονα (4.14) |
| inserted / bypassed submodule | υπομονάδα μέσα / σε παράκαμψη (4.14) |
| circulating current suppressing control (CCSC) | καταστολή του κυκλοφορούντος ρεύματος (CCSC) (4.14) |
| direct modulation | άμεση διαμόρφωση (4.14) |
| capacitor voltage balancing, sorting | εξισορρόπηση των πυκνωτών, ταξινόμηση (4.14) |
| average value model (AVM) | μέσο μοντέλο (AVM) (4.14) |
| arm switching function model | μοντέλο συνάρτησης μεταγωγής βραχίονα (4.14) |
| detailed equivalent (Thévenin) arm model | ισοδύναμο βραχίονα (Thévenin) (4.14) |
| star (grounding) reactor | αντιδραστήρας αστέρα (για γείωση) (4.14) |
| pole-to-pole fault | σφάλμα πόλου–πόλου (4.14) |
| droop (P/V_dc) | στατικότητα P/V_dc (4.14) |
| arm energy control, compensated modulation | έλεγχος ενέργειας των βραχιόνων, στάθμη από τη μετρημένη V_C (4.15) |
| horizontal / vertical energy balancing | εξισορρόπηση ενέργειας ανάμεσα στις φάσεις / άνω–κάτω (4.15) |
| active damping (virtual resistance) | ενεργή απόσβεση (εικονική αντίσταση) (4.15) |
| DC overvoltage limiter | όριο υπέρτασης DC (4.15) |
| fault clearing at current zero | εκκαθάριση σφάλματος στον μηδενισμό του ρεύματος (4.15) |
| integrator windup | συσσώρευση (windup) του ολοκληρωτή (4.15) |
| line-commutated converter (LCC), valve, six-pulse / twelve-pulse bridge | μετατροπέας φυσικής μετάβασης (LCC), βαλβίδα, γέφυρα 6 / 12 παλμών (4.16) |
| firing (delay) angle α, extinction (margin) angle γ, overlap angle μ | γωνία έναυσης α, γωνία σβέσης γ, γωνία επικάλυψης μ (4.16) |
| natural commutation point | φυσικό σημείο μετάβασης (4.16) |
| commutation voltage, commutation reactance X_c | τάση μεταγωγής, αντίδραση μεταγωγής X_c (4.16) |
| commutation failure | αποτυχία μετάβασης (4.16) |
| constant current (CC) control, current margin | έλεγχος σταθερού ρεύματος (CC), περιθώριο ρεύματος (4.16) |
| constant extinction angle (CEA) control | έλεγχος σταθερής γωνίας σβέσης (CEA, γ σταθερό) (4.16) |
| voltage-dependent current order limiter (VDCOL) | όριο της εντολής ρεύματος από την τάση (VDCOL) (4.16) |
| phase-locked oscillator (PLO), equidistant firing | ταλαντωτής κλειδωμένος στη φάση (PLO), ισαπέχουσα πυροδότηση (4.16) |
| forced retard | εξαναγκασμένη καθυστέρηση (4.16) |
| turn-off time t_q | χρόνος σβέσης t_q (4.16) |
| smoothing reactor | αντιδραστήρας εξομάλυνσης (4.16) |
| short-circuit ratio (SCR) | λόγος βραχυκύκλωσης (SCR) (4.16) |
| slack (swing) bus, PV bus, PQ bus | ζυγός ταλάντωσης, ζυγός PV, ζυγός PQ (4.19.1) |
| reference bus (of the angle) | ζυγός αναφοράς (της γωνίας) (4.19.1) |
| sparse Jacobian, fixed pattern | αραιή Ιακωβιανή, σταθερό μοτίβο (4.19.1) |
| current-injection Newton method | Newton με εγχύσεις ρεύματος (4.19.1) |
| backward/forward sweep | εμπρός–πίσω σάρωση (4.19.1) |
| radial / meshed network, weakly meshed | ακτινικό / βροχοειδές δίκτυο, ασθενώς βροχοειδές (4.19.1) |
| compensation (of a sweep), compensation-based power flow | αντιστάθμιση (της σάρωσης), σάρωση με αντιστάθμιση (4.19.5) |
| tree, link (branch out of the tree) | δέντρο, κλάδος εκτός δέντρου (4.19.5) |
| breakpoint, breakpoint impedance (sensitivity) matrix | σημείο διακοπής, πίνακας εμπεδήσεων των σημείων διακοπής (πίνακας ευαισθησίας) (4.19.5) |
| tie (line) of a feeder | κλάδος σύνδεσης (τροφοδότη) (4.19.5) |
| flat start, warm start | επίπεδη εκκίνηση, θερμή εκκίνηση (4.19.1) |
| reactive power limits (PV → PQ switching) | όρια Q (ο ζυγός PV γίνεται PQ στο όριο) (4.19.1) |
| tap ratio, phase shifter | λόγος (λήψη) μετασχηματιστή, μετατοπιστής φάσης (4.19.1) |
| power transfer / line outage distribution factors (PTDF, LODF) | συντελεστές κατανομής ισχύος / απώλειας γραμμής (PTDF, LODF) (4.19.1) |
| bridge (of a graph), island | γέφυρα (του γράφου), νησίδα (4.19.1) |
| common factors, chord iteration | κοινοί παράγοντες, επανάληψη με σταθερή Ιακωβιανή (4.19.1) |
| Broyden's (quasi-Newton) update | ενημέρωση του Broyden (4.19.1) |
| low-rank correction, matrix inversion lemma (Woodbury) | διόρθωση χαμηλής τάξης, λήμμα αντιστροφής πίνακα (4.19.1) |
| primal–dual interior-point method | μέθοδος εσωτερικού σημείου πρωτεύοντος–δυϊκού (4.19.1) |
| logarithmic barrier, barrier parameter | λογαριθμικός φραγμός, παράμετρος του φραγμού (4.19.1) |
| complementarity, feasibility | συμπληρωματικότητα, εφικτότητα (4.19.1) |
| Lagrange multiplier, Hessian of the Lagrangian | πολλαπλασιαστής Lagrange, Εσσιανή της Λαγκρανζιανής (4.19.1) |
| line search, merit function | αναζήτηση γραμμής, συνάρτηση αξίας (4.19.1) |
| locational marginal price (LMP) | οριακή τιμή ανά ζυγό (LMP) (4.19.1) |
| marginal cost | οριακό κόστος (4.19.1) |
| (branch) rating, loading | ονομαστική ισχύς (κλάδου), φόρτιση (4.19.1) |
| holomorphic embedding | ολομορφική εμφύτευση (4.19.1) |
| continuation power flow, continuation method | συνεχιζόμενη ροή φορτίου, μέθοδος συνέχισης (4.19.5) |
| predictor, corrector, tangent | πρόβλεψη, διόρθωση, εφαπτομένη (4.19.5) |
| local parametrisation, continuation parameter | τοπική παραμετροποίηση, παράμετρος συνέχισης (ο άγνωστος που κρατιέται σταθερός) (4.19.5) |
| state estimation, state (of the network) | εκτίμηση κατάστασης, κατάσταση (του δικτύου) (4.19.5) |
| weighted least squares (WLS), gain matrix | ελάχιστα τετράγωνα με βάρη, πίνακας κέρδους (4.19.5) |
| redundancy (of measurements), degrees of freedom | περίσσεια (μετρήσεων), βαθμοί ελευθερίας (4.19.5) |
| observability, observable island | παρατηρησιμότητα, παρατηρήσιμη νησίδα (4.19.5) |
| bad data, gross error | λανθασμένα δεδομένα (λανθασμένη μέτρηση), χονδρικό σφάλμα (4.19.5) |
| (normalized) residual, largest normalized residual test | (κανονικοποιημένο) υπόλοιπο, έλεγχος του μεγαλύτερου κανονικοποιημένου υπολοίπου (4.19.5) |
| critical measurement, critical pair | κρίσιμη μέτρηση, κρίσιμο ζεύγος (4.19.5) |
| zero-injection bus, equality constraint | ζυγός μηδενικής έγχυσης, ισότητα (περιορισμός ισότητας) (4.19.5) |
| harmonic load flow (harmonic penetration, current injection) | αρμονική ροή φορτίου (έγχυση ρεύματος) (4.19.5) |
| harmonic (order), spectrum, total harmonic distortion (THD) | αρμονική (τάξη), φάσμα, ολική αρμονική παραμόρφωση (THD) (4.19.5) |
| frequency scan, driving-point impedance | σάρωση συχνότητας, εμπέδηση που φαίνεται από τον ζυγό (4.19.5) |
| parallel / series resonance, tuned filter | παράλληλος συντονισμός / συντονισμός σειράς, συντονισμένο φίλτρο (4.19.5) |
| six-pulse / twelve-pulse (bridge, converter) | εξαπαλμική / δωδεκαπαλμική (γέφυρα, μετατροπέας) (4.19.5) |
| long-line (distributed-parameter) model, lumped π | μοντέλο μακριάς γραμμής (κατανεμημένες παράμετροι), συγκεντρωμένο π (4.19.5) |
| positive / negative / zero sequence (of a harmonic order) | θετική / αρνητική / μηδενική ακολουθία (μιας τάξης)· ομοπολική (4.19.5) |
| point of common coupling (PCC) | σημείο κοινής σύνδεσης (4.19.5) |
| unbalanced (three-phase) load flow | ασύμμετρη (τριφασική) ροή φορτίου (4.19.5) |
| (distribution) feeder, lateral | τροφοδότης (διανομής), κλάδος (πλευρική γραμμή) (4.19.5) |
| phase frame, phase impedance matrix | πλαίσιο των φάσεων, πίνακας εμπεδήσεων των φάσεων (4.19.5) |
| untransposed line, mutual impedance | μη αντιμετατεθειμένη γραμμή, αμοιβαία εμπέδηση (4.19.5) |
| voltage unbalance (negative over positive sequence) | ασυμμετρία τάσης (αρνητική ως προς θετική ακολουθία) (4.19.5) |
| step voltage regulator, tap | ρυθμιστής τάσης (με βήματα), λήψη (4.19.5) |
| line-drop compensator, voltage level, bandwidth | αντισταθμιστής πτώσης γραμμής, στάθμη τάσης, ζώνη (εύρος ζώνης) (4.19.5) |
| regulator hunting | ταλάντωση του ρυθμιστή (ανάμεσα σε δύο λήψεις) (4.19.5) |
| spot load, distributed load, exact lumped load model | σημειακό φορτίο, κατανεμημένο φορτίο, ακριβές ισοδύναμο (δύο σημειακών φορτίων) (4.19.5) |
| constant power / current / impedance load | φορτίο σταθερής ισχύος / σταθερού ρεύματος / σταθερής εμπέδησης (4.19.5) |
| wye (star) / delta connected load | φορτίο σε αστέρα / σε τρίγωνο (4.19.5) |
| Kron reduction (of the neutral) | αναγωγή Kron (απαλοιφή του ουδετέρου) (4.19.5) |
| P–V (nose) curve, nose (fold, saddle-node bifurcation) | καμπύλη P–V, μύτη της καμπύλης (διακλάδωση σάγματος–κόμβου) (4.19.5) |
| loadability limit (maximum loading point), loading margin | όριο φόρτισης, περιθώριο φόρτισης (4.19.5) |
| limit-induced bifurcation | άμεση αστάθεια στο όριο αέργου (γωνία της καμπύλης, όχι μύτη) (4.19.5) |
| voltage stability, voltage collapse, weakest bus | ευστάθεια τάσης, κατάρρευση τάσης, ο πιο αδύναμος ζυγός (4.19.5) |
| voltage set point (of a PV bus) | τάση ρύθμισης (ζυγού PV) (4.19.5) |
| security-constrained OPF (SCOPF) | βέλτιστη ροή φορτίου με περιορισμούς ασφαλείας (SCOPF) (4.19.1) |
| largest / smallest step (of the solver) | μέγιστο / ελάχιστο βήμα (του λύτη) (4.19.1) |
| RMS (electromechanical) simulation, transient stability | προσομοίωση RMS (ηλεκτρομηχανικά μεταβατικά), μεταβατική ευστάθεια (4.19.1, ROADMAP §71) |
| small-signal stability, participation factor, mode shape | ευστάθεια μικρών διαταραχών, συντελεστής συμμετοχής, μορφή της ταλάντωσης (4.19.1, ROADMAP §71) |
| inter-area oscillation, critical clearing time | ταλάντωση μεταξύ περιοχών, κρίσιμος χρόνος εκκαθάρισης (4.19.1, ROADMAP §71) |
| barrier parameter | παράμετρος φραγμού (4.19.2) |
| central path | κεντρική διαδρομή (4.19.2) |
| double precision / mixed precision | διπλή ακρίβεια / μικτή ακρίβεια (4.19.2) |
| feed-forward network | δίκτυο πρόσθιας τροφοδότησης (4.19.2) |
| hidden layer | κρυφό στρώμα (4.19.2) |
| validation set | σύνολο επικύρωσης (4.19.2) |
| standardization (of inputs) | τυποποίηση (4.19.2) |
| start model | μοντέλο εκκίνησης (4.19.2) |
| right-hand side | δεξί μέλος (4.19.2) |
| stand-in (in a test) | υποκατάστατο (4.19.2) |
| operator (ONNX) | τελεστής (4.19.2) |
| provider (ONNX Runtime) | πάροχος (4.19.2) |
| footnote | υποσημείωση (4.19.2) |
| inverse iteration | αντίστροφη επανάληψη (4.19.3) |
| iterative refinement | επαναληπτική βελτίωση (4.19.3) |
| Hessenberg form | μορφή Hessenberg (4.19.3) |
| balancing (of a matrix) | εξισορρόπηση (4.19.3) |
| mesh (network of buses) | πλέγμα (4.19.3· όχι «mesh») |
| infeed | τροφοδότηση (4.19.3) |
| sub-transmission | υπομεταφορά (4.19.3) |
| phase shifter | μετατοπιστής φάσης (4.19.3) |
| profile (of a program) | προφίλ (4.19.3) |
| channel (recorded quantity) | κανάλι (4.19.3) |
| single-line view (of a studied network) | διάγραμμα του δικτύου (4.19.4· όχι «γράφημα», που είναι το διάγραμμα μεγεθών) |
| layout (of a graph) | διάταξη (4.19.4) |
| layer (of the picture, of a CAD drawing) | στρώση (4.19.4) |
| viewer | προβολέας (4.19.4) |
| stress majorization | ελαχιστοποίηση της τάσης (stress) με διαδοχικές μεγιστοποιήσεις (4.19.4· η «τάση» εδώ είναι του γράφου, όχι ηλεκτρική: την πρώτη φορά με τον αγγλικό όρο) |
| classical scaling (MDS) | κλασική κλιμάκωση (4.19.4) |
| pivot (of the layout) | ζυγός-οδηγός (4.19.4· ο «οδηγός» της παραγοντοποίησης είναι άλλο πράγμα) |
| out of service | εκτός λειτουργίας (4.19.4) |
| rating (of a branch) | όριο, ονομαστική ισχύς του κλάδου (4.19.4) |
| outage (as a change of the network) | στοιχείο εκτός λειτουργίας (4.19.4· «διαταραχή» μόνο στο N−1) |
| winding (of a transformer) | τύλιγμα (4.19.4) |
| turns ratio | λόγος μετασχηματισμού (4.19.4) |
| magnetising admittance | αγωγιμότητα μαγνήτισης (4.19.4) |
| switched shunt | εγκάρσιο στοιχείο με βαθμίδες (4.19.4) |
| fixed shunt | σταθερό εγκάρσιο στοιχείο (4.19.4) |
| remote voltage regulation | ρύθμιση της τάσης άλλου ζυγού, απομακρυσμένη ρύθμιση (4.19.4) |
| star bus (of a three-winding transformer) | ζυγός-άστρο (4.19.4) |
| record, field (of a data file) | εγγραφή, πεδίο (4.19.4) |
| RMS (root mean square) | ενεργός τιμή· στα μπλοκ και στο scope γράφεται και «RMS» (4.19.6) |
| running (moving) window | κυλιόμενο παράθυρο: το διάστημα [t − T_w, t] που προχωρά με τον χρόνο (4.19.6) |
| peak-to-peak | κορυφή προς κορυφή: μέγιστο μείον ελάχιστο (4.19.6) |
| interharmonic | ενδιάμεση αρμονική: συνιστώσα με συχνότητα που δεν είναι ακέραιο πολλαπλάσιο της θεμελιώδους (4.19.6) |
| (spectral) leakage | διαρροή: η μέτρηση μιας συνιστώσας παίρνει μέρος από άλλες, όταν το παράθυρο δεν χωρά ακέραιες περιόδους τους (4.19.6) |
| instantaneous real / imaginary power (p-q theory) | στιγμιαία πραγματική / φανταστική ισχύς (θεωρία p–q) (4.19.6) |
| symmetrical components; positive, negative, zero sequence | συμμετρικές συνιστώσες· θετική, αρνητική, μηδενική ακολουθία (4.19.6) |
| (voltage) unbalance factor | ασυμμετρία (τάσης): |V⁻|/|V⁺| (4.19.6) |
| switching loss, switching energy | απώλειες μεταγωγής, ενέργεια μεταγωγής (4.19.6) |
| periodic impulse average | περιοδικός μέσος παλμών: η ενέργεια των παλμών μιας περιόδου διά την περίοδο (4.19.6) |
| multi-terminal DC grid (MTDC) | δίκτυο DC πολλών τερματικών (4.20) |
| DC slack bus | ζυγός ταλάντωσης DC: ο σταθμός που κρατά την τάση DC (4.20) |
| converter station | σταθμός μετατροπέα: μετασχηματιστής, φίλτρο, αντιδραστήρας, μετατροπέας (4.20) |
| sequential AC/DC load flow | ακολουθιακή ροή φορτίου AC/DC: οι δύο ροές εναλλάξ ως να συμφωνήσουν (4.20) |
| power sharing | μοιρασιά ισχύος (4.20) |
| DC/DC converter | μετατροπέας DC/DC: ανάμεσα σε δύο δίκτυα DC, ή σε σειρά με μια γραμμή για να ορίσει τη ροή της (4.20.1) |
| dispatcher (of a DC grid) | κεντρικός ελεγκτής (dispatcher): ξαναορίζει τις αναφορές των σταθμών ώστε η μέση τάση να είναι 1 pu (4.20.1) |
| semiconducting screen | ημιαγώγιμο στρώμα: ανάμεσα στον αγωγό ή τον μανδύα και τη μόνωση ενός καλωδίου (4.20.1) |
| binary heap | δυαδικός σωρός (heap): δίνει κάθε φορά το μικρότερο στοιχείο χωρίς ταξινόμηση όλης της λίστας (σειρά των μπλοκ, 4.20.1) |
| offshore converter station | υπεράκτιος σταθμός μετατροπέα: σχηματίζει την τάση και τη συχνότητα του δικτύου AC ενός αιολικού ή φορτίου (4.20.1) |

## Μένουν στα αγγλικά (δεν υπάρχει καθιερωμένος ελληνικός όρος ή ο αγγλικός είναι ο κοινός)

PWM, SPWM, SVPWM, PLL, PLO, FACTS, SSSC, CHB, MMC, HVDC, MTDC, LCC, CEA, VDCOL, AVM, CCSC, NLC, ULM, FDCM, OPF, SCOPF, PTDF, LODF, LMP, KKT, fast-decoupled (XB, BX), ZIP, ONNX, GPU, CUDA, CuPy, backend, MLP, Adam, RMS, cross-bonding, solid bonding, link box, vector fitting, PI, PID, scope, probe, workbench, anti-windup, back-calculation, clamp (RCD clamp), notch, ZOH, MOSFET, IGBT, CPE, MOV, FEM, tutorial, template, add-on στο όνομα αρχείων, Worker, thread.
