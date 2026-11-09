function r = pcl_sweep(project, grid, opts)
%PCL_SWEEP  A sweep of parameters with measurements, one simulation per point (ROADMAP §30, 3.14).
%   r = pcl_sweep('tutorial:buck?start=steady', {'L1.L', [22e-6 47e-6 100e-6]; 'R1.R', [5 10]}, ...
%                 struct('t_end', 5e-3, 'measure', {{'Vo', 'V:C1', 'avg', 10; 'dI', 'I:L1', 'pp', 10}}))
%   plot(r.L1_L, r.dI, 'o-')
%
%   grid   {'<id>.<parameter>', values; ...}: every combination (opts.mode = 'zip': side by side)
%   opts   t_end, measure (required), params (name-value pairs applied before the sweep), mode, workers,
%          solver, step, rtol, hmax, hdiv, method, server (MATLAB only)
%   r      one column per parameter and measurement (L1.L -> L1_L), params, measure, vars, rows, meta,
%          and in MATLAB r.table
if nargin < 3, opts = struct(); end
params = {};
if isfield(opts, 'params'), params = opts.params; opts = rmfield(opts, 'params'); end
spec = pcl_spec(project, params);
server = '';
if isfield(opts, 'server'), server = opts.server; opts = rmfield(opts, 'server'); end
if ~isfield(opts, 'measure') || isempty(opts.measure)
  error('pcl:sweep', 'Η σάρωση θέλει μετρήσεις: opts.measure = {''Vo'', ''V:C1'', ''avg'', 10}.');
end
opts.measure = pcl_measures(opts.measure);
if iscell(grid)
  g = struct('key', {}, 'values', {});
  for k = 1:size(grid, 1)
    v = grid{k, 2};
    if isnumeric(v), v = num2cell(v(:)'); end      % always a JSON array, even for one value
    g(end + 1) = struct('key', grid{k, 1}, 'values', {v}); %#ok<AGROW>
  end
  grid = g;
end
opts.grid = grid;
spec.sweep = opts;
r = pcl_result(pcl_job(spec, server));
end
