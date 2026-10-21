# -*- coding: utf-8 -*-
import os
import sys

root_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(root_dir, "backend_local")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from backend_local.server import app
