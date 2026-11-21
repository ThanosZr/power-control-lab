"""5.0.5 (ROADMAP §97 step 1, decision 363): the application in a window of its own.

``python run.py`` opens the studio in the window of an application of a Chromium browser that is already on the computer
(Chrome, Edge, Chromium, Brave): ``--app=<address>``, so no tabs, no address bar and no menu of the browser, and a profile
of its own (``--user-data-dir`` in the folder of the application, ``$PCL_HOME/browser`` or ``~/.pcl/browser``), so none
of the extensions and data of the usual profile. If none is found, or it does not start, the page opens as before, in a
tab of the default browser, and the terminal says so. ``--browser`` keeps the way of before; ``PCL_BROWSER`` names the
program to use. No new dependency: the standard library only.

The functions take the platform, the environment and the ways to look for a program as arguments, so that the tests
check them on every platform without opening anything.
"""
import os
import subprocess
import sys
import webbrowser
from pathlib import Path
from shutil import which as _which

# the names of the programs on the PATH (Linux, and any platform where they are on it)
NAMES = ('google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge', 'microsoft-edge-stable',
         'brave-browser', 'chrome', 'msedge')


def _win_paths(env):
    out = []
    for base in (env.get('PROGRAMFILES'), env.get('PROGRAMFILES(X86)'), env.get('LOCALAPPDATA')):
        if not base:
            continue
        for rel in (r'Google\Chrome\Application\chrome.exe', r'Microsoft\Edge\Application\msedge.exe',
                    r'Chromium\Application\chrome.exe', r'BraveSoftware\Brave-Browser\Application\brave.exe'):
            out.append(base.rstrip('\\/') + '\\' + rel)
    return out


def _mac_paths(env):
    apps = ('Google Chrome.app/Contents/MacOS/Google Chrome', 'Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
            'Chromium.app/Contents/MacOS/Chromium', 'Brave Browser.app/Contents/MacOS/Brave Browser')
    roots = ['/Applications']
    if env.get('HOME'):
        roots.append(env['HOME'].rstrip('/') + '/Applications')
    return [r + '/' + a for r in roots for a in apps]


def candidates(platform=None, env=None):
    """The places where a Chromium browser is looked for, in order (the PATH names come after them)."""
    platform = platform or sys.platform
    env = os.environ if env is None else env
    if platform.startswith('win'):
        return _win_paths(env)
    if platform == 'darwin':
        return _mac_paths(env)
    return []


def find_browser(platform=None, env=None, which=_which, exists=os.path.isfile):
    """The program of a Chromium browser, or None. PCL_BROWSER first (a path or a name on the PATH)."""
    env = os.environ if env is None else env
    own = (env.get('PCL_BROWSER') or '').strip()
    if own:
        if exists(own):
            return own
        return which(own) or None
    for p in candidates(platform, env):
        if exists(p):
            return p
    for n in NAMES:
        p = which(n)
        if p:
            return p
    return None


def profile_dir(env=None):
    """The profile of the window of the application: in the folder of the application, not the usual profile."""
    env = os.environ if env is None else env
    return Path(env.get('PCL_HOME') or (Path.home() / '.pcl')) / 'browser'


def app_command(exe, url, profile):
    """The command of the window: the application alone, its own profile, no first-run questions."""
    return [str(exe), f'--app={url}', f'--user-data-dir={profile}', '--no-first-run', '--no-default-browser-check']


def open_app(url, tab=False, platform=None, env=None, which=_which, exists=os.path.isfile, popen=subprocess.Popen,
             open_tab=webbrowser.open, say=print):
    """Open the studio: 'app' (a window of its own), 'tab' (a tab of the default browser, asked with --browser) or
    'fallback' (no Chromium browser, or it did not start: a tab, and the reason in the terminal)."""
    if tab:
        open_tab(url)
        return 'tab'
    exe = find_browser(platform, env, which, exists)
    if not exe:
        say('No Chrome, Edge or Chromium found: the studio opens in a tab of the default browser '
            '(PCL_BROWSER=<program> names one).')
        open_tab(url)
        return 'fallback'
    prof = profile_dir(env)
    try:
        prof.mkdir(parents=True, exist_ok=True)
    except OSError:
        pass
    kw = dict(stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, close_fds=True)
    if (platform or sys.platform).startswith('win'):
        kw['creationflags'] = 0x00000008 | 0x00000200        # DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP
    else:
        kw['start_new_session'] = True
    try:
        popen(app_command(exe, url, prof), **kw)
    except OSError as exc:
        say(f'The window of the application did not start ({exc}): the studio opens in a tab of the default browser.')
        open_tab(url)
        return 'fallback'
    say(f'The studio opens in a window of its own ({Path(exe).name}, profile {prof}). --browser: in a tab, as before.')
    return 'app'
