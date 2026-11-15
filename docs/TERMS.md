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

## Μένουν στα αγγλικά (δεν υπάρχει καθιερωμένος ελληνικός όρος ή ο αγγλικός είναι ο κοινός)

PWM, SPWM, SVPWM, PLL, PLO, FACTS, SSSC, CHB, MMC, HVDC, LCC, CEA, VDCOL, AVM, CCSC, NLC, ULM, FDCM, cross-bonding, solid bonding, link box, vector fitting, PI, PID, scope, probe, workbench, anti-windup, back-calculation, clamp (RCD clamp), notch, ZOH, MOSFET, IGBT, CPE, MOV, FEM, tutorial, template, add-on στο όνομα αρχείων, Worker, thread.
