"use strict"

const Keel = require("../index.js")
const makeState = Keel.makeState
const printCleanConfig = Keel.printCleanConfig
const assert = require("assert")

describe ("State", () => {
    let config
    let state

    it("a field update can trigger a listener", (done) => {
        state = makeState({
            data: {
                foo: true
            }
        })
        state.on("foo", data => {
            assert(data.foo === false)
            done()
        })
        state.update({foo: false})
    })

    it("a field update with the same value do not trigger a listener", (done) => {
        state = makeState({
            data: {
                foo: true
            }
        })
        state.on("foo", data => {
            assert(false)
            done()
        })
        state.update({foo: true})
        assert(true)
        done()
    })

    it("a boolean expression can act as a trigger", (done) => {
        state = makeState({
            data: {
                foo: true,
                bar: false
            },
            expressions: {
                fooAndBar: "foo is true and bar is true"
            }
        })
        state.on("fooAndBar", data => {
            assert(data.bar === true)
            done()
        })
        state.update({bar: true})
        assert(false)
        done()
    })

    it("a boolean expression passed into 'on' can act as a trigger", (done) => {
        state = makeState({
            data: {
                foo: true,
                bar: false
            }
        })
        state.on("foo is true and bar is true", data => {
            assert(data.bar === true)
            done()
        })
        state.update({bar: true})
        assert(false)
        done()
    })

    it("the application of a rule can invoke a listener", (done) => {
        state = makeState({
            data: {
                foo: false,
                bar: false
            },
            rules: [
                "bar set foo"
            ]
        })
        state.on("bar is true", data => {
            assert(data.bar === true)
            done()
        })
        state.update({foo: true})
        assert(false)
        done()
    })

    it("an expression can be used in an expression", (done) => {
        state = makeState({
            data: {
                foo: false,
                bar: false
            },
            expressions:{
                fooIsTrue: "foo is true",
                fooAndBar: "fooIsTrue and bar is true"
            },
        })
        state.on("fooAndBar", data => {
            assert(data.bar === true)
            done()
        })
        state.update({foo: true, bar: true})
        assert(false)
        done()
    })

    it("an expression can be used in a rule", (done) => {
        state = makeState({
            data: {
                foo: false,
                bar: false
            },
            expressions:{
                fooIsTrue: "foo is true"
            },
            rules: [
                "if fooIsTrue then bar set true"
            ]
        })
        state.on("bar", data => {
            assert(data.bar === true)
            done()
        })
        state.update({foo: true})
        assert(false)
        done()
    })

    it("data passed into a listener cannot be changed", () => {
        function badSet(){
             state = makeState({
                data: {
                    foo: true
                }
            })
            state.on("foo", data => {
                data.foo = "barf"
            })
            state.update({foo: false})
        }
        assert.throws(badSet, Error)
    })

})

//history revert
//history dumpHistory()