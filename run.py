#!/usr/bin/python -B

import sys
import os.path as p
j = p.join

# set up sys.path and "common paths"
BASE_DIR = p.split(__file__)[0]
CONFIG_DIR = j(BASE_DIR, 'customize')
sys.path[:] = sys.path + [p.abspath(CONFIG_DIR)]

from lserver import server
import config  # load site-specific configuration file

"""
    When the laundry server starts up, some washers may be on and some may be off.
    Some washers may be broken i.e. out-of-order (possibly autodetected or markable).
    Some washers may be designated as hypoallergenic (in the configuration file).
    
    When one does ./run.py, the following are started:
    - loads database (by default, a pickle file that is atomically replaced)
    - a webserver on port 80, so people can view laundry in a web interface
      (hosts an index.html file and a favicon, and /text and /json)
      (people can sign up for notifications on the web interface)
    - a sensor loop and/or a cronjob (undecided) which managed notifications and
      periodically write statistics to the database

    The web client may make periodic ajax queries back to the server at /json.
"""

server.run()
