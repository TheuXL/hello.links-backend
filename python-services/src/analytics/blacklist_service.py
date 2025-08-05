import ipaddress
import os
import requests

# --- FireHOL Constants and Loading ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LISTS_DIR = os.path.join(BASE_DIR, '../firehol_lists')
FIREHOL_LIST_FILES = [
    "firehol_level1.netset",
    "firehol_level2.netset",
    "firehol_webclient.netset",
]
_firehol_ip_networks = set()

def _load_firehol_lists():
    global _firehol_ip_networks
    if _firehol_ip_networks: return
    print("Loading FireHOL blocklists into memory...")
    loaded_count = 0
    for filename in FIREHOL_LIST_FILES:
        filepath = os.path.join(LISTS_DIR, filename)
        if not os.path.exists(filepath):
            print(f"Warning: FireHOL list not found at {filepath}. Skipping.")
            continue
        try:
            with open(filepath, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#'):
                        try:
                            _firehol_ip_networks.add(ipaddress.ip_network(line))
                            loaded_count += 1
                        except ValueError:
                            pass
        except Exception as e:
            print(f"Error reading FireHOL list {filename}: {e}")
    print(f"Successfully loaded {loaded_count} unique IP/network entries from FireHOL lists.")

def is_ip_in_firehol_blocklists(ip_str: str) -> bool:
    if not _firehol_ip_networks: return False
    try:
        ip_addr = ipaddress.ip_address(ip_str)
        for network in _firehol_ip_networks:
            if ip_addr in network:
                return True
    except ValueError:
        return False
    return False

# --- AbuseIPDB Constants and Logic ---
API_KEY = os.getenv("ABUSEIPDB_API_KEY")
BASE_URL = "https://api.abuseipdb.com/api/v2/check"
ABUSE_CONFIDENCE_SCORE_THRESHOLD = 90

def check_abuseipdb_reputation(ip: str):
    if not API_KEY:
        # print("Warning: ABUSEIPDB_API_KEY not set. Skipping IP reputation check.")
        return {"isMalicious": None, "abuseConfidenceScore": None}
    headers = {'Accept': 'application/json', 'Key': API_KEY}
    params = {'ipAddress': ip, 'maxAgeInDays': '90'}
    try:
        response = requests.get(url=BASE_URL, headers=headers, params=params)
        response.raise_for_status()
        data = response.json().get("data", {})
        score = data.get("abuseConfidenceScore", 0)
        return {"isMalicious": score >= ABUSE_CONFIDENCE_SCORE_THRESHOLD, "abuseConfidenceScore": score}
    except requests.exceptions.RequestException as e:
        print(f"Error calling AbuseIPDB API: {e}")
        return {"isMalicious": None, "abuseConfidenceScore": None}

# --- Initial load on module import ---
_load_firehol_lists() 