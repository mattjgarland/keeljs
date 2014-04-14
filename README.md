Keel is a declarative state-management tool for functional-style apps.

First create a state: 

    //default syntax tree is included
    var S = new State(SyntaxTree);

Add properties to a state:

    S.set("authenticated", false);
    S.set("page", null);

Add listeners to state changes:

    S.on("page", showPage);
    function showPage(page){
        //show page
    }

Update your state to trigger listeners: 

    //showPage will be called
    S.update({page: 'login'})
    //this could be the entry point for you app!

At this early point, you might think that S is like the M in MVC and Keel facilitates this familiar control flow:

1. View triggers logic that updates model, then...
2. Model triggers logic that...
3. Updates view. 

And you would be right! But there is more to it. Keel uses a flexible declarative syntax--"booleanese sugar"--to specify trigger conditions. This:

    S.on("authenticated", handleLogin);

Is really this:

    S.on("authenticated has changed", handleLogin, ["authenticated']);
    //the third parameter will pass the specified state properties into the handleLogin

Which is really this:

    S.on("authenticated was true and authenticated is false", handleLogin, ["authenticated']);
    S.on("authenticated was false and authenticated is true", handleLogin, ["authenticated']);

Does handleLogin need to know where authentication was done?

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

    S.on("clear and page is editor", saveNag);

With Keel's declarative syntax you can clearly express what your state is and when it should trigger logic. 

You can also use rules to make sure your state stays coherent:

    S.rule("if logout then page equals login");
    S.rule("if authenticated is now true then page equals home");
    S.rule("if page is loading then instruction_key equals wait");
    //control logic can go inside state!
    //your state is always valid and upright
    //like a KEEL in a boat

First I'll tackle HOW this is done, then WHY.

HOW: Any time any property is updated, every single rule of state is applied. The process starts with an update like this: 

    S.update("authenticated", false);

After the property is updated, state applies this rule to itself:

    S.rule("if authenticated is now false then page equals login");

And because it has this listener...

    S.on("page", showPage);

...state invokes showPage and the user goes to the login page. 

This process is at the heart of Keel:

1. Update state.
2. Run update rules to make sure state is coherent.
3. Invoke listeners for particular states. 

WHY? Why formalize state like this--pulling all your state properties into one place, updating all of them every time one is updated, doing declarative control flow within state and subscribing to different state permutations?

Because state can be slippery as hell and time-consuming to debug, and Keel makes state easier to see and manipulate. 

Also, because formalized state is aces for functional programming. Keel is not written in a functional way, but it facilitates functional flow. Once you encapsulate state, you can pipe from View to the Model, and back again, without getting hung up on state conditionals or weirded out by incoherent state.


TODO Syntax

TODO Example app with explanations.





































Keel allows you to declaratively subscribe to state. "has changed" is declarative sugar. You could also subscribe using this more typical 'boolean-ese' syntax:

S.on("authenticated is true", showAccountButton);

When you update one property of state, you can can ensure that other properties of state are updated accordingly, with rules like this:

S.rule("if authenticated has changed and authenticated is true then page is home");

When authentication is updated like this:

S.update({authentication: true});

The rule makes sure the page property is updated, too:

S.rule("if authenticated has changed and authenticated is true then page is home");

So since you have subscribed to home:

S.on("page has changed", showPage, ["page']);

The home page will now show. 

Another rule might be: 

S.rule("if authenticated is false then page is login");

So all you need to do to kick the user back to the login page is:

S.update({authentication: false});

What are we doing here? We are treating state like a coherent whole with its own logic. For every update, Keel goes through this process:

1. Update state.
2. Run update rules to make sure state is coherent.
2. Invoke listeners for particular states. 

The same declarative syntax can be used for rules:

S.rule("if email valid and pwd valid");

And for listener conditions:

S.on("credentials not null and authentication is false", getUser)


