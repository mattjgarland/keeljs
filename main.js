require(["lib/keel", "lib/syntaxTree"], function(State, SyntaxTree) {

    var S = new State(SyntaxTree);
    S.set("page", null);
    S.set("authenticated", false)
    S.exp("loginpage", "page has changed");
    S.exp("ready", "authenticated is true");
    S.on("loginpage", showPage, ["page"]);
    S.update({page: "login", authenticated: true});

    function showPage(data){
        console.log("show page", data);
    }

});