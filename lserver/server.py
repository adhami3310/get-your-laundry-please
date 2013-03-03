import BaseHTTPServer
import json
import os
import os.path as p
j=p.join

import config
import sandbox
import state

def isMobile(request):
    """
        If user is using a mobile (e.g. cellphone) browser,
        returns metadata about browser {...}; otherwise returns None.
    """
    return NotImplemented

content_dir = config.CONTENT_DIR
static_dir = j(content_dir, 'static')
template_dir = j(content_dir, 'templates')

# Load templates into templateCache
templateCache = {}
for root,dirs,files in os.walk(template_dir):
    for name in files:
        assert name.endswith('.template')       
        with open(j(root,name)) as f:
            contents = f.read()
    templateCache[name.split('.template')[0]] = contents

# sandboxRead is like open(...) but safe
sandboxRead = sandbox.makeSandbox(static_dir)

class MainHandler(BaseHTTPServer.BaseHTTPRequestHandler):
    """
        Handles all GET web requests
    """
    def do_GET(r):
        path = r.path

        data = state.getStateAsJson()

        if path=='/json':
            # handle .../json
            r.send_response(200)
            r.send_header("Content-type", "text/plain")
            r.end_headers()

            content = json.dumps(data, indent=4, sort_keys=True)
        else:
            if path=='/' or path=='/index.html':
                # handle .../
                if isMobile(r):
                    pass#TODO

                r.send_response(200)
                r.send_header("Content-type", "text/html")
                r.end_headers()

                content = templateCache['index'].format(**data)

            elif path=='/text':
                # handle .../text
                r.send_response(200)
                r.send_header("Content-type", "text/plain")
                r.end_headers()

                content = json.dumps(data, indent=4, sort_keys=True)
    
            else:
                try:
                    with sandboxRead(path) as f:
                        content = f.read()

                    r.send_response(200)
                    r.end_headers()
                except sandbox.SandboxSecurityException:
                    print('!!!')
                    return
                
                # No such path: 404
                #r.send_response(404)
                #r.send_header("Content-type", "text/plain")
                #r.end_headers()

                #content = 'Error: 404 content not found\n\nvalid URLs are:\n/ (defaults to /desktop or /mobile)\n/mobile (also /m)\n/text (for terminals)\n/json (API subject to change)'

        r.wfile.write(content)
        r.wfile.flush()
        r.connection.shutdown(1)

def run(server_class=BaseHTTPServer.HTTPServer, handler_class=MainHandler):
    """
        Infinite request-handling loop
    """
    server_address = (config.HOSTNAME, config.PORT)

    httpd = server_class(server_address, handler_class)
    try:
        while True:
            httpd.handle_request()
    except KeyboardInterrupt:
        httpd.server_close()
