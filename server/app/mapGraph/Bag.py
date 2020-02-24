class Bag:

    def __init__(self):
        self._n = 0
        self._last = None
        self._first = None

    def add(self, elem):
        old_last = self._last
        self._last = self.__Node()
        self._last.item = elem
        if self._n == 0:
            self._first = self._last
        else:
            old_last.next = self._last
        self._n += 1

    def __sizeof__(self):
        return self._n

    def __repr__(self):
        return [x for x in iter(self)].__repr__()

    def __iter__(self):
        self._curr = self._first
        return self

    def __next__(self):
        if self._curr is not None:
            item = self._curr.item
            self._curr = self._curr.next
            return item
        else:
            raise StopIteration

    def __bool__(self):
        return self._first is not None

    class __Node:
        item = None
        next = None


if __name__ == '__main__':
    bag = Bag()
    for i in range(11):
        bag.add(i)
    for i in bag:
        print(i, end=', ')
    print(bag)
    for i in bag:
        print(i, end=', ')
