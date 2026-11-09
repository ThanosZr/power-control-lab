function r = pcl_job(spec, server)
%PCL_JOB  Sends one request to the pcl package and returns the decoded answer (used by pcl_run and pcl_sweep).
%   spec: struct with project, set, and run or sweep (see pcl/core.py, job).
%   server: '' for the command line (python -m pcl job), or the local server, e.g. 'http://127.0.0.1:8765' (MATLAB).
if nargin > 1 && ~isempty(server)
  c = pcl_config();
  if c.octave
    error('pcl:server', 'Από το Octave τα σενάρια τρέχουν με τη γραμμή εντολών: άφησε το opts.server κενό.');
  end
  if isfield(spec, 'sweep'), kind = 'sweep'; else, kind = 'run'; end
  o = weboptions('MediaType', 'application/json', 'Timeout', 600);
  try
    r = webwrite([regexprep(server, '/+$', '') '/api/scenario_' kind], spec, o);
  catch e
    error('pcl:server', 'Ο server απάντησε: %s', e.message);
  end
  return
end
c = pcl_config();
fin = [tempname() '.json'];
fout = [tempname() '.json'];
cleanup = onCleanup(@() pcl_delete({fin, fout}));
fid = fopen(fin, 'w', 'n', 'UTF-8');
fprintf(fid, '%s', jsonencode(spec));
fclose(fid);
if ispc
  cmd = sprintf('cd /d "%s" && "%s" -m pcl job "%s" --out "%s" 2>&1', c.root, c.python, fin, fout);
else
  cmd = sprintf('cd "%s" && "%s" -m pcl job "%s" --out "%s" 2>&1', c.root, c.python, fin, fout);
end
[st, out] = system(cmd);
if st ~= 0
  error('pcl:job', '%s', strtrim(out));
end
fid = fopen(fout, 'r', 'n', 'UTF-8');
txt = fread(fid, Inf, '*char')';
fclose(fid);
r = jsondecode(txt);
end

function pcl_delete(files)
for k = 1:numel(files)
  if exist(files{k}, 'file'), delete(files{k}); end
end
end
