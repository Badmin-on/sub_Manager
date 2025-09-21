#!/usr/bin/env python3
import http.server
import socketserver
import os
import mimetypes

# Add JavaScript MIME types
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/javascript', '.js')
mimetypes.add_type('text/css', '.css')

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cross-Origin-Embedder-Policy', 'cross-origin')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        super().end_headers()

    def do_GET(self):
        # Handle SPA routing
        if self.path == '/' or (self.path.startswith('/') and not '.' in self.path.split('/')[-1]):
            self.path = '/index.html'
        return super().do_GET()
    
    def guess_type(self, path):
        """Override guess_type to ensure correct MIME types"""
        base, ext = os.path.splitext(path)
        if ext == '.js':
            return 'application/javascript'
        elif ext == '.css':
            return 'text/css'
        else:
            return super().guess_type(path)

PORT = 3003
os.chdir('dist')
with socketserver.TCPServer(("0.0.0.0", PORT), MyHTTPRequestHandler) as httpd:
    print(f"Serving at http://0.0.0.0:{PORT}")
    httpd.serve_forever()