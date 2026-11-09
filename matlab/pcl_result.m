function r = pcl_result(j)
%PCL_RESULT  The answer of the pcl package as a MATLAB/Octave struct (used by pcl_run, pcl_sweep, pcl_read).
r = struct();
r.kind = j.kind;
r.meta = j.meta;
if strcmp(j.kind, 'run')
  r.t = j.t(:);
  keys = cellstr_(j.keys);
  vars = cellstr_(j.vars);
  fn = fieldnames(j.ch);                  % jsondecode renames V:C1 to a valid name; the order is the order of keys
  for k = 1:numel(vars)
    r.(vars{k}) = col_(j.ch.(fn{k}));
  end
  r.keys = keys;
  r.vars = vars;
  u = j.units;
  if isstruct(u)
    un = struct2cell(u);
    r.units = cellfun(@(x) char(x), un(:)', 'UniformOutput', false);
  else
    r.units = {};
  end
  r.measure = j.measure;
  r.diag = j.diag;
  cols = [{'t'}, vars];
else
  r.params = cellstr_(j.params);
  r.measure = cellstr_(j.measure);
  r.vars = cellstr_(j.vars);
  rows = j.rows;
  if isstruct(rows), rows = num2cell(rows); end
  n = numel(rows);
  for k = 1:numel(r.vars)
    r.(r.vars{k}) = nan(n, 1);
  end
  for i = 1:n
    f = fieldnames(rows{i});              % parameters, then measurements (and error, when a point failed)
    for k = 1:min(numel(r.vars), numel(f))
      v = rows{i}.(f{k});
      if isnumeric(v) && isscalar(v), r.(r.vars{k})(i) = v; end
    end
  end
  r.rows = rows;
  cols = r.vars;
end
if exist('OCTAVE_VERSION', 'builtin') == 0 && exist('table', 'class')
  args = cellfun(@(c) r.(c), cols, 'UniformOutput', false);
  r.table = table(args{:}, 'VariableNames', cols);
end
end

function c = cellstr_(x)
if ischar(x), c = {x}; elseif iscell(x), c = x(:)'; else, c = {}; end
end

function v = col_(x)
if iscell(x)                              % a channel with null (NaN) values decodes as a cell
  v = nan(numel(x), 1);
  for i = 1:numel(x)
    if isnumeric(x{i}) && ~isempty(x{i}), v(i) = x{i}; end
  end
else
  v = double(x(:));
end
end
