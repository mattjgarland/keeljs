const State = require("./lib/state.js")
const printCleanConfig = require("./lib/syntax-tree.js").printCleanConfig

module.exports.State = State
module.exports.makeState = config => {
   const state = new State()
   state.init(config)
   return state
}
module.exports.printCleanConfig = printCleanConfig
