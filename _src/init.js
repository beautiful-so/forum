module.exports = {
    sesstionInit : function() {
        var script = document.createElement("script");
        script.src = "//www.gstatic.com/firebasejs/live/3.0/firebase.js";
        script.onload = function() {
            var config = {
                apiKey: "AIzaSyBi0JE_HRNznjb_43Bcv5xoBHuZEaCT07M",
                authDomain: "fora.firebaseapp.com"
            };
            firebase.initializeApp(config);
            firebase.auth().onAuthStateChanged(function(user) {
                if (user) {
                    var key = window.localStorage.key(0);
                    window.localStorage.api = user.Xc;
                    window.localStorage.name = user.displayName;
                    window.localStorage.email = user.email;
                    window.localStorage.profile = user.photoURL;
                    forum.auth = user.Xc;
                    el = document.querySelectorAll(".signin");
                    for(var i = 0, len = el.length; i < len; i++){
                        el[i].remove();
                    }
                }else{
                    document.querySelectorAll(".signout").remove();
                }
            });
        };
        this.jsonpElement.appendChild(script);
    },
    scrollInit : function(bool) {
        bool ? window.onscroll = function() {window.forum.scrollFn()} : window.onscroll = null;
    },
    routeInit : function() {
        var parameters = window.location.pathname,
            parameters = parameters ? this.locationFn(parameters) : "";

        if(parameters.id){
            this.threadPath(parameters);
            return;
        }else if(parameters.tag){
            this.threadsPath(parameters);
            return;
        }else{
            this.homePath(parameters);
        }
    },
    homeInit : function() {
        document.body.removeAttribute("class");
        document.title = "forum.red";
        this.threadElement.innerHTML = "";
        this.threadsElement.innerHTML = "";
        this.tagElement.textContent = "";
    },
    threadInit : function(tag) {
        var v = tag.replace("_", " ");
        v = decodeURIComponent(v);
        document.title = v;
        this.tagElement.textContent = v;
        document.body.className = "thread";
        this.threadElement.innerHTML = "";
        this.scrollInit(0);
    },
    threadsInit : function(tag) {
        tag = tag.replace("_", " ");
        this.shortcutElement.innerHTML = "";
        this.threadElement.innerHTML = "";
        document.title = tag;
        this.tagElement.textContent = tag;
        document.body.className = "threads";
    },
    langInit : function(json) {this.lang = json},
};