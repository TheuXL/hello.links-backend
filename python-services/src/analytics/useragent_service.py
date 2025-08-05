from user_agents import parse

# --- Bot Detection ---
BOT_KEYWORDS = [
    "bot", "crawler", "spider", "slurp", "google", "bing", "yahoo", "duckduckgo"
]

def is_bot(user_agent_string: str) -> bool:
    """
    Simple bot detection based on keywords in the User-Agent string.
    """
    if not user_agent_string:
        return False
    ua_lower = user_agent_string.lower()
    for keyword in BOT_KEYWORDS:
        if keyword in ua_lower:
            return True
    return False

# --- User-Agent Parsing ---
def parse_user_agent(user_agent_string: str):
    """
    Parses a User-Agent string to extract device, OS, and browser info.
    """
    if not user_agent_string:
        return { "device": {}, "os": {}, "browser": {} }
        
    ua = parse(user_agent_string)

    return {
        "device": {
            "type": "mobile" if ua.is_mobile else "desktop" if ua.is_pc else "tablet" if ua.is_tablet else "other",
            "brand": ua.device.brand,
            "model": ua.device.model,
        },
        "os": {
            "name": ua.os.family,
            "version": ua.os.version_string,
        },
        "browser": {
            "name": ua.browser.family,
            "version": ua.browser.version_string,
        }
    } 