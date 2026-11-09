function r = pcl_run(project, params, opts)
%PCL_RUN  One simulation of a Power Converter Lab circuit from MATLAB or Octave (ROADMAP §30, 3.14).
%   r = pcl_run('buck.json', {'L1.L', 47e-6}, struct('t_end', 5e-3, 'channels', {{'V:C1', 'I:L1'}}))
%   r = pcl_run('tutorial:buck?start=steady', {}, struct('t_end', '5m', 'step', 'var'))
%   plot(r.t, r.I_L1)
%
%   project  file saved from the app, 'tutorial:<id>[?option=value&...]', or a struct (a decoded project)
%   params   name-value pairs {'<id>.<parameter>', value, ...}: a number, '47u', or a program '0:10, 1m:12'
%   opts     t_end (s or '5m'), channels (cellstr, keys as in the app's scope), solver ('browser' | 'scipy'),
%            step ('fixed' | 'var'), rtol, hmax, hdiv, method, from, max_points,
%            measure ({name, key, stat, arg; ...} with stat avg|rms|min|max|pp|end|at|thd),
%            server (e.g. 'http://127.0.0.1:8765': the local server instead of the command line, MATLAB only)
%   r        t (column), one field per channel (V:C1 -> V_C1), keys, vars, units, measure (struct), meta, diag,
%            and in MATLAB r.table (t and the channels as columns)
%
%   The browser's solver is the app's own (web/studio/mna.js in Node), so the numbers are the app's.
if nargin < 2, params = {}; end
if nargin < 3, opts = struct(); end
spec = pcl_spec(project, params);
server = '';
if isfield(opts, 'server'), server = opts.server; opts = rmfield(opts, 'server'); end
if isfield(opts, 'measure'), opts.measure = pcl_measures(opts.measure); end
if isfield(opts, 'channels') && ischar(opts.channels), opts.channels = {opts.channels}; end
spec.run = opts;
r = pcl_result(pcl_job(spec, server));
end
