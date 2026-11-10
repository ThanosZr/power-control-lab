function fig = pcl_style(fig, name, out)
%PCL_STYLE  Applies a preset of pcl/presets/*.json to a MATLAB figure (3.15, ROADMAP §36): size in cm, font and sizes,
%   line widths, the colour order (colour-blind friendly), grid and box. The same JSON files as the Python figures
%   (python -m pcl plot), so a figure looks the same from either side.
%   plot(t, v); pcl_style(gcf, 'ieee');                 % 8.8 cm wide, Times 8 pt
%   pcl_style(gcf, 'thesis', 'fig.pdf');                % and export (pdf, svg, eps, png by the extension)
%   Presets: ieee, thesis, slides, lab, or a path to a JSON file.
if nargin < 1 || isempty(fig), fig = gcf; end
if nargin < 2, name = 'ieee'; end
c = pcl_config();
f = name;
if ~isfile(f), f = fullfile(c.root, 'pcl', 'presets', [name '.json']); end
if ~isfile(f), error('pcl:style', 'Άγνωστο πρότυπο: %s', name); end
p = jsondecode(fileread(f));
set(fig, 'Units', 'centimeters');
pos = get(fig, 'Position');
set(fig, 'Position', [pos(1) pos(2) p.width_cm p.height_cm], 'PaperUnits', 'centimeters', ...
    'PaperSize', [p.width_cm p.height_cm], 'PaperPosition', [0 0 p.width_cm p.height_cm], 'Color', 'w');
font = p.font;
fonts = listfonts();
if ~any(strcmpi(fonts, font))
  for k = 1:numel(p.font_fallback)
    if any(strcmpi(fonts, p.font_fallback{k})), font = p.font_fallback{k}; break; end
  end
end
colors = reshape(sscanf(strjoin(cellfun(@(x) x(2:end), p.colors(:)', 'UniformOutput', false), ''), '%2x'), 3, [])' / 255;
ax = findall(fig, 'Type', 'axes');
for a = ax(:)'
  set(a, 'FontName', font, 'FontSize', p.size.tick, 'LineWidth', 0.5, 'ColorOrder', colors, 'Box', onoff(p.box));
  if p.grid, grid(a, 'on'); else, grid(a, 'off'); end
  set(get(a, 'XLabel'), 'FontSize', p.size.label, 'FontName', font);
  set(get(a, 'YLabel'), 'FontSize', p.size.label, 'FontName', font);
  set(get(a, 'Title'), 'FontSize', p.size.title, 'FontName', font);
  ln = findall(a, 'Type', 'line');
  for k = 1:numel(ln)
    set(ln(k), 'LineWidth', p.linewidth, 'MarkerSize', p.markersize);
  end
end
lg = findall(fig, 'Type', 'legend');
for l = lg(:)'
  set(l, 'FontSize', p.size.legend, 'FontName', font);
end
if nargin > 2 && ~isempty(out)
  [~, ~, ext] = fileparts(out);
  switch lower(ext)
    case '.pdf', print(fig, out, '-dpdf', '-painters');
    case '.svg', print(fig, out, '-dsvg', '-painters');
    case '.eps', print(fig, out, '-depsc', '-painters');
    otherwise, print(fig, out, '-dpng', sprintf('-r%d', p.dpi));
  end
end
end

function s = onoff(b)
if b, s = 'on'; else, s = 'off'; end
end
