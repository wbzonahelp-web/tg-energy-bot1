#!/usr/bin/env python3
import http.server
import os

UPLOAD_DIR = "/opt/projects/new-project/uploads"
PORT = 8081

class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.end_headers()
        html = '''<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Upload</title></head>
<body style="font-family:Arial;max-width:600px;margin:50px auto;text-align:center">
<h1>Upload Excel File</h1>
<form method="POST" enctype="multipart/form-data">
<input type="file" name="file" accept=".xlsx,.xls,.csv" required><br><br>
<input type="submit" value="Upload" style="padding:15px 40px;font-size:18px;background:#4CAF50;color:white;border:none;border-radius:5px;cursor:pointer">
</form>
</body></html>'''
        self.wfile.write(html.encode())

    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length)
            ct = self.headers['Content-Type']
            boundary = ct.split('boundary=')[1].encode()
            parts = body.split(b'--' + boundary)
            for part in parts:
                if b'filename="' in part:
                    idx = part.find(b'\r\n\r\n')
                    if idx == -1:
                        continue
                    data = part[idx+4:]
                    if data.endswith(b'\r\n'):
                        data = data[:-2]
                    filepath = os.path.join(UPLOAD_DIR, "users.xlsx")
                    with open(filepath, 'wb') as f:
                        f.write(data)
                    sz = os.path.getsize(filepath)
                    self.send_response(200)
                    self.send_header('Content-type', 'text/html; charset=utf-8')
                    self.end_headers()
                    msg = f'<html><body style="font-family:Arial;text-align:center;margin-top:50px"><h1 style="color:green">OK! {sz} bytes</h1><p>File saved. Stop server (Ctrl+C) and run import.</p></body></html>'
                    self.wfile.write(msg.encode())
                    print(f"Uploaded: {filepath} ({sz} bytes)")
                    return
            self.send_response(400)
            self.end_headers()
        except Exception as e:
            print(f"Error: {e}")
            self.send_response(500)
            self.end_headers()

    def log_message(self, fmt, *args):
        print(f"{fmt % args}")

os.makedirs(UPLOAD_DIR, exist_ok=True)
server = http.server.HTTPServer(('0.0.0.0', PORT), Handler)
print(f"Server: http://152.53.187.79:{PORT}")
server.serve_forever()
