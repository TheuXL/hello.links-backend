from . import geoip_service
from . import blacklist_service
from . import useragent_service

def analyze_click_data(ip: str, user_agent: str):
    """
    Orchestrates the full data enrichment pipeline for a given click.
    It calls all other analytics services and aggregates the results.
    """
    # 1. Get GeoIP and ASN data
    geoip_data = geoip_service.get_geoip_data(ip)
    
    # 2. Get User-Agent and Bot info
    ua_data = useragent_service.parse_user_agent(user_agent)
    is_bot_ua = useragent_service.is_bot(user_agent)

    # 3. Get IP reputation and blocklist status
    reputation_data = blacklist_service.check_abuseipdb_reputation(ip)
    is_blocked_firehol = blacklist_service.is_ip_in_firehol_blocklists(ip)

    # 4. Aggregate all data into a single response
    enriched_data = {
        "geo": geoip_data.get("geo"),
        "asn": geoip_data.get("asn"),
        "isp": geoip_data.get("isp"),
        "isVpnOrProxy": geoip_data.get("isVpnOrProxy"),
        "isMalicious": reputation_data.get("isMalicious"),
        "abuseConfidenceScore": reputation_data.get("abuseConfidenceScore"),
        "isBlockedByFireHOL": is_blocked_firehol,
        "isBot": is_bot_ua,
        "device": ua_data.get("device"),
        "os": ua_data.get("os"),
        "browser": ua_data.get("browser"),
    }

    return enriched_data 