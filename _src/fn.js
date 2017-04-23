module.exports = {
    placeCaretAtEnd : function(el) {
        if(this.placeCaretAtEnd.checked){
            el.focus();
            if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
                var range = document.createRange();
                range.selectNodeContents(el);
                range.collapse(false);
                var sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            } else if (typeof document.body.createTextRange != "undefined") {
                var textRange = document.body.createTextRange();
                textRange.moveToElementText(el);
                textRange.collapse(false);
                textRange.select();
            }
            delete this.placeCaretAtEnd.checked
        }			
    },
    locationFn : function(parameters) {
        var path = {},
            p = parameters.substr(1).split("/");

        for(var i = 0, len = p.length; i < len; i++){
            try {
                if((p[i].length == 8 || p[i].length == 13) && typeof eval(p[i]) === "number"){
                    path.date = p[i]*1;
                }else{
                    if(i == 0){
                        path.tag = p[i];
                    }else{
                        if(p[i].length == 8 && typeof eval(p[i]) === "number"){
                            path.date = p[1]*1;
                        }else if(p[i].match(this.regex.email)){
                            path.user = p[i];
                        }else{
                            path.id = p[i];
                        }
                    }
                }
            } catch (error) {
                console.log(error);
            }
        }
        return path;
    },
    prettyDateFn : function(date) {
        var d = [];
            d.push(date.substr(0, 4));
            d.push(date.substr(4, 2));
            d.push(date.substr(6, 6));
            d = d.toString().replace(/,/gi,"-");
            d = new Date(d).getTime() + (this.currentScrollFn() == 0 ? 86400000 : -1);
            d = new Date(d).toISOString().substr(0,10).replace(/-/gi,"");
        return d;
    },
    gamesFn : function(parameters) {
        var date = typeof parameters.date != "undefined" ? parameters.date : new Date(new Date().getTime() - 86400000).toISOString().substr(0,10).replace(/-/gi,"");
        this.jsonpFn(this.gameUrl(1, date));
        this.jsonpFn(this.gameUrl(2, date));
        this.jsonpFn(this.gameUrl(3, date));
    },
    pathFn : function(path, event) {
        typeof event != "undefined" ? event.preventDefault() : "";
        typeof path != "string" ? path = path.href : "";
        if(this.popstate){
            history.pushState("", "PushState - 1", path);
            this.routeInit();
        }else{
            bom.location.href = path;
        }
    },
    getThreadsFn : function(tag, parameters) {
        var date = document.getElementsByName("date"),
            el = document.getElementsByName("threads")[0];
            date = date.length ? date[date.length-1].value*1 : this.jsonpFn(this.threadsUrl(tag, parameters.date));
            if(el && this.currentScrollFn() == 0){
                this.jsonpFn(this.threadsUrl(tag, parameters.date, null, true));
            }else if(date == ((parameters.date*1)+1)){
                this.jsonpFn(this.threadsUrl(tag, parameters.date));
            }else if(!document.getElementById("thread_none")){
                this.scrollInit(1);
            }
    },
    notFoundFn : function(el, index) {
        var elm = document.getElementById(`${el.name}_${index}`);
            elm.parentNode.removeChild(elm);
        if(el.name == "infobox_image")
            document.getElementsByName(el.name)[0].checked = true;
    },
    clearFn : function() {
        this.jsonpElement.innerHTML = "";
    },
    jsonpFn : function(url) {
        var script = document.createElement("script");
        script.src = url;
        script.onload = "forum.clearFn()";
        this.jsonpElement.appendChild(script);
    },
    ajaxFn : function(url, method, data, type) {
        var xhr = bom.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
        xhr.onreadystatechange = function(e) {
            if (e.target.readyState == 4 && e.target.status == 200){
                var json = eval("("+e.target.responseText+")");
                if(typeof type == "function"){
                    type(json);
                }else{
                    forum[type](json);
                }
                return;
            }else{
                console.log(e);
            }
        };
        xhr.open(method, url, true);
        data ? xhr.send(data) : xhr.send();
    },
    oembedFn : function(el) {
        var url = typeof el.value != "undefined" ? el.value.match(this.regex.url) : el.textContent.match(this.regex.url);
        if(url){
            for(var i = 0, len = url.length; i < len; i++){
                var uri = url[i];
                uri.indexOf("http") > 0 ? "" : uri = `https://${uri}`;
                this.jsonpElement.innerHTML = `<a id="a" href="${uri}"></a>`;
                var a = document.getElementById("a");
                var radio = document.querySelector("[name='switch']:checked");
                if(radio.dataset.request.indexOf(a.href) < 0){
                    radio.dataset.request += a.href + ",";
                    if (a.hostname == "youtu.be") {
                        var id = a.pathname.replace("/", "");
                        radio.dataset.url += `https://www.youtube.com/embed/${id},`;
                        radio.dataset.img += `https://i.ytimg.com/vi/${id}/hqdefault.jpg,`;
                    }else if(a.hostname == "www.youtube.com" || a.hostname == "m.youtube.com"){
                        var id = a.search.replace("?v=", "");
                        radio.dataset.url += `https://www.youtube.com/embed/${id},`;
                        radio.dataset.img += `https://i.ytimg.com/vi/${id}/hqdefault.jpg,`;
                    }else if(a.hostname == "vimeo.com"){
                        this.ajaxFn(`https://vimeo.com/api/oembed.json?url=https://${url}"`, "GET", "", this.oembedCallback);
                    }else if(a.hostname == "soundcloud.com"){
                        this.ajaxFn(`https://soundcloud.com/oembed?url=${uri}&format=json`, "GET", "", this.oembedCallback);
                    }else if(a.hostname == "www.slideshare.net"){
                        this.jsonpFn("https://www.slideshare.net/api/oembed/2?url=" + url + "&format=json&callback=this.oembedCallback");
                    }else if(a.hostname == "gist.github.com"){
                        radio.dataset.url += url+",";
                        radio.dataset.img += "https://gist.github.com/fluidicon.png,";
                    }else if(a.hostname == "jsfiddle.net"){
                        radio.dataset.url += url+",";
                        radio.dataset.img += "http://doc.jsfiddle.net/_images/homepage-sm.png,";
                    }else{
                        radio.dataset.url += url + ",";
                    }
                }
                a.remove();
            }
        }else{
            var radio = document.querySelector("[name='switch']:checked");
            radio.dataset.url = "";
            radio.dataset.img = "";
            radio.dataset.request = "";
        }
    },
    autocompleteFn : function(keyword, len, area) {
        len > 0 || area ? this.jsonpFn(this.autocompleteUrl(keyword)) : "";
    },
    autocompleteFocusFn : function(keyword){
        this.tagElement.textContent = keyword;
        this.placeCaretAtEnd.checked = true;
    },
    searchFn : function() {
        var checked = document.querySelector("input[name='keyword']:checked"),
            check = checked ? checked.value : 0,
            v = this.tagElement.textContent;
        if(v.length > 0 || checked){
            if(v != document.title)
                check ? this.utilFn(check) : this.utilFn(v);
        }else{
            alert(this.lang.validation.keyword);
            this.tagElement.innerHTML = "";
            this.switchElement.checked = false;
        }
    },
    keywordFocusFn : function(e) {
        var area = !(document.getElementById("shortcut").textContent.length > 0),
            keywords = document.getElementsByName("keyword"),
            keyword = this.tagElement.textContent,
            len = keywords.length;
        switch(e.which){
            // case 0 :
            // 	this.searchFn();
            // 	break;
            case 8 :
                if(keyword.length > 0){
                    this.autocompleteFn(keyword, len, area);
                    this.placeCaretAtEnd(this.tagElement);
                }else{
                    this.shortcutElement.innerHTML = "";
                }
                break;
            case 9 :
                this.tagElement.removeAttribute("contenteditable");
                this.tagElement.setAttribute("contenteditable","true");
                break;
            case 13 :
                this.searchFn();
                break;
            case 27 :
                this.shortcutElement.innerHTML = "";
                break;
            case 38 :
                if(area){
                    this.autocompleteFn(keyword, len, area);
                }else{
                    var checked = keywords[len-1];
                        checked.checked = true;
                        checked.focus();
                }
                break;
            case 40 :
                area ? this.autocompleteFn(keyword, len, area) : "";
                if(len > 1){
                    var checked = keywords[1];
                        checked.checked = true;
                        checked.focus();
                }
                break;
            default :
                this.autocompleteFn(keyword, len, area);
                this.placeCaretAtEnd(this.tagElement);
                break;
        }
    },
    currentScrollFn : function(){
        return document.body.scrollTop || document.documentElement.scrollTop;
    },
    scrollFn : function(v) {
        var limit = document.body.scrollHeight - document.documentElement.clientHeight,
            current = this.currentScrollFn(),
            path, parameters = bom.location.pathname,
            parameters = parameters ? this.locationFn(parameters) : "",
            date = document.getElementsByName("date");
        if(current == 0){
            if(parameters.tag){
                path = `/${parameters.tag}/${(date[0].value)}`;
            }else{
                path = this.prettyDateFn(date[0].value);
            }
            date ? this.pathFn(path) : "";
            this.scrollInit(0);
            this.loadingFn(1);
        }else if(current >= limit){
            if(parameters.tag){
                path = `/${parameters.tag}/${(date[date.length - 1].value - 1)}`;
            }else{
                path = this.prettyDateFn(date[date.length - 1].value);
            }
            date ? this.pathFn(path) : "";
            this.scrollInit(0);
            this.loadingFn(1);
        }
    },
    utilFn : function(keyword) {
        var checked = this.switchElement.checked;

        if(keyword != undefined){
            keyword = keyword.replace(/ /gi, "_");
            this.pathFn("/" + keyword);
            return;
        }else if(!checked){
            keyword = keyword.replace(/ /gi, "_");
            this.pathFn("/" + keyword);
            return;
        }else if(checked){
            this.postFn();
        }
    },
    closeFn : function() {
        document.querySelector("[name='switch']:checked").checked = false;
    },
    modifyFn : function(id) {
        var el = document.getElementById("switch"+id),
            reply = document.getElementById("reply"+id),
            content = document.querySelector(`[for="switch${id}"]`).textContent;
        if(el.dataset.mode != "post"){
            el.dataset.mode = "post";
            reply.innerHTML = "";
        }else{
            el.dataset.mode = "modify";
            reply.textContent = content;
            reply.focus();
        }
    },
    replyFn : function(event, el, id) {
        if(event.which == 13){
            var content = el.textContent,
                path = typeof this.tagElement.textContent != "undefined" ? this.tagElement.textContent : "",
                el = document.querySelector("[name='switch']:checked");
            this.postRest(content, path, id);

				setTimeout(function(){ el.innerHTML = "" }, 0);
			}
		},
		postFn : function() {
			var content = this.formElement.content.value;
			var path = typeof this.tagElement.textContent != "undefined" ? this.tagElement.textContent : "";
			this.postRest(content, path);
		},
		navFn : function(type) {
			if(type){
				type == "Google" ? this.jsonpFn("https://apis.google.com/js/platform.js") : "";
				var provider = new firebase.auth[type+"AuthProvider"]();
				firebase.auth().signInWithRedirect(provider).then(function(result) {
					var	token = result.credential.accessToken,
						user = result.user;
				}).catch(function(error) {
					var errorCode = error.code,
						errorMessage = error.message,
						email = error.email,
						credential = error.credential;
				});
			}else{
				localStorage.clear();
				bom.location.href = "/";
			}
		},
		dateFormatFn : function(time) {
			var today = new Date().toISOString().substr(0,10).replace(/-/gi,""),
				diff = (((new Date()).getTime() - time) / 1000);
			diff = diff - 33000;
			if(diff < 0) diff = 0;
			var day_diff = Math.floor(diff / 86400);
			if ( isNaN(day_diff) || day_diff < 0 ) return;
			return day_diff == 0 && (
				diff < 60 && "now" ||
				diff < 120 && "1 minute" ||
				diff < 3600 && Math.floor( diff / 60 ) + "minute" ||
				diff < 7200 && "1 hour" ||
				diff < 86400 && Math.floor( diff / 3600 ) + "hour") ||
				day_diff == 1 && "1days" ||
				day_diff < 7 && day_diff + "days" ||
				day_diff < 31 && Math.floor( day_diff / 7 ) + "weeks" ||
				today
		},
		ridFn : function() {
			return Math.random().toString(36).substring(20);
		},
		loadingFn : function(v, type) {
			var dom_body = document.body;
			v ? dom_body.className += " loading" : dom_body.className = dom_body.className.replace(" loading", "");
		},
};