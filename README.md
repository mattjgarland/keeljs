
Where do you keep your state? Typically state does not get as much love as models. It's kept in closures, variables and objects, and updated willy nilly. And that's a shame, because state is slippery, and ugly state-specific code can end up polluting essential application logic.

Keel is declarative state management tool for javascript apps. Keel gathers application state into one, encapsulated object that takes responsibility for updating itself with clear, natural-language rules.

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

That's the entirety of the Keel process. It's simple and clear--and it remains so, even as your app scales in complexity. 

```js
const s = makeState({
    data: {
        page: null,
        authenticated: false,
        instruction: null,
        emailInput: null,
        emailValid: false,
        passwordInput: null,
        passwordValid: false,
        submitEnabled:false,
        alert: null
    },
    rules: [
        "if page was null and page is login then set instruction signIn",
        "if emailValid is true and passwordValid is true then set submitEnabled true",
        "if emailValid is false or passwordValid is false then set submitEnabled false and set alert mistake",
        "if page is loading then set instruction wait",
        "if authenticated is now true then set page home",
        "if page is now home then set instruction enjoy"
    ]
})

s.on("page", showPage)
s.on("instruction", showInstruction)
s.on("submitEnabled", showSubmit)
s.on("input", validateLogin);
s.on("alert", showAlert);

s.update({page: "login"})

//
```





__Basics__

First create a state: 
```javascript
//default syntax tree is included
var S = new State(SyntaxTree);
```
Add properties to a state:
```javascript
S.set("authenticated", false);
S.set("page", null);
```
Add listeners to state changes:
```javascript
S.on("page", showPage);
function showPage(page){
    //implementation
}
```
Update your state to trigger listeners: 
```javascript
S.update({page: 'login'})
//showPage will be called
//this could be the entry point for you app!
```
At this early point, you might think that S is like the M in MVC and that Keel facilitates this familiar control flow:

1. View triggers logic that updates model, then...
2. Model triggers logic that...
3. Updates view. 

And you would be right! But there's more to it. Keel uses a flexible declarative syntax ("booleanese sugar") to specify trigger conditions. This:
```javascript
S.on("authenticated", handleLogin);
```
Is really this:
```javascript
S.on("authenticated has changed", handleLogin, ["authenticated"]);
//the third parameter will pass the specified state properties into the handleLogin
```
Which is really this:
```javascript
S.on("authenticated was true and authenticated is false", handleLogin, ["authenticated"]);
S.on("authenticated was false and authenticated is true", handleLogin, ["authenticated"]);
```
Does _handleLogin_ need to know where authentication was done?
```javascript
S.on("authenticated", handleLogin, ["authenticated", "page"]);
//now handleLogin will get an object with authenticated and page properties
```
You can create tokens for repeated expressions:
```javascript
S.exp("rejected", "page was loading and page is login");
S.exp("logout", "authenticated is now false");
```
And use them like this:
```javascript
S.on("logout", clearFields);
```
You can compound your expressions, too:
```javascript
S.exp("clear", "rejected or logout");
S.on("clear", clearFields);
```
And mix them with regular state expressions:
```javascript
S.on("logout and page is editor", saveNag);
```
With Keel's declarative syntax you can clearly express what your state is and when it should trigger logic. 

You can also use rules to ensure your state remains coherent:
```javascript
S.rule("if logout then page equals login");
S.rule("if authenticated is now true then page equals home");
S.rule("if page is loading then instruction_key equals wait");
//control logic can go inside state!
//your state is always valid and upright...
//like a KEEL in a boat
```
First how is this done, then why.

HOW. Any time any property is updated, every single rule of state is applied. The process starts with an update like this: 
```javascript
S.update("authenticated", false);
```
After the property is updated, state applies this rule:
```javascript
S.rule("if authenticated is now false then page equals login");
```
And because it has this listener...
```javascript
S.on("page", showPage);
```
...state invokes showPage. 

This process is at the heart of Keel:

1. Update state.
2. Run update rules to make sure state is coherent.
3. Invoke listeners for particular state permutations. 

WHY. Why formalize state like this--pulling all your state into one place, updating all your properties every time one is updated, doing declarative control flow within state and subscribing to various states?

Because state can be slippery as hell and time-consuming to debug, and Keel makes state easier to understand and manipulate. 

More, Keel facilitates functional flow. Once you encapsulate state, you can pipe from the view to the model and back again without getting hung up on state conditionals.

__Example App__

There is an example app in the repo (example.html/main.js): 
```javascript
    var S = new State(SyntaxTree);
    //create and init state properties
    S.set("page", null);
    S.set("authenticated", false);
    S.set("instruction_key", null);
    S.set("email_input", null);
    S.set("email_valid", false);
    S.set("password_input", null);
    S.set("password_valid", false);
    S.set("submit_enabled", null);
    S.set("alert", null);
    //state transform rules
    S.rule("if page was null and page is login then instruction_key equals sign_in");
    S.rule("if email_valid is true and password_valid is true then submit_enabled equals true");
    S.rule("if email_valid is false or password_valid is false then submit_enabled equals false");
    S.rule("if page is loading then instruction_key equals wait");
    S.rule("if authenticated is now true then page equals home");
    S.rule("if page is now home then instruction_key equals enjoy");
    //create expressions for repeated use in rules or state listeners
    S.exp("rejected", "page was loading and page is login");
    S.exp("logout", "authenticated is now false");
    S.exp("clear_session", "logout or rejected");
    S.exp("input", "email_input has changed or password_input has changed")
    //rules using created expressions
    S.rule("if rejected then alert equals try_again");
    S.rule("if clear_session then page equals login");
    S.rule("if clear_session then password_input equals null");
    S.rule("if clear_session then email_input equals null");
    //listen to state
    S.on("page", showPage);
    S.on("instruction_key", showInstruction);
    S.on("submit_enabled", showSubmit);
    S.on("input", validateLogin, ["email_input", "password_input"]);
    S.on("alert", showAlert);
    S.on("clear_session", clearInputFields);
    //listen to view
    $("input").keyup(captureInputs);
    $("#good_login").click(goodLogin);
    $("#bad_login").click(badLogin);
    $("#logout").click(logout);
    //entry point
    S.update({page:"login"});

    //ALL THE HANDLER CODE IS IN main.js
```
__Syntax__

The operands:

    then, plus, set, or, and, was, was not, is, is not, is now, has changed, greater than, less than

These are self-explanatory except for:

   + _equals_ sets a property to value while _is_ checks for equality.
   + _is now_ checks for a value change in addition to equality.
   + _then_ creates an if-then expression, so the _if_ is actually optional.
   + _and_ is the boolean _and_, while _plus_ means do this _plus_ this.

The terminal nodes are always triplets:

    x is y 
    x and y
    x equals y

Triplets can be formed of other triplets:

    x is y then x equals z

There is no end of recursion:

    x is y then x equals z greater than p

As long as you can draw a binary tree of your statement, it should work. 
































