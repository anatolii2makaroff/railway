import sys
import time
import json
import networkx as nx

# API


def read():
    msg = sys.stdin.readline()
    return msg.strip()


def log(m):
    sys.stderr.write("{}: {}\n".format(time.time(), m))
    sys.stderr.flush()


def send(m):
    sys.stdout.write("{}\n".format(m))
    sys.stdout.flush()


# Process - actor
#  read - recieve message from world
#  send - send message to world
#  log  -  logging anything


def load_data(path):

    with open(path, encoding="utf-8") as f:
        data = json.loads(f.read())

    return data


def load_graph(data):

    nodes = data["elements"]["nodes"]
    edges = data["elements"]["edges"]

    # print(nodes)

    g = nx.Graph()

    node_points = {}

    cnt = 0
    for n in nodes:
        g.add_node(n["data"]["id"])
        node_points[n["data"]["id"]] = {"x": n["data"]["x"], "y": n["data"]["y"]}
        cnt += 1

    for e in edges:
        x1, y1 = node_points[e["data"]["source"]]["x"], node_points[e["data"]["source"]]["y"]
        x2, y2 = node_points[e["data"]["target"]]["x"], node_points[e["data"]["target"]]["y"]

        distance = ((((x2 - x1)**2) + ((y2-y1)**2))**0.5)

        log("source: {}\ntarget: {}\ndistance:{}\n".format(e["data"]["source"], e["data"]["target"],distance))


        g.add_edge(e["data"]["source"], e["data"]["target"], weigth=distance)

    log("Count of nodes: {}".format(cnt))

    return g


def get_shortest(g, s, t):
    return nx.shortest_path(g, source=s, target=t, weight="weight")


def main():

    g = None

    g = load_graph(load_data("../graphviewer/data/railways.json"))

    while 1:
        msg = read()

        if not msg:
            break

        req = json.loads(msg)

        if req["op"] == "load_data":

            log("loading graph..")

            g = load_graph(req["data"])

            log("graph is loaded..")

            resp = json.dumps({"result": "ok"})

            send(resp)

            log("message send: {}".format(resp))

        elif req["op"] == "get_shortest":

            if g is not None:

                tb = time.time()

                path = get_shortest(g, req["data"]["source"], req["data"]["target"])

                log("path finded in {} s".format(time.time() - tb))

                resp = json.dumps({"path": path})

                send(resp)

                log("message send: {}".format(resp))

            else:
                resp = json.dumps({"error": "graph is not loaded"})

                send(resp)

                log("message send: {}".format(resp))

        else:

            resp = json.dumps({"error": "no such op"})

            send(resp)

            log("message send: {}".format(resp))


if __name__ == "__main__":
    main()
