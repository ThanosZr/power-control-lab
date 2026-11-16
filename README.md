# Υλικό αναφοράς του Power Converter Lab

Branch χωρίς κώδικα της εφαρμογής: εδώ μένουν τα εργαλεία και τα αρχεία του Θάνου που χρησιμοποιούνται ως πρότυπα ή ως αναφορά για μελλοντικές εκδόσεις. Δεν μπαίνουν στα zip των εκδόσεων και δεν τρέχουν στον CI. Θα μπουν κι άλλα.

Όταν μια έκδοση φτάνει στο αντίστοιχο θέμα του οδικού χάρτη (`docs/ROADMAP.md` στο branch της τελευταίας έκδοσης), ξεκινά από εδώ.

| Αρχείο | Τι είναι | Πού χρησιμοποιείται |
|---|---|---|
| `reference/ai_control/control_workbench_v1.zip` | Control Workbench v1 (Python), η βασική έκδοση: συμβόλαια Plant/ControlScheme, PID, Indirect Adaptive Inverse Control σε μηχανή ΣΡ και επαγωγής, πρώτη επέκταση EV/DC | ROADMAP §19 και §38: η απλή μορφή των σχημάτων ελέγχου |
| `reference/ai_control/control_workbench_evdc_v0_17.zip` | Control Workbench EV/DC v0.17 (Python): συμβόλαια Plant/ControlScheme, PID, Indirect Adaptive Inverse Control (νευρωνικός εξομοιωτής και αντίστροφος ελεγκτής), πολυκριτηριακός έλεγχος EV, έγχυση αρμονικών σε SPMSM, οπτικοποιήσεις (διάγραμμα βρόχου, κύκλωμα, 3Δ ρότορας) | ROADMAP §19 και §38: έλεγχος με AI από βρόχο σε σύνθετο, plugins οπτικοποίησης σε Python και JavaScript |
| `reference/high_voltage/Lightning_Impulse_Manager_v1.2.0.zip` | Lightning Impulse Manager 1.2.0 (MATLAB): κεραυνικό ρεύμα Heidler, προσαρμογή σε T1/T2, `label_mapping.csv` | Πηγή Heidler (3.5, έλεγχος στην 3.7), ROADMAP §35 (εργαλεία που υπολογίζουν παραμέτρους) και §36 (αντιστοίχιση ετικετών) |
| `reference/high_voltage/Voltage_Impulse_GUI_v1.1.zip` | Voltage Impulse GUI 1.1 (MATLAB): διπλοεκθετική κρουστική τάση, α, β, K, επαλήθευση | Πηγή κρουστικής τάσης (3.8, ίδια α, β, K), ROADMAP §35 |
| `reference/plotting/plot_with_mapping_gui_v4.m` | Γραφικές από CSV με αρχείο αντιστοίχισης (MATLAB GUI) | ROADMAP §36: γραφικές από CSV με πρότυπα εμφάνισης |
| `reference/networks/case1354pegase.m`, `case2869pegase.m` | Δύο μεγάλα δίκτυα δοκιμής (1354 και 2869 ζυγοί, μέρη του ευρωπαϊκού συστήματος, έργο PEGASE), όπως διανέμονται με το MATPOWER, χωρίς καμία αλλαγή. Δεν είναι δικά μας: άδεια Creative Commons Attribution 4.0 (παρακάτω) | ROADMAP §68, THEORY §8Ζ (4.19.1): οι μετρήσεις χρόνου της ροής φορτίου, των παρτίδων σεναρίων και του N−1 σε μεγάλο δίκτυο. Διαβάζονται με `pcl.network.read_matpower('case2869pegase.m')`. Δεν είναι στο `pcl/data` ούτε στα zip |

Οι δύο εκδόσεις του Control Workbench έχουν τον ίδιο πυρήνα (`core/registry.py`, `core/plant.py`, `core/scheme.py`, `schemes/indirect_inverse.py`), άρα το `python -m pcl workbench --path <φάκελος>` δουλεύει και με τις δύο.

SHA-256:
- `66670bf1df34a855a571ee324ce8ad81e86b43da3fe13281eb4792709c00d427` control_workbench_v1.zip
- `b8acfd0a45ffc08f6e316457b2d2ed804687a56fb8dc6fb541c99ca000e099c1` control_workbench_evdc_v0_17.zip
- `f1244cf26da1db125992004b72c791614531bd189d3c88148e51d8e2f3ff7cb7` Lightning_Impulse_Manager_v1.2.0.zip
- `14e525e2b8bc47034e86b7285c666289ced76c0e1ccff2371572ec6b6ff0acd4` Voltage_Impulse_GUI_v1.1.zip
- `f4a67edf549ffa10ebdcc74293dfdad00a43286f893b059accd458bc3d4a2794` plot_with_mapping_gui_v4.m
- `1b08b25a2f6c1d540d090009dfaff41ff2b05784a2d8d302a7ad695821557b89` case1354pegase.m
- `d205ccbc1c0386715393661d7bd6f1f879ebcdc5d6f0e3665fb0aaf2c4db0b64` case2869pegase.m

**Δίκτυα PEGASE: άδεια και αναφορά.** Τα `case1354pegase.m` και `case2869pegase.m` είναι αντίγραφα χωρίς αλλαγές από τον φάκελο `data` του MATPOWER (https://github.com/MATPOWER/matpower, λήψη 16/11/2026). Τα δεδομένα έχουν άδεια Creative Commons Attribution 4.0 International (https://creativecommons.org/licenses/by/4.0/), όπως γράφει η κεφαλίδα κάθε αρχείου· η άδεια του υπόλοιπου repo δεν τα αφορά. Όποιος δημοσιεύει αποτελέσματα με αυτά παραπέμπει, όπως ζητούν τα αρχεία, στα: C. Josz, S. Fliscounakis, J. Maeght, P. Panciatici, «AC Power Flow Data in MATPOWER and QCQP Format: iTesla, RTE Snapshots, and PEGASE», arXiv:1603.01533· S. Fliscounakis, P. Panciatici, F. Capitanescu, L. Wehenkel, «Contingency ranking with respect to overloads in very large power systems taking into account uncertainty, preventive and corrective actions», *IEEE Trans. Power Systems* 28(4), 4909–4917, 2013.

**Τι δεν μπαίνει εδώ:** υλικό τρίτων με πνευματικά δικαιώματα, όπως το βιβλίο «Υψηλές Τάσεις» (PDF) ή η τεκμηρίωση του EMTP. Το repo είναι δημόσιο. Αυτά μένουν στο Project του claude.ai ή σε ιδιωτικό repo, και ο κώδικας παραπέμπει σε σελίδες και σχέσεις.

**Προσθήκη αρχείου:** `git checkout ref-materials`, το αρχείο στον κατάλληλο φάκελο του `reference/`, μία γραμμή στον πίνακα και το SHA-256, commit και push.
