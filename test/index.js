"use strict"

const Keel = require("../index.js")
const makeState = Keel.makeState
const assert = require("assert")

describe ("State", () => {

   it("works", (done) => {
      const state  = makeState({
         fields: {
            flag: false,
            echo: false
         },
         exps: {
            flagAndEchoTrue: "flag is true and echo is true"
         },
         rules: [
            "echo equals flag"
         ]
      })
      state.on("flagAndEchoTrue", data => {
         //assert(data.flag === true)
         //assert(data.echo === true)
         //data.flag = false
         console.log("FLAG", data.flag)
         //assert(data.flag === true)
         //data.echo = false
         assert(data.echo === true)
         done()
      })
      state.update({flag: true})
      assert(false)
   })
})

// const state = new State()
// state.set("falseFlag", false)
// state.set("trueFlag", true)
// state.set("reset", false)
// state.exp("bothTrue", "falseFlag is true and trueFlag is true")
// state.exp("bothFalse", "falseFlag is false and trueFlag is false")
// state.rule("if reset is now true then falseFlag equals false and trueFlag is true")
// state.on("falseFlag", state => assert(false))
