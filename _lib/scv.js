(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.Scv = factory());
}(this, (function () { 'use strict';
	var $tore;
	var $dom, dom = {};
	var options = {};
	var $for = {};
	var index = {};

	(function () { 
		var uid = Math.random().toString(36).substring(7);
		var ifrm = document.createElement("iframe");
		ifrm.setAttribute("src", "about:blank");
		ifrm.id = "scv"+uid;
		window.addEventListener('storage', storageChanged);
		document.head.appendChild(ifrm);
		$dom = document.getElementById("scv"+uid).contentDocument;
		$tore = document.getElementById("scv"+uid).contentWindow.localStorage;
	})();

	function repaint(el, value, prop){
		for(var i = 0, len = el.length; i <= len-1; i++){
			var ei = el[i];
			var attr = ei.getAttribute("-"+prop);
			var _value = ei.getAttribute(attr);

			typeof prop != "undefined" ? attr == "value" ? ei[attr] = value : ei.setAttribute(attr, value) : ei.innerHTML = value;   

		}
	}

	function diffChanged(v, prop){
		var id = v.id;
		var el, value = v.data[0][prop];
		var _dom = dom[v.id][v.idx];
		var selector = "";
		if(typeof value === "object"){
			var path = JSON.stringify(value);
			path = path.replace(/":/g,"\\\.").replace(/{"/g,"").split("\\\.");
			path.pop();
			if(path.length){
				for(var i = 0, len = path.length; i < len; i++){
					value = value[path[i]];
				}
			}
			selector = "[_"+prop+"-"+path.toString().replace(/,/g, "-")+"]";
		}else{
			selector = "[_"+prop+"]";
		}
		el = _dom.querySelectorAll(selector);
		el.length ? repaint(el, value) : el = undefined;

		var attr = "[-"+prop+"]";
		el = _dom.querySelectorAll(attr);
		el.length ? repaint(el, value, prop) : el = undefined;
	}

	// Object Diff
	function diff(obj1, obj2, v) {
		for (var prop in obj1) {
			obj1.hasOwnProperty(prop) && prop != '__proto__' ? obj1[prop] != obj2[prop] ? diffChanged(v, prop) : "" : "";
		}
	}

	// Template Engine
	function template(html, obj, id, idx, parent){
		var re = /{([^}]+)?}/g, code = 'var r=[];\n', cursor = 0, match;
		var reThis = /this\./g;
		var eRe = /(@\S+)=["']?((?:.(?!["']?\s+(?:\S+)=|[>"']))+.)["']?/g;
		var attrRe = /(\S+)=["']/g;
		var add = function(line, js) {
			var on = line.match(eRe);
			var key = "";
			var handler = "";
			if(on){
				for(var i = 0, len = on.length-1; i <= len; i++){
					var _on = on[i].split("=");
					line = line.replace(/@/, "on");
					var parameter = typeof parent != "undefined" ? "({event:event,this:this, id:\'"+id+"\', idx:"+idx+", parent : {id : '"+parent.id+"', idx : "+parent.idx+"}})\"" :  "({event:event,this:this, id:\'"+id+"\', idx: "+idx+"})\"";
					handler = "\"Scv."+id+"."+_on[1].replace(/[\'\""]/g,"")+parameter;
					line = line.replace(_on[1], handler);
				}
			}else if(reThis.exec(line) != null){
				key = line.replace(reThis, "");
				key = key.replace(/\./g, "-");
				key = key.replace(/ /g, "");
			}
			var _code = '\
			var s = r[r.length-1];\
			var key = s.match('+attrRe+');\
			var $key = "'+key+'";\
			if(s[s.length-1] == ">") { \
				r[r.length-1] = s.replace(/>$/," _'+key+'>")\
			}else if(key){\
				key = key[key.length-1];\
				var _key = key.replace("=\\\"", "").replace("=\\\'", "");\
				_key = _key != $key ? "-"+$key+"=\\\""+_key+"\\\"" : "_"+_key;\
				r[r.length-1] = s.replace(key, _key+" "+key);\
			};\
			r.push(' + line + ');\n\n';
			var _line = 'r.push("' + line.replace(/"/g, '\\"') + '");\n';
			js ? (code += _code) : (code += line != '' ? _line : '');
			return add;
		};
		while(match = re.exec(html)) {
			add(html.slice(cursor, match.index))(match[1], true);
			cursor = match.index + match[0].length;
		}
		add(html.substr(cursor, html.length - cursor));
		code += 'return r.join("");';
		return new Function(code.replace(/[\r\t\n]/g, '')).apply(obj);
	}

	function storageChanged(e){
		if(e.oldValue != e.newValue){
			var newValue = typeof e.newValue != "undefined" && e.newValue != "" ? JSON.parse(e.newValue) : "";
			var oldValue = typeof e.oldValue != "undefined" && e.oldValue != "" ? JSON.parse(e.oldValue) : "";

			var key = e.key;
			key = key.split("-!#");
			var id = key[0];
			var idx = key[1];
			var option = new Object(options[id]);

			if(typeof idx != "undefined"){
				var state = newValue ? newValue.state : "";
				option.idx = idx*1;
				option.type = state.type;

				if(state.type === "add"){
					option.insert = state.insert;
					option.cache = false;

					option.body = "<"+option.id+">"+template(option.template, newValue, id, idx, state.parent)+"</"+option.id+">";
					render(option);
				}else if(state.type === "set"){
					option.data = [newValue];
					diff(newValue, oldValue, option);
				}else if(!newValue){
					option.type = "remove";
					var _idx = index[id].indexOf(idx*1);

					var el = dom[id][idx];
					option.data = [newValue];
					el.outerHTML = "";
					delete dom[id][idx];

					index[id].splice(_idx, 1);
					index[id].length == 0 ? delete $for[id] : "";

					option.sync ? setCookie(id, index[id]) : "";
				}
				changedItem(option);
			}
		}
	}

	// build in memory dom
	function render(option){
		option.insert == "prepend" ? option.target.insertAdjacentHTML('afterbegin', option.body) : option.target.insertAdjacentHTML("beforeend", option.body);
		
		var children = option.target.children;

		!option.cache ? option.insert == "prepend" ? index[option.id].unshift(option.idx) : index[option.id].push(option.idx) : "";
		dom[option.id][option.idx.toString()] = dom[option.id] ? option.insert == "prepend" ? children[0] : children[children.length-1] : children[0];
		!option.cache && option.sync ? setCookie(option.id, index[option.id]) : "";

		if(typeof $for[option.id] != "undefined"){
			if($for[option.id].idx < $for[option.id].len){
				$for[option.id].idx = $for[option.id].idx+1;
				loop(option.id);
			}else{
				delete option.cache;
				changedItem(option);
			}
		}
	}

	function getIdx(option, idx){
		var id = option.id;
		var len = typeof dom[id] != "undefined" ? Object.keys(dom[id]).length : 0;
		var key = id + "-!#" + (typeof idx != "undefined" ? idx : len);
		return key;
	}
	
	function changedItem(option){
		option.changed ? option.changed(option) : "";
	}

	function addItem(option){
		typeof dom[option.id] == "undefined" ? dom[option.id] = {} : "";
		typeof index[option.id] == "undefined" ? index[option.id] = [] : "";
		if(option.sync){
			index[option.id] = eval("["+ getCookie(option.id) +"]");
			var len = index[option.id].length;

			if(len > 0){
				option.data = [];
				option.cache = true;
				for(var i = 0; i < len; i++){
					var idx = index[option.id][i];
					var obj = JSON.parse(localStorage.getItem(option.id+"-!#"+[idx]));

					if(obj){
						typeof obj.state != "undefined" ? obj.parent = obj.state.parent : "";
						option.data.push(obj);
					}
				}
			}else{
				option.cache = false;
			}
		}
		syncItem(option);
	}

	function syncItem(option){
  		if(typeof options[option.id] == "undefined"){
			document.createElement(option.id);
			options[option.id] = option;
		}
		if(typeof option.data != "undefined"){
			var typeof_array = typeof option.data.length == "undefined";
			typeof_array ? option.data = [option.data] : "";
			if(option.data.length > 0){
				var len = option.data.length-1;
				var for_type = typeof $for[option.id] == "undefined";
				if(typeof option.template == "undefined"){
					option.template = options[option.id].template;
					option.target = options[option.id].target;
				}
				if(option.sync){
					$for[option.id] = {
						idx : 0,
						len : len,
						option : option
					};
				}else{
					!for_type && index[option.id].length ? $for[option.id].len = Math.max.apply(null, index[option.id]) : "";
					$for[option.id] = {
						idx : (for_type ? 0 : $for[option.id].len + 1),
						len : (for_type ? len : $for[option.id].len + 1),
						option : option,
						type : typeof_array
					};
				} 
				loop(option.id);
			}
		}
	}

	function loop(id){
		var len = $for[id].len;
		var option = $for[id].option;
		var idx = $for[id].idx;

		if(typeof dom[option.id] != "undefined" && !option.cache){
			option.idx = Object.keys(dom[id]).length;
		}else if(typeof index[option.id] != "undefined"){
			typeof index[option.id][idx] != "undefined" ? option.idx = index[option.id][idx]*1 : option.idx = idx;
		}else{
			option.idx = idx;
		}
		var key = getIdx(option, idx);

		var data = option.data[($for[id].type ? 0 : idx)];
		var _data = JSON.stringify(data);

		if(!option.cache){
			data.state = {
				type : "add",
				parent : option.parent,
				insert : option.insert
			};
			_data = JSON.stringify(data);
			$tore.setItem(key, _data);
		}else{
			var parent;
			if(typeof data.state != "undefined"){
				parent = data.state.parent; 
				option.insert = data.state.insert;
			}
			option.body = "<"+option.id+">"+template(option.template, data, option.id, option.idx, parent)+"</"+option.id+">";
			option.cache = true;
			render(option);
		}
  	}

	function setItem(option){
		setTimeout(function(){
			typeof option.idx == "undefined" ? option.idx = 0 : "";
			typeof option.template == "undefined" ? option.template = options[option.id].template : "";
			var key = getIdx(option, option.idx);
			var newValue = option.data;
			var oldValue = $tore.getItem(key);

			oldValue = JSON.parse(oldValue);
			oldValue != null ? delete oldValue.state : "";
			oldValue = JSON.stringify(oldValue);
			var _newValue = JSON.stringify(newValue);

			if(oldValue != _newValue){
				newValue.state = {type : "set"};
				_newValue = JSON.stringify(newValue);
				$tore.setItem(key, _newValue);
			}
			return;
		}, 0);
	}

	function getItem(option){
		var data = {};
		var _dom = dom[option.id];
		if(typeof _dom != "undefined"){
			typeof option.idx == "undefined" ? option.idx = 0 : "";
			var len = Object.keys(_dom).length-1;
			data = JSON.parse(localStorage.getItem(option.id+"-!#"+option.idx));
			return {data : data, el : _dom[option.idx]};
		}
	}

	function removeItem(option){
		event.view ? $tore.removeItem(option.id+"-!#"+option.idx) : "";
	}

	function setCookie(cname, cvalue, exdays) {
		var d = new Date();
		d.setTime(d.getTime() + (exdays*24*60*60*1000));
		var expires = "expires="+ d.toUTCString();
		document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
	}

	function getCookie(cname) {
		var name = cname + "=";
		var decodedCookie = decodeURIComponent(document.cookie);
		var ca = decodedCookie.split(';');
		for(var i = 0; i <ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0) == ' ') {
				c = c.substring(1);
			}
			if (c.indexOf(name) == 0) {
				return c.substring(name.length, c.length);
			}
		}
		return "";
	}		

	function getStyle(option){
		var cssText = "";
		var uid = Math.random().toString(36).substring(7);
		var link = document.createElement("link");
		link.href = option.css;
		link.id = uid;
		link.rel = "stylesheet";
		link.type = "text/css";
		link.onload = function(){
			var $tyle = document.createElement('style');
			$tyle.id = uid+option.id;
			var style = $dom.styleSheets[0];
			document.head.appendChild($tyle);
			$dom.getElementById(uid).outerHTML = "";

			for(var i = 0, len = style.cssRules.length; len > i; i++){
				var cssRule = style.cssRules[i];

				if(cssRule.style){
					cssRule.cssText.indexOf(":root") === -1 ? cssText += option.id+" "+cssRule.cssText : cssText += cssRule.cssText.replace(/:root/gi, option.id);
				}else{
					var rule = "";
					for(var s = 0,len = cssRule.cssRules.length; s < len; s++){
						cssRule.cssRules[s].cssText.indexOf(":root") === -1 ? rule += option.id+" "+cssRule.cssRules[s].cssText : rule += cssRule.cssRules[s].cssText.replace(/:root/gi, option.id);
					}
					cssText += "@media "+cssRule.media.mediaText + "{"+rule+"}";
				}
			}
			$tyle.textContent = cssText;
			localStorage.setItem("$tyle_"+option.id, option.css+"_$tyle"+cssText);
		};
		$dom.head.appendChild(link);
		return cssText;
	}

	function setStyle(option){
		if(typeof option.css != "undefined" && !document.getElementById("scv_style"+option.id)){
			var cache = localStorage.getItem("$tyle_"+option.id);

			if(cache){
				cache = cache.split("_$tyle");
				if(option.css == cache[0]){
					var $tyle = document.createElement('style');
					$tyle.textContent = cache[1];
					document.head.appendChild($tyle);
				}else{
					getStyle(option);  
				}	
			}else{
				getStyle(option);
			}
		}
	}

	function init(){
		Scv.getItem = getItem;
		Scv.addItem = addItem;
		Scv.setItem = setItem;
		Scv.removeItem = removeItem;
		Scv.getCookie = getCookie;
		Scv.setCookie = setCookie;
	}

	return function(option){
		typeof Scv.getItem == "undefined" ? init() : "";
		typeof option.events != "undefined" ? Scv[option.id] = option.events : "";
		typeof option.created != "undefined" ? option.created(option) : "";
		option.cache = true;
		addItem(option);
		setStyle(option);
	};
})));