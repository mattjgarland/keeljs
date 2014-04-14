require(["lib/jquery", "lib/keel", "lib/syntaxTree"], function(jquery, State, SyntaxTree) {

    $(function(){
        //create state
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
        //listeners
        function showPage(page){
            var pages = ["login", "loading", "home"];
            pages.forEach(function(page){
                $("#"+page).hide();
            })
            $("#"+page).show();
            $("#title").html("<h2>" + page.toUpperCase() + "</h2>");
        };
        function showInstruction(key){
            var texts = {sign_in: "Please sign in.",
                    email_short: "EMAIL must be at least FIVE characters long",
                    password_short: "PASSWORD must be at least EIGHT characters long",
                    submit: "You're good.",
                    wait: "Please wait.",
                    enjoy: "Enjoy!"
            }
            $("#instruction").html("<p>" + texts[key] + "</p>");
        }
        function showSubmit(val){
            if (val){
                $("#buttons").show();
            } else {
                $("#buttons").hide();
            }
        }
        function captureInputs(e){
            var data = {};
            data[e.target.id + "_input"] = $("#" + e.target.id).val();
            S.update(data);
        }
        function validateLogin(inputs){
            var data = {};
            data.email_valid = inputs.email_input!=null && inputs.email_input.length>4;
            data.password_valid = inputs.password_input!=null && inputs.password_input.length>7;
            if (!inputs.email_input){
                data.instruction_key = "sign_in";
            } else if (data.email_valid == false){
                data.instruction_key = "email_short";
            } else if (data.password_valid == false){
                data.instruction_key = "password_short";
            } else {
                data.instruction_key = "submit";
            }
            S.update(data);
        }
        function goodLogin(){
            S.update({page: "loading"});
            setTimeout(function(){
                S.update({authenticated: true});
            }, 1000)
        }
        function badLogin(){
            S.update({page: "loading"});
            setTimeout(function(){
                S.update({page: "login"});
            }, 1000)
        }
        function showAlert(key){
            var texts = {"try_again": "Sorry, we don't recognize you. Try again."};
            if (key){
                alert(texts[key]);
                S.set("alert", null);
            }
        }
        function logout(){
            S.update({authenticated: false});
        }
        function clearInputFields(){
            $("input:text").val("");
        }
    })
});

//plus node....for adding thens....