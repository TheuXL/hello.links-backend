FROM python:3.9-slim

# Install wget and remove apt cache
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

# Download and install the geoipupdate utility
RUN wget https://github.com/maxmind/geoipupdate/releases/download/v7.0.1/geoipupdate_7.0.1_linux_amd64.deb && \
    dpkg -i geoipupdate_7.0.1_linux_amd64.deb && \
    rm geoipupdate_7.0.1_linux_amd64.deb

WORKDIR /usr/src/app

COPY ./requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy the GeoIP configuration file to the default location
COPY ./GeoIP.conf /etc/GeoIP.conf

COPY ./src .
COPY ./run.sh .

RUN chmod +x ./run.sh

EXPOSE 8000

CMD ["./run.sh"]
