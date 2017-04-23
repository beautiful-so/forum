module.exports = {
    autocompleteTpl : function(keyword, json, num) {
        var v = json[1][num].replace(keyword, `<span>${keyword}</span>`);
        return `<input onfocus="forum.autocompleteFocusFn(this.value)" onkeydown="forum.keywordFocusFn(event)" id="keyword${num}" type="radio" name="keyword" value="${json[1][num].replace(/%20/gi, "_")}"><label for="keyword${num}"><a href="/${json[1][num]}" onclick="forum.pathFn(this,event)">${v}</a></label>`;
    },
    youtubeTpl : function(id) {
        return `<a class="media" id="media${id}" onclick="window.forum.youtubeOembed('${id}')"><img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="youtube"></a>`;
    },
    oembedTpl : function(url, img, key) {
        var id = this.ridFn();
        return `<a class="media ${key}" id="media${id}"><img src="${img}" alt="" onclick="window.forum.defaultOembed('${id}', '${url}')"></a>`;
    },
    newsTpl : function(pageid, title) {
        return `<li name="news"><a href="https://${this.lang.type}.wikinews.org/wiki/${title}?dpl_id=${pageid}" target="_blank" title=new window">${title}</a></li>`;
    },
    gameTpl : function(category, game, league, home, home_score, home_country, away, away_score, away_country, date, youtube, win, img) {
        var type = 0,
            attr = typeof youtube != "undefined" ? `href="https://www.youtube.com/watch?v=${youtube}" target="_blank" title="new window"` : "";
        if(category == 1){
            type = "football";
        }else if(category == 2){
            type = "basketball";
        }else if(category == 3){
            type = "baseball";
        }

        return `<div name="game" class="game ${win} ${league} ${type}" ${img}><a ${attr} class="title"><dl class="home"><dt><strong class="name">${home}</strong><span class="country">${home_country}</span></dt><dd class="score">${home_score}</dd></dl><dl class="away"><dt><strong class="name">${away}</strong><span class="country">${away_country}</span></dt><dd class="score">${away_score}</dd></dl></a><input type="hidden" name="date" value="${date}"></div>`;
    },
    infobox_imageTpl : function(key, value, num, checked) {
        return `<label id="infobox_image_${num}" for="infobox_img${num}"><input id="infobox_image${num}" type="radio" name="infobox_image" ${checked}><img name="infobox_image" onerror="forum.notFoundFn(this, ${num})" src="http://commons.wikimedia.org/wiki/Special:Filepath/${value}" alt="${key}"></label>`;
    },
    threadTpl : function(prop, data, img) {
        img = typeof img != "undefined" ? `<div class="image">${img}</div>` : "";
        var tag = this.tagElement.textContent,
            meta = "",
        parent = typeof data.parent != "undefined" ? `<input name="parent" type="hidden" value="${data.parent}">` : "",
        root = typeof data.root != "undefined" ? `<input name="root" type="hidden" value="${data.root}">` : "",
        setting = data.email == localStorage.email ? `<a class="setting" onclick="forum.modifyFn('${prop}')" name="modify">modify</a><a class="setting" onclick="forum.deleteRest('${tag}', '${prop}')" name="remove">remove</a>` : "";
        if(typeof data.url != "undefined"){
            var len = data.url.length;
            if(len > 0){
                for(var i = 0; len > i; i++){
                    var tpl = data.img[i] ? forum.oembedTpl(data.url[i], data.img[i], prop) : `a class="link" href="http://${data.url[i]}" target="_blank" title="new window">#link${(i + 1)}</a>`;
                    typeof tpl != "undefined" ? meta += tpl : "";
                }
            }
        }
        return `${meta}<input id="switch${prop}" name="switch" type="radio" data-mode="post" data-request="" data-url="" data-img=""> <form action="javascript:this.replyFn('${prop}')" id="${prop}" name="thread"><input type="hidden" name="lang" value="${data.lang}"><div class="info"><div class="infobox"><a href="/${tag}/${data.email}" name="profile" style="background-image:url(${data.profile})">${data.name}</a><a name="date">${this.dateFormatFn(data.date)}</a>${setting}<a class="close" onclick="window.forum.closeFn()"><i class="alt">close</i></a></div></div><label for="switch${prop}" name="content">${data.content}</label><div id="reply${prop}" title="${this.lang.title.reply}" class="reply" contenteditable onkeyup="window.forum.oembedFn(this)" onkeydown="forum.replyFn(event, this, '${prop}')"></div>${parent}${root}${img}</form>`;
    },
    threadsTpl : function(json, key, tag, img) {
        var thread_key = typeof json[key].root != "undefined" ? json[key].root + "#" + key : key;
        return `<form name="threads" ${(typeof json[key].root == "undefined" ? "class='root'" : "")} action="javascript:fetchRecord(this)"><input name="root" type="hidden" value="${json[key].root}"><input name="parent" type="hidden" value="${json[key].parent}"><input name="date" type="hidden" value="${json[key].date}">${img}<div id="content${key}" class="content"><div class="info"><a class="profile" href="/${tag}/${json[key].email}" onclick="forum.pathFn(this, event)"><img class="profile_img" alt="${json[key].name}" src="${json[key].profile}"><span class="name">${json[key].name}</span></a><span class="date">${this.dateFormatFn(json[key].date)}</span></div><a class="txt" href="/${tag}/${thread_key}" onclick="forum.pathFn(this, event)" contenteditable="false">${json[key].content}</a></div></form>`;
    },
    thread_mediaTpl : function(json, key, num) {
        return `<a class="thumnail" id="media${key}"><img src="${json[key].img[num]}" alt="thumnail"></a>`;
    },
};