function c = pcl_config()
%PCL_CONFIG  Where the Power & Control Lab is and which Python runs its pcl package (ROADMAP §30, 3.14).
%   The environment variable PCL_PYTHON overrides the Python executable, e.g. the Anaconda environment:
%       setenv('PCL_PYTHON', 'C:\Users\me\anaconda3\envs\pcl\python.exe')
%   The browser's solver also needs Node.js (https://nodejs.org) on the PATH.
c.root = fileparts(fileparts(mfilename('fullpath')));
py = getenv('PCL_PYTHON');
if isempty(py)
  if ispc, py = 'python'; else, py = 'python3'; end
end
c.python = py;
c.octave = exist('OCTAVE_VERSION', 'builtin') ~= 0;
end
