# customizable install-specific configuration

# set to True is local development and testing, False if production
DEVEL = True

# server name: appears in <title> tags, etc.
SERVER_NAME = 'Laundry Server'
SERVER_LOCATION = ''

SERVER_FULLNAME = '{}'
if SERVER_LOCATION:
    SERVER_FULLNAME += ' - '+SERVER_LOCATION

# hostname and port name
HOSTNAME = '' if DEVEL else 'laundry.mit.edu'
PORT = 8000 if DEVEL else 80

# misc
import os.path as p
CONFIG_DIR = p.dirname(__file__)
CONTENT_DIR = p.join(CONFIG_DIR, 'content')
