function plot_with_mapping_gui_v4()
clc;
close all;

%% ============================================================
% DEFAULT SETTINGS
mappingFile = 'label_mapping.csv';
delimiter = ';';
timeColumnIndexDefault = 1;

defaultFigColor = 'w';
defaultAxesFontName = 'Arial';
defaultAxesFontSize = 12;
defaultAxesLineWidth = 1.2;
defaultLineWidth = 1.8;
defaultLineStyle = '-';
defaultMarker = 'none';
defaultMarkerSize = 6;
defaultTickDir = 'out';
defaultBoxState = 'off';
defaultGridState = 'off';
defaultInterpreter = 'tex';

S = struct();
S.files = {};
S.mappingFile = mappingFile;
S.delimiter = delimiter;
S.timeColumnIndexDefault = timeColumnIndexDefault;
S.fileLegendMap = {};   % {fileShortName, legendName3D}

%% ============================================================
% MAIN FIGURE
% ============================================================
fig = figure( ...
    'Name', 'Plot GUI v3 - Multi File / Mapping / 2D / 3D', ...
    'NumberTitle', 'off', ...
    'MenuBar', 'none', ...
    'ToolBar', 'none', ...
    'Color', [0.94 0.94 0.94], ...
    'Position', [20 30 1600 860]);

setappdata(fig, 'S', S);

%% ============================================================
% TOP BUTTONS
% ============================================================
uicontrol(fig, 'Style', 'pushbutton', ...
    'Units', 'normalized', ...
    'Position', [0.015 0.95 0.09 0.04], ...
    'String', 'Load Files', ...
    'FontWeight', 'bold', ...
    'Callback', @loadFilesCallback);

uicontrol(fig, 'Style', 'pushbutton', ...
    'Units', 'normalized', ...
    'Position', [0.11 0.95 0.12 0.04], ...
    'String', 'Save Current Tab', ...
    'FontWeight', 'bold', ...
    'Callback', @saveCurrentTabMappingCallback);

uicontrol(fig, 'Style', 'pushbutton', ...
    'Units', 'normalized', ...
    'Position', [0.235 0.95 0.10 0.04], ...
    'String', 'Save All Tabs', ...
    'FontWeight', 'bold', ...
    'Callback', @saveAllTabsMappingCallback);

uicontrol(fig, 'Style', 'pushbutton', ...
    'Units', 'normalized', ...
    'Position', [0.34 0.95 0.09 0.04], ...
    'String', '2D Plot', ...
    'FontWeight', 'bold', ...
    'Callback', @plot2DCallback);

uicontrol(fig, 'Style', 'pushbutton', ...
    'Units', 'normalized', ...
    'Position', [0.435 0.95 0.09 0.04], ...
    'String', '3D Plot', ...
    'FontWeight', 'bold', ...
    'Callback', @plot3DCallback);

uicontrol(fig, 'Style', 'pushbutton', ...
    'Units', 'normalized', ...
    'Position', [0.53 0.95 0.10 0.04], ...
    'String', 'Refresh Preview', ...
    'FontWeight', 'bold', ...
    'Callback', @refreshPreviewCallback);

uicontrol(fig, 'Style', 'pushbutton', ...
    'Units', 'normalized', ...
    'Position', [0.635 0.95 0.11 0.04], ...
    'String', 'Max in Current Tab', ...
    'FontWeight', 'bold', ...
    'Callback', @maxCurrentTabCallback);

uicontrol(fig, 'Style', 'pushbutton', ...
    'Units', 'normalized', ...
    'Position', [0.752 0.95 0.058 0.04], ...
    'String', 'Select All', ...
    'FontWeight', 'bold', ...
    'Callback', @selectAllInTab);

uicontrol(fig, 'Style', 'pushbutton', ...
    'Units', 'normalized', ...
    'Position', [0.812 0.95 0.070 0.04], ...
    'String', 'Deselect All', ...
    'FontWeight', 'bold', ...
    'Callback', @deselectAllInTab);

uicontrol(fig, 'Style', 'pushbutton', ...
    'Units', 'normalized', ...
    'Position', [0.884 0.95 0.058 0.04], ...
    'String', 'Close Tab', ...
    'FontWeight', 'bold', ...
    'ForegroundColor', [0.6 0 0], ...
    'Callback', @closeCurrentTab);

% Status bar (bottom): shows clearly what was saved / done and when
hStatus = uicontrol(fig, 'Style', 'text', ...
    'Units', 'normalized', ...
    'Position', [0.015 0.006 0.955 0.030], ...
    'HorizontalAlignment', 'left', ...
    'BackgroundColor', [0.88 0.90 0.94], ...
    'ForegroundColor', [0.10 0.20 0.40], ...
    'FontWeight', 'bold', ...
    'String', '  Ready.');
%% ============================================================
% LEFT: TABS
% ============================================================
tabgp = uitabgroup('Parent', fig, ...
    'Units', 'normalized', ...
    'Position', [0.015 0.05 0.60 0.88]);

%% ============================================================
% RIGHT: GLOBAL SETTINGS
% ============================================================
panelRight = uipanel('Parent', fig, ...
    'Title', 'Global Plot Settings', ...
    'FontWeight', 'bold', ...
    'Units', 'normalized', ...
    'Position', [0.625 0.05 0.36 0.88]);

y = 0.94;
dy = 0.042;
labelW = 0.33;
editW = 0.55;
x1 = 0.04;
x2 = 0.39;

uicontrol(panelRight, 'Style', 'text', 'Units', 'normalized', ...
    'Position', [x1 y labelW 0.03], 'String', 'Time label:', ...
    'HorizontalAlignment', 'left', ...
    'BackgroundColor', get(panelRight,'BackgroundColor'));
hTimeLabel = uicontrol(panelRight, 'Style', 'edit', 'Units', 'normalized', ...
    'Position', [x2 y editW 0.04], 'String', 'Time');

y = y - dy;
uicontrol(panelRight, 'Style', 'text', 'Units', 'normalized', ...
    'Position', [x1 y labelW 0.03], 'String', 'Time unit:', ...
    'HorizontalAlignment', 'left', ...
    'BackgroundColor', get(panelRight,'BackgroundColor'));
hTimeUnit = uicontrol(panelRight, 'Style', 'edit', 'Units', 'normalized', ...
    'Position', [x2 y editW 0.04], 'String', '');

y = y - dy;
uicontrol(panelRight, 'Style', 'text', 'Units', 'normalized', ...
    'Position', [x1 y labelW 0.03], 'String', 'Time multiplier:', ...
    'HorizontalAlignment', 'left', ...
    'BackgroundColor', get(panelRight,'BackgroundColor'));
hTimeMult = uicontrol(panelRight, 'Style', 'edit', 'Units', 'normalized', ...
    'Position', [x2 y editW 0.04], 'String', '1');

%% Time range section
y = y - dy - 0.01;
uicontrol(panelRight, 'Style', 'text', 'Units', 'normalized', ...
    'Position', [x1 y 0.28 0.03], 'String', 'Available time range:', ...
    'HorizontalAlignment', 'left', ...
    'FontWeight', 'bold', ...
    'BackgroundColor', get(panelRight,'BackgroundColor'));

hTimeRangeBar = uicontrol(panelRight, 'Style', 'text', 'Units', 'normalized', ...
    'Position', [x2 y 0.55 0.035], 'String', '[No file loaded]', ...
    'HorizontalAlignment', 'center', ...
    'BackgroundColor', [1 1 1]);

y = y - dy;
uicontrol(panelRight, 'Style', 'text', 'Units', 'normalized', ...
    'Position', [x1 y 0.15 0.03], 'String', 't min:', ...
    'HorizontalAlignment', 'left', ...
    'BackgroundColor', get(panelRight,'BackgroundColor'));
hTmin = uicontrol(panelRight, 'Style', 'edit', 'Units', 'normalized', ...
    'Position', [x1+0.12 y 0.28 0.04], 'String', '');

uicontrol(panelRight, 'Style', 'text', 'Units', 'normalized', ...
    'Position', [0.52 y 0.12 0.03], 'String', 't max:', ...
    'HorizontalAlignment', 'left', ...
    'BackgroundColor', get(panelRight,'BackgroundColor'));
hTmax = uicontrol(panelRight, 'Style', 'edit', 'Units', 'normalized', ...
    'Position', [0.64 y 0.30 0.04], 'String', '');

%% Standard plot settings
y = y - dy - 0.005;
uicontrol(panelRight, 'Style', 'text', 'Units', 'normalized', ...
    'Position', [x1 y labelW 0.03], 'String', 'Title:', ...
    'HorizontalAlignment', 'left', ...
    'BackgroundColor', get(panelRight,'BackgroundColor'));
hTitle = uicontrol(panelRight, 'Style', 'edit', 'Units', 'normalized', ...
    'Position', [x2 y editW 0.04], 'String', '');

y = y - dy;
uicontrol(panelRight, 'Style', 'text', 'Units', 'normalized', ...
    'Position', [x1 y labelW 0.03], 'String', 'Line width:', ...
    'HorizontalAlignment', 'left', ...
    'BackgroundColor', get(panelRight,'BackgroundColor'));
hLineWidth = uicontrol(panelRight, 'Style', 'edit', 'Units', 'normalized', ...
    'Position', [x2 y editW 0.04], 'String', num2str(defaultLineWidth));

y = y - dy;
uicontrol(panelRight, 'Style', 'text', 'Units', 'normalized', ...
    'Position', [x1 y labelW 0.03], 'String', 'Font size:', ...
    'HorizontalAlignment', 'left', ...
    'BackgroundColor', get(panelRight,'BackgroundColor'));
hFontSize = uicontrol(panelRight, 'Style', 'edit', 'Units', 'normalized', ...
    'Position', [x2 y editW 0.04], 'String', num2str(defaultAxesFontSize));

y = y - dy;
uicontrol(panelRight, 'Style', 'text', 'Units', 'normalized', ...
    'Position', [x1 y labelW 0.03], 'String', 'Line style:', ...
    'HorizontalAlignment', 'left', ...
    'BackgroundColor', get(panelRight,'BackgroundColor'));
hLineStyle = uicontrol(panelRight, 'Style', 'popupmenu', 'Units', 'normalized', ...
    'Position', [x2 y editW 0.04], 'String', {'-','--',':','-.'}, 'Value', 1);

y = y - dy;
uicontrol(panelRight, 'Style', 'text', 'Units', 'normalized', ...
    'Position', [x1 y labelW 0.03], 'String', 'Marker:', ...
    'HorizontalAlignment', 'left', ...
    'BackgroundColor', get(panelRight,'BackgroundColor'));
hMarker = uicontrol(panelRight, 'Style', 'popupmenu', 'Units', 'normalized', ...
    'Position', [x2 y editW 0.04], 'String', {'none','o','.','x','+','*','s','d'}, 'Value', 1);

y = y - dy;
uicontrol(panelRight, 'Style', 'text', 'Units', 'normalized', ...
    'Position', [x1 y labelW 0.03], 'String', 'Marker size:', ...
    'HorizontalAlignment', 'left', ...
    'BackgroundColor', get(panelRight,'BackgroundColor'));
hMarkerSize = uicontrol(panelRight, 'Style', 'edit', 'Units', 'normalized', ...
    'Position', [x2 y editW 0.04], 'String', num2str(defaultMarkerSize));

y = y - dy;
hGrid = uicontrol(panelRight, 'Style', 'checkbox', 'Units', 'normalized', ...
    'Position', [0.04 y 0.18 0.04], 'String', 'Grid on', ...
    'Value', strcmpi(defaultGridState,'on'), ...
    'BackgroundColor', get(panelRight,'BackgroundColor'));

hBox = uicontrol(panelRight, 'Style', 'checkbox', 'Units', 'normalized', ...
    'Position', [0.40 y 0.18 0.04], 'String', 'Box on', ...
    'Value', strcmpi(defaultBoxState,'on'), ...
    'BackgroundColor', get(panelRight,'BackgroundColor'));

hSameFigure = uicontrol(panelRight, 'Style', 'checkbox', 'Units', 'normalized', ...
    'Position', [0.66 y 0.22 0.04], 'String', 'Same fig', ...
    'Value', 1, ...
    'BackgroundColor', get(panelRight,'BackgroundColor'));

y = y - dy;
hLegend = uicontrol(panelRight, 'Style', 'checkbox', 'Units', 'normalized', ...
    'Position', [0.04 y 0.20 0.04], 'String', 'Show legend', ...
    'Value', 1, ...
    'BackgroundColor', get(panelRight,'BackgroundColor'));

hSave = uicontrol(panelRight, 'Style', 'checkbox', 'Units', 'normalized', ...
    'Position', [0.40 y 0.20 0.04], 'String', 'Save plots', ...
    'Value', 0, ...
    'BackgroundColor', get(panelRight,'BackgroundColor'));

y = y - dy;
uicontrol(panelRight, 'Style', 'text', 'Units', 'normalized', ...
    'Position', [x1 y labelW 0.03], 'String', 'Save folder:', ...
    'HorizontalAlignment', 'left', ...
    'BackgroundColor', get(panelRight,'BackgroundColor'));
hSaveFolder = uicontrol(panelRight, 'Style', 'edit', 'Units', 'normalized', ...
    'Position', [x2 y editW 0.04], 'String', 'plots_output');

%% Preview
y = y - dy - 0.005;
uicontrol(panelRight, 'Style', 'text', 'Units', 'normalized', ...
    'Position', [x1 y 0.20 0.03], 'String', 'Preview:', ...
    'HorizontalAlignment', 'left', ...
    'FontWeight', 'bold', ...
    'BackgroundColor', get(panelRight,'BackgroundColor'));

hPreview = uicontrol(panelRight, 'Style', 'text', 'Units', 'normalized', ...
    'Position', [x2 y-0.025 0.55 0.09], ...
    'String', '', ...
    'HorizontalAlignment', 'left', ...
    'BackgroundColor', 'w', ...
    'FontSize', 11);

%% 3D file legend mapping section
y = y - 0.12;
uicontrol(panelRight, 'Style', 'text', 'Units', 'normalized', ...
    'Position', [0.04 y 0.40 0.03], 'String', '3D Legend Mapping per File', ...
    'HorizontalAlignment', 'left', ...
    'FontWeight', 'bold', ...
    'BackgroundColor', get(panelRight,'BackgroundColor'));

panelLegend3D = uipanel('Parent', panelRight, ...
    'Units', 'normalized', ...
    'Position', [0.04 0.04 0.92 max(0.18, y-0.03)], ...
    'Title', '');

%% ============================================================
% CALLBACKS
% ============================================================
    function loadFilesCallback(~, ~)
        S = getappdata(fig, 'S');

        [files, pathName] = uigetfile({'*.csv','CSV files (*.csv)'}, ...
            'Select one or more renamed CSV files', ...
            'MultiSelect', 'on');

        if isequal(files,0)
            return;
        end

        if ischar(files)
            files = {files};
        end

        for iFile = 1:numel(files)
            fullName = fullfile(pathName, files{iFile});

            alreadyLoaded = false;
            for kk = 1:numel(S.files)
                if isfield(S.files{kk}, 'fullPath')
                    if strcmpi(S.files{kk}.fullPath, fullName)
                        alreadyLoaded = true;
                        break;
                    end
                end
            end
            if alreadyLoaded
                continue;
            end

            fileStruct = buildFileStruct(fullName, S.mappingFile, S.delimiter, S.timeColumnIndexDefault);
            S.files{end+1} = fileStruct; %#ok<AGROW>

            S = createTabForFile(S, numel(S.files));
        end

        S = update3DLegendMapDefaults(S);
        setappdata(fig, 'S', S);

        rebuild3DLegendPanel();
        updateTimeRangeDisplay();
        refreshPreviewCallback();
        setStatus(sprintf('Loaded %d file(s). Mapping: %s', numel(S.files), S.mappingFile));
    end

    function saveCurrentTabMappingCallback(~, ~)
        S = getappdata(fig, 'S');
        idx = getCurrentTabIndex();
        if isempty(idx)
            errordlg('Δεν υπάρχει ενεργό tab.', 'Error');
            return;
        end

        S = pullTableDataFromTab(S, idx);
        writeUnifiedMapping(S.mappingFile, S.files, S.delimiter);
        setappdata(fig, 'S', S);

        savedPath = mappingFullPath(S.mappingFile);
        setStatus(['ΑΠΟΘΗΚΕΥΤΗΚΕ (τρέχον tab) -> ' savedPath]);
        msgbox(['Αποθηκεύτηκαν οι ρυθμίσεις του τρέχοντος tab.' char(10) char(10) ...
            'Αρχείο ρυθμίσεων:' char(10) savedPath], 'Αποθήκευση OK', 'help');
    end

    function saveAllTabsMappingCallback(~, ~)
        S = getappdata(fig, 'S');
        if isempty(S.files)
            errordlg('Δεν υπάρχουν loaded files.', 'Error');
            return;
        end

        for idx = 1:numel(S.files)
            S = pullTableDataFromTab(S, idx);
        end

        writeUnifiedMapping(S.mappingFile, S.files, S.delimiter);
        setappdata(fig, 'S', S);

        savedPath = mappingFullPath(S.mappingFile);
        setStatus(['ΑΠΟΘΗΚΕΥΤΗΚΑΝ όλα τα tabs -> ' savedPath]);
        msgbox(['Αποθηκεύτηκαν οι ρυθμίσεις όλων των tabs.' char(10) char(10) ...
            'Αρχείο ρυθμίσεων:' char(10) savedPath], 'Αποθήκευση OK', 'help');
    end

    function refreshPreviewCallback(~, ~)
        S = getappdata(fig, 'S');
        idx = getCurrentTabIndex();
        if isempty(idx) || isempty(S.files)
            set(hPreview, 'String', 'No file loaded');
            return;
        end

        t = S.files{idx}.tableHandle;
        d = get(t, 'Data');

        if isempty(d)
            set(hPreview, 'String', 'No data');
            return;
        end

        idSel = find(cell2mat(d(:,1)), 1, 'first');
        if isempty(idSel)
            set(hPreview, 'String', 'No variable selected');
            return;
        end

        lbl = d{idSel,3};
        unt = d{idSel,4};
        leg = d{idSel,7};
        grp = d{idSel,8};

        shown = buildAxisLabel(lbl, unt);

        if isempty(strtrim(char(leg)))
            legTxt = 'Legend: fallback to PlotLabel';
        else
            legTxt = ['Legend: ' char(leg)];
        end

        if isempty(strtrim(char(grp)))
            grpTxt = 'Group: -';
        else
            grpTxt = ['Group: ' char(grp)];
        end

        set(hPreview, 'String', sprintf('%s\n%s\n%s', shown, legTxt, grpTxt));
    end

    function updateTimeRangeDisplay()
        S = getappdata(fig, 'S');

        if isempty(S.files)
            set(hTimeRangeBar, 'String', '[No file loaded]');
            set(hTmin, 'String', '');
            set(hTmax, 'String', '');
            return;
        end

        idx = getCurrentTabIndex();
        if isempty(idx)
            idx = 1;
        end

        timeVec = S.files{idx}.timeRaw;
        tmin = min(timeVec);
        tmax = max(timeVec);

        set(hTimeRangeBar, 'String', sprintf('[ %.6g   ...   %.6g ]', tmin, tmax));

        if isempty(get(hTmin,'String'))
            set(hTmin, 'String', num2str(tmin, '%.6g'));
        end
        if isempty(get(hTmax,'String'))
            set(hTmax, 'String', num2str(tmax, '%.6g'));
        end
    end

    function rebuild3DLegendPanel()
        S = getappdata(fig, 'S');

        oldChildren = get(panelLegend3D, 'Children');
        if ~isempty(oldChildren)
            delete(oldChildren);
        end

        if isempty(S.files)
            uicontrol(panelLegend3D, 'Style', 'text', ...
                'Units', 'normalized', ...
                'Position', [0.03 0.70 0.94 0.20], ...
                'String', 'No files loaded', ...
                'HorizontalAlignment', 'left', ...
                'BackgroundColor', get(panelLegend3D,'BackgroundColor'));
            return;
        end

        n = numel(S.files);
        rowH = max(0.10, 0.78 / max(n,1));
        topY = 0.88;

        for k = 1:n
            yrow = topY - k*rowH;

            uicontrol(panelLegend3D, 'Style', 'text', ...
                'Units', 'normalized', ...
                'Position', [0.03 yrow 0.42 rowH*0.8], ...
                'String', S.files{k}.shortName, ...
                'HorizontalAlignment', 'left', ...
                'BackgroundColor', get(panelLegend3D,'BackgroundColor'));

            val = '';
            idxMap = find(strcmp(S.fileLegendMap(:,1), S.files{k}.shortName), 1);
            if ~isempty(idxMap)
                val = S.fileLegendMap{idxMap,2};
            end

            uicontrol(panelLegend3D, 'Style', 'edit', ...
                'Units', 'normalized', ...
                'Position', [0.48 yrow 0.47 rowH*0.8], ...
                'String', val, ...
                'Tag', ['legend3d_' num2str(k)], ...
                'Callback', @(src,~)updateSingle3DLegendName(src, k));
        end
    end

    function updateSingle3DLegendName(src, k)
        S = getappdata(fig, 'S');
        val = get(src, 'String');

        if k <= numel(S.files)
            fileName = S.files{k}.shortName;
            idxMap = find(strcmp(S.fileLegendMap(:,1), fileName), 1);

            if isempty(idxMap)
                S.fileLegendMap(end+1,:) = {fileName, val};
            else
                S.fileLegendMap{idxMap,2} = val;
            end
        end

        setappdata(fig, 'S', S);
    end

    function plot2DCallback(~, ~)
        S = getappdata(fig, 'S');
        if isempty(S.files)
            errordlg('Δεν έχουν φορτωθεί αρχεία.', 'Error');
            return;
        end

        for idx = 1:numel(S.files)
            S = pullTableDataFromTab(S, idx);
        end
        setappdata(fig, 'S', S);

        timeLabel = get(hTimeLabel, 'String');
        timeUnit = get(hTimeUnit, 'String');
        titleText = get(hTitle, 'String');

        timeMult = str2double(get(hTimeMult, 'String'));
        if isnan(timeMult), timeMult = 1; end

        tminUser = str2double(get(hTmin, 'String'));
        tmaxUser = str2double(get(hTmax, 'String'));

        lineWidth = str2double(get(hLineWidth, 'String'));
        if isnan(lineWidth), lineWidth = defaultLineWidth; end

        fontSize = str2double(get(hFontSize, 'String'));
        if isnan(fontSize), fontSize = defaultAxesFontSize; end

        markerSize = str2double(get(hMarkerSize, 'String'));
        if isnan(markerSize), markerSize = defaultMarkerSize; end

        lineStyleList = get(hLineStyle, 'String');
        lineStyle = lineStyleList{get(hLineStyle,'Value')};

        markerList = get(hMarker, 'String');
        markerType = markerList{get(hMarker,'Value')};

        useGrid = get(hGrid, 'Value');
        useBox = get(hBox, 'Value');
        sameFigure = get(hSameFigure, 'Value');
        showLegend = get(hLegend, 'Value');
        savePlots = get(hSave, 'Value');
        saveFolder = get(hSaveFolder, 'String');

        selectedItems = collectSelected2DItems(S, tminUser, tmaxUser);
        if isempty(selectedItems)
            errordlg('Δεν έχει επιλεγεί καμία μεταβλητή για 2D plot.', 'Error');
            return;
        end

        if sameFigure
            figPlot = figure('Color', defaultFigColor, ...
                'Name', 'Combined 2D Plot', ...
                'NumberTitle', 'off', ...
                'Position', [100 100 1080 640]);

            ax = axes(figPlot);
            hold(ax, 'on');

            for k = 1:numel(selectedItems)
                item = selectedItems{k};
                x = item.time * timeMult;
                y = item.y;

                plot(ax, x, y, ...
                    'LineWidth', lineWidth, ...
                    'LineStyle', lineStyle, ...
                    'Marker', markerType, ...
                    'MarkerSize', markerSize, ...
                    'DisplayName', item.legendName);
            end

            xlabel(ax, buildAxisLabel(timeLabel, timeUnit), ...
                'FontSize', fontSize+2, ...
                'Interpreter', defaultInterpreter);

            ylabel(ax, 'Signals', ...
                'FontSize', fontSize+2, ...
                'Interpreter', defaultInterpreter);

            if isempty(strtrim(titleText))
                title(ax, 'Selected Variables from Multiple Files', ...
                    'FontSize', fontSize+3, ...
                    'Interpreter', defaultInterpreter);
            else
                title(ax, titleText, ...
                    'FontSize', fontSize+3, ...
                    'Interpreter', defaultInterpreter);
            end

            ax.FontSize = fontSize;
            ax.FontName = defaultAxesFontName;
            ax.LineWidth = defaultAxesLineWidth;
            ax.TickDir = defaultTickDir;
            ax.Box = onOffFromValue(useBox);
            ax.XGrid = onOffFromValue(useGrid);
            ax.YGrid = onOffFromValue(useGrid);
            ax.Color = 'w';

            if showLegend
                legend(ax, 'show', 'Interpreter', defaultInterpreter, 'Location', 'best');
            end

            hold(ax, 'off');

            if savePlots
                ensureFolder(saveFolder);
                saveas(figPlot, fullfile(saveFolder, 'combined_2d_plot.png'));
            end
        else
            for k = 1:numel(selectedItems)
                item = selectedItems{k};
                x = item.time * timeMult;
                y = item.y;

                figPlot = figure('Color', defaultFigColor, ...
                    'Name', item.varName, ...
                    'NumberTitle', 'off', ...
                    'Position', [100 100 960 560]);

                ax = axes(figPlot);
                hold(ax, 'on');

                plot(ax, x, y, ...
                    'LineWidth', lineWidth, ...
                    'LineStyle', lineStyle, ...
                    'Marker', markerType, ...
                    'MarkerSize', markerSize);

                xlabel(ax, buildAxisLabel(timeLabel, timeUnit), ...
                    'FontSize', fontSize+2, ...
                    'Interpreter', defaultInterpreter);

                ylabel(ax, item.yLabel, ...
                    'FontSize', fontSize+2, ...
                    'Interpreter', defaultInterpreter);

                if isempty(strtrim(titleText))
                    title(ax, item.legendName, ...
                        'FontSize', fontSize+3, ...
                        'Interpreter', defaultInterpreter);
                else
                    title(ax, titleText, ...
                        'FontSize', fontSize+3, ...
                        'Interpreter', defaultInterpreter);
                end

                ax.FontSize = fontSize;
                ax.FontName = defaultAxesFontName;
                ax.LineWidth = defaultAxesLineWidth;
                ax.TickDir = defaultTickDir;
                ax.Box = onOffFromValue(useBox);
                ax.XGrid = onOffFromValue(useGrid);
                ax.YGrid = onOffFromValue(useGrid);
                ax.Color = 'w';

                hold(ax, 'off');

                if savePlots
                    ensureFolder(saveFolder);
                    safeName = matlab.lang.makeValidName([item.fileShortName '_' item.varName]);
                    saveas(figPlot, fullfile(saveFolder, [safeName '.png']));
                end
            end
        end
    end

    function plot3DCallback(~, ~)
        S = getappdata(fig, 'S');
        if isempty(S.files)
            errordlg('Δεν έχουν φορτωθεί αρχεία.', 'Error');
            return;
        end

        for idx = 1:numel(S.files)
            S = pullTableDataFromTab(S, idx);
        end
        setappdata(fig, 'S', S);

        timeLabel = get(hTimeLabel, 'String');
        timeUnit = get(hTimeUnit, 'String');
        titleText = get(hTitle, 'String');

        timeMult = str2double(get(hTimeMult, 'String'));
        if isnan(timeMult), timeMult = 1; end

        tminUser = str2double(get(hTmin, 'String'));
        tmaxUser = str2double(get(hTmax, 'String'));

        lineWidth = str2double(get(hLineWidth, 'String'));
        if isnan(lineWidth), lineWidth = defaultLineWidth; end

        fontSize = str2double(get(hFontSize, 'String'));
        if isnan(fontSize), fontSize = defaultAxesFontSize; end

        useGrid = get(hGrid, 'Value');
        useBox = get(hBox, 'Value');

        items3D = collectSelected3DItems(S, tminUser, tmaxUser);
        if isempty(items3D)
            errordlg('Δεν υπάρχουν επιλεγμένες μεταβλητές με GroupName για 3D plot.', 'Error');
            return;
        end

        % unique groups ordered by GroupPriority
        groupNames = {};
        groupPriorities = [];
        
        for k = 1:numel(items3D)
            g = char(items3D{k}.groupName);
        
            gp = items3D{k}.groupPriority;
            if isempty(gp) || ~isnumeric(gp) || isnan(gp)
                gp = inf;
            end
        
            idxg = find(strcmp(groupNames, g), 1);
            if isempty(idxg)
                groupNames{end+1} = g; %#ok<AGROW>
                groupPriorities(end+1) = gp; %#ok<AGROW>
            else
                groupPriorities(idxg) = min(groupPriorities(idxg), gp);
            end
        end
        
        [~, ord] = sort(groupPriorities);
        groupNames = groupNames(ord);
        
        % update groupIndex according to sorted groupNames
        for k = 1:numel(items3D)
            items3D{k}.groupIndex = find(strcmp(groupNames, items3D{k}.groupName), 1);
        end

        fig3d = figure('Color', 'w', ...
            'Name', '3D Plot', ...
            'NumberTitle', 'off', ...
            'Position', [80 80 1180 700]);

        ax = axes(fig3d);
        hold(ax, 'on');

        legendHandles = [];
        legendNames = {};
        fileLegendSeen = {};

        for k = 1:numel(items3D)
            item = items3D{k};

            x = item.time * timeMult;
            y = item.groupIndex * ones(size(x));
            z = item.y;

            h = plot3(ax, x, y, z, 'LineWidth', lineWidth);

            if ~any(strcmp(fileLegendSeen, item.fileLegend3D))
                legendHandles(end+1) = h; %#ok<AGROW>
                legendNames{end+1} = item.fileLegend3D; %#ok<AGROW>
                fileLegendSeen{end+1} = item.fileLegend3D; %#ok<AGROW>
            end
        end

        xlabel(ax, buildAxisLabel(timeLabel, timeUnit), ...
            'FontSize', fontSize+2, ...
            'Interpreter', defaultInterpreter);

        ylabel(ax, 'Groups', ...
            'FontSize', fontSize+2, ...
            'Interpreter', defaultInterpreter);

        zlabel(ax, 'Signal', ...
            'FontSize', fontSize+2, ...
            'Interpreter', defaultInterpreter);

        if isempty(strtrim(titleText))
            title(ax, '3D Plot by Group', ...
                'FontSize', fontSize+3, ...
                'Interpreter', defaultInterpreter);
        else
            title(ax, titleText, ...
                'FontSize', fontSize+3, ...
                'Interpreter', defaultInterpreter);
        end

        set(ax, 'YTick', 1:numel(groupNames));
        set(ax, 'YTickLabel', groupNames);

        ax.FontSize = fontSize;
        ax.FontName = defaultAxesFontName;
        ax.LineWidth = defaultAxesLineWidth;
        ax.TickDir = defaultTickDir;
        ax.Box = onOffFromValue(useBox);
        ax.XGrid = onOffFromValue(useGrid);
        ax.YGrid = onOffFromValue(useGrid);
        ax.ZGrid = onOffFromValue(useGrid);
        ax.Color = 'w';

        if ~isempty(legendHandles)
            legend(ax, legendHandles, legendNames, ...
                'Interpreter', defaultInterpreter, ...
                'Location', 'best');
        end

        view(ax, 3);
        hold(ax, 'off');

        % Summary table κάτω από το 3D plot
        figInfo = figure('Color', 'w', ...
            'Name', '3D Summary', ...
            'NumberTitle', 'off', ...
            'Position', [140 120 1050 260]);

        summaryData = cell(numel(items3D), 6);
        for k = 1:numel(items3D)
            summaryData{k,1} = items3D{k}.groupName;
            summaryData{k,2} = items3D{k}.fileShortName;
            summaryData{k,3} = items3D{k}.varName;
            summaryData{k,4} = items3D{k}.fileLegend3D;
            summaryData{k,5} = items3D{k}.plotLabel;
            summaryData{k,6} = items3D{k}.legendName;
        end

        uitable('Parent', figInfo, ...
            'Units', 'normalized', ...
            'Position', [0.02 0.08 0.96 0.86], ...
            'Data', summaryData, ...
            'ColumnName', {'GroupName','File','VariableName','3DLegend','PlotLabel','LegendName'});
    end

%% ============================================================
% NESTED HELPERS
% ============================================================

    function maxCurrentTabCallback(~, ~)
        S = getappdata(fig, 'S');
        idx = getCurrentTabIndex();
    
        if isempty(idx) || isempty(S.files)
            errordlg('Δεν υπάρχει ενεργό tab ή loaded file.', 'Error');
            return;
        end
    
        S = pullTableDataFromTab(S, idx);
        setappdata(fig, 'S', S);
    
        file = S.files{idx};
        d = file.tableData;
    
        tminUser = str2double(get(hTmin, 'String'));
        tmaxUser = str2double(get(hTmax, 'String'));
    
        results = {};
        cnt = 0;
    
        for r = 1:size(d,1)
            doPlot = d{r,1};
            if ~doPlot
                continue;
            end
    
            varName = d{r,2};
            plotLabel = d{r,3};
            unitText = d{r,4};
            multVal = d{r,5};
            transformName = d{r,6};
    
            idxCol = find(strcmp(file.varNames, varName), 1);
            if isempty(idxCol)
                continue;
            end
    
            x = file.timeRaw;
            y = file.T{:, idxCol};
    
            if ~isnumeric(y)
                continue;
            end
    
            mask = true(size(x));
            if ~isnan(tminUser)
                mask = mask & (x >= tminUser);
            end
            if ~isnan(tmaxUser)
                mask = mask & (x <= tmaxUser);
            end
    
            xSel = x(mask);
            ySel = y(mask);
    
            if isempty(ySel)
                continue;
            end
    
            if isempty(multVal) || ~isnumeric(multVal) || isnan(multVal)
                multVal = 1;
            end
    
            ySel = ySel .* multVal;
            ySel = applyTransform(ySel, transformName);
    
            [maxVal, imax] = max(ySel);
            tAtMax = xSel(imax);
    
            cnt = cnt + 1;
            results{cnt,1} = varName; %#ok<AGROW>
            results{cnt,2} = plotLabel; %#ok<AGROW>
            results{cnt,3} = unitText; %#ok<AGROW>
            results{cnt,4} = maxVal; %#ok<AGROW>
            results{cnt,5} = tAtMax; %#ok<AGROW>
        end
    
        if isempty(results)
            msgbox('Δεν βρέθηκαν επιλεγμένες numeric μεταβλητές στο ενεργό tab.', 'Info', 'help');
            return;
        end
    
        figMax = figure( ...
            'Name', ['Maxima - ' file.shortName], ...
            'NumberTitle', 'off', ...
            'MenuBar', 'none', ...
            'ToolBar', 'none', ...
            'Color', 'w', ...
            'Position', [180 140 820 420]);
    
        uitable('Parent', figMax, ...
            'Units', 'normalized', ...
            'Position', [0.03 0.08 0.94 0.88], ...
            'Data', results, ...
            'ColumnName', {'VariableName','PlotLabel','Unit','MaxValue','TimeAtMax'});
    end

    function selectAllInTab(~, ~)
        setTabPlotColumn(true);
    end

    function deselectAllInTab(~, ~)
        setTabPlotColumn(false);
    end

    function setTabPlotColumn(val)
        S = getappdata(fig, 'S');
        idx = getCurrentTabIndex();
        if isempty(idx)
            errordlg('Δεν υπάρχει ενεργό tab.', 'Error');
            return;
        end
        tbl = S.files{idx}.tableHandle;
        d = get(tbl, 'Data');
        for r = 1:size(d,1)
            d{r,1} = logical(val);
        end
        set(tbl, 'Data', d);
        S = pullTableDataFromTab(S, idx);
        setappdata(fig, 'S', S);
        if val
            setStatus(['Επιλέχθηκαν ΟΛΕΣ οι μεταβλητές στο tab: ' S.files{idx}.shortName]);
        else
            setStatus(['Αποεπιλέχθηκαν ΟΛΕΣ οι μεταβλητές στο tab: ' S.files{idx}.shortName]);
        end
    end

    function closeCurrentTab(~, ~)
        S = getappdata(fig, 'S');
        idx = getCurrentTabIndex();
        if isempty(idx)
            errordlg('Δεν υπάρχει ενεργό tab.', 'Error');
            return;
        end
        shortName = S.files{idx}.shortName;
        choice = questdlg(['Κλείσιμο του tab:  ' shortName ' ;'], ...
            'Επιβεβαίωση', 'Ναι', 'Όχι', 'Όχι');
        if ~strcmp(choice, 'Ναι')
            return;
        end
        if ~isempty(S.fileLegendMap)
            mrow = find(strcmp(S.fileLegendMap(:,1), shortName), 1);
            if ~isempty(mrow)
                S.fileLegendMap(mrow, :) = [];
            end
        end
        try
            delete(S.files{idx}.tabHandle);
        catch
        end
        S.files(idx) = [];
        setappdata(fig, 'S', S);
        rebuild3DLegendPanel();
        updateTimeRangeDisplay();
        refreshPreviewCallback();
        setStatus(['Έκλεισε το tab: ' shortName]);
    end

    function p = mappingFullPath(mf)
        if isempty(fileparts(mf))
            p = fullfile(pwd, mf);
        else
            p = mf;
        end
    end

    function setStatus(msg)
        if nargin < 1 || isempty(msg)
            msg = '';
        end
        if exist('hStatus', 'var') && ~isempty(hStatus) && ishghandle(hStatus)
            set(hStatus, 'String', ['  [' datestr(now, 'HH:MM:SS') ']  ' msg]);
        end
    end

    function idx = getCurrentTabIndex()
        S = getappdata(fig, 'S');
        idx = [];
        if isempty(S.files)
            return;
        end

        selectedTab = tabgp.SelectedTab;
        for ii = 1:numel(S.files)
            if isequal(S.files{ii}.tabHandle, selectedTab)
                idx = ii;
                return;
            end
        end
    end

    function S = createTabForFile(S, fileIdx)
        fileStruct = S.files{fileIdx};

        tab = uitab(tabgp, 'Title', fileStruct.shortName);

        panel = uipanel('Parent', tab, ...
            'Title', ['Variables / Mapping - ' fileStruct.shortName], ...
            'FontWeight', 'bold', ...
            'Units', 'normalized', ...
            'Position', [0.01 0.01 0.98 0.98]);

        colNames = {'Plot','VariableName','PlotLabel','Unit','Multiplier','Transform','LegendName','GroupName','GroupPriority'};
        colEditable = [true false true true true true true true true];
        colFormats = {'logical','char','char','char','numeric',{'none','abs','real','imag','-x'},'char','char','numeric'};

        tbl = uitable('Parent', panel, ...
            'Units', 'normalized', ...
            'Position', [0.01 0.01 0.98 0.98], ...
            'Data', fileStruct.tableData, ...
            'ColumnName', colNames, ...
            'ColumnEditable', colEditable, ...
            'ColumnFormat', colFormats);

        S.files{fileIdx}.tabHandle = tab;
        S.files{fileIdx}.tableHandle = tbl;
    end

    function S = pullTableDataFromTab(S, idx)
        if idx < 1 || idx > numel(S.files)
            return;
        end
        if ~isfield(S.files{idx}, 'tableHandle') || isempty(S.files{idx}.tableHandle)
            return;
        end

        newData = get(S.files{idx}.tableHandle, 'Data');
        S.files{idx}.tableData = newData;
    end

    function S = update3DLegendMapDefaults(S)
        if isempty(S.fileLegendMap)
            S.fileLegendMap = cell(0,2);
        end

        for i = 1:numel(S.files)
            fName = S.files{i}.shortName;
            idxMap = find(strcmp(S.fileLegendMap(:,1), fName), 1);
            if isempty(idxMap)
                S.fileLegendMap(end+1,:) = {fName, fName};
            end
        end
    end
end

%% ============================================================
% EXTERNAL HELPERS
% ============================================================
function fileStruct = buildFileStruct(fullName, mappingFile, delimiter, timeColumnIndex)
optsData = detectImportOptions(fullName, 'Delimiter', delimiter);
optsData.VariableNamesLine = 1;
optsData.DataLines = [2 Inf];
optsData.VariableNamingRule = 'preserve';

T = readtable(fullName, optsData);
varNames = T.Properties.VariableNames;
nVars = numel(varNames);

if timeColumnIndex < 1 || timeColumnIndex > nVars
    error('Μη έγκυρο timeColumnIndex για το αρχείο %s', fullName);
end

timeRaw = T{:, timeColumnIndex};
if ~isnumeric(timeRaw)
    error('Η χρονική στήλη δεν είναι numeric στο αρχείο %s', fullName);
end

if exist(mappingFile, 'file')
    optsMap = detectImportOptions(mappingFile, 'Delimiter', delimiter);
    optsMap.VariableNamingRule = 'preserve';
    Tmap = readtable(mappingFile, optsMap);

    if ~iscell(Tmap.VariableName), Tmap.VariableName = cellstr(Tmap.VariableName); end
    if ismember('PlotLabel', Tmap.Properties.VariableNames)
        if ~iscell(Tmap.PlotLabel), Tmap.PlotLabel = cellstr(Tmap.PlotLabel); end
    else
        Tmap.PlotLabel = Tmap.VariableName;
    end
    if ~ismember('GroupPriority', Tmap.Properties.VariableNames)
        Tmap.GroupPriority = nan(height(Tmap),1);
    end
    if ismember('Unit', Tmap.Properties.VariableNames)
        if ~iscell(Tmap.Unit), Tmap.Unit = cellstr(Tmap.Unit); end
    else
        Tmap.Unit = repmat({''}, height(Tmap),1);
    end
    if ~ismember('Multiplier', Tmap.Properties.VariableNames)
        Tmap.Multiplier = ones(height(Tmap),1);
    end
    if ismember('LegendName', Tmap.Properties.VariableNames)
        if ~iscell(Tmap.LegendName), Tmap.LegendName = cellstr(Tmap.LegendName); end
    else
        Tmap.LegendName = repmat({''}, height(Tmap),1);
    end
    if ismember('GroupName', Tmap.Properties.VariableNames)
        if ~iscell(Tmap.GroupName), Tmap.GroupName = cellstr(Tmap.GroupName); end
    else
        Tmap.GroupName = repmat({''}, height(Tmap),1);
    end
else
    Tmap = table(cell(0,1),cell(0,1),cell(0,1),zeros(0,1),cell(0,1),cell(0,1), ...
        'VariableNames', {'VariableName','PlotLabel','Unit','Multiplier','LegendName','GroupName'});
end

signalIndices = setdiff(1:nVars, timeColumnIndex);
nSignals = numel(signalIndices);

plotFlag = true(nSignals,1);
variableNameCol = cell(nSignals,1);
plotLabelCol = cell(nSignals,1);
unitCol = cell(nSignals,1);
multiplierCol = num2cell(ones(nSignals,1));
transformCol = repmat({'none'}, nSignals, 1);
legendNameCol = cell(nSignals,1);
groupNameCol = cell(nSignals,1);
groupPriorityCol = num2cell(nan(nSignals,1));

for i = 1:nSignals
    idxCol = signalIndices(i);
    thisVar = varNames{idxCol};
    variableNameCol{i} = thisVar;

    idxMap = find(strcmp(Tmap.VariableName, thisVar), 1);
    if isempty(idxMap)
        plotLabelCol{i} = thisVar;
        unitCol{i} = '';
        multiplierCol{i} = 1;
        legendNameCol{i} = '';
        groupNameCol{i} = '';
        groupPriorityCol{i} = nan;
    else
        plotLabelCol{i} = Tmap.PlotLabel{idxMap};
        unitCol{i} = Tmap.Unit{idxMap};
        multiplierCol{i} = Tmap.Multiplier(idxMap);
        legendNameCol{i} = Tmap.LegendName{idxMap};
        groupNameCol{i} = Tmap.GroupName{idxMap};
        groupPriorityCol{i} = Tmap.GroupPriority(idxMap);
    end
end

tableData = [num2cell(plotFlag), variableNameCol, plotLabelCol, unitCol, multiplierCol, transformCol, legendNameCol, groupNameCol, groupPriorityCol];

[~, shortName, ext] = fileparts(fullName);

fileStruct = struct();
fileStruct.fullPath = fullName;
fileStruct.shortName = [shortName ext];
fileStruct.T = T;
fileStruct.varNames = varNames;
fileStruct.timeColumnIndex = timeColumnIndex;
fileStruct.timeRaw = timeRaw;
fileStruct.tableData = tableData;
fileStruct.tabHandle = [];
fileStruct.tableHandle = [];
end

function writeUnifiedMapping(mappingFile, files, delimiter)
allVar = {};
allLabel = {};
allUnit = {};
allMult = [];
allLegend = {};
allGroup = {};
allGroupPriority = [];

for i = 1:numel(files)
    d = files{i}.tableData;
    for r = 1:size(d,1)
        allVar{end+1,1} = d{r,2}; %#ok<AGROW>
        allLabel{end+1,1} = d{r,3}; %#ok<AGROW>
        allUnit{end+1,1} = d{r,4}; %#ok<AGROW>

        m = d{r,5};
        if isempty(m) || ~isnumeric(m) || isnan(m)
            m = 1;
        end
        allMult(end+1,1) = m; %#ok<AGROW>

        allLegend{end+1,1} = d{r,7}; %#ok<AGROW>
        allGroup{end+1,1} = d{r,8}; %#ok<AGROW>
        
        gp = d{r,9};
        if isempty(gp) || ~isnumeric(gp) || isnan(gp)
            gp = nan;
        end
        allGroupPriority(end+1,1) = gp; %#ok<AGROW>
    end
end

Tall = table(allVar, allLabel, allUnit, allMult, allLegend, allGroup, allGroupPriority, ...
    'VariableNames', {'VariableName','PlotLabel','Unit','Multiplier','LegendName','GroupName','GroupPriority'});

[~, ia] = unique(Tall.VariableName, 'stable');
Tall = Tall(ia, :);

writetable(Tall, mappingFile, 'Delimiter', delimiter);
end

function items = collectSelected2DItems(S, tminUser, tmaxUser)
items = {};

for iFile = 1:numel(S.files)
    file = S.files{iFile};
    d = file.tableData;

    for r = 1:size(d,1)
        doPlot = d{r,1};
        if ~doPlot
            continue;
        end

        varName = d{r,2};
        plotLabel = d{r,3};
        unitText = d{r,4};
        multVal = d{r,5};
        transformName = d{r,6};
        legendName = d{r,7};

        idxCol = find(strcmp(file.varNames, varName), 1);
        if isempty(idxCol)
            continue;
        end

        x = file.timeRaw;
        y = file.T{:, idxCol};

        if ~isnumeric(y)
            continue;
        end

        mask = true(size(x));
        if ~isnan(tminUser)
            mask = mask & (x >= tminUser);
        end
        if ~isnan(tmaxUser)
            mask = mask & (x <= tmaxUser);
        end

        x = x(mask);
        y = y(mask);

        if isempty(multVal) || ~isnumeric(multVal) || isnan(multVal)
            multVal = 1;
        end

        y = y .* multVal;
        y = applyTransform(y, transformName);

        if isempty(strtrim(char(legendName)))
            legendNameUse = buildAxisLabel(plotLabel, unitText);
        else
            legendNameUse = char(legendName);
        end

        item = struct();
        item.fileShortName = file.shortName;
        item.varName = varName;
        item.time = x;
        item.y = y;
        item.yLabel = buildAxisLabel(plotLabel, unitText);
        item.legendName = legendNameUse;

        items{end+1} = item; %#ok<AGROW>
    end
end
end

function items3D = collectSelected3DItems(S, tminUser, tmaxUser)
items3D = {};

% βρίσκω unique groups και priority
groupNames = {};
groupPriorities = [];

for iFile = 1:numel(S.files)
    file = S.files{iFile};
    d = file.tableData;

    for r = 1:size(d,1)
        doPlot = d{r,1};
        if ~doPlot
            continue;
        end

        g = char(d{r,8});
        if isempty(strtrim(g))
            continue;
        end

        gp = d{r,9};
        if isempty(gp) || ~isnumeric(gp) || isnan(gp)
            gp = inf;
        end

        idx = find(strcmp(groupNames, g), 1);
        if isempty(idx)
            groupNames{end+1} = g; %#ok<AGROW>
            groupPriorities(end+1) = gp; %#ok<AGROW>
        else
            groupPriorities(idx) = min(groupPriorities(idx), gp);
        end
    end
end

% sort by priority first, then by original encounter order
[~, ord] = sort(groupPriorities);
groupNames = groupNames(ord);
groupPriorities = groupPriorities(ord);


for iFile = 1:numel(S.files)
    file = S.files{iFile};
    d = file.tableData;

    % 3D legend per file
    fileLegend3D = file.shortName;
    idxLegendMap = find(strcmp(S.fileLegendMap(:,1), file.shortName), 1);
    if ~isempty(idxLegendMap)
        val = S.fileLegendMap{idxLegendMap,2};
        if ~isempty(strtrim(char(val)))
            fileLegend3D = char(val);
        end
    end

    for r = 1:size(d,1)
        doPlot = d{r,1};
        if ~doPlot
            continue;
        end

        groupName = d{r,8};
        if isempty(strtrim(char(groupName)))
            continue;
        end

        varName = d{r,2};
        plotLabel = d{r,3};
        unitText = d{r,4};
        multVal = d{r,5};
        transformName = d{r,6};
        legendName = d{r,7};

        idxCol = find(strcmp(file.varNames, varName), 1);
        if isempty(idxCol)
            continue;
        end

        x = file.timeRaw;
        y = file.T{:, idxCol};

        if ~isnumeric(y)
            continue;
        end

        mask = true(size(x));
        if ~isnan(tminUser)
            mask = mask & (x >= tminUser);
        end
        if ~isnan(tmaxUser)
            mask = mask & (x <= tmaxUser);
        end

        x = x(mask);
        y = y(mask);

        if isempty(multVal) || ~isnumeric(multVal) || isnan(multVal)
            multVal = 1;
        end

        y = y .* multVal;
        y = applyTransform(y, transformName);

        if isempty(strtrim(char(legendName)))
            legendNameUse = buildAxisLabel(plotLabel, unitText);
        else
            legendNameUse = char(legendName);
        end

        groupIndex = find(strcmp(groupNames, char(groupName)), 1);
        if isempty(groupIndex)
            groupIndex = 1;
        end

        item = struct();
        item.fileShortName = file.shortName;
        item.fileLegend3D = fileLegend3D;
        item.varName = varName;
        item.plotLabel = char(plotLabel);
        item.legendName = legendNameUse;
        item.groupName = char(groupName);
        item.groupIndex = groupIndex;
        item.time = x;
        item.y = y;
        item.groupPriority = d{r,9};
        items3D{end+1} = item; %#ok<AGROW>
    end
end
end

function out = applyTransform(y, transformName)
if isempty(transformName)
    out = y;
    return;
end

switch lower(strtrim(char(transformName)))
    case 'none'
        out = y;
    case 'abs'
        out = abs(y);
    case 'real'
        out = real(y);
    case 'imag'
        out = imag(y);
    case '-x'
        out = -y;
    otherwise
        out = y;
end
end

function txt = buildAxisLabel(labelText, unitText)
labelText = char(labelText);
unitText = char(unitText);

labelText = convertUnderscoreToSubscript(labelText);

if isempty(strtrim(unitText))
    txt = labelText;
else
    txt = [labelText, ' (', unitText, ')'];
end
end

function outLabel = convertUnderscoreToSubscript(inLabel)
s = char(inLabel);

if any(s == '{') || any(s == '}')
    outLabel = s;
    return;
end

pos = strfind(s, '_');
if isempty(pos)
    outLabel = s;
    return;
end

firstUnd = pos(1);
leftPart = s(1:firstUnd-1);
rightPart = s(firstUnd+1:end);

if isempty(rightPart)
    outLabel = s;
else
    outLabel = [leftPart, '_{', rightPart, '}'];
end
end

function s = onOffFromValue(v)
if v
    s = 'on';
else
    s = 'off';
end
end

function ensureFolder(folderName)
if ~exist(folderName, 'dir')
    mkdir(folderName);
end
end