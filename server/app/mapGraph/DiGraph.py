from queue import LifoQueue
from queue import Queue

from server.app.mapGraph.Bag import Bag


class DiGraph:
    def __init__(self):
        self._V = 0
        self._E = 0
        self._adj = {}

    def fromfile(self, file):

        for line in file:
            self.add_edge(int(line.split(' ')[0]), int(line.split(' ')[1]))

    def add_edge(self, v, w):
        self._E += 1
        b = self._adj.get(v, Bag())
        # if not b:
        #     self._V += 1
        b.add(w)
        self._adj[v] = b

        # b = self._adj.get(w, Bag())
        # b.add(v)
        # self._adj[w] = b

    def adj(self, v):
        """Iterating on vertices belonging to given v"""
        edges = self._adj.get(v, [])
        for edge in edges:
            yield edge

    def V(self):
        """Number of vertices"""
        return len(self._adj.keys())

    def E(self):
        """Number of edges"""
        return self._E

    def __repr__(self):
        return self._adj.__repr__()


class Node:
    def __init__(self, x):
        self.x = x

    def __repr__(self):
        return "Node(%d)" % self.x

    def __eq__(self, other):
        return True

    def __hash__(self):
        return self.x.__hash__()


class BreadthFirstPath:
    def __init__(self, graph: DiGraph, s):
        self._s = s
        # self._marked = array.array('b', [False for x in range(graph.V())])
        self._marked = {}
        self._edge_to = {}
        self._bfs(graph, s)

    def _bfs(self, graph, s):
        q = Queue()
        q.put(s)
        self._marked[s] = True
        while not q.empty():
            v = q.get()
            for w in graph.adj(v):
                if not self._marked.get(w):
                    q.put(w)
                    self._marked[w] = True
                    self._edge_to[w] = v

    def has_path_to(self, v) -> bool:
        return self._marked.get(v, False)

    def path_to(self, v):
        """:returns path between s, given in the constructor, and v; None if there no path"""
        if not self.has_path_to(v): return None
        path = LifoQueue()
        x = v
        while x != self._s:
            path.put(x)
            x = self._edge_to[x]
        path.put(self._s)
        while not path.empty():
            yield path.get()


if __name__ == '__main__':
    # graph = DiGraph()
    # for i in range(5):
    #     v = Node(i)
    #     for j in range(5, 7):
    #         w = Node(j)
    #         graph.add_edge(v, w)
    # print(graph)
    # graph.add_edge(Node(0), Node(22))
    # for edge in graph.adj(Node(0)):
    #     print(edge)
    with open("tinyG.txt") as f:
        graph = DiGraph()
        graph.fromfile(f)
        s = 6
        bfs = BreadthFirstPath(graph, s)

        for v in range(1, graph.E()):
            if bfs.has_path_to(v):
                print("%d to %d:" % (s, v), end=' ')
                for x in bfs.path_to(v):
                    print('%d-' % x, end='')
                print()
            else:
                print("%d to %d: not connected" % (s, v))
