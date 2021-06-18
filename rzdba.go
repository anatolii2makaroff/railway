package main

import (
	"fmt"
	"rzdba.ru/rzdba/pathq"
)

func main() {

	fmt.Println(pathq.Stub())

	graph := pathq.BuildGraph()

	pathq.FindShortest(graph)

}
