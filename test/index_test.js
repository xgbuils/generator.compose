const {expect} = require('chai')
const compose = require('../src/')

describe('compose', function () {
    describe('with simple generators', function () {
        it('compose(add1, square)', function () {
            const gen = compose(add1, square)
            const iterator = gen(3)
            expect(iterator.next()).to.be.deep.equal({
                value: 10,
                done: false
            })
        })

        it('compose(square, add1)', function () {
            const gen = compose(square, add1)
            const iterator = gen(3)
            expect(iterator.next()).to.be.deep.equal({
                value: 16,
                done: false
            })
        })
    })
    describe('using compose for repetition', function () {
        it('compose(range.bind(null, 3), range)', function () {
            const gen = compose(range.bind(null, 3), range)
            expect([...gen(2)]).to.be.deep.equal([0, 1, 2, 0, 1, 2])
        })

        it('compose(range.bind(null, 2), range)', function () {
            const gen = compose(range.bind(null, 2), range)
            expect([...gen(5)]).to.be.deep.equal([0, 1, 0, 1, 0, 1, 0, 1, 0, 1])
        })
    })
    describe('triangular replication', function () {
        it('compose(range, range)', function () {
            const gen = compose(range, range)
            expect([...gen(5)]).to.be.deep.equal([0, 0, 1, 0, 1, 2, 0, 1, 2, 3])
        })
    })

    describe('cartesian product', function () {
        let start
        let middle
        let end
        beforeEach(function () {
            start = function* (n) {
                for (let i = 1; i <= n; ++i) {
                    yield {
                        n,
                        arr: [i]
                    }
                }
            }
            middle = function* (obj) {
                const {n, arr} = obj
                for (let i = 1; i <= n; ++i) {
                    yield {
                        n,
                        arr: [...arr, i]
                    }
                }
            }
            end = function* (obj) {
                yield obj.arr
            }
        })
        it('[1, 2, 3] x [1, 2, 3]', function () {
            const generators = [end, middle, start]
            const gen = compose(...generators)
            expect([...gen(3)]).to.be.deep.equal([
                [1, 1],
                [1, 2],
                [1, 3],
                [2, 1],
                [2, 2],
                [2, 3],
                [3, 1],
                [3, 2],
                [3, 3]
            ])
        })

        it('[1, 2] x [1, 2] x [1, 2]', function () {
            const generators = [end, middle, middle, start]
            const gen = compose(...generators)
            expect([...gen(2)]).to.be.deep.equal([
                [1, 1, 1],
                [1, 1, 2],
                [1, 2, 1],
                [1, 2, 2],
                [2, 1, 1],
                [2, 1, 2],
                [2, 2, 1],
                [2, 2, 2]
            ])
        })
    })
})

function* add1 (x) {
    yield x + 1
}

function* square (x) {
    yield x * x
}

function* range (n) {
    for (let i = 0; i < n; ++i) {
        yield i
    }
}
