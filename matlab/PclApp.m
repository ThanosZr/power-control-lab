classdef PclApp
%PCLAPP  The app open in the browser, seen from MATLAB or Octave (3.15): read and change the circuit on the screen,
%   run it with the app's solver, read the scope, send tables, charts and messages to the app.
%   app = PclApp();
%   app.info()                                        % circuit, selection, period T
%   app.param('R1.R')   ;  app.setParam('R1.R', 20)   % the change shows in the app (with undo)
%   r = app.run('t_end', 5e-3, 'measure', {'Vo', 'V:C1', 'avg', 10});   r.measure.Vo, plot(r.t, r.V_C1)
%   s = app.scope();                                  % what the scope holds now
%   app.show('μήνυμα ή πίνακας');  app.notify('τέλος', 'info');
%   With the link closed in the app the first call «knocks»: the app asks Αποδοχή / Απόρριψη.
%   The same methods as the Python pcl.link and the add-ons (docs/ADDONS.md).
  properties
    client = '';
  end
  methods
    function obj = PclApp(client)
      if nargin > 0, obj.client = client; end
    end
    function r = call(obj, method, args)
      if nargin < 3, args = struct(); end
      r = pcl_link(method, args, obj.client);
    end
    function r = info(obj), r = obj.call('info'); end
    function r = project(obj), r = obj.call('project.get'); end
    function r = load(obj, project), r = obj.call('project.load', struct('project', project)); end
    function r = params(obj, id)
      if nargin < 2, r = obj.call('params'); else, r = obj.call('params', struct('id', id)); end
    end
    function v = param(obj, key), v = obj.call('get', struct('key', key)); end
    function r = setParam(obj, key, value), r = obj.call('set', struct('key', key, 'value', value)); end
    function r = setMany(obj, keys, values)
      % keys {'R1.R', 'L1.L'}, values {20, 47e-6} (keys with a dot cannot be struct fields)
      r = obj.call('set_many', struct('values', containers.Map(keys, values)));
    end
    function r = selection(obj), r = obj.call('selection'); end
    function r = channels(obj), r = obj.call('channels'); end
    function r = values(obj, keys), r = obj.call('values', struct('keys', {keys})); end
    function s = scope(obj, keys)
      if nargin < 2, keys = {}; end
      j = obj.call('scope', struct('keys', {keys}));
      s = PclApp.columns(j);
    end
    function r = run(obj, varargin)
      % name-value: t_end (s), channels {…}, measure {name, key, stat, arg; …}, step ('fixed' | 'var'), hdiv, method
      a = struct();
      for k = 1:2:numel(varargin), a.(varargin{k}) = varargin{k + 1}; end      % not struct(varargin{:}): a cell value would make an array
      if isfield(a, 'measure')
        m = pcl_measures(a.measure); q = cell(1, numel(m));
        for k = 1:numel(m)
          q{k} = struct('name', m(k).name, 'key', m(k).key, 'stat', m(k).stat);
          if ~isempty(m(k).arg)
            if strcmp(m(k).stat, 'at'), q{k}.at = m(k).arg; else, q{k}.periods = m(k).arg; end
          end
        end
        a.measure = q;
      end
      j = obj.call('run', a);
      r = PclApp.columns(j);
      r.measure = j.measure; r.meta = j.meta;
    end
    function r = python(obj, code, inputs)
      if nargin < 3, inputs = struct(); end
      r = obj.call('python', struct('code', code, 'inputs', inputs));
    end
    function r = show(obj, what, title)
      if nargin < 3, title = ''; end
      if ischar(what), what = struct('type', 'text', 'text', what); end
      what.title = title;
      r = obj.call('show', struct('obj', what));
    end
    function r = notify(obj, msg, sev)
      if nargin < 3, sev = 'info'; end
      r = obj.call('notify', struct('msg', msg, 'sev', sev, 'src', 'MATLAB'));
    end
  end
  methods (Static)
    function r = columns(j)
      % t and one field per channel (V:C1 → V_C1), with the original keys
      ks = PclApp.cs(j.keys);
      r = struct('t', double(j.t(:)), 'keys', {ks});
      fn = fieldnames(j.ch);
      for k = 1:numel(ks)
        v = regexprep(ks{k}, '\W', '_'); v = regexprep(v, '^_+|_+$', '');
        if isempty(v) || ~isletter(v(1)), v = ['x_' v]; end
        x = j.ch.(fn{k});
        if iscell(x), y = nan(numel(x), 1); for i = 1:numel(x), if isnumeric(x{i}) && ~isempty(x{i}), y(i) = x{i}; end, end, x = y; end
        r.(v) = double(x(:));
      end
    end
    function c = cs(x)
      if ischar(x), c = {x}; elseif iscell(x), c = x(:)'; else, c = {}; end
    end
  end
end
