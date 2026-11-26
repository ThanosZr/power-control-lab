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
| knee point (of a magnetizing curve) | γόνατο της καμπύλης μαγνήτισης, ροή του γονάτου ψ_k (στη δίοδο μένει «τάση κατωφλίου») | τάση γονάτου (στη δίοδο) | 5.0.1 |

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
| static var compensator (SVC), STATCOM | στατός αντισταθμιστής αέργου ισχύος (SVC), STATCOM· στο κείμενο οι αγγλικές συντομογραφίες, όπως στη βιβλιογραφία (5.0.14) |
| susceptance regulator, slope (of a compensator) | ρυθμιστής επιδεκτικότητας, κλίση (της στατικής χαρακτηριστικής) |
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
| V/f control (islanded station) | σταθμός V/f: σχηματίζει την τάση και τη συχνότητα της νησίδας του, ο ζυγός ταλάντωσής της στη ροή φορτίου (5.0.15) |
| phasor model (Type 6) | μοντέλο φασιθετών (τύπος 6 του CIGRE TB 604): ο σταθμός σε RMS, χωρίς τα κατώτερα επίπεδα του ελέγχου (5.0.15) |
| active damping | ενεργός απόσβεση: μια αντίσταση του ελέγχου στο μέρος ενός ρεύματος πάνω από μια συχνότητα (5.0.15) |
| breakpoint (in time) | άλμα στον χρόνο: η στιγμή όπου μια έκφραση του t αλλάζει απότομα· το βήμα του RMS σταματά εκεί (5.0.16) |
| sequential AC/DC load flow | ακολουθιακή ροή φορτίου AC/DC: οι δύο ροές εναλλάξ ως να συμφωνήσουν (4.20) |
| power sharing | μοιρασιά ισχύος (4.20) |
| DC/DC converter | μετατροπέας DC/DC: ανάμεσα σε δύο δίκτυα DC, ή σε σειρά με μια γραμμή για να ορίσει τη ροή της (4.20.1) |
| dispatcher (of a DC grid) | κεντρικός ελεγκτής (dispatcher): ξαναορίζει τις αναφορές των σταθμών ώστε η μέση τάση να είναι 1 pu (4.20.1) |
| semiconducting screen | ημιαγώγιμο στρώμα: ανάμεσα στον αγωγό ή τον μανδύα και τη μόνωση ενός καλωδίου (4.20.1) |
| binary heap | δυαδικός σωρός (heap): δίνει κάθε φορά το μικρότερο στοιχείο χωρίς ταξινόμηση όλης της λίστας (σειρά των μπλοκ, 4.20.1) |
| offshore converter station | υπεράκτιος σταθμός μετατροπέα: σχηματίζει την τάση και τη συχνότητα του δικτύου AC ενός αιολικού ή φορτίου (4.20.1) |
| dispatchable virtual oscillator control (dVOC) | ταλαντωτής dVOC: ο μετατροπέας σχηματίζει την τάση ενός εικονικού ταλαντωτή που συγχρονίζεται μέσω του ρεύματός του, με σημεία λειτουργίας P*, Q*, V* (4.20.2) |
| matching control | matching control: η συχνότητα του μετατροπέα από την τάση DC του (ω = k_θ·v_dc), όπως η συχνότητα μιας μηχανής από την ταχύτητά της (4.20.2) |
| time-scale separation | διαχωρισμός χρονικών κλιμάκων: ο έλεγχος αρκετά πιο αργός από τη δυναμική των γραμμών (4.20.2) |
| loss feed-forward | πρόσθια τροφοδότηση των απωλειών (4.20.2) |
| headroom (of a source) | περιθώριο της πηγής: πόση ισχύς μένει ως το όριό της (4.20.3) |
| black start | εκκίνηση χωρίς τάση: ο μετατροπέας σχηματίζει την τάση του από το μηδέν, χωρίς δίκτυο (4.20.3) |
| current limitation (through the power set-point) | όριο ρεύματος μέσω της αναφοράς ισχύος (4.20.3) |
| limit cycle | οριακός κύκλος (4.20.4) |
| synchrophasor, phasor measurement unit (PMU) | φασιθέτης (συγχρονισμένος), μονάδα μέτρησης φασιθετών (PMU) (4.21) |
| total vector error (TVE) | ολικό διανυσματικό σφάλμα (TVE) (4.21) |
| capability chart (P–Q) | διάγραμμα P–Q (δυνατοτήτων) του σταθμού (4.21) |
| commutation overlap | επικάλυψη (διάρκεια) της μετάβασης, μ (4.21) |
| disconnector, restrike, trapped charge | αποζεύκτης, επανέναυση (σπινθήρας), παγιδευμένο φορτίο (4.22) |
| very fast transient overvoltage (VFTO, VFFO) | υπέρταση πολύ ταχέος μετώπου (VFTO) (4.22) |
| streamer, leader | οχετός (streamer), οχετός ηγέτης (leader)· στα κείμενα «οι οχετοί» και «ο οχετός» (4.22) |
| multistory tower model | πολυώροφος πύργος (μοντέλο) (4.22) |
| coordination / required withstand voltage, atmospheric correction factor | τάση αντοχής συντονισμού / απαιτούμενη τάση αντοχής, συντελεστής υψομέτρου K_a (4.22) |
| protective zone (of an arrester), continuous operating voltage U_c | ζώνη προστασίας (του απαγωγέα), τάση συνεχούς λειτουργίας U_c (4.22) |
| earth fault factor | συντελεστής σφάλματος γης (4.22) |
| method of characteristics | μέθοδος των χαρακτηριστικών (4.22) |
| graticule, scale bar, route (of a line) | κάνναβος (μεσημβρινοί και παράλληλοι), κλίμακα, διαδρομή (της γραμμής) (4.22) |
| leader line (of a label) | γραμμή οδηγός (της ετικέτας) (4.22) |
| RMS dynamics, transient stability simulation | δυναμική RMS, προσομοίωση μεταβατικής ευστάθειας |
| small-signal stability | ευστάθεια μικρών διαταραχών |
| differential-algebraic equations (DAE) | διαφορικές–αλγεβρικές εξισώσεις (DAE) |
| simultaneous / alternating (partitioned) solution | ταυτόχρονη / εναλλασσόμενη λύση |
| state matrix | πίνακας κατάστασης |
| participation factor | συντελεστής συμμετοχής |
| mode shape | μορφή της ταλάντωσης |
| damping ratio | λόγος απόσβεσης |
| shift-and-invert | μετατόπιση και αντιστροφή |
| critical clearing time | κρίσιμος χρόνος εκκαθάρισης |
| centre of inertia | κέντρο αδράνειας |
| two-axis model | μοντέλο δύο αξόνων |
| subtransient model, voltage behind the subtransient reactance (E″ model) | υπομεταβατικό μοντέλο, τάση πίσω από την υπομεταβατική αντίδραση (μοντέλο E″) (5.0.13) |
| generating unit (a machine with its controls) | μονάδα παραγωγής (5.0.13) |
| exponential saturation, air-gap line | εκθετικός κορεσμός, γραμμή του διακένου (5.0.13) |
| non-windup limit | όριο χωρίς windup (5.0.13) |
| exponential load | εκθετικό φορτίο (5.0.13) |
| underexcitation limit | όριο υποδιέγερσης (5.0.13) |
| reheater, inelastic water column | αναθερμαντήρας, ασυμπίεστη στήλη νερού (5.0.13) |
| typical (dynamic) data | τυπικά (δυναμικά) δεδομένα (5.0.13) |
| complex-step differentiation | παραγώγιση με μιγαδικό βήμα |
| watched channels | κανάλια που παρακολουθούνται |
| kernel (of a solver) | πυρήνας (του λύτη) |
| subnetwork, subsystem (of a network split at its lines) | υποδίκτυο |
| network partitioning, tearing | διαμέριση (χωρισμός) του δικτύου |
| multirate simulation, multiple time steps | πολλαπλοί ρυθμοί, προσομοίωση με πολλαπλά βήματα |
| latency (of a slow subnetwork) | λανθάνουσα συμπεριφορά (αργού υποδικτύου) |
| link (between two simulators) | σύνδεση |
| incident wave, reflected wave | προσπίπτον κύμα, ανακλώμενο κύμα |
| smoothing (equal area) | εξομάλυνση (ίσου εμβαδού) |
| exciter (IEEE Type 1) | διεγέρτρια (IEEE Τύπου 1) |
| neutral point, star point | ουδέτερος, κέντρο του αστέρα |
| solidly grounded (earthed) neutral | στερεά γειωμένος ουδέτερος |
| impedance-grounded neutral | ουδέτερος γειωμένος μέσω εμπέδησης (R_n + jX_n) |
| isolated (ungrounded) neutral | μονωμένος ουδέτερος |
| Petersen coil, arc-suppression coil | πηνίο Petersen (πηνίο σβέσης τόξου) |
| study folder, project folder (EMTP, PSCAD) | φάκελος μελέτης (5.0) |
| run (of a simulation) | τρέξιμο |
| viewer (ScopeView, PSOUT Reader, Livewire) | εργαλείο προβολής (5.0) |
| netlist | netlist (ο πίνακας των στοιχείων και των κόμβων όπως τον βλέπει ο λύτης) |
| digital twin | ψηφιακό δίδυμο |
| inrush current | ρεύμα ζεύξης (ενός μετασχηματιστή) |
| residual flux, remanent flux | παραμένουσα ροή |
| air-core reactance, air-core inductance | αντίδραση πυρήνα αέρα, αυτεπαγωγή πυρήνα αέρα |
| flux linkage | πεπλεγμένη ροή ψ |
| magnetizing branch | κλάδος μαγνήτισης |
| open-circuit test, no-load test | δοκιμή κενού |
| distortionless line | γραμμή χωρίς παραμόρφωση |
| propagation mode (of a line) | ρυθμός (διάδοσης) |
| continuously transposed line | γραμμή με συνεχή μετάθεση |
| window frame, resize handle | πλαίσιο του παραθύρου, λαβή αλλαγής μεγέθους (5.0.2) |
| zoom, pan (of a diagram) | μεγέθυνση, μετακίνηση (του διαγράμματος) (5.0.2) |
| dock, undock, panel | κούμπωμα, απόσπαση, πλαίσιο (§94· το κούμπωμα στην 5.0.5) |
| maximize, restore (a window) | μέγιστο μέγεθος, επαναφορά (διπλό κλικ στον τίτλο) (5.0.2) |
| region (of a graph), min–max tool | περιοχή (του γραφήματος), εργαλείο min–max (5.0.2) |
| unzoom | χωρίς μεγέθυνση, επαναφορά της μεγέθυνσης (5.0.2) |
| autoscale that only grows | αυτόματη κλίμακα που μόνο μεγαλώνει (5.0.2) |
| network equivalent | ισοδύναμο δικτύου (5.0.3) |
| study area, internal system | περιοχή της μελέτης, εσωτερικό δίκτυο (5.0.3) |
| external system | εξωτερικό δίκτυο (5.0.3) |
| boundary bus | ζυγός του συνόρου (5.0.3) |
| Kron reduction (of a network), Schur complement | μείωση Kron (ενός δικτύου), συμπλήρωμα Schur (5.0.3) |
| Ward equivalent, Ward injection | ισοδύναμο Ward, έγχυση Ward (5.0.3) |
| extended Ward | extended Ward (5.0.3) |
| fictitious PV bus | πλασματικός ζυγός PV (5.0.3) |
| multi-port Thevenin / Norton equivalent | ισοδύναμο Thevenin / Norton πολλών θυρών (5.0.3) |
| multi-port network equivalent (for EMT) | ισοδύναμο δικτύου πολλών θυρών (5.0.4) |
| Foster equivalent circuit | κύκλωμα Foster (5.0.4) |
| short-circuit impedance (L_sc, R_sc) of the reduced part | εμπέδηση βραχυκύκλωσης του υπόλοιπου δικτύου (5.0.4) |
| dock region, tab (of a group), floating window | περιοχή (αριστερά, δεξιά, κάτω), καρτέλα, κάρτα σε δικό της παράθυρο (5.0.5) |
| layout (of the workspace), reset layout | διάταξη, επαναφορά (5.0.5) |
| splitter (edge of a dock region) | άκρη της περιοχής (5.0.5) |
| submenu | υπομενού (5.0.5) |
| app window (of a browser), browser profile | παράθυρο εφαρμογής, προφίλ του browser (5.0.5) |
| web app manifest | manifest της εφαρμογής (5.0.5) |
| lasso, rubber-band (window) selection | λάσο, επιλογή με παράθυρο (5.0.6) |
| side by side (split view) | δίπλα δίπλα (5.0.6· δύο κάρτες μιας ομάδας) |
| boundary bus | ζυγός του συνόρου (5.0.3· από την 5.0.6 και από την επιλογή στο διάγραμμα) |
| Foster block (parallel RL–RC branch), positive-real term | κλάδος Foster ((L + R′) ∥ (C + R″), και με R_p παράλληλα), θετικός πραγματικός όρος (5.0.7) |
| frequency-dependent network equivalent (FDNE) | ισοδύναμο δικτύου που εξαρτάται από τη συχνότητα (FDNE· μίας θύρας στην 5.0.7, πολλών θυρών στην 5.0.9) |
| driving-point impedance, transfer admittance | εμπέδηση οδήγησης (Z_kk), αγωγιμότητα μεταφοράς (Y_ij, i ≠ j) (5.0.9) |
| common poles (of a matrix fit) | κοινοί πόλοι (όλων των στοιχείων του πίνακα) (5.0.9) |
| passivity enforcement, residue matrix | διόρθωση της παθητικότητας, πίνακας υπολοίπων (5.0.9) |
| command window, command line (of the app) | γραμμή εντολών (η κάρτα της 5.0.8· η «γραμμή εντολών του συστήματος» είναι το τερματικό) |
| workspace (of MATLAB) | χώρος μεταβλητών |
| kernel (of a console: Pyodide, the Python of the server) | πυρήνας (της γραμμής εντολών) |
| prompt | πρόθεμα (`>>>`, και `...` για μπλοκ) |
| tab completion | συμπλήρωση με Tab |
| shard (of the tests) | μέρος (των tests) |
| named layout, preset layout | διάταξη με όνομα, έτοιμη διάταξη («Αρχική», «Σχέδιο», «Μελέτη δικτύου», «Ανάλυση») (5.0.10) |
| second screen (a card in a window of the browser) | δεύτερη οθόνη (η κάρτα σε δικό της παράθυρο του browser· το «σε δικό της παράθυρο» της 5.0.5 είναι μέσα στη σελίδα) (5.0.10) |
| common (network) model, element identity | κοινό μοντέλο (του δικτύου), ταυτότητα στοιχείου (5.0.11· το σχέδιο ως ζυγοί και στοιχεία με τα ids του) |
| bus–branch model, topology processing (node–breaker to bus–branch) | μοντέλο ζυγών–κλάδων· οι κλειστοί διακόπτες ενώνουν ζυγούς (5.0.11) |
| equivalent voltage source at the short-circuit location | ισοδύναμη πηγή τάσης στη θέση του σφάλματος (IEC 60909-0· 4.2, και από το σχέδιο στην 5.0.11) |
| initial symmetrical short-circuit current I″k, peak short-circuit current i_p | αρχικό ρεύμα βραχυκύκλωσης I″k, κρουστικό ρεύμα βραχυκύκλωσης i_p |
| rated power factor cos φ_rG | ονομαστικός συντελεστής ισχύος cos φ_rG (της γεννήτριας, για το K_G· 5.0.11) |
| exact pi equivalent (of a line) | ακριβές ισοδύναμο π (της γραμμής στη θεμελιώδη, από Z′, Y′· 4.4, και στο κοινό μοντέλο στην 5.0.12) |
| sequence coupling (of an untransposed line) | σύζευξη των ακολουθιών (γραμμής χωρίς μετάθεση· 5.0.12) |
| flattening (of subcircuits) | άνοιγμα (των υποκυκλωμάτων, `SubCircuit.flatten`· 5.0.12) |
| symmetric monopole (HVDC) | συμμετρικός μονοπολικός (σύνδεσμος ή σταθμός HVDC: δύο πόλοι στα ±U_dc/2, χωρίς επιστροφή· 5.0.17) |
| bipole (HVDC) | δίπολος (σύνδεσμος ή σταθμός HVDC με δύο πόλους και ουδέτερο, επιστροφή από τη γη ή μεταλλική· 5.0.17) |
| pole-to-pole voltage | τάση από πόλο σε πόλο (ενός ζυγού DC δύο πόλων· 5.0.17) |
| start at the phase shifts (of a load flow) | εκκίνηση στις ολισθήσεις φάσης (της ροής φορτίου: κάθε ζυγός στη γωνία του δρόμου του από τον ζυγό αναφοράς· 5.0.18) |
| grid-forming station (HVDC) | σταθμός grid-forming (σταθμός HVDC που σχηματίζει την τάση της πλευράς AC του με νόμο στατικότητας, VSM ή PSC· 5.0.18) |
| bus voltage control | έλεγχος τάσης ζυγού (βρόχος τάσης πάνω από τους βρόχους ρεύματος, Άσκηση 4 του PE2· 5.0.18) |
| overload timer | χρονομετρητής της υπερφόρτισης (μετρά τον χρόνο πάνω από το I_n και ρίχνει την αναφορά στο I_n μετά το T_ol· 5.0.18) |
| interarea mode | διαπεριοχικός τρόπος (ταλάντωσης· οι μηχανές μιας περιοχής απέναντι σε αυτές μιας άλλης, 0,1–0,8 Hz· 5.1) |
| local (intermachine) mode | τοπικός τρόπος (ταλάντωσης· δύο μηχανές της ίδιας περιοχής η μία απέναντι στην άλλη, 0,8–2 Hz· 5.1) |
| transient gain reduction (TGR) | μείωση του μεταβατικού κέρδους (ενός AVR, με ένα lead–lag (1 + sT_C)/(1 + sT_B), T_B > T_C· 5.1) |
| alternator-rectifier exciter | διεγέρτης εναλλακτήρα με ανορθωτή (AC1A του IEEE Std 421.5· 5.1) |
| rectifier regulation | ρύθμιση του ανορθωτή (η πτώση της τάσης του με το ρεύμα, F_EX(I_N) του Παρ. D του IEEE Std 421.5· 5.1) |
| demagnetizing factor | συντελεστής απομαγνήτισης (K_D, της αντίδρασης οπλισμού του διεγέρτη· 5.1) |
| dual-input stabilizer | σταθεροποιητής δύο εισόδων (PSS2B: ταχύτητα και ηλεκτρική ισχύς· 5.1) |
| ramp-tracking filter | φίλτρο ράμπας (του PSS2B, [(1 + sT8)/(1 + sT9)^M]^N· περνά μια ράμπα της μηχανικής ισχύος χωρίς σφάλμα· 5.1) |
| critical damping adjustment (CDA) | προσαρμογή κρίσιμης απόσβεσης: μετά από μια ασυνέχεια δύο μισά βήματα προς τα πίσω Euler στη θέση ενός τραπεζοειδούς, για να μη μείνει αριθμητική ταλάντωση (στο RMS όσο ένας σταθμός είναι μπλοκαρισμένος· 5.1.1) |
| latched (protection) | που κρατιέται (μπλοκάρισμα που δεν απελευθερώνεται μόνο του· 5.1.1) |
| undervoltage, overcurrent (protection) | υπόταση, υπερένταση (της προστασίας του σταθμού· 5.1.1) |
| electromechanical mode | ηλεκτρομηχανικός τρόπος (ταλάντωσης των δρομέων, από 0,05 ως 4 Hz εδώ· 5.1.2) |
| executable, portable build | εκτελέσιμο, φορητή έκδοση (η εφαρμογή σε έναν φάκελο με την Python μέσα, χωρίς πρόγραμμα εγκατάστασης· 5.1.3) |
| fault ride through (FRT) | διέλευση από βύθιση τάσης (η ανεμογεννήτρια μένει συνδεδεμένη και εγχέει άεργο ρεύμα· το F_FRT του IEC 61400-27-1· 5.1.4) |
| ramp rate limiter | περιοριστής ρυθμού (της μεταβολής· «ράμπα» για την κλίση του· 5.1.4) |
| lookup table | πίνακας τιμών (γραμμική παρεμβολή ανάμεσα στα σημεία, η πλησιέστερη τιμή έξω από αυτά· 5.1.4) |
| drive train, torsional mode | άξονας (μετάδοσης), στρεπτικός τρόπος (του άξονα δύο μαζών· 5.1.4) |
| reference frame rotation | περιστροφή του πλαισίου αναφοράς (του ρεύματος στη γωνία της τάσης· 5.1.4) |
| quasi-steady-state model (HVDC) | μοντέλο οιονεί μόνιμης κατάστασης (οι μέσες τιμές της πλευράς DC και οι RMS της θεμελιώδους, σε κάθε στιγμή· 5.1.5) |
| HT bus, LT bus (of a converter) | ζυγός HT, ζυγός LT (η πλευρά AC και η πλευρά των βαλβίδων του μετασχηματιστή μετατροπέα· 5.1.5) |
| mode of operation (CC/CEA, CIA/CC) | τρόπος λειτουργίας (ποιος σταθμός κρατά το ρεύμα και ποιος την τάση ή το γ· 5.1.5) |

## Μένουν στα αγγλικά (δεν υπάρχει καθιερωμένος ελληνικός όρος ή ο αγγλικός είναι ο κοινός)

PWM, SPWM, SVPWM, PLL, PLO, dVOC, Arnoldi, WebAssembly, Worker, SharedArrayBuffer, MATE, GeoJSON, Web Mercator, WGS 84, haversine, FACTS, SSSC, CHB, MMC, HVDC, MTDC, LCC, CEA, VDCOL, AVM, CCSC, NLC, ULM, FDCM, OPF, SCOPF, PTDF, LODF, LMP, KKT, fast-decoupled (XB, BX), ZIP, ONNX, GPU, CUDA, CuPy, backend, MLP, Adam, RMS, cross-bonding, solid bonding, link box, vector fitting, PI, PID, scope, probe, workbench, anti-windup, back-calculation, clamp (RCD clamp), notch, ZOH, MOSFET, IGBT, CPE, MOV, FEM, tutorial, template, add-on στο όνομα αρχείων, Worker, thread.
