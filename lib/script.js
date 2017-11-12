/**
	* Copyright (c) 2016 forum.red Corp.
	* forum.red projects are licensed under the MIT license
*/

(function (bom, dom) {
	"use strict;";

	bom.forum = {
	/**
		* option
		* 
	*/
		scroll : {},
		lang: {},
		popstate: typeof bom.onpopstate != "undefined",
		regex: {
			url: /[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi,
			email: /^[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i
		},
		restUrl: "https://fora.firebaseio.com/tag/",
		autocompleteUrl : function(keyword, type){
			return "https://market.android.com/suggest/SuggRequest?json=1&c="+type+"&query="+keyword+"&callback=forum.autocompleteCallback"
		},
		gameUrl: function(type, date) {
			return "https://spreadsheets.google.com/feeds/list/1-JVlP9YIwC2DydGZvAtOSmRE-BhN32IRK8g6AfchcQU/" + type + "/public/basic?alt=json-in-script&sq=date=" + date + "&callback=forum.gameCallback";
		},
		newsUrl: function() {
			return "https://" + this.lang.type + ".wikinews.org/w/api.php?action=query&format=json&list=recentchanges&redirects=1&utf8=1&rcdir=newer&rcnamespace=0&rclimit=100&callback=forum.newsCallback";
		},
		threadUrl: function(tag, id) {
			return "" + this.restUrl + tag + "/" + id + ".json?callback=forum.threadCallback";
		},
		threadsUrl: function(tag, date, user, back) {
			var parameter = "";
			if (back) {
				parameter = (date ? "startAt=" + date + "&" : "") + "orderBy=\"date\"&limitToLast=10";
			} else if (typeof user != "undefined") {
				parameter = "orderBy=\"email\"&equalTo=\"" + user + "\"&limitToLast=50";
			} else {
				parameter = (date ? "endAt=" + date + "&" : "") + "orderBy=\"date\"&limitToLast=10";
			}
			return "" + this.restUrl + tag + ".json?" + parameter + "&callback=forum.threadsCallback";
		},
		rootUrl: function(tag, root) {
			return "" + this.restUrl + tag + "/" + root + ".json/?callback=forum.threadCallback";
		},
		branchUrl: function(tag, root, date) {
			return "" + this.restUrl + tag + ".json?equalTo=\"" + root + "\"&orderBy=\"root\"&callback=forum.threadCallback";
		},
		/**
  	* element
  	* 
  */
		jsonpElement: dom.getElementById("jsonp"),
		autocompleteElement: dom.getElementById("autocomplete"),
		switchElement: dom.getElementById("switch"),
		formElement: dom.form,
		searchElement : dom.getElementById("search"),
		navElement: dom.getElementById("nav"),
		tagElement: dom.getElementById("tag"),
		gamesElement: dom.getElementById("games"),
		threadsElement: dom.getElementById("threads"),
		threadElement: dom.getElementById("thread"),
		imagesElement: dom.getElementById("images"),
		mainElement: dom.getElementById("main"),
		asideElement: dom.getElementById("aside"),
		metaElement: dom.getElementById("meta"),
		/**
  	* init
  	* 
  */
		sesstionInit: function() {
			var script = dom.createElement("script");
			script.src = "//www.gstatic.com/firebasejs/live/3.0/firebase.js";
			script.onload = function () {
				var config = {
					apiKey: "AIzaSyBi0JE_HRNznjb_43Bcv5xoBHuZEaCT07M",
					authDomain: "fora.firebaseapp.com"
				};
				firebase.initializeApp(config);
				firebase.auth().onAuthStateChanged(function (user) {
					if (user) {
						var key = bom.localStorage.key(0);
						bom.localStorage.api = user.Xc;
						bom.localStorage.name = user.displayName;
						bom.localStorage.email = user.email;
						bom.localStorage.profile = user.photoURL;
						forum.auth = user.Xc;
						Scv({
							id : "top",
							template : dom.getElementById("signOutTpl").innerHTML,
							data : {lang : this.lang},
							target : forum.metaElement,
							css : "/lib/top.css"
						});
					} else {
						Scv({
							id : "top",
							template : dom.getElementById("signInTpl").innerHTML,
							data : {lang : this.lang},
							target : forum.metaElement,
							css : "/lib/top.css"
						});
					}
				});
			};
			this.jsonpElement.appendChild(script);
		},
		scrollInit: function(bool) {
			if(bool){
				bom.onscroll = function () {
					bom.forum.scrollFn();
				};
			}else{
				bom.onscroll = null;	
			}
		},
		routeInit: function() {
			var parameters = bom.location.pathname,
				parameters = parameters ? this.locationFn(parameters) : "";
				this.formElement.className = "";
			switch (parameters.tag){
				case "news" : 
					break;

				case "football" : 
					break;

				case "baseball" : 
					break;

				case "basketball" : 
					break;

				case "book" :
					break;

				default :
					if (parameters.id) {
						this.threadPath(parameters);
						return;
					} else if (parameters.tag) {
						this.threadsPath(parameters);
						return;
					} else {
						this.homePath(parameters);
					} 
					break;
			}
		},
		homeInit: function() {
			this.scroll = {};
			dom.body.removeAttribute("class");
			dom.title = "forum.red";
			this.threadElement.innerHTML = "";
			this.tagElement.textContent = "";
		},
		threadInit: function(tag) {
			var v = tag.replace("_", " ");
			v = decodeURIComponent(v);
			dom.title = v;
			this.tagElement.textContent = v;
			dom.body.className = "thread";
			this.threadElement.innerHTML = "";
			this.scrollInit(0);
		},
		threadsInit: function(tag) {
			if(dom.body.className.indexOf("threads") < 0){
				this.scroll = {};
				tag = tag.replace("_", " ");
				this.threadElement.innerHTML = "";
				dom.title = tag;
				this.tagElement.textContent = tag;
				dom.body.className = "threads";  
			}
		},
		langInit: function langInit(json) {
			this.lang = json;
		},
		/**
  	* route
  	* 
  */
		homePath: function(parameters) {
			this.homeInit();
			if (typeof bom.onscroll == "function") {
				var date = dom.querySelector("[value='" + parameters.date + "']");
				if (typeof parameters.date != "undefined" && !date) this.gamesFn(parameters);
			} else {
				this.scrollInit(1);
				this.jsonpFn(this.newsUrl());
				this.gamesFn(parameters);
			}
		},
		threadPath: function(parameters) {
			this.threadInit(parameters.tag);
			this.jsonpFn(this.threadUrl(parameters.tag, parameters.id));
		},
		threadsPath: function(parameters) {
			var tag = parameters.tag,
				tag = decodeURIComponent(tag),
				parametersUser = typeof parameters.user != "undefined",
				parametersDate = typeof parameters.date == "undefined",
				el = this.threadsElement,
				threadsLen = el.innerHTML.length;

			this.threadsInit(tag);
			!threadsLen || parametersUser ? this.scrollInit(0) : "";

			this.keywordFocusFn({which : 27});

			if (typeof bom.onscroll == "function") {
				this.getThreadsFn(tag, parameters);
			} else {
				if (parametersUser) {
					dom.body.className += " user";
					this.jsonpFn(this.threadsUrl(tag, null, parameters.user));
					return;
				} else if (parametersDate) {
					el.innerHTML.length == 0 ? this.jsonpFn(this.threadsUrl(tag)) : this.getThreadsFn(tag, parameters);
					return;
				} else {
					this.getThreadsFn(tag, parameters);
				}
			}
		},
		/**
  	* function
  	* 
  */
		placeCaretAtEnd: function(el) {
			if (this.placeCaretAtEnd.checked) {
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
				delete this.placeCaretAtEnd.checked;
			}
		},
		locationFn: function(parameters) {
			var path = {},
				p = parameters.substr(1).split("/");

			for (var i = 0, len = p.length; i < len; i++) {
				try {
					if (((p[i].length == 13) || (p[i].length == 8)) && typeof (p[i]*1) === "number") {
						path.date = p[i] * 1;
					} else {
						if (i == 0) {
							path.tag = p[i];
						} else {
							if (p[i].length == 13 && typeof (p[i]*1) === "number") {
								path.date = p[1] * 1;
							} else if (p[i].match(this.regex.email)) {
								path.user = p[i];
							} else {
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
		leadingZeros: function (n, digits) {
			var zero = '';
			n = n.toString();

			if (n.length < digits) {
			for (i = 0; i < digits - n.length; i++)
			zero += '0';
			}
			return (zero + n).toString();
		},
		prettyDateFn: function(date) {
			var d = (date*1) + (this.currentScrollFn() == 0 ? 86400000 : -86400000);
				d = new Date(d);
				d = this.leadingZeros(d.getFullYear(), 4) + this.leadingZeros(d.getMonth() + 1, 2) + this.leadingZeros(d.getDate(), 2);
			return d;
		},
		gamesFn: function(parameters) {
			var date = typeof parameters.date != "undefined" ? parameters.date : new Date(new Date().getTime() - 86400000).toISOString().substr(0, 10).replace(/-/gi, "");
			this.jsonpFn(this.gameUrl(2, date));
			this.jsonpFn(this.gameUrl(3, date));
			this.jsonpFn(this.gameUrl(4, date));
		},
		pathFn: function(path, event) {
			typeof event != "undefined" ? event.preventDefault() : "";
			typeof path != "string" ? path = path.href : "";
			if (this.popstate) {
				history.pushState("", "PushState - 1", path);
				this.routeInit();
			} else {
				bom.location.href = path;
			}
		},
		getThreadsFn: function(tag, parameters) {
			var date = document.querySelectorAll("threads [name='date']"),
				el = dom.getElementsByTagName("threads");
			date = date.length ? date[date.length - 1].value * 1 : this.jsonpFn(this.threadsUrl(tag, parameters.date));

			if (el.length > 0 && this.currentScrollFn() == 0) {
				if(parameters.date != el[0].querySelector("[name='date']").value*1){
					this.jsonpFn(this.threadsUrl(tag, parameters.date, null, true));
				}else{
					this.loadingFn(0,1);
					this.scrollInit(1);
					this.scroll.before = true;
				}
			} else if (date == parameters.date * 1 + 1) {
				this.jsonpFn(this.threadsUrl(tag, parameters.date));
			} else if (!dom.getElementById("thread_none")) {
				this.scrollInit(1);
			}else{
				this.scrollInit(1);
			}
		},
		notFoundFn: function(el, index) {
			var elm = dom.getElementById(el.name + "_" + index);
			elm.parentNode.removeChild(elm);
			if (el.name == "infobox_image") dom.getElementsByName(el.name)[0].checked = true;
		},
		clearFn: function() {
			this.jsonpElement.innerHTML = "";
		},
		jsonpFn: function(url) {
			var script = dom.createElement("script");
			script.src = url;
			script.onload = "forum.clearFn()";
			this.jsonpElement.appendChild(script);
		},
		ajaxFn: function(url, method, data, type) {
			var xhr = bom.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
			xhr.onreadystatechange = function (e) {
				if (e.target.readyState == 4 && e.target.status == 200) {
					var json = eval("(" + e.target.responseText + ")");
					if (typeof type == "function") {
						type(json);
					} else {
						forum[type](json);
					}
					return;
				} else {
					console.log(e);
				}
			};
			xhr.open(method, url, true);
			data ? xhr.send(data) : xhr.send();
		},
		autocompleteFilter : function(keyword){
			switch(keyword[0]){
				case "#" :
					return 1;
				default :
					return 0; 
			}
		},
		autocompleteRequest : function(keyword, len, area, type){
			if(len > 0 || area){
				var tag = localStorage["#"+keyword];
				var $json = eval("("+tag+")");
				typeof $json != "undefined" ? this.autocompleteCallback($json) : this.jsonpFn(this.autocompleteUrl(keyword, type));
			}
		},
		autocompleteFn: function(keyword, len, area) {
			var type = this.autocompleteFilter(keyword);
			this.autocompleteRequest(keyword, len, area, type);
			dom.getElementsByName("keyword")[0].checked = "checked";

		},
		autocompleteFocusFn: function(keyword) {
			this.tagElement.textContent = keyword;
			this.placeCaretAtEnd.checked = true;
		},
		searchFn: function() {
			var checked = document.querySelector("input[name='keyword']:checked"),
				v = this.tagElement.textContent;
			if (v.length > 0 || checked) {
				if (v != dom.title) this.utilFn(v);
			} else {
				alert(this.lang.validation.keyword);
				this.tagElement.innerHTML = "";
				this.switchElement.checked = false;
			}
		},
		searchFocusFn : function(){

		},
		keywordFocusFn: function(e) {
			var area = !(dom.getElementById("autocomplete").textContent.length > 0),
				keywords = dom.getElementsByName("keyword"),
				keyword = this.tagElement.textContent,
				len = keywords.length;
				this.formElement.className = "typing";
			switch (e.which) {
				case 8:
					if (keyword.length > 0) {
						this.autocompleteFn(keyword, len, area);
						this.placeCaretAtEnd(this.tagElement);
					}
					break;
				case 9:
					this.tagElement.removeAttribute("contenteditable");
					this.tagElement.setAttribute("contenteditable", "true");
					break;
				case 13:
					this.formElement.className = "";
					this.searchFn();
					break;
				case 27:
					this.formElement.className = "";
					keyword = keyword.slice(0, -1);
					this.autocompleteFn(keyword, len, area);
					this.tagElement.textContent = dom.body.className != "" ? document.title : "";
					break;
				case 38:
					if (area) {
						this.autocompleteFn(keyword, len, area);
					} else {
						var checked = keywords[len - 1];
						checked.checked = true;
						checked.focus();
					}
					break;
				case 40:
					area ? this.autocompleteFn(keyword, len, area) : "";
					if (len > 1) {
						var checked = keywords[1];
						checked.checked = true;
						checked.focus();
					}
					break;
				default:
					this.autocompleteFn(keyword, len, area);
					this.placeCaretAtEnd(this.tagElement);
					break;
			}
		},
		currentScrollFn: function() {
			return dom.body.scrollTop || dom.documentElement.scrollTop;
		},
		scrollFn: function(v) {
			var limit = dom.body.scrollHeight - dom.documentElement.clientHeight,
				current = this.currentScrollFn(),
				parameters = bom.location.pathname,
				parameters = parameters ? this.locationFn(parameters) : "",
				date = dom.getElementsByName("date");
			this.scrollChanged(limit, current, parameters, date);
		},
		scrollChanged : function(limit, current, parameters, date){
			if (current == 0) {
				if (parameters.tag) {
					path = "/" + parameters.tag + "/" + date[0].value;
				} else {
					path = this.prettyDateFn(date[0].value);
				}
				this.scrollInit(0);
				this.loadingFn(1, 1);
				date ? this.pathFn(path) : "";
			} else if (current >= limit) {
				if (parameters.tag) {
					path = "/" + parameters.tag + "/" + (date[date.length - 1].value - 1);
				} else {
					path = this.prettyDateFn(date[date.length - 1].value);
				}
				date ? this.pathFn(path) : "";
				this.scrollInit(0);
				this.loadingFn(1);
			}
		},
		utilFn: function(keyword) {
			var checked = this.switchElement.checked;

			if (keyword != undefined) {
				keyword = keyword.replace(/ /gi, "_");
				this.pathFn("/" + keyword);
				return;
			} else if (!checked) {
				keyword = keyword.replace(/ /gi, "_");
				this.pathFn("/" + keyword);
				return;
			} else if (checked) {
				this.postFn();
			}
		},
		closeFn: function() {
			dom.querySelector("[name='switch']:checked").checked = false;
		},
		modifyFn: function(id) {
			var el = dom.getElementById("switch" + id),
				reply = dom.getElementById("reply" + id),
				content = dom.querySelector("[for=\"switch" + id + "\"]").textContent;
			if (el.dataset.mode != "post") {
				el.dataset.mode = "post";
				reply.innerHTML = "";
			} else {
				el.dataset.mode = "modify";
				reply.textContent = content;
				reply.focus();
			}
		},
		replyFn: function(event, el, id) {
			if (event.which == 13) {
				var content = el.textContent,
					path = typeof this.tagElement.textContent != "undefined" ? this.tagElement.textContent : "",
					el = dom.querySelector("[name='switch']:checked");
				this.postRest(content, path, id);

				setTimeout(function () {
					el.innerHTML = "";
				}, 0);
			}
		},
		postFn: function() {
			var content = this.formElement.content.value;
			var path = typeof this.tagElement.textContent != "undefined" ? this.tagElement.textContent : "";
			this.postRest(content, path);
		},
		navFn: function(type) {
			if (type) {
				type == "Google" ? this.jsonpFn("https://apis.google.com/js/platform.js") : "";
				var provider = new firebase.auth[type + "AuthProvider"]();
				firebase.auth().signInWithRedirect(provider).then(function (result) {
					var token = result.credential.accessToken,
						user = result.user;
				}).catch(function (error) {
					var errorCode = error.code,
						errorMessage = error.message,
						email = error.email,
						credential = error.credential;
				});
			} else {
				localStorage.clear();
				bom.location.href = "/";
			}
		},
		dateFormatFn: function(time) {
			var today = new Date().toISOString().substr(0, 10).replace(/-/gi, ""),
				diff = (new Date().getTime() - time) / 1000;
			diff = diff - 33000;
			if (diff < 0) diff = 0;
			var day_diff = Math.floor(diff / 86400);
			if (isNaN(day_diff) || day_diff < 0) return;
			return day_diff == 0 && (diff < 60 && "now" || diff < 120 && "1 minute" || diff < 3600 && Math.floor(diff / 60) + "minute" || diff < 7200 && "1 hour" || diff < 86400 && Math.floor(diff / 3600) + "hour") || day_diff == 1 && "1days" || day_diff < 7 && day_diff + "days" || day_diff < 31 && Math.floor(day_diff / 7) + "weeks" || today;
		},
		loadingFn: function(v, type) {
			var $body = dom.body;
			if(type == 1){
				v ? $body.className += " _loading" : $body.className = $body.className.replace(" _loading", "");	
			}else{
				v ? $body.className += " loading" : $body.className = $body.className.replace(" loading", "");	
			}
		},
		/**
  	* rest
  	* 
  */
		postRest: function(content, path, id) {
			if (!this.auth) {
				alert(this.lang.validation.login);
			} else if (!content.length) {
				alert(this.lang.validation.content);
			} else {
				content = content.replace(/</gi, "&lt;");
				content = content.replace(/>/gi, "&gt;");
				var root = dom.getElementsByName("thread"),
					el = dom.querySelector("[name='switch']:checked"),
					data = {
						content: content,
						date: new Date().getTime(),
						profile: bom.localStorage.profile,
						email: bom.localStorage.email,
						name: bom.localStorage.name,
						lang: this.lang.type,
						url: [],
						img: []
					},
					type = "";

				if (el.dataset.mode == "post") {
					type = "POST";
					data.parent = id;
					root.length > 0 ? data.root = root[0].id : "";
				} else {
					type = "PUT";
					path = path + "/" + el.id.replace("switch", "");
				}
				path = this.restUrl + path + ".json?auth=" + this.auth;
				var url = el.dataset.url.slice(0, -1).split(","),
					img = el.dataset.img.slice(0, -1).split(","),
					request = el.dataset.request.slice(0, -1).split(",");
				for (var i = 0, len = request.length; i < len; i++) {
					data.content = data.content.replace(request[i], "");
				}
				url[0] != "" ? data.url = url : "";
				img[0] != "" ? data.img = img : "";
				this.firebaseCallback.data = data;
				data = JSON.stringify(data);
				this.ajaxFn(path, type, data, "firebaseCallback");
			}
		},
		deleteRest: function(tag, id) {
			var bool = confirm(this.lang.validation.delete);
			this.deleteCallback.id = id;
			bool ? this.ajaxFn("\"" + this.restUrl + tag + "/" + id + ".json?auth=" + this.auth + "\"", "DELETE", "", "deleteCallback") : "";
		},
		/**
  	* oembed
  	* 
  */
		youtubeOembed: function(id) {
			dom.getElementById("media" + id).innerHTML += "<iframe src=\"https://www.youtube.com/embed/" + id + "?autoplay=1\" frameborder=\"0\"></iframe>";
		},
		defaultOembed: function(id, url) {
			var el = dom.getElementById("media" + id);
			if (url.indexOf("gist.github.com") >= 0) {
				this.gistCallback.id = id;
				this.jsonpFn("https://" + url + ".json?callback=this.gistCallback");
			} else if (url.indexOf("jsfiddle.net") >= 0) {
				el.innerHTML += "<script src='https://" + url + "embed/'></scr" + "ipt>";
				this.jsonpFn("https://" + url + "embed/");
			} else {
				var url = url.indexOf("youtube") >= 0 || url.indexOf("vimeo") >= 0 ? url + "?autoplay=1" : url;
				el.innerHTML += "<iframe src=\"" + url + "\"></iframe>";
			}
		},
		/**
  	* template
  	* 
  */
		oembedTpl: function(url, img, key) {
			var id = Math.random().toString(36).substring(3);
			return '<a class="media '+key+'" id="media'+id+'"><img src="'+img+'" alt="" onclick="window.forum.defaultOembed(\''+id+'\', \''+url+'\')"></a>';
		},
		threadTemplate: function(prop, data, img) {
			img = typeof img != "undefined" ? "<div class=\"image\">" + img + "</div>" : "";
			var tag = this.tagElement.textContent,
				meta = "",
				parent = typeof data.parent != "undefined" ? "<input name=\"parent\" type=\"hidden\" value=\"" + data.parent + "\">" : "",
				root = typeof data.root != "undefined" ? "<input name=\"root\" type=\"hidden\" value=\"" + data.root + "\">" : "",
				setting = data.email == localStorage.email ? "<a class=\"setting\" onclick=\"forum.modifyFn('" + prop + "')\" name=\"modify\">modify</a><a class=\"setting\" onclick=\"forum.deleteRest('" + tag + "', '" + prop + "')\" name=\"remove\">remove</a>" : "";

			if (typeof data.url != "undefined") {
				var len = data.url.length;
				if (len > 0) {
					for (var i = 0; len > i; i++) {
						var tpl = data.img[i] ? forum.oembedTpl(data.url[i], data.img[i], prop) : "a class=\"link\" href=\"http://" + data.url[i] + "\" target=\"_blank\" title=\"new window\">#link" + (i + 1) + "</a>";
						meta += typeof tpl != "undefined" ? tpl : "";
					}					
				}
			}
			var obj = {
				prop : prop,
				meta : meta,
				lang : data.lang,
				tag : tag,
				email : data.email,
				profile : data.profile,
				name : data.name,
				title : this.lang.title.reply,
				content : data.content,
				date : this.dateFormatFn(data.date),
				parent : parent,
				root : root,
				setting : setting
			};
			Scv.addItem({id : "thread", data : obj});
		},
		thread_mediaTpl: function(json, key, num) {
			return "<a class=\"thumnail\" id=\"media" + key + "\"><img src=\"" + json[key].img[num] + "\" alt=\"thumnail\"></a>";
		},
		/**
  	* callback
  	* 
  */
		gameCallback: function(json) {
			var body = "",
				entry = json.feed.entry,
				category = json.feed.title.$t;

				category == 1 ? category = "football" : "";
				category == 2 ? category = "baseball" : "";
				category == 3 ? category = "basketball" : "";

			if (typeof entry != "undefined") {
				var games = dom.getElementById("games");
				for (var i = 0, len = entry.length; i <= entry.length; i++) {
					if (typeof entry[i] != "undefined") {
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
							img = typeof youtube != "undefined" ? 'style="background-image:url(https://i.ytimg.com/vi/${youtube}/hqdefault.jpg)' : "",
							timestamp = date.toString();
							timestamp = timestamp.substr(0,4)+"-"+timestamp.substr(4,2)+"-"+timestamp.substr(6,6);
							timestamp = new Date(timestamp).getTime();

						var obj = {
							category : category,
							league : league,
							home : home,
							home_score : home_score,
							home_country : home_country,
							away : away,
							away_score : away_score,
							away_country : away_country,
							date : date,
							timestamp : timestamp,
							youtube : youtube,
							win : win,
							img : img,
							href : home +" "+ away +" "+ home_score +" "+ away_score +" "+ date
						};

						document.getElementsByName("game")[0] && this.currentScrollFn() == 0 ? Scv.addItem({id : "game", data: obj, insert : "prepend"}) : Scv.addItem({id : "game", data: obj});
					}
				}
				this.scrollInit(1);
				this.loadingFn(0);
			}
		},
		newsCallback: function(json) {
			var body = "";
			if (json.query.recentchanges.length) {
				var list = json.query.recentchanges;
				for (var i = 0; i < 5; i++) {
					var obj = {
						pageid : list[i].pageid,
						title : list[i].title,
						lang : this.lang.type
					}
					if (body.indexOf(obj.title) < 0) {
						body += obj.title;
						// var item = Scv.getItem({id : "news", idx : i});
						// 	item ? item = typeof item.el != "undefined" : "";
						// 	item ? Scv.setItem({id : "news", idx : i, data: obj}) : Scv.addItem({id : "news", data: obj});
						Scv.addItem({id : "news", data: obj});
					}
				}
			}
		},
		autocompleteCallback: function(json) {
			var keyword = this.tagElement.textContent;
			if (json.length) {
				var tag = "#"+keyword;
				var keywords = typeof localStorage[tag] != "undefined" ? localStorage[tag] : "";
				localStorage[tag] = JSON.stringify(json);

				for (var i = 0, len = 5; i < len; i++) {
					var item = Scv.getItem({id : "autocomplete", idx : i});
					if(json.length < len){
						console.log(item);
						typeof item.el != "undefined" ? Scv.removeItem({id : "autocomplete", idx: i}) : "";
					}else{
						var s = json[i].s;

						var obj = {
							text : s.replace(/%20/gi, "_"),
							keyword : s.replace(keyword, "<span>"+keyword+"</span>"),
							href : s,
							index : i
						}

						typeof item.el != "undefined" ? Scv.setItem({id : "autocomplete", idx: i, data : obj}) : Scv.addItem({id : "autocomplete", data : obj});
					}
				}
			}else{
				this.formElement.className = "";
			}
		},
		firebaseCallback: function(json) {
			if (typeof json != "undefined") {
				var tpl = "",
					img = "",
					key = json.name,
					tag = this.tagElement.textContent,
					data = this.firebaseCallback.data;
					data.key = key;
				if (typeof data.img != "undefined") for (var g = 0, len2 = data.img.length - 1; g <= len2; g++) {
					img += forum.thread_mediaTpl(json, key, g);
				}
				if (dom.body.className == "thread") {
					var forms = this.threadElement.innerHTML,
						radio = dom.querySelector("[name='switch']:checked"),
						id = radio.id.replace("switch", ""),
						el = dom.getElementById(id);
					radio.checked = false;
					tpl = forum.threadTemplate(key, data, img);
					el ? el.outerHTML += tpl : this.threadElement.innerHTML = tpl;
				} else {
					data.parent = key;
					data.timestamp = data.date;
					data.date = this.dateFormatFn(data.date);
					// var el = dom.getElementsByTagName("threads")[0];
					// console.log(el.querySelector("[name='date']").value == data.timestamp); 

					Scv.addItem({id : "threads", data : data, insert : "prepend"});
				}
				this.formElement.content.value = "";
				delete this.firebaseCallback.data;
			}
		},
		deleteCallback: function(json) {
			if (json === null) {
				var keyword = this.tagElement.textContent,
					id = this.deleteCallback.id,
					form = dom.getElementById(id),
					_switch = dom.getElementById("switch" + id),
					media = dom.querySelectorAll("." + id),
					contents = dom.getElementById("content" + id);
				form ? form.remove() : "";
				contents ? contents.remove() : "";
				_switch ? _switch.remove() : "";

				if (media.length) {
					for (var i = 0, len = media.length; i < len; i++) {
						media[i].remove();
					}
				}
				var len = this.threadElement.innerHTML.trim();
				len.length == 0 ? this.utilFn(keyword) : "";
				alert(this.lang.complete.delete);
				delete this.deleteCallback.id;
			}
		},
		threadsCallback: function(json) {
			var parameters = bom.location.pathname,
				parameters = parameters ? this.locationFn(parameters) : "",
				scrollTop = this.currentScrollFn();
				
			scrollTop == 0 ? this.loadingFn(0, 1) : this.loadingFn(0);
			if (json) {
				var body = "",
					tag = parameters.tag,
					keys = Object.keys(json).sort().reverse(),
					el = dom.getElementsByName("threads")[0],
					scrolling = el && scrollTop == 0;
				for (var i = 0, len1 = keys.length; i < len1; i++) {
					var key = keys[i],
						img = "",
						content = "";
					if (typeof json[key].img != "undefined") for (var g = 0, len2 = json[key].img.length - 1; g <= len2; g++) {
						img += forum.thread_mediaTpl(json, key, g);
					}
					var data = json[key];
					var obj = {
						class : typeof data.root == "undefined" ? "root" : "",
						root : data.root,
						parent : data.parent,
						timestamp : data.date,
						key : key,
						tag : tag,
						img : img,
						email : data.email,
						name : data.name,
						profile : data.profile,
						date : this.dateFormatFn(data.date),
						thread_key : typeof data.root != "undefined" ? data.root + "#" + key : key,
						content : data.content,
						pager : i == 0 ? "on" : "",
						uid : new Date().getTime()
					};

					if(scrolling){
						Scv.addItem({id : "threads", data : obj, insert : "prepend"});
					}else{
						if (typeof parameters.user == "undefined") {
							Scv.addItem({id : "threads", data : obj});
							this.scrollInit(1);
						} else {
							Scv.addItem({id : "threads", data : obj});
						}
					}
				}
			} else {
				var $croll = this.scroll;
				scrollTop == 0 ? $croll.before = true : $croll.after = true;
				$croll.before && $croll.after ? this.scrollInit(0) : this.scrollInit(1);
				if(typeof parameters.date != "undefined"){
					!dom.getElementById("thread_none") ? this.threadsElement.innerHTML += '<input type="hidden" name="date" value="'+parameters.date+'" /><a href="javascript:forum.scrollFn()" id="thread_none">&olarr;</a>' : '';
				}else{
					!dom.getElementById("thread_none") ? this.threadsElement.innerHTML += '<a href="javascript:forum.scrollFn()" id="thread_none">&olarr;</a>' : '';
				}

				
			}
		},
		threadCallback: function(json) {
			var date,
				parameters = bom.location.pathname,
				parameters = this.locationFn(parameters),
				id = parameters.id,
				tag = parameters.tag;
			if (typeof json.name != "undefined") {
				var key = "";
				if (typeof json.root == "undefined") {
					var map = json;
					json = {};
					json[id] = map;
					key = id;
				} else {
					key = json.root;
					this.jsonpFn(this.rootUrl(key));
				}
				this.jsonpFn(this.branchUrl(tag, key, date));
			}

			var keys = Object.keys(json).sort();
			for (var i = 0, len1 = keys.length; i < len1; i++) {
				var key = keys[i],
					obj = json[key],
					img = "",
					content = "";
				if (typeof obj.img != "undefined") {
					for (var g = 0, len2 = obj.img.length - 1; g <= len2; g++) {
						img += forum.thread_mediaTpl(json, key, g);
					}
				}
				forum.threadTemplate(key, obj, img);
			}
		},
		oembedCallback: function(json) {
			forum.jsonpElement.innerHTML += json.html;
			var radio = dom.querySelector("[name='switch']:checked"),
				iframe = forum.jsonpElement.getElementsByTagName("iframe");
			radio.dataset.url += iframe[0].src + ",";
			radio.dataset.img += json.thumbnail_url + ",";
			iframe[0].remove();
		},
		gistCallback: function gistCallback(json) {
			var self = this.gistCallback,
				el = dom.getElementById("media" + self.id);
			el.innerHTML += "<link rel=\"stylesheet\" href=\"" + json.stylesheet + "\">" + json.div;
			delete self["id"];
		},
		/**
  	* Error
  	* 
  */
		threadError: function() {},
		threadsError: function() {},
		homeError: function() {},
		mediaError: function() {}
	};

	var n = navigator,
		uAgent = n.userAgent.toLowerCase(),
		type = n.appName,
		lang = type == "Netscape" ? navigator.language : lang = navigator.userLanguage;
	dom.documentElement.lang = lang = lang.substr(0, 2);

	var oembedFn = function(option) {
		var e = option.event;
		var el = option.this;
		var url = typeof el.value != "undefined" ? el.value.match(forum.regex.url) : el.textContent.match(forum.regex.url);
		if(e.which == 27){
			dom.getElementsByName("keyword")[0].checked = false;
		}
		if (url) {
			for (var i = 0, len = url.length; i < len; i++) {
				var uri = url[i];
				uri.indexOf("http") > 0 ? "" : uri = "https://" + uri;
				this.jsonpElement.innerHTML = "<a id=\"a\" href=\"" + uri + "\"></a>";
				var a = dom.getElementById("a");
				var radio = dom.querySelector("[name='switch']:checked");
				if (radio.dataset.request.indexOf(a.href) < 0) {
					radio.dataset.request += a.href + ",";
					if (a.hostname == "youtu.be") {
						var id = a.pathname.replace("/", "");
						radio.dataset.url += "https://www.youtube.com/embed/" + id + ",";
						radio.dataset.img += "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg,";
					} else if (a.hostname == "www.youtube.com" || a.hostname == "m.youtube.com") {
						var id = a.search.replace("?v=", "");
						radio.dataset.url += "https://www.youtube.com/embed/" + id + ",";
						radio.dataset.img += "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg,";
					} else if (a.hostname == "vimeo.com") {
						this.ajaxFn("https://vimeo.com/api/oembed.json?url=https://" + url, "GET", "", this.oembedCallback);
					} else if (a.hostname == "soundcloud.com") {
						this.ajaxFn("https://soundcloud.com/oembed?url=" + uri + "&format=json", "GET", "", this.oembedCallback);
					} else if (a.hostname == "www.slideshare.net") {
						this.jsonpFn("https://www.slideshare.net/api/oembed/2?url=" + url + "&format=json&callback=forum.oembedCallback");
					} else if (a.hostname == "gist.github.com") {
						radio.dataset.url += url + ",";
						radio.dataset.img += "https://gist.github.com/fluidicon.png,";
					} else if (a.hostname == "jsfiddle.net") {
						radio.dataset.url += url + ",";
						radio.dataset.img += "http://doc.jsfiddle.net/_images/homepage-sm.png,";
					} else {
						radio.dataset.url += url + ",";
					}
				}
				a.remove();
			}
		} else {
			var radio = dom.querySelector("[name='switch']:checked");
			radio.dataset.url = "";
			radio.dataset.img = "";
			radio.dataset.request = "";
		}
	}

	Scv({
		id : "datalist",
		template : dom.getElementById("optionTpl").innerHTML,
		target : dom.getElementById("datalist"),
		sync : true,
		data :{
			keyword : "키워드를 선택해주세요"
		}
	});

	Scv({
		id : "txtarea",
		data : {
			txt : ""	
		},
		template : dom.getElementById("txtareaTpl").innerHTML,
		target : dom.getElementById("txtarea"),
		events : { 
			oembed: oembedFn
		}
	});


	
	Scv({
		id : "autocomplete",
		template : dom.getElementById("autocompleteTpl").innerHTML,
		target : forum.autocompleteElement,
		css : "/lib/autocomplete.css"
	});

	Scv({
		id : "thread",
		template : dom.getElementById("threadTpl").innerHTML,
		target : forum.threadElement,
		css : "/lib/thread.css",
		events : { 
			oembed: oembedFn
		}
	});

	Scv({
		id : "threads",
		template : dom.getElementById("threadsTpl").innerHTML,
		target : forum.threadsElement,
		css : "/lib/threads.css"
	});

	Scv({
		id : "game",
		template : dom.getElementById("gamesTpl").innerHTML,
		target : forum.threadsElement,
		css : "/lib/game.css"
	});

	Scv({
		id : "news",
		template : dom.getElementById("newsTpl").innerHTML,
		target : forum.threadsElement,
		css : "/lib/news.css"
	});

	forum.jsonpFn("/lang/" + lang + ".js");
})(window, document);