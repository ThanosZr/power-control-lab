function r = pcl_read(file)
%PCL_READ  Reads a result the pcl package or the app wrote: CSV (with the '#' metadata), JSON, .mat (3.14),
%   Parquet (MATLAB parquetread) or HDF5 (3.15).
%   r = pcl_read('out.csv');  plot(r.t, r.V_C1)
%   For a CSV: t, one field per column (V:C1 [V] -> V_C1), keys, vars, units, meta; in MATLAB also r.table.
%   Works for the Greek Excel format too (';' and decimal comma).
[~, ~, ext] = fileparts(file);
switch lower(ext)
  case '.json'
    fid = fopen(file, 'r', 'n', 'UTF-8'); txt = fread(fid, Inf, '*char')'; fclose(fid);
    r = pcl_result(jsondecode(txt));
    return
  case '.mat'
    r = load(file);
    if isfield(r, 'meta') && ischar(r.meta), r.meta = jsondecode(r.meta); end
    return
  case {'.parquet', '.pq'}                % 3.15: MATLAB R2019a and later (Octave: write .mat or .csv instead)
    if exist('parquetread', 'file') == 0
      error('pcl:read', 'Το Parquet διαβάζεται με parquetread (MATLAB R2019a+). Στο Octave: r.save(''x.mat'') ή .csv.');
    end
    T = parquetread(file, 'VariableNamingRule', 'preserve');
    info = parquetinfo(file);
    r = struct('kind', 'parquet', 'table', T, 'keys', {T.Properties.VariableNames});
    vars = matlab.lang.makeValidName(T.Properties.VariableNames);
    for k = 1:numel(vars), r.(vars{k}) = T{:, k}; end
    r.vars = vars;
    try, r.meta = jsondecode(info.FileMetadata('pcl')); catch, r.meta = struct(); end %#ok<CTCH>
    return
  case {'.h5', '.hdf5'}                   % 3.15: one dataset per column (MATLAB h5read; Octave: write .mat or .csv instead)
    if exist('h5read', 'file') == 0 && exist('h5read', 'builtin') == 0
      error('pcl:read', 'Το HDF5 διαβάζεται με h5read (MATLAB). Στο Octave: r.save(''x.mat'') ή .csv.');
    end
    r = struct('kind', 'hdf5');
    try, cols = jsondecode(h5readatt(file, '/', 'columns')); catch, cols = {}; end %#ok<CTCH>
    try, r.meta = jsondecode(h5readatt(file, '/', 'meta')); catch, r.meta = struct(); end %#ok<CTCH>
    if ischar(cols), cols = {cols}; end
    vars = cell(1, numel(cols));
    for k = 1:numel(cols)
      v = regexprep(cols{k}, '\W', '_'); v = regexprep(v, '^_+|_+$', '');
      if isempty(v) || ~isletter(v(1)), v = ['x_' v]; end
      vars{k} = v;
      r.(v) = h5read(file, ['/' cols{k}]);
    end
    r.keys = cols(:)'; r.vars = vars;
    return
end
fid = fopen(file, 'r', 'n', 'UTF-8');
txt = fread(fid, Inf, '*char')';
fclose(fid);
lines = regexp(txt, '\r?\n', 'split');
meta = struct();
k = 1;
while k <= numel(lines) && strncmp(lines{k}, '#', 1)
  tok = regexp(lines{k}, '^#\s*([^:]+):\s*(.*)$', 'tokens', 'once');
  if ~isempty(tok)
    name = regexprep(strtrim(tok{1}), '\W', '_');
    try, meta.(name) = jsondecode(tok{2}); catch, meta.(name) = tok{2}; end
  end
  k = k + 1;
end
head = lines{k};
if any(head == ';'), sep = ';'; else, sep = ','; end
cols = strsplit(head, sep);
data = lines(k + 1:end);
data = data(~cellfun(@isempty, data));
if strcmp(sep, ';'), data = strrep(data, ',', '.'); end
M = nan(numel(data), numel(cols));
for i = 1:numel(data)
  v = str2double(strsplit(data{i}, sep));
  M(i, 1:numel(v)) = v;
end
r = struct('kind', 'csv', 'meta', meta);
keys = cell(1, numel(cols)); units = keys; vars = keys;
for j = 1:numel(cols)
  tok = regexp(cols{j}, '^(.*?)\s*\[(.*)\]$', 'tokens', 'once');
  if isempty(tok), keys{j} = strtrim(cols{j}); units{j} = ''; else, keys{j} = tok{1}; units{j} = tok{2}; end
  v = regexprep(keys{j}, '\W', '_'); v = regexprep(v, '^_+|_+$', '');
  if isempty(v) || ~isletter(v(1)), v = ['x_' v]; end
  vars{j} = v;
  r.(v) = M(:, j);
end
r.keys = keys; r.vars = vars; r.units = units;
if exist('OCTAVE_VERSION', 'builtin') == 0 && exist('table', 'class')
  r.table = array2table(M, 'VariableNames', vars);
end
end
