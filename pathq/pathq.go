package pathq

import (
	"fmt"
	"github.com/RyanCarrier/dijkstra"
	"log"
)

func Stub() string {

	return "stub"

}

func LoadData()

func BuildGraph() *dijkstra.Graph {

	graph := dijkstra.NewGraph()
	//Add the 3 verticies
	graph.AddVertex(0)
	graph.AddVertex(1)
	graph.AddVertex(2)
	//Add the arcs
	graph.AddArc(0, 1, 1)
	graph.AddArc(0, 2, 1)
	graph.AddArc(1, 0, 1)
	graph.AddArc(1, 2, 2)

	return graph
}

func FindShortest(g *dijkstra.Graph) {

	best, err := g.Shortest(0, 2)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Shortest distance ", best.Distance, " following path ", best.Path)
}
