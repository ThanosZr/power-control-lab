function r = pcl_link(method, args)
%PCL_LINK  Calls the app open in the browser (3.15): read and change the circuit on the screen, run it with the app's
%   solver, send tables and charts to its panel. The link is turned on in the app (panel «Πρόσθετα και σύνδεση»);
%   the address and the token are in ~/.pcl/link.json, written by python run.py.
%   info = pcl_link('info');
%   pcl_link('set', struct('key', 'R1.R', 'value', 10));
%   r = pcl_link('run', struct('t_end', 5e-3, 'measure', {{struct('name', 'Vo', 'key', 'V:C1', 'stat', 'avg', 'periods', 10)}}));
%   r.measure.Vo
%   pcl_link('show', struct('obj', struct('type', 'text', 'text', 'από το MATLAB')));
%   Methods: info, project.get, project.load, params, get, set, set_many, selection, channels, scope, run, batch,
%   bifurcation, python, show, notify (the same as the add-ons, web/studio/addons.js).
if nargin < 2, args = struct(); end
c = pcl_config();
if c.octave
  error('pcl:link', 'Η σύνδεση θέλει webwrite (MATLAB). Από το Octave: pcl_run και pcl_sweep με τη γραμμή εντολών.');
end
home = getenv('PCL_HOME');
if isempty(home)
  if ispc, home = fullfile(getenv('USERPROFILE'), '.pcl'); else, home = fullfile(getenv('HOME'), '.pcl'); end
end
f = fullfile(home, 'link.json');
if ~isfile(f), error('pcl:link', 'Δεν βρέθηκε το %s: ξεκίνα την εφαρμογή με python run.py.', f); end
L = jsondecode(fileread(f));
o = weboptions('MediaType', 'application/json', 'Timeout', 600);
try
  out = webwrite([L.url '/api/link/call'], struct('token', L.token, 'method', method, 'args', args, 'timeout', 590), o);
catch e
  error('pcl:link', 'Η εφαρμογή απάντησε: %s', e.message);
end
r = out.result;
end
