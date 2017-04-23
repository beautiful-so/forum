module.exports = {
    postRest : function(content, path, id) {
        if(!this.auth){
            alert(this.lang.validation.login);
        }else if(!content.length){
            alert(this.lang.validation.content);
        }else{
            content = content.replace(/</gi,"&lt;");
            content = content.replace(/>/gi, "&gt;");
            var root = document.getElementsByName("thread"),
                el = document.querySelector("[name='switch']:checked"),
                data = {
                    content : content,
                    date : new Date().getTime(),
                    profile : window.localStorage.profile,
                    email : window.localStorage.email,
                    name : window.localStorage.name,
                    lang : this.lang,
                    url : [],
                    img : []
                },
                type = "";

            if(el.dataset.mode == "post"){
                type = "POST";
                data.parent = id;
                root.length > 0 ? data.root = root[0].id : "";
            }else{
                type = "PUT";
                path = path+"/"+el.id.replace("switch", "");
            }
            path = this.restUrl + path + ".json?auth=" + this.auth;
            var url = el.dataset.url.slice(0,-1).split(","),
                img = el.dataset.img.slice(0,-1).split(","),
                request = el.dataset.request.slice(0,-1).split(",");
            for(var i = 0, len = request.length; i < len; i++){
                data.content = data.content.replace(request[i], "");
            }
            url[0] != "" ? data.url = url : "";
            img[0] != "" ? data.img = img : "";
            data = JSON.stringify(data);
            this.firebaseCallback.data = data;
            this.ajaxFn(path, type, data, "firebaseCallback");
        }
    },
    deleteRest : function(tag, id) {
        var bool = confirm(this.lang.validation.delete);
        this.deleteCallback.id = id;
        bool ? this.ajaxFn(`"${this.restUrl}${tag}/${id}.json?auth=${this.auth}"`, "DELETE", "", "deleteCallback") : "";
    },
};