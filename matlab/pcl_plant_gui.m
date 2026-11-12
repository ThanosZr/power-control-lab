function fig = pcl_plant_gui(opts)
%PCL_PLANT_GUI  A window in MATLAB or Octave that drives a circuit of the lab with a controller written here (4.8.1,
%   ROADMAP §48): the circuit and its mathematics in the lab's solver (PclPlant), the controller, the reference, the
%   disturbance, the plots and the record here. A template: change pcl_pi for your own controller (classical,
%   neural, anything with [u, cs] = ctrl(r, m, cs, dt)).
%
%   pcl_plant_gui()                                  % the DC drive of the tutorial, speed loop through the duty
%   pcl_plant_gui(struct('project', 'my.json', 'input', 'KL', 'measure', 'M1:w', 'u_range', [0 150]))
%   pcl_plant_gui(struct('steps', 300))              % 300 samples and stop (for scripts and tests)
%
%   opts: project, input, measure, state, u_range, params ({'<id>.<parameter>', value, ...}), hdiv, ctrl (a function
%   handle), Kp, Ki, dt (s), ref, ref_max, dist ('<id>.<parameter>' changed live by the slider), dist_max, window (s of
%   the plots), steps (samples per ▶; 0: until ■). The record (t, r, y, u, the second measurement) goes to a CSV.
%   Works with figure/uicontrol, so the same file runs in MATLAB and in Octave (Qt).
if nargin < 1, opts = struct(); end
d = struct('project', 'tutorial:dc_drive?mode=open', 'input', 'PWM1:d', 'measure', 'M1:w', 'state', {{'AM1:y'}}, ...
           'u_range', [0 1], 'params', {{'M1.TL', 0}}, 'hdiv', 50, 'ctrl', @pcl_pi, 'Kp', 0.004, 'Ki', 0.1, 'dt', 2e-3, ...
           'ref', 100, 'ref_max', 200, 'dist', 'M1.TL', 'dist_max', 5, 'steps', 0, 'window', 2);
f = fieldnames(opts);
for k = 1:numel(f), d.(f{k}) = opts.(f{k}); end

fig = figure('Name', 'Power & Control Lab · σύστημα υπό έλεγχο', 'NumberTitle', 'off', 'MenuBar', 'none', ...
             'Units', 'pixels', 'Position', [80 80 1100 680], 'Color', [0.97 0.97 0.96]);
S = struct('d', d, 'plant', [], 'run', false, 'cs', struct(), 'buf', zeros(0, 5), 'ui', struct());
ui = struct();
lbl = @(txt, pos) uicontrol(fig, 'Style', 'text', 'String', txt, 'Units', 'normalized', 'Position', pos, ...
                            'HorizontalAlignment', 'left', 'BackgroundColor', [0.97 0.97 0.96]);
edt = @(txt, pos) uicontrol(fig, 'Style', 'edit', 'String', txt, 'Units', 'normalized', 'Position', pos, 'HorizontalAlignment', 'left');
% the circuit
lbl('Κύκλωμα (αρχείο ή tutorial:<id>?…)', [0.02 0.94 0.30 0.03]);
ui.project = edt(d.project, [0.02 0.905 0.30 0.04]);
lbl('Είσοδος u', [0.02 0.86 0.14 0.03]);  ui.input = edt(d.input, [0.02 0.825 0.14 0.04]);
lbl('Μέτρηση y', [0.18 0.86 0.14 0.03]);  ui.measure = edt(d.measure, [0.18 0.825 0.14 0.04]);
lbl('Όρια u', [0.02 0.78 0.14 0.03]);     ui.urange = edt(num2str(d.u_range), [0.02 0.745 0.14 0.04]);
lbl('Άλλες μετρήσεις', [0.18 0.78 0.14 0.03]); ui.state = edt(strjoin(cellstr(d.state), ' '), [0.18 0.745 0.14 0.04]);
ui.open = uicontrol(fig, 'Style', 'pushbutton', 'String', 'Άνοιγμα του κυκλώματος', 'Units', 'normalized', ...
                    'Position', [0.02 0.685 0.30 0.045], 'Callback', @(h, e) cb_open(fig));
% the controller
lbl('Ελεγκτής: PI (pcl_pi)', [0.02 0.62 0.30 0.03]);
lbl('Kp', [0.02 0.58 0.05 0.03]); ui.Kp = edt(num2str(d.Kp), [0.06 0.58 0.08 0.04]);
lbl('Ki', [0.16 0.58 0.05 0.03]); ui.Ki = edt(num2str(d.Ki), [0.20 0.58 0.08 0.04]);
lbl('Δείγμα dt (s)', [0.02 0.53 0.12 0.03]); ui.dt = edt(num2str(d.dt), [0.14 0.53 0.08 0.04]);
% the reference and the disturbance, live
ui.reflbl = lbl(sprintf('Αναφορά r = %g', d.ref), [0.02 0.46 0.30 0.03]);
ui.ref = uicontrol(fig, 'Style', 'slider', 'Min', 0, 'Max', d.ref_max, 'Value', d.ref, 'Units', 'normalized', ...
                   'Position', [0.02 0.42 0.30 0.035], 'Callback', @(h, e) cb_ref(fig));
ui.distlbl = lbl(sprintf('Διαταραχή %s = 0', d.dist), [0.02 0.36 0.30 0.03]);
ui.dist = uicontrol(fig, 'Style', 'slider', 'Min', 0, 'Max', d.dist_max, 'Value', 0, 'Units', 'normalized', ...
                    'Position', [0.02 0.32 0.30 0.035], 'Callback', @(h, e) cb_dist(fig));
ui.go = uicontrol(fig, 'Style', 'pushbutton', 'String', '▶ Εκκίνηση', 'Units', 'normalized', 'Position', [0.02 0.24 0.10 0.05], ...
                  'Callback', @(h, e) cb_go(fig));
ui.stop = uicontrol(fig, 'Style', 'pushbutton', 'String', '■ Διακοπή', 'Units', 'normalized', 'Position', [0.125 0.24 0.10 0.05], ...
                    'Callback', @(h, e) cb_stop(fig));
ui.reset = uicontrol(fig, 'Style', 'pushbutton', 'String', '⟲ Επαναφορά', 'Units', 'normalized', 'Position', [0.23 0.24 0.11 0.05], ...
                     'Callback', @(h, e) cb_reset(fig));
ui.save = uicontrol(fig, 'Style', 'pushbutton', 'String', 'Αποθήκευση (CSV)', 'Units', 'normalized', 'Position', [0.02 0.18 0.32 0.045], ...
                    'Callback', @(h, e) cb_save(fig));
ui.info = lbl('Άνοιξε το κύκλωμα.', [0.02 0.02 0.30 0.14]);
% the plots
ui.ax1 = axes('Parent', fig, 'Units', 'normalized', 'Position', [0.40 0.56 0.57 0.38]); hold(ui.ax1, 'on'); grid(ui.ax1, 'on');
ui.ly = plot(ui.ax1, NaN, NaN, 'LineWidth', 1.4, 'Marker', 'none'); ui.lr = plot(ui.ax1, NaN, NaN, '--', 'LineWidth', 1.1, 'Marker', 'none');
ylabel(ui.ax1, 'y, r'); legend(ui.ax1, {'y', 'r'}, 'Location', 'southeast');
ui.ax2 = axes('Parent', fig, 'Units', 'normalized', 'Position', [0.40 0.08 0.57 0.38]); hold(ui.ax2, 'on'); grid(ui.ax2, 'on');
ui.lu = plot(ui.ax2, NaN, NaN, 'LineWidth', 1.2, 'Marker', 'none'); ylabel(ui.ax2, 'u'); xlabel(ui.ax2, 't (s)');
S.ui = ui;
set(fig, 'CloseRequestFcn', @(h, e) cb_close(fig));
setappdata(fig, 'S', S);
cb_open(fig);
if d.steps > 0
  run_loop(fig, d.steps);
end
end

function cb_open(fig)
S = getappdata(fig, 'S'); ui = S.ui; d = S.d;
if ~isempty(S.plant), S.plant.close(); end
st = strsplit(strtrim(get(ui.state, 'String')));
st = st(~cellfun(@isempty, st));
set(ui.info, 'String', 'Ανοίγει το κύκλωμα…'); drawnow;
try
  S.plant = PclPlant(strtrim(get(ui.project, 'String')), 'input', strtrim(get(ui.input, 'String')), ...
                     'measure', strtrim(get(ui.measure, 'String')), 'state', st, 'u_range', str2num(get(ui.urange, 'String')), ... %#ok<ST2NM>
                     'params', d.params, 'hdiv', d.hdiv);
catch e
  S.plant = []; setappdata(fig, 'S', S); set(ui.info, 'String', ['Σφάλμα: ' e.message]); return
end
S.cs = struct(); S.buf = zeros(0, 5);
setappdata(fig, 'S', S); show(fig);
set(ui.info, 'String', sprintf('Ανοιχτό: είσοδος %s, μετρήσεις %s, T = %g s.', S.plant.input, strjoin(S.plant.keys, ', '), S.plant.T));
end

function cb_go(fig)
S = getappdata(fig, 'S');
if isempty(S.plant) || S.run, return; end
if S.d.steps > 0, run_loop(fig, S.d.steps); else, run_loop(fig, Inf); end
end

function run_loop(fig, n)
S = getappdata(fig, 'S'); ui = S.ui;
if isempty(S.plant), return; end
S.run = true; setappdata(fig, 'S', S);
k = 0;
while k < n
  S = getappdata(fig, 'S');
  if ~S.run || isempty(S.plant), break; end
  dt = str2double(get(ui.dt, 'String'));
  cs = S.cs; cs.Kp = str2double(get(ui.Kp, 'String')); cs.Ki = str2double(get(ui.Ki, 'String'));
  cs.lo = S.plant.u_range(1); cs.hi = S.plant.u_range(2);
  r = get(ui.ref, 'Value');
  [u, cs] = S.d.ctrl(r, S.plant.m, cs, dt);
  S.plant.step(u, dt);
  S.cs = cs;
  m = [S.plant.m NaN];
  S.buf(end + 1, :) = [S.plant.t, r, S.plant.y, S.plant.u, m(2)];
  setappdata(fig, 'S', S);
  k = k + 1;
  if mod(k, 10) == 0 || k == n, show(fig); drawnow; end
end
S = getappdata(fig, 'S'); S.run = false; setappdata(fig, 'S', S); show(fig);
end

function show(fig)
S = getappdata(fig, 'S'); ui = S.ui; b = S.buf;
if isempty(b)
  set(ui.ly, 'XData', NaN, 'YData', NaN); set(ui.lr, 'XData', NaN, 'YData', NaN); set(ui.lu, 'XData', NaN, 'YData', NaN); return
end
w = b(:, 1) >= b(end, 1) - S.d.window;
set(ui.ly, 'XData', b(w, 1), 'YData', b(w, 3)); set(ui.lr, 'XData', b(w, 1), 'YData', b(w, 2));
set(ui.lu, 'XData', b(w, 1), 'YData', b(w, 4));
e = b(:, 2) - b(:, 3); iae = sum(abs(e)) * (b(end, 1) - b(1, 1)) / max(size(b, 1) - 1, 1);
set(ui.info, 'String', sprintf('t = %.3f s · y = %.4g · u = %.4g\nIAE = %.4g · δείγματα %d', b(end, 1), b(end, 3), b(end, 4), iae, size(b, 1)));
end

function cb_stop(fig)
S = getappdata(fig, 'S'); S.run = false; setappdata(fig, 'S', S);
end

function cb_reset(fig)
S = getappdata(fig, 'S');
if isempty(S.plant), return; end
S.run = false; S.plant.reset(); S.cs = struct(); S.buf = zeros(0, 5);
set(S.ui.dist, 'Value', 0); set(S.ui.distlbl, 'String', sprintf('Διαταραχή %s = 0', S.d.dist));
setappdata(fig, 'S', S); show(fig);
end

function cb_ref(fig)
S = getappdata(fig, 'S'); set(S.ui.reflbl, 'String', sprintf('Αναφορά r = %.4g', get(S.ui.ref, 'Value')));
end

function cb_dist(fig)
S = getappdata(fig, 'S'); v = get(S.ui.dist, 'Value');
set(S.ui.distlbl, 'String', sprintf('Διαταραχή %s = %.4g', S.d.dist, v));
if ~isempty(S.plant) && ~isempty(S.d.dist), S.plant.setParam(S.d.dist, v); end
end

function cb_save(fig)
S = getappdata(fig, 'S');
if isempty(S.buf), return; end
[f, p] = uiputfile('*.csv', 'Αποθήκευση', 'plant_run.csv');
if isequal(f, 0), return; end
fid = fopen(fullfile(p, f), 'w'); fprintf(fid, 't,r,y,u,m2\n'); fprintf(fid, '%.9g,%.9g,%.9g,%.9g,%.9g\n', S.buf'); fclose(fid);
end

function cb_close(fig)
S = getappdata(fig, 'S');
S.run = false; setappdata(fig, 'S', S);
if ~isempty(S.plant), S.plant.close(); end
delete(fig);
end
