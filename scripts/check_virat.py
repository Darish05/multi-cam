import urllib.request
import ssl
import re

ctx = ssl._create_unverified_context()
req = urllib.request.Request('http://www.viratdata.org/', headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8', errors='ignore')

links = re.findall(r'href=[\"\'](.*?)[\"\']', html)
for l in links:
    if any(k in l.lower() for k in ['http', 'data', 'download', 'kitware', 'gitlab', 'box', 'drive', 'zip', 'mp4']):
        print(l)
