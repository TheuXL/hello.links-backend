#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Add the current directory to PYTHONPATH to enable absolute imports
export PYTHONPATH=$PYTHONPATH:/usr/src/app

# Update GeoIP databases before starting the services.
# The -v flag provides verbose output, which is useful for debugging.
# The databases will be downloaded to the 'src/geoip_databases' directory.
echo "Updating GeoIP databases..."
geoipupdate -d src/geoip_databases -v

# Update FireHOL IP lists. The -N flag ensures we only download if the remote file is newer.
# The -P flag directs the output to the specified directory.
echo "Updating FireHOL IP lists..."
wget -N -P src/utils/firehol_lists/ https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/firehol_level1.netset
wget -N -P src/utils/firehol_lists/ https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/firehol_level2.netset
wget -N -P src/utils/firehol_lists/ https://raw.githubusercontent.com/firehol/blocklist-ipsets/master/firehol_webclient.netset

# Start the Uvicorn server in the background
echo "Starting FastAPI server..."
uvicorn src.main:app --host 0.0.0.0 --port 8000 &

# Wait for a few seconds to ensure the server starts up
sleep 3

# Start the aggregator worker in the foreground
echo "Starting Aggregator Worker..."
python src/workers/aggregator.py 