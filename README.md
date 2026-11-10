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

Οι δύο εκδόσεις του Control Workbench έχουν τον ίδιο πυρήνα (`core/registry.py`, `core/plant.py`, `core/scheme.py`, `schemes/indirect_inverse.py`), άρα το `python -m pcl workbench --path <φάκελος>` δουλεύει και με τις δύο.

SHA-256:
- `66670bf1df34a855a571ee324ce8ad81e86b43da3fe13281eb4792709c00d427` control_workbench_v1.zip
- `b8acfd0a45ffc08f6e316457b2d2ed804687a56fb8dc6fb541c99ca000e099c1` control_workbench_evdc_v0_17.zip
- `f1244cf26da1db125992004b72c791614531bd189d3c88148e51d8e2f3ff7cb7` Lightning_Impulse_Manager_v1.2.0.zip
- `14e525e2b8bc47034e86b7285c666289ced76c0e1ccff2371572ec6b6ff0acd4` Voltage_Impulse_GUI_v1.1.zip
- `f4a67edf549ffa10ebdcc74293dfdad00a43286f893b059accd458bc3d4a2794` plot_with_mapping_gui_v4.m

**Τι δεν μπαίνει εδώ:** υλικό τρίτων με πνευματικά δικαιώματα, όπως το βιβλίο «Υψηλές Τάσεις» (PDF) ή η τεκμηρίωση του EMTP. Το repo είναι δημόσιο. Αυτά μένουν στο Project του claude.ai ή σε ιδιωτικό repo, και ο κώδικας παραπέμπει σε σελίδες και σχέσεις.

**Προσθήκη αρχείου:** `git checkout ref-materials`, το αρχείο στον κατάλληλο φάκελο του `reference/`, μία γραμμή στον πίνακα και το SHA-256, commit και push.
