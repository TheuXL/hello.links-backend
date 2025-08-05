import geoip2.database
import os

# --- Constants ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_DIR = os.path.join(BASE_DIR, '../geoip_databases')
CITY_DB_PATH = os.path.join(DB_DIR, 'GeoLite2-City.mmdb')
ASN_DB_PATH = os.path.join(DB_DIR, 'GeoLite2-ASN.mmdb')
COUNTRY_DB_PATH = os.path.join(DB_DIR, 'GeoLite2-Country.mmdb')


# Keywords to identify non-residential IPs (likely VPNs, proxies, or servers)
DATACENTER_KEYWORDS = [
    "hosting", "cloud", "datacenter", "server", "vps", "vpn", 
    "proxy", "digitalocean", "linode", "vultr", "ovh", "hetzner",
    "amazon", "google", "microsoft", "oracle"
]

# --- Database Readers (initialized on module load) ---
city_reader = None
asn_reader = None
country_reader = None

try:
    if os.path.exists(CITY_DB_PATH):
        city_reader = geoip2.database.Reader(CITY_DB_PATH)
    else:
        print(f"Warning: GeoLite2 City database not found at {CITY_DB_PATH}")
except Exception as e:
    print(f"Error loading GeoLite2 City database: {e}")

try:
    if os.path.exists(ASN_DB_PATH):
        asn_reader = geoip2.database.Reader(ASN_DB_PATH)
    else:
        print(f"Warning: GeoLite2 ASN database not found at {ASN_DB_PATH}")
except Exception as e:
    print(f"Error loading GeoLite2 ASN database: {e}")

try:
    if os.path.exists(COUNTRY_DB_PATH):
        country_reader = geoip2.database.Reader(COUNTRY_DB_PATH)
    else:
        print(f"Warning: GeoLite2 Country database not found at {COUNTRY_DB_PATH}")
except Exception as e:
    print(f"Error loading GeoLite2 Country database: {e}")


def get_geoip_data(ip: str):
    """
    Looks up geo-location and ASN data for a given IP address using MaxMind DBs.
    Also performs a basic VPN/proxy detection based on ASN organization.
    """
    geo_info = {}
    asn_info = {}
    is_vpn_or_proxy = False

    # Get City/Country/Location data
    if city_reader:
        try:
            response = city_reader.city(ip)
            geo_info = {
                "country": response.country.iso_code,
                "city": response.city.name,
                "latitude": response.location.latitude,
                "longitude": response.location.longitude,
                "timezone": response.location.time_zone,
            }
        except geoip2.errors.AddressNotFoundError:
            # If city is not found, we can try the country database as a fallback.
            pass
        except Exception as e:
            print(f"An error occurred during city lookup for {ip}: {e}")

    # Fallback to Country database if city lookup failed to find a country
    if not geo_info.get("country") and country_reader:
        try:
            response = country_reader.country(ip)
            geo_info["country"] = response.country.iso_code
        except geoip2.errors.AddressNotFoundError:
            print(f"IP address not found in GeoLite2-Country database: {ip}")
        except Exception as e:
            print(f"An error occurred during country lookup for {ip}: {e}")


    # Get ASN/ISP data and check for VPN/Proxy
    if asn_reader:
        try:
            response = asn_reader.asn(ip)
            asn_info = {
                "number": response.autonomous_system_number,
                "organization": response.autonomous_system_organization
            }
            # Basic datacenter/VPN detection
            org_lower = response.autonomous_system_organization.lower()
            if any(keyword in org_lower for keyword in DATACENTER_KEYWORDS):
                is_vpn_or_proxy = True

        except geoip2.errors.AddressNotFoundError:
            print(f"IP address not found in GeoLite2-ASN database: {ip}")
        except Exception as e:
            print(f"An error occurred during ASN lookup for {ip}: {e}")

    return {
        "geo": geo_info,
        "asn": asn_info,
        "isVpnOrProxy": is_vpn_or_proxy,
        "isp": asn_info.get("organization") # Use ASN organization as ISP
    }

def close_readers():
    """Closes the database readers."""
    if city_reader:
        city_reader.close()
    if asn_reader:
        asn_reader.close()
    if country_reader:
        country_reader.close() 