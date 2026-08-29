import requests
import sys
import os

# cobalt tools / tungsten self hosted api download script
# This script was made for using with cobalt.tools, now adapted for tungsten.
# cobalt runs on port 9000, tungsten runs on 9007
# you can change the HOST var to match your IP and port (cobalt or tungsten)

HOST = "http://localhost:9007"
URL = None
DOWNLOAD_PATH = os.path.join(os.path.expanduser("~"), "Downloads")

HEADERS = {
    "Accept": "application/json",
    "Content-Type": "application/json"
}

try:
    URL = sys.argv[1]
except IndexError:
    print("Must provide YouTube video URL!")
    exit(1)

BODY = {
    "url": URL
}

# POST response
res = requests.post(HOST, json=BODY, headers=HEADERS)
if res.status_code != 200:
    print(f"Requesting {URL} went wrong! HTTP Status Code: {res.status_code}")
    print(res.text)
    exit(1)

res_json = res.json()
url_to_download = res_json["url"]
video_name = res_json["filename"]
file_destination = os.path.join(DOWNLOAD_PATH, video_name)

# GET for downloading the video
d_res = requests.get(url_to_download, stream=True)
if d_res.status_code != 200:
    print(f"Requesting {URL} went wrong! HTTP Status Code: {d_res.status_code}")
    print(res.text)
    exit(1)
 
with open(file_destination, "wb") as f:
    for chunk in d_res.iter_content(chunk_size=8192):
        f.write(chunk)

saved_file_size = os.path.getsize(file_destination)
if saved_file_size == 0:
    print(f"Error while downloading {video_name} (0 byte file)")
    os.remove(file_destination)
    exit(1)
    
print(f"File saved to {file_destination}")
