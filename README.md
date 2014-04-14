Keel is a declarative state-management tool for javascript apps.

__Basics__

First create a state: 

    //default syntax tree is included
    var S = new State(SyntaxTree);

Add properties to a state:

    S.set("authenticated", false);
    S.set("page", null);

Add listeners to state changes:

    S.on("page", showPage);
    function showPage(page){
        //implementation
    }

Update your state to trigger listeners: 

    S.update({page: 'login'})
    //showPage will be called
    //this could be the entry point for you app!

At this early point, you might think that S is like the M in MVC and that Keel facilitates this familiar control flow:

1. View triggers logic that updates model, then...
2. Model triggers logic that...
3. Updates view. 

And you would be right! But there's more to it. Keel uses a flexible declarative syntax ("booleanese sugar") to specify trigger conditions. This:

    S.on("authenticated", handleLogin);

Is really this:

    S.on("authenticated has changed", handleLogin, ["authenticated']);
    //the third parameter will pass the specified state properties into the handleLogin

Which is really this:

    S.on("authenticated was true and authenticated is false", handleLogin, ["authenticated']);
    S.on("authenticated was false and authenticated is true", handleLogin, ["authenticated']);

Does _handleLogin_ need to know where authentication was done?

    S.on("authenticated", handleLogin, ["authenticated", "page"]);
    //now handleLogin will get an object with authenticated and page properties

You can create tokens for repeated expressions:

    S.exp("rejected", "page was loading and page is login");
    S.exp("logout", "authenticated is now false");

And use them like this:

    S.on("logout", clearFields);

You can compound your expressions, too:

    S.exp("clear", "rejected or logout");
    S.on("clear", clearFields);

And mix them with regular state expressions:

    S.on("logout and page is editor", saveNag);

With Keel's declarative syntax you can clearly express what your state is and when it should trigger logic. 

You can also use rules to ensure your state remains coherent:

    S.rule("if logout then page equals login");
    S.rule("if authenticated is now true then page equals home");
    S.rule("if page is loading then instruction_key equals wait");
    //control logic can go inside state!
    //your state is always valid and upright...
    //like a KEEL in a boat

First how is this done, then why.

HOW. Any time any property is updated, every single rule of state is applied. The process starts with an update like this: 

    S.update("authenticated", false);

After the property is updated, state applies this rule:

    S.rule("if authenticated is now false then page equals login");

And because it has this listener...

    S.on("page", showPage);

...state invokes showPage. 

This process is at the heart of Keel:

1. Update state.
2. Run update rules to make sure state is coherent.
3. Invoke listeners for particular state permutations. 

WHY. Why formalize state like this--pulling all your state into one place, updating all your properties every time one is updated, doing declarative control flow within state and subscribing to various states?

Because state can be slippery as hell and time-consuming to debug, and Keel makes state easier to understand and manipulate. 

More, Keel facilitates functional flow. Once you encapsulate state, you can pipe from the view to the model and back again without getting hung up on state conditionals.

__EXAMPLE App__

There is an example app in the repo (example.html/main.js): 

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

__Syntax__

The operands:

    then, plus, equals, or, and, was, was not, is, is not, is now, has changed, greater than, less than

These are self-explanatory except for:

   + _equals_ sets a property to value while _is_ checks for equality.
   + _is now_ checks for a value change in addition to equality.
   + _then_ creates an if-then expression, so the _if_ is actually optional.
   + _and is the boolean _and_, while _plus_ means do this _plus_ this.

The terminal nodes are always triplets:

    x is y 
    x and y
    x equals y

Triplets can be formed of other triplets:

    x is y then x equals z

There is no end of recursion:

    x is y then x equals a greater than b

As long as you can draw a binary tree of your statement, it should work. 
































