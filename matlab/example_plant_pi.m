% A controller written in MATLAB or Octave closes the loop around a circuit of the lab (4.8.1, ROADMAP §48):
% the speed of the DC drive of the tutorial through the duty of its PWM, a PI here, the circuit in the lab's solver.
% At 0.3 s the load torque steps to 2 N·m (a change of the circuit while it runs). Run it from this folder.
p = PclPlant('tutorial:dc_drive?mode=open', 'input', 'PWM1:d', 'measure', 'M1:w', 'state', {'AM1:y'}, ...
             'u_range', [0 1], 'params', {'M1.TL', 0}, 'hdiv', 50);
dt = 2e-3; cs = struct('Kp', 0.004, 'Ki', 0.1, 'lo', 0, 'hi', 1);
a = p.loop(@pcl_pi, 100 * ones(150, 1), dt, cs);
p.setParam('M1.TL', 2);
b = p.loop(@pcl_pi, 100 * ones(100, 1), dt, a.cs);
p.close();
t = [a.t; b.t]; y = [a.y; b.y]; u = [a.u; b.u]; i = [a.m(:, 2); b.m(:, 2)];
figure;
subplot(3, 1, 1); plot(t, y, t, 100 * ones(size(t)), '--'); ylabel('\omega (rad/s)'); grid on; legend('y', 'r');
subplot(3, 1, 2); plot(t, u); ylabel('D'); grid on;
subplot(3, 1, 3); plot(t, i); ylabel('i_a (A)'); xlabel('t (s)'); grid on;
fprintf('ω(0,3 s) = %.3f rad/s, ελάχιστη μετά το φορτίο %.3f, τέλος %.3f\n', a.y(end), min(b.y), b.y(end));
