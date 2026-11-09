function m = pcl_measures(m)
%PCL_MEASURES  Measurements as a struct array name/key/stat/periods (or at): from a cell {name, key, stat, arg; ...}.
%   stat: avg, rms, min, max, pp (over the last arg base periods), end, at (arg = time in s), thd.
if isempty(m) || isstruct(m)
  return
end
c = m;
m = struct('name', {}, 'key', {}, 'stat', {}, 'arg', {});
for k = 1:size(c, 1)
  row = c(k, :);
  a = [];
  if numel(row) > 3, a = row{4}; end
  m(end + 1) = struct('name', row{1}, 'key', row{2}, 'stat', row{3}, 'arg', a); %#ok<AGROW>
end
end
