function r = pcl_link(method, args, client)
%PCL_LINK  One call to the app open in the browser (3.15). PclApp wraps it in methods; this is the plain call.
%   info = pcl_link('info');
%   pcl_link('set', struct('key', 'R1.R', 'value', 10));
%   With the link closed in the app, the call «knocks»: the app shows Αποδοχή / Απόρριψη and the call waits for it.
%   The address and the token are in ~/.pcl/link.json (PCL_HOME moves it), written by python run.py.
%   Methods: info, project.get, project.load, params, get, set, set_many, selection, channels, scope, values, run,
%   batch, bifurcation, python, show, notify (docs/ADDONS.md). MATLAB: webwrite. Octave: through python -m pcl link.
if nargin < 2 || isempty(args), args = struct(); end
c = pcl_config();
if nargin < 3 || isempty(client)
  if c.octave, client = 'Octave (pcl_link)'; else, client = 'MATLAB (pcl_link)'; end
end
home = getenv('PCL_HOME');
if isempty(home)
  if ispc, home = fullfile(getenv('USERPROFILE'), '.pcl'); else, home = fullfile(getenv('HOME'), '.pcl'); end
end
f = fullfile(home, 'link.json');
if exist(f, 'file') ~= 2, error('pcl:link', 'Δεν βρέθηκε το %s: ξεκίνα την εφαρμογή με python run.py.', f); end
L = jsondecode(fileread(f));
if c.octave
  % Octave's webwrite sends only form data: the call goes through python -m pcl link (pcl.link), the same request
  fin = [tempname() '.json']; fout = [tempname() '.json'];
  cleanup = onCleanup(@() pcl_delete({fin, fout}));
  fid = fopen(fin, 'w', 'n', 'UTF-8'); fprintf(fid, '%s', jsonencode(struct('method', method, 'args', args, 'client', client))); fclose(fid);
  [st, msg] = system(sprintf('cd "%s" && "%s" -m pcl link "%s" --out "%s" 2>&1', c.root, c.python, fin, fout));
  if st ~= 0 || exist(fout, 'file') ~= 2, error('pcl:link', 'Η κλήση δεν έγινε: %s', msg); end
  out = jsondecode(fileread(fout));
else
  body = jsonencode(struct('token', L.token, 'method', method, 'args', args, 'timeout', 590, 'client', client));
  o = weboptions('MediaType', 'application/json', 'ContentType', 'text', 'Timeout', 700);
  try
    txt = webwrite([L.url '/api/link/call'], body, o);
  catch e
    error('pcl:link', 'Η εφαρμογή απάντησε: %s', e.message);
  end
  out = jsondecode(char(txt));
end
if isfield(out, 'error'), error('pcl:link', '%s', out.error); end
r = out.result;
end

function pcl_delete(files)
for k = 1:numel(files)
  if exist(files{k}, 'file') == 2, delete(files{k}); end
end
end
