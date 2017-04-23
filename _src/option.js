module.exports = {
    lang : {},
    popstate : typeof window.onpopstate != "undefined",
    regex : {
        url : /[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi,
        email : /^[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i
    },
    restUrl : "https://fora.firebaseio.com/tag/",
    autocompleteUrl : function(keyword) {
        return `http://${this.lang.type}.wikipedia.org/w/api.php?action=opensearch&limit=10&format=json&utf8=1&callback=forum.autocompleteCallback&search=${keyword}`;
    },
    gameUrl : function(type, date) {
        return `https://spreadsheets.google.com/feeds/list/1-JVlP9YIwC2DydGZvAtOSmRE-BhN32IRK8g6AfchcQU/${type}/public/basic?alt=json-in-script&sq=date=${date}&callback=forum.gameCallback`;
    },
    newsUrl : function() {
        return `https://${this.lang.type}.wikinews.org/w/api.php?action=query&format=json&list=recentchanges&redirects=1&utf8=1&rcdir=newer&rcnamespace=0&rclimit=100&callback=forum.newsCallback`;
    },
    infoboxUrl : function(tag) {
        return `http://${this.lang.type}.dbpedia.org/sparql?default-graph-uri=http://${this.lang.type}.dbpedia.org&query=select distinct * where { <http://${this.lang.type}.dbpedia.org/resource/${tag.replace(/%20/gi, "_")}> ?k ?o . }&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on&callback=forum.infoboxCallback`;
    },
    threadUrl : function(tag, id) {
        return `${this.restUrl}${tag}/${id}.json?callback=forum.threadCallback`;
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
        return `${this.restUrl}${tag}.json?${parameter}&callback=forum.threadsCallback`;
    },
    rootUrl : function(tag, root) {
        return `${this.restUrl}${tag}/${root}.json/?callback=forum.threadCallback`;
    },
    branchUrl : function(tag, root, date) {
        return `${this.restUrl}${tag}.json?equalTo="${root}"&orderBy="root"&callback=forum.threadCallback`;
    },
};