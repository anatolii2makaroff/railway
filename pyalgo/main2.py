import json
import networkx as nx
import time

def load_data(path):

    with open(path) as f:
        data = json.loads(f.read())

    return data


if __name__ == '__main__':

    data = load_data("../graphviewer/data/railways.json")

    nodes = data["elements"]["nodes"]
    edges = data["elements"]["edges"]

    # print(nodes)
    # print(edges)

    tb = time.time()

    g = nx.Graph()

    node_points = {}

    cnt = 0
    for n in nodes:
        g.add_node(n["data"]["id"])

        print(n["data"]["id"])
        node_points[n["data"]["id"]] = {"x": n["data"]["x"], "y": n["data"]["y"]}
        cnt += 1

    for e in edges:

        x1, y1 = node_points[e["data"]["source"]]["x"], node_points[e["data"]["source"]]["y"]
        x2, y2 = node_points[e["data"]["target"]]["x"], node_points[e["data"]["target"]]["y"]

        distance = ((((x2 - x1 )**2) + ((y2-y1)**2) )**0.5)

        print("{} -> {}".format(e["data"]["source"], e["data"]["target"]))


        g.add_edge(e["data"]["source"], e["data"]["target"], weigth=distance)

    print("Count of nodes: {}/ loaded {}".format(cnt, time.time()-tb))

    tb = time.time()

    print(nx.shortest_path(g, source="3013", target="5450", weight="weight"))

    print("path finded {}".format(time.time()-tb))
