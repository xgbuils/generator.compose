function compose (...generators) {
    return generators.reduceRight(function (resultGen, gen) {
        return function* (y) {
            for (const val of resultGen(y)) {
                yield* gen(val)
            }
        }
    }, function* (x) {
        yield x
    })
}

module.exports = compose
