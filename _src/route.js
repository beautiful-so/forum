module.exports = {
    homePath : function(parameters) {
        !this.newsElement.innerHTML.length ? this.scrollInit(0) : "";
        this.homeInit();
        if(typeof window.onscroll == "function"){
            var date = document.querySelector(`[value='${parameters.date}']`);
            if(typeof parameters.date != "undefined" && !date)
                this.gamesFn(parameters)
        }else{
            this.scrollInit(1);
            this.jsonpFn(this.newsUrl());
            this.gamesFn(parameters);
        }
    },
    threadPath : function(parameters) {
        this.threadInit(parameters.tag);
        this.jsonpFn(this.threadUrl(parameters.tag, parameters.id));
    },
    threadsPath : function(parameters) {
        var tag = parameters.tag,
            tag = decodeURIComponent(tag),
            parametersUser = typeof parameters.user != "undefined",
            parametersDate = typeof parameters.date == "undefined",
            el = this.threadsElement,
            threadsLen = el.innerHTML.length;
        if(document.title != tag || this.infoboxElement.innerHTML.length == 0 || (document.body.className.indexOf("user") > 0 && !parametersUser)){
            this.jsonpFn(this.infoboxUrl(tag));
            el.innerHTML = "";
        }
        this.threadsInit(tag);
        !threadsLen || parametersUser ? this.scrollInit(0) : "";

        if(typeof window.onscroll == "function"){
            this.getThreadsFn(tag, parameters);
        }else if(!threadsLen && !this.threadElement.innerHTML.length){
            if(parametersUser){
                document.body.className += " user";
                this.jsonpFn(this.threadsUrl(tag, null, parameters.user));
                return;
            }else if(parametersDate){
                el.innerHTML.length == 0 ? this.jsonpFn(this.threadsUrl(tag)) : this.getThreadsFn(tag, parameters);
                return;
            }else{
                this.getThreadsFn(tag, parameters);
            }
        }
    },
};