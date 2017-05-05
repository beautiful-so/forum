"use strict;";
/**
	* Copyright (c) 2016 forum.red Corp.
	* forum.red projects are licensed under the MIT license
*/
(function(bom, dom) {
	"use strict;"
	bom.app = {
	/**
		* option
		* 
	*/	
		lang : {},
		popstate : typeof bom.onpopstate != "undefined",
		regex : {
			url : /[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi,
			email : /^[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i
		},
		restUrl : "https://fora.firebaseio.com/tag/",
		autocompleteUrl : function(keyword) {
			return `http://${this.lang.type}.wikipedia.org/w/api.php?action=opensearch&limit=10&format=json&utf8=1&callback=app.autocompleteCallback&search=${keyword}`;
		},
		gameUrl : function(type, date) {
			return `https://spreadsheets.google.com/feeds/list/1-JVlP9YIwC2DydGZvAtOSmRE-BhN32IRK8g6AfchcQU/${type}/public/basic?alt=json-in-script&sq=date=${date}&callback=app.gameCallback`;
		},
		newsUrl : function() {
			return `https://${this.lang.type}.wikinews.org/w/api.php?action=query&format=json&list=recentchanges&redirects=1&utf8=1&rcdir=newer&rcnamespace=0&rclimit=100&callback=app.newsCallback`;
		},
		infoboxUrl : function(tag) {
			return `http://${this.lang.type}.dbpedia.org/sparql?default-graph-uri=http://${this.lang.type}.dbpedia.org&query=select distinct * where { <http://${this.lang.type}.dbpedia.org/resource/${tag.replace(/%20/gi, "_")}> ?k ?o . }&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on&callback=app.infoboxCallback`;
		},
		threadUrl : function(tag, id) {
			return `${this.restUrl}${tag}/${id}.json?callback=app.threadCallback`;
		},
		threadsUrl : function(tag, date, user, back) {
			var parameter = "";
			if(back){
				parameter = `${(date ? "startAt=" + date + "&" : "")}orderBy="date"&limitToLast=10`;
			}else if(typeof user != "undefined"){
				parameter = `orderBy="email"&equalTo="${user}"&limitToLast=50`;
			}else{
				parameter = `${(date ? "endAt=" + date + "&" : "")}orderBy="date"&limitToLast=10`;
			}
			return `${this.restUrl}${tag}.json?${parameter}&callback=app.threadsCallback`;
		},
		rootUrl : function(tag, root) {
			return `${this.restUrl}${tag}/${root}.json/?callback=app.threadCallback`;
		},
		branchUrl : function(tag, root, date) {
			return `${this.restUrl}${tag}.json?equalTo="${root}"&orderBy="root"&callback=app.threadCallback`;
		},
	/**
		* element
		* 
	*/	
		jsonpElement : dom.getElementById("jsonp"),
		shortcutElement : dom.getElementById("shortcut"),
		switchElement : dom.getElementById("switch"),
		formElement : dom.form,
		navElement : dom.getElementById("nav"),
		tagElement : dom.getElementById("tag"),
		newsElement : dom.getElementById("news"),
		gamesElement : dom.getElementById("games"),
		threadsElement : dom.getElementById("threads"),
		threadElement : dom.getElementById("thread"),
		imagesElement : dom.getElementById("images"),
		mainElement : dom.getElementById("main"),
		asideElement : dom.getElementById("aside"),
		keywordsElement : dom.getElementById("keywords"),
		infoboxElement : dom.getElementById("infobox"),
	/**
		* init
		* 
	*/
		sesstionInit : function() {
			var script = dom.createElement("script");
			script.src = "//www.gstatic.com/firebasejs/live/3.0/firebase.js";
			script.onload = function() {
				var config = {
					apiKey: "AIzaSyBi0JE_HRNznjb_43Bcv5xoBHuZEaCT07M",
					authDomain: "fora.firebaseapp.com"
				};
				firebase.initializeApp(config);
				firebase.auth().onAuthStateChanged(function(user) {
					if (user) {
						var key = bom.localStorage.key(0);
						bom.localStorage.api = user.Xc;
						bom.localStorage.name = user.displayName;
						bom.localStorage.email = user.email;
						bom.localStorage.profile = user.photoURL;
						app.auth = user.Xc;
						el = dom.querySelectorAll(".signin");
						for(var i = 0, len = el.length; i < len; i++){
							el[i].remove();
						}
					}else{
						dom.querySelectorAll(".signout").remove();
					}
				});
			};
			this.jsonpElement.appendChild(script);
		},
		scrollInit : function(bool) {
			bool ? bom.onscroll = function() {bom.app.scrollFn()} : bom.onscroll = null;
		},
		routeInit : function() {
			var parameters = bom.location.pathname,
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
			dom.body.removeAttribute("class");
			dom.title = "forum.red";
			this.threadElement.innerHTML = "";
			this.threadsElement.innerHTML = "";
			this.tagElement.textContent = "";
		},
		threadInit : function(tag) {
			var v = tag.replace("_", " ");
			v = decodeURIComponent(v);
			dom.title = v;
			this.tagElement.textContent = v;
			dom.body.className = "thread";
			this.threadElement.innerHTML = "";
			this.scrollInit(0);
		},
		threadsInit : function(tag) {
			tag = tag.replace("_", " ");
			this.shortcutElement.innerHTML = "";
			this.threadElement.innerHTML = "";
			dom.title = tag;
			this.tagElement.textContent = tag;
			dom.body.className = "threads";
		},
		langInit : function(json) {this.lang = json},
	/**
		* route
		* 
	*/
		homePath : function(parameters) {
			!this.newsElement.innerHTML.length ? this.scrollInit(0) : "";
			this.homeInit();
			if(typeof bom.onscroll == "function"){
				var date = dom.querySelector(`[value='${parameters.date}']`);
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
			if(dom.title != tag || this.infoboxElement.innerHTML.length == 0 || (dom.body.className.indexOf("user") > 0 && !parametersUser)){
				this.jsonpFn(this.infoboxUrl(tag));
				el.innerHTML = "";
			}
			this.threadsInit(tag);
			!threadsLen || parametersUser ? this.scrollInit(0) : "";

			if(typeof bom.onscroll == "function"){
				this.getThreadsFn(tag, parameters);
			}else if(!threadsLen && !this.threadElement.innerHTML.length){
				if(parametersUser){
					dom.body.className += " user";
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
	/**
		* function
		* 
	*/
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
			var date = typeof parameters.date != "undefined" ? parameters.date.toString() : new Date(new Date().getTime() - 86400000).toISOString().substr(0,10).replace(/-/gi,"").toString();

			this.gameCallback.len = 2;

			for(var i = 1; i < 4; i++){
				if(typeof localStorage[i+date] != "undefined"){
					var $json = eval("("+localStorage[i+date]+")");
					this.gameCallback($json);
				}else{
					this.jsonpFn(this.gameUrl(i, date));
				}
			}
		},
		pathFn : function(path, event) {
			typeof event != "undefined" ? event.preventDefault() : "";
			typeof path != "string" ? path = path.href : "";
			if(this.popstate){
				history.pushState("", "PushState - 1", path);
				this.routeInit();
			}else{
				// 스크롤 이벤트 일때 별도로 무한 스크롤 로딩 구현해야함
				bom.location.href = path;
			}
		},
		getThreadsFn : function(tag, parameters) {
			var date = dom.getElementsByName("date"),
				el = dom.getElementsByName("threads")[0];
				date = date.length ? date[date.length-1].value*1 : this.jsonpFn(this.threadsUrl(tag, parameters.date));
				if(el && this.currentScrollFn() == 0){
					this.jsonpFn(this.threadsUrl(tag, parameters.date, null, true));
				}else if(date == ((parameters.date*1)+1)){
					this.jsonpFn(this.threadsUrl(tag, parameters.date));
				}else if(!dom.getElementById("thread_none")){
					this.scrollInit(1);
				}
		},
		notFoundFn : function(el, index) {
			var elm = dom.getElementById(`${el.name}_${index}`);
				elm.parentNode.removeChild(elm);
			if(el.name == "infobox_image")
				dom.getElementsByName(el.name)[0].checked = true;
		},
		clearFn : function() {
			this.jsonpElement.innerHTML = "";
		},
		jsonpFn : function(url) {
			var script = dom.createElement("script");
			script.src = url;
			script.onload = "app.clearFn()";
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
						app[type](json);
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
					var a = dom.getElementById("a");
					var radio = dom.querySelector("[name='switch']:checked");
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
							this.ajaxFn(`https://vimeo.com/api/oembed.json?url=https://${url}`, "GET", "", this.oembedCallback);
						}else if(a.hostname == "soundcloud.com"){
							this.ajaxFn(`https://soundcloud.com/oembed?url=${uri}&format=json`, "GET", "", this.oembedCallback);
						}else if(a.hostname == "www.slideshare.net"){
							this.jsonpFn("https://www.slideshare.net/api/oembed/2?url=" + url + "&format=json&callback=app.oembedCallback");
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
				var radio = dom.querySelector("[name='switch']:checked");
				radio.dataset.url = "";
				radio.dataset.img = "";
				radio.dataset.request = "";
			}
		},
		autocompleteFn : function(keyword, len, area) {
			if(len > 0 || area){
				var tag = localStorage["#"+keyword];
				var $json = eval("("+tag+")");
				if(typeof $json != "undefined"){
					this.autocompleteCallback($json);
				}else{
					this.jsonpFn(this.autocompleteUrl(keyword))
				}
			}
		},
		autocompleteFocusFn : function(keyword){
			this.tagElement.textContent = keyword;
			this.placeCaretAtEnd.checked = true;
		},
		searchFn : function() {
			var checked = dom.querySelector("input[name='keyword']:checked"),
				check = checked ? checked.value : 0,
				v = this.tagElement.textContent;
			if(v.length > 0 || checked){
				if(v != dom.title)
					check ? this.utilFn(check) : this.utilFn(v);
			}else{
				alert(this.lang.validation.keyword);
				this.tagElement.innerHTML = "";
				this.switchElement.checked = false;
			}
		},
		keywordFocusFn : function(e) {
			var area = !(dom.getElementById("shortcut").textContent.length > 0),
				keywords = dom.getElementsByName("keyword"),
				keyword = this.tagElement.textContent,
				len = keywords.length;
			switch(e.which){
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
			return dom.body.scrollTop || dom.documentElement.scrollTop;
		},
		scrollFn : function(v) {
			var limit = dom.body.scrollHeight - dom.documentElement.clientHeight,
				current = this.currentScrollFn(),
				path, parameters = bom.location.pathname,
				parameters = parameters ? this.locationFn(parameters) : "",
				date = dom.getElementsByName("date");
			if(current == 0){
				if(parameters.tag){
					path = `/${parameters.tag}/${(date[0].value)}`;
				}else{
					path = this.prettyDateFn(date[0].value);
				}
				date ? this.pathFn(path) : "";
				// this.scrollInit(0);
				// this.loadingFn(1);
			}else if(current >= limit){
				if(parameters.tag){
					path = `/${parameters.tag}/${(date[date.length - 1].value - 1)}`;
				}else{
					path = this.prettyDateFn(date[date.length - 1].value);
				}
				date ? this.pathFn(path) : "";
				// this.scrollInit(0);
				// this.loadingFn(1);
			}
		},
		utilFn : function(keyword) {
			var checked = this.switchElement.checked;

			if(keyword != undefined){
				keyword = keyword.replace(/ /gi, "_");
				this.pathFn("/"+keyword+"/");
				return;
			}else if(!checked){
				keyword = keyword.replace(/ /gi, "_");
				this.pathFn("/"+keyword+"/");
				return;
			}else if(checked){
				this.postFn();
			}
		},
		closeFn : function() {
			dom.querySelector("[name='switch']:checked").checked = false;
		},
		modifyFn : function(id) {
			var el = dom.getElementById("switch"+id),
				reply = dom.getElementById("reply"+id),
				content = dom.querySelector(`[for="switch${id}"]`).textContent;
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
					el = dom.querySelector("[name='switch']:checked");
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
		loadingFn : function(v, type) {
			var dom_body = dom.body;
			v ? dom_body.className += " loading" : dom_body.className = dom_body.className.replace(" loading", "");
		},
	/**
		* rest
		* 
	*/
		postRest : function(content, path, id) {
			if(!this.auth){
				alert(this.lang.validation.login);
			}else if(!content.length){
				alert(this.lang.validation.content);
			}else{
				content = content.replace(/</gi,"&lt;");
				content = content.replace(/>/gi, "&gt;");
				var root = dom.getElementsByName("thread"),
					el = dom.querySelector("[name='switch']:checked"),
					data = {
						content : content,
						date : new Date().getTime(),
						profile : bom.localStorage.profile,
						email : bom.localStorage.email,
						name : bom.localStorage.name,
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
	/**
		* oembed
		* 
	*/
		youtubeOembed : function(id) {
			dom.getElementById("media"+id).innerHTML += `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1" frameborder="0"></iframe>`;
		},
		defaultOembed : function(id, url) {
			var el = dom.getElementById("media"+id);
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
	/**
		* template
		* 
	*/
		autocompleteTpl : function(keyword, json, num) {
			var v = json[1][num].replace(keyword, `<span>${keyword}</span>`);
			return `<input onfocus="app.autocompleteFocusFn(this.value)" onkeydown="app.keywordFocusFn(event)" id="keyword${num}" type="radio" name="keyword" value="${json[1][num].replace(/%20/gi, "_")}"><label for="keyword${num}"><a href="/${json[1][num]}" onclick="app.pathFn(this,event)">${v}</a></label>`;
		},
		youtubeTpl : function(id) {
			return `<a class="media" id="media${id}" onclick="window.app.youtubeOembed('${id}')"><img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="youtube"></a>`;
		},
		oembedTpl : function(url, img, key) {
			var id = Math.random().toString(36).substring(3);
			return `<a class="media ${key}" id="media${id}"><img src="${img}" alt="" onclick="window.app.defaultOembed('${id}', '${url}')"></a>`;
		},
		newsTpl : function(pageid, title) {
			return `<li name="news"><a href="https://${this.lang.type}.wikinews.org/wiki/${title}?dpl_id=${pageid}" target="_blank" title=new window">${title}</a></li>`;
		},
		gameTpl : function(category, game, league, home, home_score, home_country, away, away_score, away_country, date, youtube, win, img) {
			var type = 0;
			if(category == 1){
				type = "football";
			}else if(category == 2){
				type = "basketball";
			}else if(category == 3){
				type = "baseball";
			}

			return `<div name="game" class="game ${win} ${league} ${type}" ${img}><a href="https://www.youtube.com/results?search_query=${home} ${away} ${home_score} ${away_score} ${date}" target="_blank" title="new window" class="title"><dl class="home"><dt><strong class="name">${home}</strong><span class="country">${home_country}</span></dt><dd class="score">${home_score}</dd></dl><dl class="away"><dt><strong class="name">${away}</strong><span class="country">${away_country}</span></dt><dd class="score">${away_score}</dd></dl></a><input type="hidden" name="date" value="${date}"></div>`;
        },
		infobox_imageTpl : function(key, value, num, checked) {
			return `<label id="infobox_image_${num}" for="infobox_img${num}"><input id="infobox_image${num}" type="radio" name="infobox_image" ${checked}><img name="infobox_image" onerror="app.notFoundFn(this, ${num})" src="http://commons.wikimedia.org/wiki/Special:Filepath/${value}" alt="${key}"></label>`;
		},
		threadTpl : function(prop, data, img) {
			img = typeof img != "undefined" ? `<div class="image">${img}</div>` : "";
			var tag = this.tagElement.textContent,
                meta = "",
			parent = typeof data.parent != "undefined" ? `<input name="parent" type="hidden" value="${data.parent}">` : "",
			root = typeof data.root != "undefined" ? `<input name="root" type="hidden" value="${data.root}">` : "",
			setting = data.email == localStorage.email ? `<a class="setting" onclick="app.modifyFn('${prop}')" name="modify">modify</a><a class="setting" onclick="app.deleteRest('${tag}', '${prop}')" name="remove">remove</a>` : "";
			if(typeof data.url != "undefined"){
				var len = data.url.length;
				if(len > 0){
					for(var i = 0; len > i; i++){
						var tpl = "";
						if(typeof data.img != "undefined"){
							tpl = app.oembedTpl(data.url[i], data.img[i], prop)
						}else{
							tpl = `<a class="link" href="http://${data.url[i]}" target="_blank" title="new window">#link${(i + 1)}</a>`;
						}
						typeof tpl != "undefined" ? meta += tpl : "";
					}
				}
			}
			return `${meta}<input id="switch${prop}" name="switch" type="radio" data-mode="post" data-request="" data-url="" data-img=""> <form action="javascript:this.replyFn('${prop}')" id="${prop}" name="thread"><input type="hidden" name="lang" value="${data.lang}"><div class="info"><div class="infobox"><a href="/${tag}/${data.email}" name="profile" style="background-image:url(${data.profile})">${data.name}</a><a name="date">${this.dateFormatFn(data.date)}</a>${setting}<a class="close" onclick="window.app.closeFn()"><i class="alt">close</i></a></div></div><label for="switch${prop}" name="content">${data.content}</label><div id="reply${prop}" title="${this.lang.title.reply}" class="reply" contenteditable onkeyup="window.app.oembedFn(this)" onkeydown="app.replyFn(event, this, '${prop}')"></div>${parent}${root}${img}</form>`;
		},
		threadsTpl : function(json, key, tag, img) {
			var thread_key = typeof json[key].root != "undefined" ? json[key].root + "#" + key : key;
			return `<form name="threads" ${(typeof json[key].root == "undefined" ? "class='root'" : "")} action="javascript:fetchRecord(this)"><input name="root" type="hidden" value="${json[key].root}"><input name="parent" type="hidden" value="${json[key].parent}"><input name="date" type="hidden" value="${json[key].date}">${img}<div id="content${key}" class="content"><div class="info"><a class="profile" href="/${tag}/${json[key].email}" onclick="app.pathFn(this, event)"><img class="profile_img" alt="${json[key].name}" src="${json[key].profile}"><span class="name">${json[key].name}</span></a><span class="date">${this.dateFormatFn(json[key].date)}</span></div><a class="txt" href="/${tag}/${thread_key}" onclick="app.pathFn(this, event)" contenteditable="false">${json[key].content}</a></div></form>`;
		},
		thread_mediaTpl : function(json, key, num) {
			return `<a class="thumnail" id="media${key}"><img src="${json[key].img[num]}" alt="thumnail"></a>`;
		},
	/**
		* callback
		* 
	*/
		gameCallback : function(json) {
			var body = "",
				entry = json.feed.entry,
				category = json.feed.title.$t.toString();

			if(typeof entry != "undefined"){
				var games = dom.getElementById("games");
				var g = entry[0].content.$t.split(",");
				var d = eval("{"+g[6]+"}");
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

						body += app.gameTpl(category, game, league, home, home_score, home_country, away, away_score, away_country, date, youtube, win, img);
					}
				}
				localStorage[category+d] = JSON.stringify(json);
				var el = document.getElementsByName("game")[0];
				if(el && this.currentScrollFn() == 0){					
					el.outerHTML = body + el.outerHTML;
				}else{
					games.innerHTML += body;
				}
				if(this.gameCallback.len == 0){
					this.scrollInit(1);
					this.loadingFn(0);		
				}
				this.gameCallback.len--;
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
						body += app.newsTpl(pageid, title);
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
				var key = json[i].k.value.replace("http://ko.dbpedia.org/property/",""),
				value = json[i].o.value.replace("http://ko.dbpedia.org/resource/","");
				value = value.replace(/_/gi, " ");
				if(json[i].k.value.indexOf("http://dbpedia.org/ontology/wikiPageWikiLink") >= 0)
					if(value.indexOf(".svg") >= 0 || value.indexOf(".jpg") >= 0 || value.indexOf(".JPG") >= 0 || value.indexOf(".png") >= 0 || value.indexOf(".PNG") >= 0 || value.indexOf(".SVG") >= 0){
						images += app.infobox_imageTpl(key, value.replace("파일:",""), i);
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
							infobox_image != "" ? infobox_image += app.infobox_imageTpl(key, value, i) : infobox_image += app.infobox_imageTpl(key, value, i, "checked");
					}else{
							dl += `<dt>${key}</dt><dd>${value}</dd>`;
					}
				}
			}
			keywords.length > 0 ? this.keywordsElement.innerHTML = `<div>${keywords}</div>` : "";
			dl.length > 0 ? this.infoboxElement.innerHTML = `<label for="more_images"><span>more</span></label><h2>${infobox_image}${images}</h2><dl>${dl}</dl>` : this.infoboxElement.innerHTML = "";
			uri.length > 0 ? dom.getElementById("domain_uri").href = uri : "";
		},
		autocompleteCallback : function(json) {
			var body = "";
			var keyword = this.tagElement.textContent;
			if(json.length){
				var tag = "#"+json[0];
				var keywords = typeof localStorage[tag] != "undefined" ? localStorage[tag] : "";
				localStorage[tag] = JSON.stringify(json);

				for(var i = 0, len = json[1].length; i < len; i++){
					body += app.autocompleteTpl(keyword, json, i);
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
						img += app.thread_mediaTpl(json, key, g);
					}
				if(dom.body.className == "thread"){
					var forms = this.threadElement.innerHTML,
						radio = dom.querySelector("[name='switch']:checked"),
						id = radio.id.replace("switch", ""),
						el = dom.getElementById(id);
					radio.checked = false;
					tpl = app.threadTpl(key, data[key], img);
					el ? el.outerHTML += tpl : this.threadElement.innerHTML = tpl;
				}else{
					var el = dom.getElementsByName("threads")[0];
					tpl = app.threadsTpl(data, key, tag, img);
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
					form = dom.getElementById(id),
					_switch = dom.getElementById("switch" + id),
					media = dom.querySelectorAll("." + id),
					contents = dom.getElementById("content" + id);
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
					parameters = bom.location.pathname,
					parameters = parameters ? this.locationFn(parameters) : "",
					tag = parameters.tag,
					keys = Object.keys(json).sort().reverse(),
					el = dom.getElementsByName("threads")[0];

				for(var i = 0, len1 = keys.length; i < len1; i++){
					var key = keys[i],
						img = "",
						content = "";
					if(typeof json[key].img != "undefined")
						for(var g = 0, len2 = json[key].img.length-1; g <= len2; g++){
							img += app.thread_mediaTpl(json, key, g);
						}
					body += app.threadsTpl(json, key, tag, img);
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
				!dom.getElementById("thread_none") ? this.threadsElement.innerHTML += `<div id="thread_none">${this.lang.status.none}</div>` : "";
			}
		},
		threadCallback : function(json) {
			var date, parameters = bom.location.pathname,
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
						img += app.thread_mediaTpl(json, key, g);
					}
				}
				if(typeof json[key].parent != "undefined"){
					dom.getElementById(json[key].parent).outerHTML += app.threadTpl(key, json[key], img);
				}else{
					this.threadElement.innerHTML += app.threadTpl(key, json[key], img);			
				}
			}
		},
		oembedCallback : function(json) {
			app.jsonpElement.innerHTML += json.html;
			var radio = dom.querySelector("[name='switch']:checked"),
				iframe = app.jsonpElement.getElementsByTagName("iframe");
			radio.dataset.url += iframe[0].src+",";
			radio.dataset.img += json.thumbnail_url+",";
			iframe[0].remove();	
		},
		gistCallback : function(json) {
			var self = this.gistCallback,
				el = dom.getElementById("media"+self.id);
			el.innerHTML += `<link rel="stylesheet" href="${json.stylesheet}">${json.div}`;
			delete self["id"];
		},
	/**
		* Error
		* 
	*/
		threadError : function() {
			
		},
		threadsError : function() {

		},
		homeError : function() {

		},
		mediaError : function() {
			
		}
	}
	
	var n = navigator,
	uAgent = n.userAgent.toLowerCase(),
	type = n.appName,
	lang = (type=="Netscape") ? navigator.language : lang = navigator.userLanguage;
	dom.documentElement.lang = lang = lang.substr(0,2);

	app.jsonpFn(`/lang/${lang}.js`);

})(window, document);