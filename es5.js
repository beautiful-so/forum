(function(bom, dom) {
	bom.forum = {
		api : {
			lang : "",
			popstate : typeof bom.onpopstate != "undefined",
			restUrl : "https://fora.firebaseio.com/",
			autocomplete : function(keyword) {
				return "http://" + forum.api.lang + ".wikipedia.org/w/api.php?action=opensearch&limit=10&format=json&utf8=1&callback=forum.callback.autocomplete&search=" + keyword;
			},
			game : function(type, date) {
				return "https://spreadsheets.google.com/feeds/list/1-JVlP9YIwC2DydGZvAtOSmRE-BhN32IRK8g6AfchcQU/" + type + "/public/basic?alt=json-in-script&sq=date=" + date + "&callback=forum.callback.game";
			},
			news : function() {
				return "https://" + forum.api.lang + ".wikinews.org/w/api.php?action=query&format=json&list=recentchanges&redirects=1&utf8=1&rcdir=newer&rcnamespace=0&rclimit=100&callback=forum.callback.news";
			},
			infobox : function(tag) {
				return "http://" + forum.api.lang + ".dbpedia.org/sparql?default-graph-uri=http://" + forum.api.lang + ".dbpedia.org&query=select distinct * where { <http://" + forum.api.lang + ".dbpedia.org/resource/" + tag.replace(/%20/gi, "_") + "> ?k ?o . }&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on&callback=forum.callback.infobox";
			},
			thread : function(tag, id) {
				return forum.api.restUrl + tag + "/" + id + ".json?callback=forum.callback.thread";
			},
			threads : function(tag, date, user) {
				var parameter = "";
				if(typeof user != "undefined"){
					parameter = "orderBy=\"email\"&equalTo=\"" + user + "\"&limitToLast=50";
				}else{
					parameter = (date ? "endAt=" + date + "&" : "") + "orderBy=\"date\"&limitToLast=10";
				}
				return forum.api.restUrl + tag + ".json?" + parameter + "&callback=forum.callback.threads";
			},
			root : function(tag, root) {
				return forum.api.restUrl + tag + "/" + root + ".json/?callback=forum.callback.thread";
			},
			branch : function(tag, root, date) {
				return forum.api.restUrl + tag + ".json?equalTo=\"" + root + "\"&orderBy=\"root\"&callback=forum.callback.thread";
			},
			regex : {
				url : /[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi,
                email : /^[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i
			}
		},
		element : {
			jsonp : dom.getElementById("jsonp"),
			shortcut : dom.getElementById("shortcut"),
			switch : dom.getElementById("switch"),
			form : dom.form,
			nav : dom.getElementById("nav"),
			tag : dom.getElementById("tag"),
			news : dom.getElementById("news"),
			games : dom.getElementById("games"),
			threads : dom.getElementById("threads"),
			thread : dom.getElementById("thread"),
			keyword : "",
			images : dom.getElementById("images"),
			main : dom.getElementById("main"),
			aside : dom.getElementById("aside"),
			keywords : dom.getElementById("keywords"),
			infobox : dom.getElementById("infobox")
		},
		init : {
			sesstion : function() {
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
							forum.api.auth = user.Xc;
							el = dom.querySelectorAll(".signin");
							for(var i = 0, len = el.length; i < len; i++){
								el[i].remove();
							}
						}else{
							dom.querySelectorAll(".signout").remove();
						}
					});
				};
				forum.element.jsonp.appendChild(script);
			},
			scroll : function(bool) {
				bool ? bom.onscroll = function() {bom.forum.fn.scroll()} : bom.onscroll = null;
			},
			route : function() {
				var parameters = bom.location.pathname,
					parameters = parameters ? forum.fn.location(parameters) : "";

				if(parameters.id){
					forum.route.thread(parameters);
					return;
				}else if(parameters.tag){
					forum.route.threads(parameters);
					return;
				}else{
					forum.route.home(parameters);
				}
			},
			home : function() {
				dom.body.removeAttribute("class");
				dom.title = "forum.red";
				forum.element.thread.innerHTML = "";
				forum.element.threads.innerHTML = "";
				forum.element.tag.textContent = "";
			},
			thread : function(tag) {
				var v = tag.replace("_", " ");
				v = decodeURIComponent(v);
				dom.title = v;
				forum.element.tag.textContent = v;
				dom.body.className = "thread";
				forum.element.thread.innerHTML = "";
				forum.init.scroll(0);
			},
			threads : function(tag) {
				tag = tag.replace("_", " ");
				forum.element.shortcut.innerHTML = "";
				forum.element.thread.innerHTML = "";
				forum.element.keyword = tag;
				dom.title = tag;
				forum.element.tag.textContent = tag;
				dom.body.className = "threads";
			},
			lang : function(json) {forum.lang = json}
		},
		route : {
			home : function(parameters) {
				!forum.element.news.innerHTML.length ? forum.init.scroll(0) : "";
				forum.init.home();
				if(typeof bom.onscroll == "function"){
					if(typeof parameters.date != "undefined")
						forum.fn.games(parameters)
				}else{
					forum.init.scroll(1);
					forum.fn.jsonp(forum.api.news());
					forum.fn.games(parameters);
				}
			},
			thread : function(parameters) {
				forum.init.thread(parameters.tag);
				forum.fn.jsonp(forum.api.thread(parameters.tag, parameters.id));
			},
			threads : function(parameters) {
				var tag = parameters.tag,
					tag = decodeURIComponent(tag),
					parametersUser = typeof parameters.user != "undefined",
					parametersDate = typeof parameters.date == "undefined",
					el = forum.element.threads,
					threadsLen = el.innerHTML.length,
					getDate = function() {
						var date = dom.getElementsByName("date");
							date = date.length ? date[date.length-1].value*1 : forum.fn.jsonp(forum.api.threads(tag, parameters.date));
							if(date == ((parameters.date*1)+1)){
								forum.fn.jsonp(forum.api.threads(tag, parameters.date));
							}else if(!dom.getElementById("thread_none")){
								forum.init.scroll(1);
							}
					};
				if(dom.title != tag || forum.element.infobox.innerHTML.length == 0 || (dom.body.className.indexOf("user") > 0 && !parametersUser)){
					forum.fn.jsonp(forum.api.infobox(tag));
					el.innerHTML = "";
				}
				forum.init.threads(tag);
				!threadsLen || parametersUser ? forum.init.scroll(0) : "";

				if(typeof bom.onscroll == "function"){
					getDate();
				}else{
					if(parametersUser){
						dom.body.className += " user";
						forum.fn.jsonp(forum.api.threads(tag, null, parameters.user));
						return;
					}else if(parametersDate){
						el.innerHTML.length == 0 ? forum.fn.jsonp(forum.api.threads(tag)) : getDate();
						return;
					}else{
						getDate();
					}
				}
			}
		},
		fn : {
			location : function(parameters) {
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
                                }else if(p[i].match(forum.api.regex.email)){
                                    path.email = p[i];
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
			prettyDate : function(date) {
				console.log(date);
				var d = [];
					d.push(date.substr(0, 4));
					d.push(date.substr(4, 2));
					d.push(date.substr(6, 6));
					d = d.toString().replace(/,/gi,"-");
					d = new Date(d).getTime()-1;
					d = new Date(d).toISOString().substr(0,10).replace(/-/gi,"");
				return d;
			},
			games : function(parameters) {
				var date = typeof parameters.date != "undefined" ? parameters.date : new Date(new Date().getTime() - 86400000).toISOString().substr(0,10).replace(/-/gi,"");
				forum.fn.jsonp(forum.api.game(1, date));
				forum.fn.jsonp(forum.api.game(2, date));
				forum.fn.jsonp(forum.api.game(3, date));
			},
			path : function(path, event) {
				typeof event != "undefined" ? event.preventDefault() : "";
				typeof path != "string" ? path = path.href : "";
				if(forum.api.popstate){
					history.pushState("", "PushState - 1", path);
					forum.init.route();
				}else{
					bom.location.href = path;
				}
			},
			notFound : function(el, index) {
				var elm = dom.getElementById(el.name+"_"+index);
					elm.parentNode.removeChild(elm);
				if(el.name == "infobox_image")
					dom.getElementsByName(el.name)[0].checked = true;
			},
			clear : function(){
				forum.element.jsonp.innerHTML = "";
			},
			jsonp : function(url, callback) {
				var script = dom.createElement("script");
				script.src = url;
				script.onload = "forum.fn.clear()";
				forum.element.jsonp.appendChild(script);
			},
			ajax : function(url, method, data, type) {
				var xhr = bom.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
				xhr.onreadystatechange = function(e) {
					if (e.target.readyState == 4 && e.target.status == 200){
						var json = eval("("+e.target.responseText+")");
						if(typeof type == "function"){
							type(json);
						}else{
							forum.callback[type](json);
						}
						return;
					}else{
						console.log(e);
					}
				};
				xhr.open(method, url, true);
				data ? xhr.send(data) : xhr.send();
			},
			oembed : function(el) {
				var url = typeof el.value != "undefined" ? el.value.match(forum.api.regex.url) : el.textContent.match(forum.api.regex.url);
				if(url){
					for(var i = 0, len = url.length; i < len; i++){
						var uri = url[i];
						uri.indexOf("http") > 0 ? "" : uri = "https://" + uri;
						forum.element.jsonp.innerHTML = "<a id=\"a\" href=\"" + uri + "\"></a>";
						var a = dom.getElementById("a");
						var radio = dom.querySelector("[name=\"switch\"]:checked");
						if(radio.dataset.request.indexOf(a.href) < 0){
							radio.dataset.request += a.href + ",";
							if (a.hostname == "youtu.be") {
								var id = a.pathname.replace("/", "");
								radio.dataset.url += "https://www.youtube.com/embed/" + id + ",";
								radio.dataset.img += "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg,";
							}else if(a.hostname == "www.youtube.com" || a.hostname == "m.youtube.com"){
								var id = a.search.replace("?v=", "");
								radio.dataset.url += "https://www.youtube.com/embed/" + id + ",";
								radio.dataset.img += "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg,";
							}else if(a.hostname == "vimeo.com"){
								forum.fn.ajax("https://vimeo.com/api/oembed.json?url=https://" + url, "GET", "", forum.callback.oembed);
							}else if(a.hostname == "soundcloud.com"){
								forum.fn.ajax("https://soundcloud.com/oembed?url=" + uri + "&format=json", "GET", "", forum.callback.oembed);
							}else if(a.hostname == "www.slideshare.net"){
								forum.fn.jsonp("https://www.slideshare.net/api/oembed/2?url=" + url + "&format=json&callback=forum.callback.oembed");
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
					var radio = dom.querySelector("[name=\"switch\"]:checked");
					radio.dataset.url = "";
					radio.dataset.img = "";
					radio.dataset.request = "";
				}
			},
			keywordFocus : function(e) {
				var area = !(dom.getElementById("shortcut").textContent.length > 0),
					keywords = dom.getElementsByName("keyword"),
					keyword = forum.element.tag.textContent,
					len = keywords.length,
					autocomplete = function() {
						len > 0 || area ? forum.fn.jsonp(forum.api.autocomplete(keyword)) : "";
					},
					submit = function() {
						var checked = dom.querySelector("input[name=\"keyword\"]:checked"),
							check = checked ? checked.value : 0,
							v = forum.element.tag.textContent;
						if(v.length > 0 || checked){
							if(v != dom.title)
								check ? forum.fn.util(check) : forum.fn.util(v);
						}else{
							alert(forum.lang.validation.keyword);
							forum.element.tag.innerHTML = "";
							forum.element.switch.checked = false;
						}
					}
				switch(e.which){
					case 0 :
						submit();
						break;
					case 8 :
						autocomplete();
						break;
					case 9 :
						element.tag.removeAttribute("contenteditable");
						element.tag.setAttribute("contenteditable","true");
						break;
					case 13 :
						submit();
						break;
					case 27 :
						element.shortcut.innerHTML = "";
						break;
					case 38 :
						if(area){
							autocomplete();
						}else{
							var checked = keywords[len-1];
								checked.checked = true;
								checked.focus();
						}
						break;
					case 40 :
						area ? autocomplete() : "";
                        if(len > 1){
							var checked = keywords[1];
								checked.checked = true;
								checked.focus();
						}
						break;
					default :
						autocomplete();
						break;
				}
			},
			scroll : function(v) {
				var limit = dom.body.scrollHeight - dom.documentElement.clientHeight,
					top = dom.body.scrollTop || dom.documentElement.scrollTop;
				if(top >= limit){
					var path, parameters = bom.location.pathname,
						parameters = parameters ? forum.fn.location(parameters) : "",
						date = dom.getElementsByName("date");
						typeof parameters.date ? delete parameters.date : "";

						if(parameters.tag){
							path = "/" + parameters.tag + "/" + (date[date.length - 1].value - 1);
						}else{
							path = forum.fn.prettyDate(date[date.length - 1].value);
						}
					date ? forum.fn.path(path) : "";
					forum.init.scroll(0);
					forum.fn.loading(1);
				}
			},
			util : function(keyword) {
				var checked = forum.element.switch.checked;

				if(keyword != undefined){
					keyword = keyword.replace(/ /gi, "_");
					forum.fn.path("/" + keyword);
					return;
				}else if(!checked){
					keyword = keyword.replace(/ /gi, "_");
					forum.fn.path("/" + keyword);
					return;
				}else if(checked){
					forum.fn.post(forum.element);
				}
			},
			close : function() {
				dom.querySelector("[name=\"switch\"]:checked").checked = false;
			},
			modify : function(id){
				var el = dom.getElementById("switch"+id),
					reply = dom.getElementById("reply"+id),
					content = dom.querySelector("[for=\"switch"+id+"\"]").textContent;
				if(el.dataset.mode != "post"){
					el.dataset.mode = "post";
					reply.innerHTML = "";
				}else{
					el.dataset.mode = "modify";
					reply.innerHTML = content;
					reply.focus();
				}
			},
			reply : function(event, el, id) {
				if(event.which == 13){
					var content = el.textContent,
						path = typeof forum.element.tag.textContent != "undefined" ? forum.element.tag.textContent : "",
						el = dom.querySelector("[name=\"switch\"]:checked");
					forum.rest.post(content, path, id);

					setTimeout(function(){ el.innerHTML = "" }, 0);
				}
			},
			post : function(el) {
				var content = el.form.content.value;
				var path = typeof el.tag.textContent != "undefined" ? el.tag.textContent : "";
				forum.rest.post(content, path);
			},
			nav : function(type) {
				if(type){
					type == "Google" ? forum.fn.jsonp("https://apis.google.com/js/platform.js") : "";
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
			dateFormat : function(time) {
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
			rid : function() {
				return Math.random().toString(36).substring(20);
			},
			loading : function(v, type) {
				var dom_body = dom.body;
				v ? dom_body.className += " loading" : dom_body.className = dom_body.className.replace(" loading", "");
			}
		},
		rest : {
			post : function(content, path, id) {
				if(!forum.api.auth){
					alert(forum.lang.validation.login);
				}else if(!content.length){
					alert(forum.lang.validation.content);
				}else{
					var root = dom.getElementsByName("thread"),
						el = dom.querySelector("[name=\"switch\"]:checked"),
						data = {
							content : content,
							date : new Date().getTime(),
							profile : bom.localStorage.profile,
							email : bom.localStorage.email,
							name : bom.localStorage.name,
							lang : forum.api.lang,
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
					path = forum.api.restUrl + path + ".json?auth=" + forum.api.auth;
					var url = el.dataset.url.slice(0,-1).split(","),
						img = el.dataset.img.slice(0,-1).split(","),
						request = el.dataset.request.slice(0,-1).split(",");
					for(var i = 0, len = request.length; i < len; i++){
						data.content = data.content.replace(request[i], "");
					}
					url[0] != "" ? data.url = url : "";
					img[0] != "" ? data.img = img : "";
					data = JSON.stringify(data);
					forum.callback.firebase.data = data;
					forum.fn.ajax(path, type, data, "firebase");
				}
			},
			delete : function(tag, id) {
				var bool = confirm(forum.lang.validation.delete);
				forum.callback.delete.id = id;
				bool ? forum.fn.ajax(forum.api.restUrl + tag + "/" + id + ".json?auth=" + forum.api.auth, "DELETE", "", "delete") : "";
			}
		},
		oembed : {
			youtube : function(id) {
				dom.getElementById("media"+id).innerHTML += "<iframe src=\"https://www.youtube.com/embed/" + id + "?autoplay=1\" frameborder=\"0\"></iframe>";
			},
			default : function(id, url) {
				var el = dom.getElementById("media"+id);
				if(url.indexOf("gist.github.com") >= 0){
					forum.callback.gist.id = id;
					forum.fn.jsonp("https://" + url + ".json?callback=forum.callback.gist");
				}else if(url.indexOf("jsfiddle.net") >= 0){
					el.innerHTML += "<script src=\"https://" + url + "embed/\"></scr"+"ipt>";
					forum.fn.jsonp("https://" + url + "embed/");
				}else{
					var url = url.indexOf("youtube") >= 0 || url.indexOf("vimeo") >= 0  ? url + "?autoplay=1" : url;
					el.innerHTML += "<iframe src=\"" + url + "\"></iframe>";
				}
			}
		},
		template : {
			autocomplete : function(keyword, json, num) {
				var v = json[1][num].replace(keyword, "<span>" + keyword + "</span>");
				return "<input onkeydown=\"forum.fn.keywordFocus(event)\" id=\"keyword" + num + "\" type=\"radio\" name=\"keyword\" value=\"" + json[1][num].replace(/%20/gi, "_") + "\"><label for=\"keyword" + num + "\"><a href=\"/" + json[1][num] + "\" onclick=\"forum.fn.path(this)\">" + v + "</a></label>";
			},
			youtube : function(id) {
				return "<a class=\"media\" id=\"media" + id + "\" onclick=\"window.forum.oembed.youtube(\"" + id + "\")\"><img src=\"https://i.ytimg.com/vi/" + id + "/hqdefault.jpg\" alt=\"youtube\"></a>";
			},
			oembed : function(url, img, key) {
				var id = forum.fn.rid();
				return "<a class=\"media " + key + "\" id=\"media" + id + "\"><img src=\"" + img + "\" alt=\"\" onclick=\"window.forum.oembed.default(\"" + id + "\", \"" + url + "\")\"></a>";
			},
			news : function(pageid, title) {
				return "<li name=\"news\"><a href=\"https://" + forum.api.lang + ".wikinews.org/wiki/" + title + "?dpl_id=" + pageid + "\" target=\"_blank\" title=\"new window\">" + title + "</a></li>";
			},
			game : function(category, game, league, home, home_score, home_country, away, away_score, away_country, date, youtube, win, img) {
				var type = 0,
					attr = typeof youtube != "undefined" ? "href=\"https://www.youtube.com/watch?v=" + youtube + "\" target=\"_blank\" title=\"new window\"" : "";
				if(category == 1){
					type = "football";
				}else if(category == 2){
					type = "basketball";
				}else if(category == 3){
					type = "baseball";
				}

				return "<div name=\"game\" class=\"game " + win + " " + league + " " + type + "\" " + img + "><a " + attr + " class=\"title\"><dl class=\"home\"><dt><strong class=\"name\">" + home + "</strong><span class=\"country\">" + home_country + "</span></dt><dd class=\"score\">" + home_score + "</dd></dl><dl class=\"away\"><dt><strong class=\"name\">" + away + "</strong><span class=\"country\">" + away_country + "</span></dt><dd class=\"score\">" + away_score + "</dd></dl></a><input type=\"hidden\" name=\"date\" value=\"" + date + "\"></div>";
            },
			infobox_image : function(key, value, num, checked) {
				return "<label id=\"infobox_image_" + num + "\" for=\"infobox_img" + num + "\"><input id=\"infobox_image" + num + "\" type=\"radio\" name=\"infobox_image\" " + checked + "><img name=\"infobox_image\" onerror=\"forum.fn.notFound(this, " + num + ")\" src=\"http://commons.wikimedia.org/wiki/Special:Filepath/" + value + "\" alt=\"" + key + "\"></label>";
			},
			thread : function(prop, data, img) {
				img = typeof img != "undefined" ? "<div class=\"image\">" + img + "</div>" : "";
				var tag = forum.element.tag.textContent,
                    meta = "",
				parent = typeof data.parent != "undefined" ? "<input name=\"parent\" type=\"hidden\" value=\"" + data.parent + "\">" : "",
				root = typeof data.root != "undefined" ? "<input name=\"root\" type=\"hidden\" value=\"" + data.root + "\">" : "",
				setting = data.email == localStorage.email ? "<a class=\"setting\" onclick=\"forum.fn.modify(\"" + prop + "\")\" name=\"modify\">modify</a><a class=\"setting\" onclick=\"forum.rest.delete(\"" + tag + "\", \"" + prop + "\")\" name=\"remove\">remove</a>" : "";
				if(typeof data.url != "undefined"){
					var len = data.url.length;
					if(len > 0){
						for(var i = 0; len > i; i++){
							var tpl = data.img[i] ? forum.template.oembed(data.url[i], data.img[i], prop) : "<a class=\"link\" href=\"http://" + data.url[i] + "\" target=\"_blank\" title=\"new window\">#link" + (i + 1) + "</a>";
							typeof tpl != "undefined" ? meta += tpl : "";
						}
					}
				}
				return meta + "<input id=\"switch" + prop + "\" name=\"switch\" type=\"radio\" data-mode=\"post\" data-request=\"\" data-url=\"\" data-img=\"\"><form action=\"javascript:forum.fn.reply(\"" + prop + "\")\" id=\"" + prop + "\" name=\"thread\"><input type=\"hidden\" name=\"lang\" value=\"" + data.lang + "\"><div class=\"info\"><div class=\"infobox\"><a href=\"/"+tag+"/" + data.email + "\" name=\"profile\" style=\"background-image:url(" + data.profile + ")\">" + data.name + "</a><a name=\"date\">" + forum.fn.dateFormat(data.date) + "</a>" + setting + "<a class=\"close\" onclick=\"window.forum.fn.close()\"><i class=\"alt\">close</i></a></div></div><label for=\"switch" + prop + "\" name=\"content\">" + data.content + "</label><div id=\"reply"+prop+"\" title=\""+forum.lang.title.reply+"\" class=\"reply\" contenteditable onkeyup=\"window.forum.fn.oembed(this)\" onkeydown=\"forum.fn.reply(event, this, \"" + prop + "\")\"></div>" + parent + root + img + "</form>";
			},
			threads : function(json, key, tag, img) {
				var thread_key = typeof json[key].root != "undefined" ? json[key].root + "#" + key : key;
				return "<form name=\"threads\" " + (typeof json[key].root == "undefined" ? "class=\"root\"" : "") + " action=\"javascript:fetchRecord(this)\"><input name=\"root\" type=\"hidden\" value=\"" + json[key].root + "\"><input name=\"parent\" type=\"hidden\" value=\"" + json[key].parent + "\"><input name=\"date\" type=\"hidden\" value=\"" + json[key].date + "\">" + img + "<div id=\"content" + key + "\" class=\"content\"><div class=\"info\"><a class=\"profile\" href=\"/" + tag + "/" + json[key].email + "\" onclick=\"forum.fn.path(this)\"><img class=\"profile_img\" alt=\"" + json[key].name + "\" src=\"https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg\"><span class=\"name\">" + json[key].name + "</span></a><span class=\"date\">" + forum.fn.dateFormat(json[key].date) + "</span></div><a class=\"txt\" href=\"/" + tag + "/" + thread_key + "\" onclick=\"forum.fn.path(this, event)\" contenteditable=\"false\">" + json[key].content + "</a></div></form>";
			},
			thread_media : function(json, key, num) {
				return "<a class=\"thumnail\" id=\"media" + key + "\"><img src=\"" + json[key].img[num] + "\" alt=\"thumnail\"></a>";
			}
		},
		callback : {
			game : function(json) {
				var body = "",
					entry = json.feed.entry,
					category = json.feed.title.$t;

				if(typeof entry != "undefined"){
					var games = dom.getElementById("games");
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
							img = typeof youtube != "undefined" ? "style=\"background-image:url(https://i.ytimg.com/vi/" + youtube + "/hqdefault.jpg)\"" : "";

							body += forum.template.game(category, game, league, home, home_score, home_country, away, away_score, away_country, date, youtube, win, img);
						}
					}
					games.innerHTML += body;
					forum.init.scroll(1);
					forum.fn.loading(0);
				}
			},
			news : function(json) {
				var body = "";
				if(json.query.recentchanges.length){
					var list = json.query.recentchanges;
					for(var i = 0; i < 5; i++){
						var pageid = list[i].pageid,
							title = list[i].title;
						if(body.indexOf(title) < 0){
							body += forum.template.news(pageid, title);
						}
					}
					forum.element.news.innerHTML = "<ul class=\"news\">" + body + "</ul>";
				}
			},
			infobox : function(json) {
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
							images += forum.template.infobox_image(key, value.replace("파일:",""), i);
						}else if(json[i].k.value.indexOf("wikiPageWikiLink") >= 0){
							keywords += "<a href=\"/" + value + "\">" + value + "</a>";
						}
					if(key == "url" || ((key == "주소" || key == "웹사이트") && json[i].o["type"] == "uri")){
						uri = value;
					}
					if(json[i].k.value.indexOf(property) >= 0 && json[i].o["xml:lang"]){
						if(dl.indexOf("<dt>" + key + "</dt>") >= 0){
							dl += "<dt style=\"opacity:0\">" + key + "</dt><dd>" + value + "</dd>";
						}else if(value == forum.element.tag.textContent){
								dl += "<dt>" + key + "</dt><dd><a target=\"_blank\" id=\"domain_uri\">" + value + "</a></dd>";
						}else if(value.indexOf(".svg") >= 0 || value.indexOf(".jpg") >= 0 || value.indexOf(".JPG") >= 0 || value.indexOf(".png") >= 0 || value.indexOf(".PNG") >= 0 || value.indexOf(".SVG") >= 0){
								infobox_image != "" ? infobox_image += forum.template.infobox_image(key, value, i) : infobox_image += forum.template.infobox_image(key, value, i, "checked");
						}else{
								dl += "<dt>" + key + "</dt><dd>" + value + "</dd>";
						}
					}
				}
				keywords.length > 0 ? forum.element.keywords.innerHTML = "<div>" + keywords + "</div>" : element.keywords.innerHTML = "";
				dl.length > 0 ? forum.element.infobox.innerHTML = "<label for=\"more_images\"><span>more</span></label><h2>" + infobox_image + images + "</h2><dl>" + dl + "</dl>" : forum.element.infobox.innerHTML = "";
				uri.length > 0 ? dom.getElementById("domain_uri").href = uri : "";
			},
			autocomplete : function(json) {
				var body = "";
				var keyword = forum.element.tag.textContent;
				if(json.length){
					for(var i = 0, len = json[1].length; i < len; i++){
						body += forum.template.autocomplete(keyword, json, i);
					}
					forum.element.shortcut.innerHTML = "<div class=\"autocomplete\">" + body + "</div>";
				}else{
					forum.element.shortcut.innerHTML = "";
				}
			},
			firebase : function(json) {
				if(typeof json != "undefined"){
					var tpl = "",
						img = "",
						key = json.name,
						tag = forum.element.tag.textContent,
						data = eval("({\""+key+"\" : "+forum.callback.firebase.data+"})");
					if(typeof data.img != "undefined")
						for(var g = 0, len2 = data.img.length-1; g <= len2; g++){
							img += forum.template.thread_media(json, key, g);
						}
					if(dom.body.className == "thread"){
						var forms = forum.element.thread.innerHTML,
							radio = dom.querySelector("[name=\"switch\"]:checked"),
							id = radio.id.replace("switch", ""),
							el = dom.getElementById(id);
						radio.checked = false;
						tpl = forum.template.thread(key, data[key], img);
						el ? el.outerHTML += tpl : forum.element.thread.innerHTML = tpl;
					}else{
						var el = dom.getElementsByName("threads")[0];
						tpl = forum.template.threads(data, key, tag, img);
						el ? el.outerHTML = tpl+el.outerHTML : forum.element.threads.innerHTML = tpl;
					}
					forum.element.form.content.value = "";
					delete forum.callback.firebase.data;
				}
			},
			delete : function(json) {
				if(json === null){
					var keyword = forum.element.tag.textContent,
						id = forum.callback.delete.id,
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
						var len = forum.element.thread.innerHTML.trim();
						len.length == 0 ? forum.fn.util(keyword) : "";
					alert(forum.lang.complete.delete);
					delete forum.callback.delete.id;
				}
			},
			threads : function(json) {
				if(json){
					var body = "",
						parameters = bom.location.pathname,
						parameters = parameters ? forum.fn.location(parameters) : "",
						tag = parameters.tag;
					var keys = Object.keys(json).sort().reverse();

					for(var i = 0, len1 = keys.length; i < len1; i++){
						var key = keys[i],
							img = "",
							content = "";
						if(typeof json[key].img != "undefined")
							for(var g = 0, len2 = json[key].img.length-1; g <= len2; g++){
								img += forum.template.thread_media(json, key, g);
							}
						body += forum.template.threads(json, key, tag, img);
					}

					if(typeof parameters.user == "undefined"){
						forum.element.threads.innerHTML += body;
						forum.init.scroll(1);
					}else{
						forum.element.threads.innerHTML = body;
					}
					forum.fn.loading(0);
				}else{
					forum.init.scroll(0);
					forum.fn.loading(0);
					!dom.getElementById("thread_none") ? forum.element.threads.innerHTML += "<div id=\"thread_none\">" + forum.lang.status.none + "</div>" : "";
				}
			},
			thread : function(json) {
				var date, parameters = bom.location.pathname,
                    parameters = forum.fn.location(parameters),
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
						forum.fn.jsonp(forum.api.root(key));
					}
					forum.fn.jsonp(forum.api.branch(tag, key, date));
				}

				var keys = Object.keys(json).sort();
				for(var i = 0, len1 = keys.length; i < len1; i++){
					var key = keys[i],
						img = "",
						content = "";
					if(typeof json[key].img != "undefined"){
						for(var g = 0, len2 = json[key].img.length-1; g <= len2; g++){
							img += forum.template.thread_media(json, key, g);
						}
					}
					if(typeof json[key].parent != "undefined"){
						dom.getElementById(json[key].parent).outerHTML += forum.template.thread(key, json[key], img);
					}else{
						forum.element.thread.innerHTML += forum.template.thread(key, json[key], img);							
					}
				}
			},
			oembed : function(json) {
				forum.element.jsonp.innerHTML += json.html;
				var radio = dom.querySelector("[name=\"switch\"]:checked"),
					iframe = forum.element.jsonp.getElementsByTagName("iframe");
				radio.dataset.url += iframe[0].src+",";
				radio.dataset.img += json.thumbnail_url+",";
				iframe[0].remove();	
			},
			gist : function(json) {
				var self = forum.callback.gist,
					el = dom.getElementById("media"+self.id);
				el.innerHTML += "<link rel=\"stylesheet\" href=\"" + json.stylesheet + "\">" + json.div;
				delete self["id"];
			}
		},
		error : {
			thread : function() {
				
			},
			threads : function() {

			},
			home : function() {

			},
			media : function() {
				
			}
		}
	}
	bom.onload = function() {
		var n = navigator,
		uAgent = n.userAgent.toLowerCase(),
		type = n.appName,
		lang = (type=="Netscape") ? navigator.language : lang = navigator.userLanguage;
		dom.documentElement.lang = forum.api.lang = lang.substr(0,2);

		forum.fn.jsonp("/lang/" + forum.api.lang + ".js");
		forum.init.route();
		forum.init.sesstion();
		forum.api.popstate ? bom.onpopstate = function(event) {forum.init.route()} : "";
	}
})(window, document);