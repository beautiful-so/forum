module.exports = {
    youtubeOembed : function(id) {
        document.getElementById("media"+id).innerHTML += `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1" frameborder="0"></iframe>`;
    },
    defaultOembed : function(id, url) {
        var el = document.getElementById("media"+id);
        if(url.indexOf("gist.github.com") >= 0){
            this.gistCallback.id = id;
            this.jsonpFn(`https://${url}.json?callback=this.gistCallback`);
        }else if(url.indexOf("jsfiddle.net") >= 0){
            el.innerHTML += "<script src='https://" + url + "embed/'></scr"+"ipt>";
            this.jsonpFn(`https://${url}embed/`);
        }else{
            var url = url.indexOf("youtube") >= 0 || url.indexOf("vimeo") >= 0  ? `${url}?autoplay=1` : url;
            el.innerHTML += `<iframe src="${url}"></iframe>`;
        }
    },
};