#!/usr/bin/env python3
import http.server
import os

UPLOAD_DIR = "/opt/projects/new-project/uploads"
PORT = 9999

HTML_FORM = b'''<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Upload Excel</title></head>
<body style="font-family:Arial;max-width:600px;margin:50px auto;text-align:center">
<h1>Upload Excel File</h1>
<form method="POST" enctype="multipart/form-data" action="/">
<input type="file" name="file" accept=".xlsx,.xls,.csv" style="padding:20px;font-size:16px"><br><br>
<input type="submit" value="Upload" style="padding:15px 40px;font-size:18px;background:#4CAF50;color:white;border:none;border-radius:5px;cursor:pointer">
</form>
</body>
</html>'''

class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(HTML_FORM)

    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length)
            content_type = self.headers['Content-Type']
            
            boundary = content_type.split('boundary=')[1].encode()
            parts = body.split(b'--' + boundary)
            
            for part in parts:
                if b'filename="' in part:
                    header_end = part.find(b'\r\n\r\n')
                    if header_end == -1:
                        continue
                    file_data = part[header_end + 4:]
                    if file_data.endswith(b'\r\n'):
                        file_data = file_data[:-2]
                    
                    filepath = os.path.join(UPLOAD_DIR, "users.xlsx")
                    with open(filepath, 'wb') as f:
                        f.write(file_data)
                    
                    size = os.path.getsize(filepath)
                    self.send_response(200)
                    self.send_header('Content-type', 'text/html; charset=utf-8')
                    self.end_headers()
                    self.wfile.write(f'<html><body style="font-family:Arial;text-align:center;margin-top:50px"><h1 style="color:green">File uploaded! Size: {size} bytes</h1><p>Path: {filepath}</p><p>Now go to server terminal and press Ctrl+C, then run import script</p></body></html>'.encode())
                    print(f"File uploaded: {filepath} ({size} bytes)")
                    return
            
            self.send_response(400)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(b'<h1>No file found in upload</h1>')
        except Exception as e:
            print(f"Error: {e}")
            self.send_response(500)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(f'<h1>Error: {e}</h1>'.encode())

    def log_message(self, format, *args):
        print(f"[{self.log_date_time_string()}] {format % args}")

os.makedirs(UPLOAD_DIR, exist_ok=True)
server = http.server.HTTPServer(('0.0.0.0', PORT), Handler)
print(f"Upload server running on http://152.53.187.79:{PORT}")
print(f"Press Ctrl+C to stop after upload")
server.serve_forever()
