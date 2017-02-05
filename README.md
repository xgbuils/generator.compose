# compose

building generators using composition

## Version
0.1.0

Given a list of generators as parameters, `compose` returns a new generator that is the composition of its.

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