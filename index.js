const State = require("./lib/state.js")

module.exports.State = State
module.exports.makeState = config => {
   const state = new State()
   state.init(config)
   return state
}

//get config by requiring it and parsing yaml
