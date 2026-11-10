% Power & Control Lab from MATLAB or Octave (ROADMAP §30, 3.14): the inductor ripple of the buck against L,
% with the theory ΔI = V_o(1 − D)/(L·f_s). Run it from this folder (or addpath it).
L = [33 47 68 100 150 220] * 1e-6;
r = pcl_sweep('tutorial:buck?start=steady', {'L1.L', L}, ...
              struct('t_end', 8e-3, 'measure', {{'Vo', 'V:C1', 'avg', 10; 'dI', 'I:L1', 'pp', 10}}));
D = 0.5; fs = 100e3;
dI = r.Vo .* (1 - D) ./ (r.L1_L * fs);
figure; plot(r.L1_L * 1e6, r.dI, 'o-', r.L1_L * 1e6, dI, '--');
xlabel('L (\muH)'); ylabel('\Delta i_L (A)'); legend('προσομοίωση', 'V_o(1 - D)/(L f_s)'); grid on;
fprintf('L = %6.1f uH   dI = %.4f A   θεωρία %.4f A\n', [r.L1_L * 1e6, r.dI, dI]');

% one run with the waveforms, then CSV for other tools
w = pcl_run('tutorial:buck?start=steady', {'L1.L', 47e-6}, struct('t_end', 1e-3, 'channels', {{'V:C1', 'I:L1'}}));
figure; plot(w.t * 1e3, w.I_L1); xlabel('t (ms)'); ylabel('i_L (A)'); grid on;
