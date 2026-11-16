"""4.19.2: the accelerator of this machine and what it gives. The same as `python -m pcl accel` (pcl/accel.py), for those who
run the tools from this folder:  python tools/accel.py [--quick] [--save] [--case FILE.m …] [--scenarios 1000,10000] [--json FILE]"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from pcl import accel  # noqa: E402

if __name__ == '__main__':
    sys.exit(accel.main())
