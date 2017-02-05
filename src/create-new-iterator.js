function createNewIterator (context, item, previous, state) {
    state.nextParams = undefined
    const args = createArgs(item.args || [], state.nextParamsCallback, previous && previous.state.value)
    item.itor = item.ctor.apply(context, args)
}

function createArgs (args, _, value) {
    const params = args.map(arg => arg === _ ? value : arg)
    params.push(_)
    return params
}

module.exports = createNewIterator
