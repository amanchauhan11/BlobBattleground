FROM ubuntu:latest

RUN apt-get update
RUN apt-get install -y python3 python3-pip
RUN mkdir -p /deploy/game

# Install dependencies
COPY requirements.txt /deploy/game/requirements.txt
RUN pip3 install -r /deploy/game/requirements.txt

# Deploy application
COPY gunicorn_config.py /deploy/gunicorn_config.py
COPY app /deploy/game
WORKDIR /deploy/game

# Set Python path
ENV PYTHONPATH=/deploy

EXPOSE 8080

CMD ["gunicorn", "--config", "/deploy/gunicorn_config.py", "-k","eventlet" "game:app"]