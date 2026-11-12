classdef PclPlant < handle
%PCLPLANT  A circuit of the lab as the plant of a controller written in MATLAB or Octave (4.8.1, ROADMAP §48).
%   The circuit runs with the app's solver (the browser's, in Node, through python -m pcl plant); the controller runs
%   here, one sample at a time. The steps are those of pcl.workbench.CircuitPlant in Python, so the same controller
%   gives the same numbers in MATLAB, in Octave and in Python.
%
%   p = PclPlant('tutorial:dc_drive?mode=open', 'input', 'PWM1:d', 'measure', 'M1:w', 'state', {'AM1:y'}, ...
%                'u_range', [0 1], 'params', {'M1.TL', 0}, 'hdiv', 50);
%   y = p.step(0.5, 2e-3);        % 2 ms with u = 0.5 held; y is the measurement (here M1:w)
%   p.m, p.t                      % all the measurements [y, state ...] and the time
%   p.setParam('M1.TL', 2);       % a change of the circuit from the next step on (as in the app while it runs)
%   p.reset();                    % back to the start: the same trajectory again
%   r = p.loop(@pcl_pi, ref, 2e-3, struct('Kp', 0.01, 'Ki', 0.5));   % a controller over a reference (one step per sample)
%   p.close();                    % or delete(p)
%
%   project  a file saved from the app, 'tutorial:<id>[?option=value&...]', or a struct (a decoded project)
%   input    a «Σταθερά / πρόγραμμα» block (e.g. KL) or <id>:<pin> of a signal input (e.g. PWM1:d, a PWM's duty)
%   measure  the output y (e.g. M1:w);  state: more measurements (e.g. {'AM1:y'})
%   u_range  the input is clipped to it;  settle: seconds run before the first step (every reset returns there)
%   params   name-value pairs {'<id>.<parameter>', value, ...} set before the start;  hdiv, method: the solver's step
%
%   One step costs about a millisecond of communication: enough for loops of speed, voltage, power (up to a few
%   hundred Hz). Faster loops (currents, kHz) belong inside the circuit, as blocks.
  properties (SetAccess = private)
    t = 0;          % s
    y = 0;          % the measurement
    m = [];         % [y, state ...]
    u = 0;          % the last input (after the clipping)
    keys = {};      % the channels of y and the state
    T = NaN;        % the period of the circuit (s)
    input = '';     % the block that takes u
    u_range = [-1 1];
  end
  properties (Access = private)
    io = struct();
  end
  methods
    function obj = PclPlant(project, varargin)
      o = struct('input', '', 'measure', '', 'state', {{}}, 'u_range', [-1 1], 'y_range', [-1 1], 'settle', 0, ...
                 'params', {{}}, 'hdiv', 0, 'method', '');
      for k = 1:2:numel(varargin), o.(varargin{k}) = varargin{k + 1}; end
      if isempty(o.input) || isempty(o.measure)
        error('pcl:plant', 'Δώσε την είσοδο (''input'', π.χ. PWM1:d) και τη μέτρηση (''measure'', π.χ. M1:w).');
      end
      if ischar(project) && ~strncmp(project, 'tutorial:', 9)
        if ~exist(project, 'file'), error('pcl:plant', 'Δεν βρέθηκε το αρχείο %s.', project); end
        [~, a] = fileattrib(project); project = a.Name;          % python runs from the lab's folder
      end
      if ischar(o.state), o.state = {o.state}; end
      if mod(numel(o.params), 2), error('pcl:plant', 'Οι παράμετροι είναι ζεύγη {''<id>.<παράμετρος>'', τιμή, ...}.'); end
      pairs = cell(1, numel(o.params) / 2);
      for k = 1:numel(pairs), pairs{k} = {o.params{2 * k - 1}, o.params{2 * k}}; end
      q = struct('op', 'open', 'project', project, 'set', {pairs}, 'input', o.input, 'measure', o.measure, ...
                 'state', {o.state(:)'}, 'u_range', o.u_range, 'y_range', o.y_range, 'settle', o.settle);
      if o.hdiv > 0, q.hdiv = o.hdiv; end
      if ~isempty(o.method), q.method = o.method; end
      obj.start();
      r = obj.call(q);
      obj.keys = PclApp.cs(r.keys); obj.T = r.T; obj.input = r.input; obj.u_range = r.u_range(:)';
      obj.take(r);
    end
    function y = step(obj, u, dt)
      % the circuit dt seconds with u held (a zero-order hold, as a sampled controller); y the measurement at the end
      y = obj.take(obj.call(struct('op', 'step', 'u', u, 'dt', dt)));
    end
    function y = reset(obj)
      % back to the start (t = 0 or the settled state), without solving the start again; changes made with setParam go
      y = obj.take(obj.call(struct('op', 'reset')));
    end
    function setParam(obj, varargin)
      % setParam('M1.TL', 2) or setParam({'M1.TL', 2, 'KL', 3}): from the next step on, the states kept
      a = varargin; if numel(a) == 1 && iscell(a{1}), a = a{1}; end
      v = containers.Map(a(1:2:end), a(2:2:end));
      obj.call(struct('op', 'set', 'values', v));
    end
    function r = loop(obj, ctrl, ref, dt, cs)
      %LOOP  A controller over a reference, one step per sample: [u, cs] = ctrl(r, m, cs, dt), with m = [y, state ...].
      %   r = p.loop(@pcl_pi, ref, dt, struct('Kp', 0.01, 'Ki', 0.5, 'lo', 0, 'hi', 1))
      %   r.t, r.y, r.u, r.r, r.m (a row per sample, after its step)
      if nargin < 5, cs = struct(); end
      n = numel(ref); r = struct('t', zeros(n, 1), 'y', zeros(n, 1), 'u', zeros(n, 1), 'r', ref(:), 'm', zeros(n, numel(obj.m)));
      for k = 1:n
        [u, cs] = ctrl(ref(k), obj.m, cs, dt);
        obj.step(u, dt);
        r.t(k) = obj.t; r.y(k) = obj.y; r.u(k) = obj.u; r.m(k, :) = obj.m(:)';
      end
      r.cs = cs;
    end
    function close(obj)
      if ~isfield(obj.io, 'kind'), return; end
      try, obj.call(struct('op', 'close')); catch, end
      io = obj.io; obj.io = struct();
      try
        if strcmp(io.kind, 'octave')
          fclose(io.in); fclose(io.out); waitpid(io.pid);
        else
          io.w.close(); io.r.close(); io.proc.waitFor();
        end
      catch
      end
      if isfield(io, 'err') && exist(io.err, 'file') == 2, delete(io.err); end
    end
    function delete(obj)
      obj.close();
    end
  end
  methods (Access = private)
    function y = take(obj, r)
      obj.t = r.t; obj.y = r.y; obj.m = r.m(:)'; obj.u = r.u; y = r.y;
    end
    function start(obj)
      c = pcl_config();
      if c.octave
        if ispc
          [in, out, pid] = popen2('cmd', {'/c', sprintf('cd /d "%s" && "%s" -m pcl plant', c.root, c.python)});
        else
          [in, out, pid] = popen2('sh', {'-c', sprintf('cd "%s" && exec "%s" -m pcl plant', c.root, c.python)});
        end
        if pid < 0, error('pcl:plant', 'Δεν ξεκίνησε η Python (%s).', c.python); end
        obj.io = struct('kind', 'octave', 'in', in, 'out', out, 'pid', pid);
      else
        pb = java.lang.ProcessBuilder({c.python, '-m', 'pcl', 'plant'});
        pb.directory(java.io.File(c.root));
        pb.environment().put('PYTHONIOENCODING', 'utf-8');
        err = [tempname() '.log'];
        pb.redirectError(java.io.File(err));
        proc = pb.start();
        w = java.io.BufferedWriter(java.io.OutputStreamWriter(proc.getOutputStream(), 'UTF-8'));
        r = java.io.BufferedReader(java.io.InputStreamReader(proc.getInputStream(), 'UTF-8'));
        obj.io = struct('kind', 'matlab', 'proc', proc, 'w', w, 'r', r, 'err', err);
      end
    end
    function r = call(obj, q)
      if ~isfield(obj.io, 'kind'), error('pcl:plant', 'Το σύστημα έκλεισε.'); end
      line = jsonencode(q);
      io = obj.io;
      if strcmp(io.kind, 'octave')
        fputs(io.in, [line char(10)]); fflush(io.in);
        txt = ''; t0 = tic;
        while true
          x = fgets(io.out);
          if ischar(x)
            txt = [txt x]; %#ok<AGROW>
            if x(end) == char(10), break; end
          else
            fclear(io.out);
            if waitpid(io.pid, WNOHANG) == io.pid, error('pcl:plant', 'Η Python σταμάτησε: %s', txt); end
            if toc(t0) > 600, error('pcl:plant', 'Καμία απάντηση σε 10 λεπτά.'); end
            pause(2e-4);
          end
        end
      else
        io.w.write(line); io.w.newLine(); io.w.flush();
        x = io.r.readLine();
        if isempty(x), error('pcl:plant', 'Η Python σταμάτησε: %s', fileread(io.err)); end
        txt = char(x);
      end
      a = jsondecode(txt);
      if isfield(a, 'error'), error('pcl:plant', '%s', a.error); end
      r = a.ok;
    end
  end
end
