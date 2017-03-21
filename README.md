# generator.compose

building generators using generator composition

## Version
0.1.0

## Introduction

### Function composition

A [univariate function](http://mathworld.wolfram.com/UnivariateFunction.html) is a function of one variable. Given two univariate functions `f` and `g`, the function composition (f ·g) is a function that for each `x`, it returns `f(g(x))`. Function composition is easy to extrapolate to multiple univariate functions: given `f1`, `f2`, ..., `fn` univariate functions, the function composition `(f1·f2·..·fn)` is a function that for each `x`, it returns `f1(f2(..fn(x)))`.

In javascript functions are first-class objects. Then it is easy to create a function `compose` that receives a list of univariate functions and returns a function that is the composition of these functions:

``` javascript
function compose(...functions) {
    return function (x) {
        return functions.reduceRight(function(result, fn) {
            return fn(result)
        }, x)
    }
}
```

Then, if you define two univariate functions `add1` and `square`:

``` javascript
function add1 (x) {
    return x + 1
}

function square (x) {
    return x * x
}
```

you can create composition of functions using `compose`:

``` javascript
// f(x) = x^2 + 1
const f = compose(add1, square)

// g(x) = (x + 1)^2
const g = compose(square, add1)
```

### Generator composition

However this package is not about function composition. This package is about the concept of **generator composition**. We can assume that [ES2015 generator](https://developer.mozilla.org/es/docs/Web/JavaScript/Guide/Iterators_and_Generators) it is a function that is able to return a list of values through an iterator object. Then, we can assume a generator composition as an extrapolation of function composition. First of all, let's go back to the `compose` function defined above. We can redefine the implementation thus:

``` javascript
function compose(...functions) {
    return functions.reduceRight(function(resultFn, fn) {
        return function(y) {
            const val = resultFn(y)
            return fn(val)
        }
    }, function (x) {
        return x
    })
}
```

This implementation is more verbose than previous definition but is more useful to understand how is extrapolated to generator composition. Firstly, we can implement a version that works with univariate generators that returns an iterator that **just iterates over one value**. Assuming the previous constriction is easy to adapt replacing `return`s by `yield`s and `function` by `function*`:

``` javascript
function compose(...generators) {
    return generators.reduceRight(function(resultGen, gen) {
        return function* (y) {
            const val = resultGen(y).next().value
            yield* gen(val)
        }
    }, function* (x) {
        yield x
    })
}
```

Then, we can take previous examples of `add1` and `square` and transform to generators:

``` javascript
function* add1 (x) {
    yield x + 1
}

function* square (x) {
    yield x * x
}
```

Now we can use `composeGenerator` thus:

``` javascript
const f = compose(add1, square)
const iteratorF = f(3)
iteratorF.next() // returns {value: 10, done: false}

const g = compose(square, add1)
const iteratorG = g(3)
iteratorG.next() // returns {value: 16, done: false}
```

However, the interesting thing is allowing that generators return iterators that iterates over more than one value. Given the previous `composeGenerator`, we have to change `const val = resultGen(y).next().value`:

``` javascript
function compose(...generators) {
    return generators.reduceRight(function(resultGen, gen) {
        return function* (y) {
            for (const val of resultGen(y)) {
                yield* gen(val)
            }
        }
    }, function* (x) {
        yield x
    })
}
```

### Ok, but what is it for?

Generation composition can be used to create lazy cartesian product generator and problably another exponential patterns like permutations or combinations.


## TO REMOVE:

### Repeated patterns using composition
For example, if it is passed a list for two generators, second generator iterates its values for each value produced by first iterator:

``` javascript
const compose = require('generator.compose')

function* range (a, b, inc = 1) {
    for (let i = a; i <= b; i += inc) {
        yield i
    }
}

const gen = compose(
    function* () {
        yield* range(1, 3)
    },
    function* () {
        yield* [1, 5]
    }
)

// [1, 5] x 3
[...gen()] // [1, 5, 1, 5, 1, 5]
```

If it is passed a list of 3 generators, third generator iterates its values for each value produced by second generator, and second generator iterates its values for each value produced by first generator:

``` javascript
const compose = require('generator.compose')

function* range (a, b, inc = 1) {
    for (let i = a; i <= b; i += inc) {
        yield i
    }
}

const gen = compose(
    function* () {
        yield* range(1, 2)
    },
    function* () {
        yield* range(1, 3)
    },
    function* () {
        yield* [1, 5]
    }
)

// [1, 5] x 2 x 3
[...gen()] // [1, 5, 1, 5, 1, 5, 1, 5, 1, 5, 1, 5]
```


It is possible to create a parametrizable generator defining the first generator with parameters:
``` javascript
const compose = require('generator.compose')

const gen = compose(
    function (n) {
        yield* range(1, n)
    },
    function () {
        yield* [3, 6]
    }
)

[...gen(1)] // [3, 6]
[...gen(2)] // [3, 6, 3, 6]
[...gen(3)] // [3, 6, 3, 6, 3, 6]

```

## Calling extra callback parameter

It is possible to call extra callback parameter. In this way, the rest of generators are able to depend on the parameters of first generator. For example:


``` javascript
const compose = require('generator.compose')

function* range (a, b, inc = 1) {
    for (let i = a; i <= b; i += inc) {
        yield i
    }
}

const gen = compose(
    function* (n, _) {
        _(n)
        yield* range(1, n)
    },
    function* (n) {
        yield* range(1, n)
    }
)

[...gen(1)] // [1]
[...gen(2)] // [1, 2, 1, 2]
[...gen(3)] // [1, 2, 3, 1, 2, 3, 1, 2, 3]
```

## self passing extra callback parameter

When a generator calls callback parameter passing itself, next generator will be called with the values produced by the previous generator. For example:
``` javascript
const compose = require('generator.compose')

const generator = compose(
    function* (_) {
        _(_)
        yield* [5, 1, 9]
    },
    function (i) {
        yield* [i, i]
    }
)

[...gen()] // [5, 5, 1, 1, 9, 9]

```

Another example also passing the first generator parameter:

``` javascript
const compose = require('generator.compose')

const generator = compose(
    function* (n, _) {
        _(n, _)
        yield* [5, 1, 9]
    },
    function (n, i) {
        for (let k = 0; k < n; ++k) {
            yield i
        }
    }
)

[...gen(1)] // [5, 1, 9]
[...gen(2)] // [5, 5, 1, 1, 9, 9]
[...gen(3)] // [5, 5, 5, 1, 1, 1, 9, 9, 9]

```

Or creating a cartesian product [1, 2] x [3, 4] x [5, 6] set example:

``` javascript
const compose = require('generator.compose')

const gen = Iterum.compose(
    function* (_) {
        _(_)
        yield* [1, 2]
    },
    function* (i, _) {
        _(i, _)
        yield* [3, 4]
    },
    function* (i, j, _) {
        yield* [5, 6]
    },
    function* (i, j, k) {
        yield [i, j, k]
    }
)

[...gen()] // [
    [1, 3, 5],
    [1, 3, 6],
    [1, 4, 5],
    [1, 4, 6],
    [2, 3, 5],
    [2, 3, 6],
    [2, 4, 5],
    [2, 4, 6]
]
```

## LICENSE
MIT