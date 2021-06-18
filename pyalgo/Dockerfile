FROM ubuntu:18.04
RUN apt-get update && apt-get install -y python3
RUN apt-get install -y python3-pip
RUN pip3 install networkx
RUN useradd drop
COPY ./pathq.py /home/drop/
COPY ./railways.json /home/drop/
