import os
import time
from datetime import datetime, timedelta
from pymongo import MongoClient, errors

# --- Constants ---
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://mongo:27017/hellolinksDB")
# Time window to check for spikes (in minutes)
TIME_WINDOW_MINUTES = 5
# Number of clicks within the time window to be considered a spike
SPIKE_THRESHOLD = 100
# How often the worker should run (in seconds)
SLEEP_INTERVAL_SECONDS = 60
# Threshold for IP flood detection (clicks per IP in time window)
IP_FLOOD_THRESHOLD = 30
# Time window for IP flood detection (in minutes)
IP_FLOOD_TIME_WINDOW_MINUTES = 3

def get_db_client():
    """Establishes a connection to the MongoDB database."""
    try:
        client = MongoClient(MONGO_URI)
        # The ismaster command is cheap and does not require auth.
        client.admin.command('ismaster')
        print("MongoDB connection successful.")
        return client
    except errors.ConnectionFailure as e:
        print(f"Could not connect to MongoDB: {e}")
        return None

def analyze_traffic_spikes(db):
    """
    Analyzes click data to find traffic spikes and records them.
    """
    print(f"[{datetime.now()}] Running traffic spike analysis...")

    end_time = datetime.utcnow()
    start_time = end_time - timedelta(minutes=TIME_WINDOW_MINUTES)

    pipeline = [
        {
            "$match": {
                "timestamp": {"$gte": start_time, "$lt": end_time}
            }
        },
        {
            "$group": {
                "_id": "$linkId",
                "clickCount": {"$sum": 1}
            }
        },
        {
            "$match": {
                "clickCount": {"$gte": SPIKE_THRESHOLD}
            }
        }
    ]

    try:
        spikes = list(db.clicks.aggregate(pipeline))

        if not spikes:
            print("No significant traffic spikes detected.")
            return

        print(f"Detected {len(spikes)} traffic spike(s).")
        
        spike_docs = [
            {
                "linkId": spike["_id"],
                "spikeCount": spike["clickCount"],
                "timeWindowStart": start_time,
                "timeWindowEnd": end_time,
                "detectedAt": datetime.utcnow()
            }
            for spike in spikes
        ]
        
        db.traffic_spikes.insert_many(spike_docs)
        print(f"Successfully recorded {len(spike_docs)} spike events.")

    except Exception as e:
        print(f"An error occurred during spike analysis: {e}")

def detect_ip_flood(db):
    """
    Detects and records excessive click activity from individual IPs,
    which could indicate bot activity or DDoS attempts.
    """
    print(f"[{datetime.now()}] Running IP flood detection...")

    end_time = datetime.utcnow()
    start_time = end_time - timedelta(minutes=IP_FLOOD_TIME_WINDOW_MINUTES)

    pipeline = [
        {
            "$match": {
                "timestamp": {"$gte": start_time, "$lt": end_time},
                "ip": {"$ne": None}  # Ensure we have an IP
            }
        },
        {
            "$group": {
                "_id": {
                    "ip": "$ip",
                    "linkId": "$linkId"
                },
                "clickCount": {"$sum": 1},
                "firstClick": {"$min": "$timestamp"},
                "lastClick": {"$max": "$timestamp"},
                "isBot": {"$max": {"$cond": [{"$eq": ["$isBot", True]}, 1, 0]}}
            }
        },
        {
            "$match": {
                "clickCount": {"$gte": IP_FLOOD_THRESHOLD}
            }
        },
        {
            "$project": {
                "ip": "$_id.ip",
                "linkId": "$_id.linkId",
                "clickCount": 1,
                "firstClick": 1,
                "lastClick": 1,
                "clicksPerMinute": {
                    "$divide": [
                        "$clickCount",
                        {"$max": [1, {"$divide": [{"$subtract": ["$lastClick", "$firstClick"]}, 60000]}]}
                    ]
                },
                "isBot": {"$cond": [{"$eq": ["$isBot", 1]}, true, false]},
                "_id": 0
            }
        }
    ]

    try:
        flood_results = list(db.clicks.aggregate(pipeline))

        if not flood_results:
            print("No IP flood activity detected.")
            return

        print(f"Detected {len(flood_results)} IP flood events.")
        
        flood_docs = [
            {
                "ip": result["ip"],
                "linkId": result["linkId"],
                "clickCount": result["clickCount"],
                "clicksPerMinute": result["clicksPerMinute"],
                "timeWindowStart": start_time,
                "timeWindowEnd": end_time,
                "detectedAt": datetime.utcnow(),
                "isBot": result["isBot"]
            }
            for result in flood_results
        ]
        
        db.ip_flood_events.insert_many(flood_docs)
        
        # Flag these IPs in a separate collection for potential blocking
        for doc in flood_docs:
            db.suspicious_ips.update_one(
                {"ip": doc["ip"]},
                {
                    "$set": {
                        "lastDetected": doc["detectedAt"],
                        "isBot": doc["isBot"]
                    },
                    "$inc": {"floodCount": 1},
                    "$setOnInsert": {"firstDetected": doc["detectedAt"]}
                },
                upsert=True
            )
        
        print(f"Successfully recorded {len(flood_docs)} IP flood events.")

    except Exception as e:
        print(f"An error occurred during IP flood detection: {e}")

def main():
    """Main worker loop."""
    client = None
    while not client:
        client = get_db_client()
        if not client:
            print("Retrying MongoDB connection in 10 seconds...")
            time.sleep(10)
    
    db = client.get_database()

    while True:
        analyze_traffic_spikes(db)
        detect_ip_flood(db)
        print(f"Worker sleeping for {SLEEP_INTERVAL_SECONDS} seconds...")
        time.sleep(SLEEP_INTERVAL_SECONDS)


if __name__ == "__main__":
    print("Starting Traffic Spike Aggregator Worker...")
    main()
