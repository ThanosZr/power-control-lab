"""Power & Control Lab from Python: scripted scenarios (ROADMAP §30). See pcl/core.py and `python -m pcl --help`."""
from .core import (BifurcationResult, PclError, Plot, Project, Result, SweepResult, bifurcation, current, get, job, load, params, parse_value, plot, run, set,
                   show, sweep, tutorial, tutorials, use, version)

__all__ = ['BifurcationResult', 'PclError', 'bifurcation', 'Plot', 'Project', 'Result', 'SweepResult', 'current', 'get', 'job', 'load', 'params', 'parse_value', 'plot',
           'run', 'set', 'show', 'sweep', 'tutorial', 'tutorials', 'use', 'version']


def __getattr__(name):
    # pcl.link and pcl.impulse on first use (3.15): the app's Python worker loads only the modules it needs (4.2: network)
    if name in ('link', 'impulse', 'plotting', 'network'):
        import importlib
        return importlib.import_module(f'{__name__}.{name}')
    raise AttributeError(name)
