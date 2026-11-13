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

## Μένουν στα αγγλικά (δεν υπάρχει καθιερωμένος ελληνικός όρος ή ο αγγλικός είναι ο κοινός)

PWM, SPWM, SVPWM, PLL, PI, PID, scope, probe, workbench, anti-windup, back-calculation, clamp (RCD clamp), notch, ZOH, MOSFET, IGBT, CPE, MOV, FEM, tutorial, template, add-on στο όνομα αρχείων, Worker, thread.
