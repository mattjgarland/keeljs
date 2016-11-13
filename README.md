## Keel

Where do you keep your state? Typically state does not get the love that models do. State and state logic are often scattered in bindings, variables and objects. And that's a shame, because state can be slippery as hell, and ugly state-specific code can pollute core application logic.

Keel is declarative state management tool for javascript apps. It gathers application state into an encapsulated object that updates itself with clear, sentence-like rules.

```js
keel = require("keel")
makeState = keel.makeState

let s = makeState({
    data: {
        foo: false,
        bar: false
    },
    rules: [
        "if foo is true then bar is true"
    ]
})

s.on("bar", (data) => {
    console.log("New bar is", data.bar)
})

s.update({foo: true})
```

In this short example:

- State fields are defined and inited with configuration `{foo: false, bar: false}`.
- State is updated with new values `{foo: true}`.
- The rule `if foo is true then bar is true` is applied and `bar` is updated to `true`.
- Because a listener has been added for `bar` changes, it is invoked and passed state `data`.

That's the entirety of the Keel process. It's simple--and remains so, even as your app grows more complex. 

```js
const s = makeState({
    data: {
        page: null,
        authenticated: false,
        instruction: null,
        emailValid: false,
        passwordValid: false,
        submitEnabled:false,
        modal: null
    },
    rules: [
        "if page is null and authenticated is true then set page home",
        "if page is not null and page is not login and authenticated is now false then set page login and set instructions goodbye",
        "if page is null and authenticated is false then set page login and set instructons signIn",
        "if emailValid is false then set submitEnabled false and set modal emailMistake",
        "if emailValid is true and passwordValid is false then set submitEnabled false and set modal passwordMistake",
        "if emailValid is true and passwordValid is true then set submitEnabled true",
        "if page is loading then set instruction wait",
        "if authenticated is now true then set page home and set instructions hello"
    ]
})

s.on("page", showPage)
s.on("instruction", showInstruction)
s.on("submitEnabled", showSubmit)
s.on("modal", showModal);

s.update({authenticated: getAuthenticated()})
```

The benefits of Keel are twofold:

- State is gathered into one place and updated according to clear rules, all at once. 
- Non-state code no longer worries about state. Imagine how straightforward functions like _showPage, showInstructionq, showSubmit_ and _showModal_ can be now. 


## Expressions 

When you create a state, you can specify expressions as well as fields and rules. Expressions make rules more expressive:

```js
const s = makeState({
    data: {...},
    expressions: {
        rejected: "page was loading and page is login",
        logout: "authenticated is now false"
    }
    rules: [...]
})
```

Now you can create rules with these expressions: 

```
if rejected then set instruction tryAgain
```
```
if logout then set instruction goodbye
```

Expressions can be used in other expressions: 

```
clearInputs: rejected or logout
```

Just as listeners can be bound to state fields, they can be bound to state expressions:

```
s.on("clearInputs", clearInputs)
```

Expression literals can also be bound:

```
s.on("authenticated is now false or page is now login", clearInputs)
```

A mix:

```
s.on("logout and page is editor", saveNag)
```

Just as with field triggers, expression triggers work only when the underlying values **change.**


## Grammar

Keel's Booleanese sugar rests on a rudimentary grammar. The verbs:

`then, or, and, set, inc, was, was not, is, is not, is now, is not now, has changed, has not changed, greater than, less than`

The sentences are triplets with the verb in the middle:

```
x is y
```
```
x was not 3
```
```
x is not now 3
```

Irregulars:

```
x has changed
```
```
set x y
```
```
inc x
```

Keel works on the simple sentence level and does not have clauses. It creates syntax trees by waiting to resolve the highest priority verbs last:

`then > or > and > set > inc > was > was not > is > is not > is now > is not now > has changed > has not changed > greater than > less than`

```
if x is 0 then set y 1
```

This is resolved into a syntax tree like this:

 ```
 {x -> is <- 0} -> then <- {y -> set <- 1}
 ```

A sentence with two high-level _thens_ could not be resolved into a single tree. If you need two _thens,_ make sure one exists in an expression, because verb expressions are weaker and resolved first. 

However, the point of Keel is to express your state logic in the simplest, clearest way possible. If your rules are bumping up against syntax, ask yourself if you need more rules rather than more complex syntax.


























