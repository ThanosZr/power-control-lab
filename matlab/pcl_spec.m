function spec = pcl_spec(project, params)
%PCL_SPEC  The project and the parameter changes of a request (used by pcl_run and pcl_sweep).
%   project: a file saved from the app, 'tutorial:<id>[?option=value&...]', or a struct (a decoded project).
%   params: name-value pairs {'<id>.<parameter>', value, ...}, or a struct array with fields key, value.
if ischar(project) && ~strncmp(project, 'tutorial:', 9)
  if ~exist(project, 'file')
    error('pcl:project', 'Δεν βρέθηκε το αρχείο %s.', project);
  end
  [~, info] = fileattrib(project);          % the full path: the command line runs from the lab's folder
  project = info.Name;
end
spec.project = project;
if nargin < 2 || isempty(params)
  return
end
if iscell(params)
  if mod(numel(params), 2)
    error('pcl:params', 'Οι παράμετροι είναι ζεύγη {''<id>.<παράμετρος>'', τιμή, ...}.');
  end
  spec.set = struct('key', params(1:2:end), 'value', params(2:2:end));
else
  spec.set = params;
end
end
