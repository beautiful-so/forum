module.exports = {
    gameCallback : function(json) {
        var body = "",
            entry = json.feed.entry,
            category = json.feed.title.$t;

        if(typeof entry != "undefined"){
            var games = document.getElementById("games");
            for (var i = 0;  i <= entry.length; i++) {
                if(typeof entry[i] != "undefined"){
                    var game = entry[i].content.$t,
                    game = game.split(","),
                    league = eval("{"+entry[i].title.$t+"}"),
                    home = eval("{"+game[0]+"}"),
                    home_score = eval("{"+game[1]+"}"),
                    home_country = eval("{"+game[2]+"}"),
                    away = eval("{"+game[3]+"}"),
                    away_score = eval("{"+game[4]+"}"),
                    away_country = eval("{"+game[5]+"}"),
                    date = eval("{"+game[6]+"}"),
                    youtube = eval("{"+game[7]+"}"),
                    win = away_score < home_score ? "home" : "away",
                    img = typeof youtube != "undefined" ? `style="background-image:url(https://i.ytimg.com/vi/${youtube}/hqdefault.jpg)"` : "";

                    body += forum.gameTpl(category, game, league, home, home_score, home_country, away, away_score, away_country, date, youtube, win, img);
                }
            }
            var el = document.getElementsByName("game")[0];
            if(el && this.currentScrollFn() == 0){						
                el.outerHTML = body + el.outerHTML;
            }else{
                games.innerHTML += body;
            }
            this.scrollInit(1);
            this.loadingFn(0);
        }
    },
    newsCallback : function(json) {
        var body = "";
        if(json.query.recentchanges.length){
            var list = json.query.recentchanges;
            for(var i = 0; i < 5; i++){
                var pageid = list[i].pageid,
                    title = list[i].title;
                if(body.indexOf(title) < 0){
                    body += forum.newsTpl(pageid, title);
                }
            }
            this.newsElement.innerHTML = `<ul class="news">${body}</ul>`;
        }
    },
    infoboxCallback : function(json) {
        var dl ="",
            keywords = "",
            uri = "",
            images = "",
            infobox_image = "",
            json = json["results"]["bindings"],
            property = "dbpedia.org/property/";

        for(var i in json){
            if(json.hasOwnProperty(i)){
                var key = json[i].k.value.replace("http://ko.dbpedia.org/property/",""),
                value = json[i].o.value.replace("http://ko.dbpedia.org/resource/","");
                value = value.replace(/_/gi, " ");
                if(json[i].k.value.indexOf("http://dbpedia.org/ontology/wikiPageWikiLink") >= 0)
                    if(value.indexOf(".svg") >= 0 || value.indexOf(".jpg") >= 0 || value.indexOf(".JPG") >= 0 || value.indexOf(".png") >= 0 || value.indexOf(".PNG") >= 0 || value.indexOf(".SVG") >= 0){
                        images += forum.infobox_imageTpl(key, value.replace("파일:",""), i);
                    }else if(json[i].k.value.indexOf("wikiPageWikiLink") >= 0){
                        keywords += `<a href="/${value}">${value}</a>`;
                    }
                if(key == "url" || ((key == "주소" || key == "웹사이트") && json[i].o["type"] == "uri")){
                    uri = value;
                }
                if(json[i].k.value.indexOf(property) >= 0 && json[i].o["xml:lang"]){
                    if(dl.indexOf(`<dt>${key}</dt>`) >= 0){
                        dl += `<dt style="opacity:0">${key}</dt><dd>${value}</dd>`;
                    }else if(value == this.tagElement.textContent){
                            dl += `<dt>${key}</dt><dd><a target="_blank" id="domain_uri">${value}</a></dd>`;
                    }else if(value.indexOf(".svg") >= 0 || value.indexOf(".jpg") >= 0 || value.indexOf(".JPG") >= 0 || value.indexOf(".png") >= 0 || value.indexOf(".PNG") >= 0 || value.indexOf(".SVG") >= 0){
                            infobox_image != "" ? infobox_image += forum.infobox_imageTpl(key, value, i) : infobox_image += forum.infobox_imageTpl(key, value, i, "checked");
                    }else{
                            dl += `<dt>${key}</dt><dd>${value}</dd>`;
                    }
                }
            }
        }
        keywords.length > 0 ? this.keywordsElement.innerHTML = `<div>${keywords}</div>` : "";
        dl.length > 0 ? this.infoboxElement.innerHTML = `<label for="more_images"><span>more</span></label><h2>${infobox_image}${images}</h2><dl>${dl}</dl>` : this.infoboxElement.innerHTML = "";
        uri.length > 0 ? document.getElementById("domain_uri").href = uri : "";
    },
    autocompleteCallback : function(json) {
        var body = "";
        var keyword = this.tagElement.textContent;
        if(json.length){
            for(var i = 0, len = json[1].length; i < len; i++){
                body += forum.autocompleteTpl(keyword, json, i);
            }
            this.shortcutElement.innerHTML = `<div class="autocomplete">${body}</div>`;
        }else{
            this.shortcutElement.innerHTML = "";
        }
    },
    firebaseCallback : function(json) {
        if(typeof json != "undefined"){
            var tpl = "",
                img = "",
                key = json.name,
                tag = this.tagElement.textContent,
                data = eval(`({'${key}' : ${this.firebaseCallback.data}})`);
            if(typeof data.img != "undefined")
                for(var g = 0, len2 = data.img.length-1; g <= len2; g++){
                    img += forum.thread_mediaTpl(json, key, g);
                }
            if(document.body.className == "thread"){
                var forms = this.threadElement.innerHTML,
                    radio = document.querySelector("[name='switch']:checked"),
                    id = radio.id.replace("switch", ""),
                    el = document.getElementById(id);
                radio.checked = false;
                tpl = forum.threadTpl(key, data[key], img);
                el ? el.outerHTML += tpl : this.threadElement.innerHTML = tpl;
            }else{
                var el = document.getElementsByName("threads")[0];
                tpl = forum.threadsTpl(data, key, tag, img);
                el ? el.outerHTML = tpl+el.outerHTML : this.threadsElement.innerHTML = tpl;
            }
            this.formElement.content.value = "";
            delete this.firebaseCallback.data;
        }
    },
    deleteCallback : function(json) {
        if(json === null){
            var keyword = this.tagElement.textContent,
                id = this.deleteCallback.id,
                form = document.getElementById(id),
                _switch = document.getElementById("switch" + id),
                media = document.querySelectorAll("." + id),
                contents = document.getElementById("content" + id);
                form ? form.remove() : "";
                contents ? contents.remove() : "";
                _switch ? _switch.remove() : "";

                if(media.length){
                    for(var i = 0, len = media.length; i < len; i++){
                        media[i].remove();
                    }
                }
                var len = this.threadElement.innerHTML.trim();
                len.length == 0 ? this.utilFn(keyword) : "";
            alert(this.lang.complete.delete);
            delete this.deleteCallback.id;
        }
    },
    threadsCallback : function(json) {
        if(json){
            var body = "",
                parameters = window.location.pathname,
                parameters = parameters ? this.locationFn(parameters) : "",
                tag = parameters.tag,
                keys = Object.keys(json).sort().reverse(),
                el = document.getElementsByName("threads")[0];

            for(var i = 0, len1 = keys.length; i < len1; i++){
                var key = keys[i],
                    img = "",
                    content = "";
                if(typeof json[key].img != "undefined")
                    for(var g = 0, len2 = json[key].img.length-1; g <= len2; g++){
                        img += forum.thread_mediaTpl(json, key, g);
                    }
                body += forum.threadsTpl(json, key, tag, img);
            }
            console.log(parameters);
            if(el && this.currentScrollFn() == 0){
                el.outerHTML = body+el.outerHTML;
            }else if(typeof parameters.user == "undefined"){
                this.threadsElement.innerHTML += body;
                this.scrollInit(1);
            }else{
                this.threadsElement.innerHTML = body;
            }
            this.loadingFn(0);
        }else{
            this.scrollInit(0);
            this.loadingFn(0);
            !document.getElementById("thread_none") ? this.threadsElement.innerHTML += `<div id="thread_none">${this.lang.status.none}</div>` : "";
        }
    },
    threadCallback : function(json) {
        var date, parameters = window.location.pathname,
            parameters = this.locationFn(parameters),
            id = parameters.id,
            tag = parameters.tag;
        if(typeof json.name != "undefined"){
            var key = "";
            if(typeof json.root == "undefined"){
                var map = json;
                json = {};
                json[id] = map;
                key = id;
            }else{
                key = json.root;
                this.jsonpFn(this.rootUrl(key));
            }
            this.jsonpFn(this.branchUrl(tag, key, date));
        }

        var keys = Object.keys(json).sort();
        for(var i = 0, len1 = keys.length; i < len1; i++){
            var key = keys[i],
                img = "",
                content = "";
            if(typeof json[key].img != "undefined"){
                for(var g = 0, len2 = json[key].img.length-1; g <= len2; g++){
                    img += forum.thread_mediaTpl(json, key, g);
                }
            }
            if(typeof json[key].parent != "undefined"){
                document.getElementById(json[key].parent).outerHTML += forum.threadTpl(key, json[key], img);
            }else{
                this.threadElement.innerHTML += forum.threadTpl(key, json[key], img);			
            }
        }
    },
    oembedCallback : function(json) {
        this.jsonpElement.innerHTML += json.html;
        var radio = document.querySelector("[name='switch']:checked"),
            iframe = this.jsonpElement.getElementsByTagName("iframe");
        radio.dataset.url += iframe[0].src+",";
        radio.dataset.img += json.thumbnail_url+",";
        iframe[0].remove();	
    },
    gistCallback : function(json) {
        var self = this.gistCallback,
            el = document.getElementById("media"+self.id);
        el.innerHTML += `<link rel="stylesheet" href="${json.stylesheet}">${json.div}`;
        delete self["id"];
    },
};