"use strict"

const Keel = require("../index.js")
const makeState = Keel.makeState
const printCleanConfig = Keel.printCleanConfig
const assert = require("assert")
let config
let state

describe ("Triggering Handlers", () => {

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

    it("a field update with the same value does not trigger a listener", (done) => {
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
                "set bar foo"
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

})

describe("Operands", () => {
    it ("'then'", (done) => {
        state = makeState({
            data: {
                foo: false,
                bar: false
            },
            rules: [
                "if foo is true then set bar true"
            ]
         })
        state.on("bar", (data) => {
            assert(data.bar === true)
            done()
        })
        state.update({foo: true})
    })

    it ("'set'", (done) => {
        state = makeState({
            data: {
                foo: false,
                bar: false,
                baz: false
            },
            rules: [
                "if baz is true then set bar true and set foo true"
            ]
         })
        state.on("baz", (data) => {
            assert(data.foo === true)
            assert(data.bar === true)
            done()
        })
        state.update({baz: true})
    })

    it ("'or'", (done) => {
        state = makeState({
            data: {
                foo: false,
                bar: false,
                baz: false
            },
            rules: [
                "if foo is true or bar is true then set baz true"
            ]
         })
        state.on("foo", (data) => {
            assert(data.baz === true)
        })
        state.update({foo: true})

        state.on("foo", (data) => {
            assert(data.baz === true)
            done()
        })
        state.update({foo: false, bar: true, baz: false})
    })

    it ("'or'", (done) => {
        state = makeState({
            data: {
                foo: false,
                bar: false,
                baz: false
            },
            rules: [
                "if foo is true and bar is true then set baz true"
            ]
         })
        state.on("foo", (data) => {
            assert(data.baz === true)
            done()
        })
        state.update({foo: true, bar: true})
    })

    it ("'was'", (done) => {
        state = makeState({
            data: {
                foo: false,
                bar: false,
            },
            rules: [
                "if foo was false then set bar true"
            ]
         })
        state.on("foo", (data) => {
            assert(data.bar === true)
            done()
        })
        state.update({foo: true})
    })

    it ("'was not'", (done) => {
        state = makeState({
            data: {
                foo: false,
                bar: false,
            },
            rules: [
                "if foo was not true then set bar true"
            ]
         })
        state.on("foo", (data) => {
            assert(data.bar === true)
            done()
        })
        state.update({foo: true})
    })

    it ("'is'", (done) => {
        state = makeState({
            data: {
                foo: false,
                bar: false,
            },
            rules: [
                "if foo is true then set bar true"
            ]
         })
        state.on("foo", (data) => {
            assert(data.bar === true)
            done()
        })
        state.update({foo: true})
    })

    it ("'is not'", (done) => {
        state = makeState({
            data: {
                foo: false,
                bar: false,
            },
            rules: [
                "if foo is not false then set bar true"
            ]
         })
        state.on("foo", (data) => {
            assert(data.bar === true)
            done()
        })
        state.update({foo: true})
    })

    it ("'is now' positive case", (done) => {
        state = makeState({
            data: {
                foo: false,
                bar: false,
            },
            rules: [
                "if foo is now true then set bar true"
            ]
         })
        state.on("foo", (data) => {
            assert(data.bar === true)
            done()
        })
        state.update({foo: true})
    })

    it ("'is now' negative case", (done) => {
        state = makeState({
            data: {
                foo: true,
                bar: false,
            },
            rules: [
                "if foo is now true then set bar true"
            ]
         })
        state.on("bar", (data) => {
            assert(false)
            done()
        })
        state.update({foo: true})
        assert(true)
        done()
    })

    it ("'has changed' positive case", (done) => {
        state = makeState({
            data: {
                foo: true,
                bar: false,
            },
            rules: [
                "if foo has changed then set bar true"
            ]
         })
        state.on("bar", (data) => {
            assert(data.bar === true)
            done()
        })
        state.update({foo: false})
        assert(false)
        done()
    })

    it ("'has changed' negative case", (done) => {
        state = makeState({
            data: {
                foo: true,
                bar: false,
            },
            rules: [
                "if foo has changed then set bar true"
            ]
         })
        state.on("bar", (data) => {
            assert(false)
            done()
        })
        state.update({foo: true})
        assert(true)
        done()
    })

    it ("'has not changed' positive case", (done) => {
        state = makeState({
            data: {
                foo: true,
                bar: false,
            },
            rules: [
                "if foo has not changed then set bar true"
            ]
         })
        state.on("bar", (data) => {
            assert(data.bar === true)
            done()
        })
        state.update({foo: true})
        assert(false)
        done()
    })

    it ("'has not changed' negative case", (done) => {
        state = makeState({
            data: {
                foo: true,
                bar: false,
            },
            rules: [
                "if foo has not changed then set bar true"
            ]
         })
        state.on("bar", (data) => {
            assert(false)
            done()
        })
        state.update({foo: false})
        assert(true)
        done()
    })

    it ("'greater than' positive case", (done) => {
        state = makeState({
            data: {
                x: 0,
                y: 0,
                z: 0
            },
            rules: [
                "if x greater than y then set z 1"
            ]
         })
        state.on("z", (data) => {
            assert(data.z === 1)
            done()
        })
        state.update({x: 1})
        assert(false)
        done()
    })

    it ("'greater than' negative case", (done) => {
        state = makeState({
            data: {
                x: 0,
                y: 0,
                z: 0
            },
            rules: [
                "if x greater than y then set z 1"
            ]
         })
        state.on("z", (data) => {
            assert(false)
            done()
        })
        state.update({x: 0})
        assert(true)
        done()
    })

    it ("'less than' positive case", (done) => {
        state = makeState({
            data: {
                x: 0,
                y: 0,
                z: 0
            },
            rules: [
                "if x less than y then set z 1"
            ]
         })
        state.on("z", (data) => {
            assert(data.z === 1)
            done()
        })
        state.update({x: -1})
        assert(false)
        done()
    })

    it ("'less than' negative case", (done) => {
        state = makeState({
            data: {
                x: 0,
                y: 0,
                z: 0
            },
            rules: [
                "if x less than y then set z 1"
            ]
         })
        state.on("z", (data) => {
            assert(false)
            done()
        })
        state.update({x: 1})
        assert(true)
        done()
    })

    it("'inc'", (done) => {
        state = makeState({
            data: {
                x: 0,
                y: 1,
                z: 0
            },
            rules: [
                "if x is y then inc z and inc y"
            ]
         })
        state.on("z", (data) => {
            assert(data.z === 1)
            assert(data.y === 2)
            done()
        })
        state.update({x: 1})
        assert(false)
        done()
    })
})

describe("Data", () => {
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

    it("data can be changed/accessed directly with set/get", () => {
        state = makeState({
            data: {
                foo: true
            }
        })
        state.set("foo", false)
        assert(state.get("foo") === false)
    })
})

describe("Grammar", () => {
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
                "if fooIsTrue then set bar true"
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

     it("top operand types (then) must be on the same level", () => {
        function complicatedTree(){
            state = makeState({
                data: {
                    x: 0,
                    y: 1,
                    z: 0
                },
                rules: [
                    "if x is 1 then set x 2 and if z is 1 then set y 2"
                ]
            })
        }
        assert.throws(complicatedTree, Error)
    })
})

describe("History", () => {
    it("history can be dumped", () => {
        state = makeState({
            data: {
                foo: false,
            }
        })
        state.update({foo: true})
        let history = state.getHistory()
        assert(history.length === 2)
        assert(history.pop().foo === true)
        assert(history.pop().foo === false)
    })

    it("state can be a flyweight (no own data) when history is set", (done) => {
        state = makeState({
            data: {
                foo: false,
            }
        })
        state.update({foo: true})
        let newHistory = [ { foo: true }, { foo: false } ]  
        state.setHistory(newHistory)
        state.on("foo", (data) => {
            assert(data.foo === true)
            done()
        })
        state.update({foo: true})
        assert(false)
        done()
    })
})