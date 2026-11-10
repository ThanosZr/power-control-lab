function r = pcl_bifurcation(project, param, values, opts)
%PCL_BIFURCATION  The bifurcation diagram as a sweep (ROADMAP §30, 3.15): for each value of param a transient,
%   then one sample of a channel per base period, and the period of the samples (1, 2, 4, …; 0 = none).
%   r = pcl_bifurcation('tutorial:pcm_chaos', 'IC.v', linspace(1.4, 3, 33), ...
%                       struct('channel', 'Y:AM1', 'stat', 'end', 'transient', 300, 'record', 64));
%   plot(repmat(r.values, 1, size(r.Y, 2)), r.Y, 'k.')
%
%   opts   channel (required), stat (min, max, avg, end), transient, record, workers, params (name-value pairs), server (MATLAB)
%   r      values (n×1), Y (n×record), period (n×1), changes (the first value of each new period), meta
%   The same solver call as the app's diagram, so the same numbers.
if nargin < 4, opts = struct(); end
params = {};
if isfield(opts, 'params'), params = opts.params; opts = rmfield(opts, 'params'); end
server = '';
if isfield(opts, 'server'), server = opts.server; opts = rmfield(opts, 'server'); end
if ~isfield(opts, 'channel'), error('pcl:bifurcation', 'Δώσε opts.channel, π.χ. ''I:L1''.'); end
spec = pcl_spec(project, params);
opts.param = param;
opts.values = num2cell(values(:)');
spec.bifurcation = opts;
r = pcl_result(pcl_job(spec, server));
end
