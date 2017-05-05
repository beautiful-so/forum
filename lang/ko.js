(function(bom, dom) {
	window.app.langInit({
		type : "ko",
		title : {
			reply : "답장 내용을 입력해주세요"	
		},
		status : {
			none : "더이상 데이터가 없습니다."
		},
		placeholder : {
			search : "검색어를 입력해주세요"
		},
		complete : {
			delete : "삭제가 완료되었습니다"
		},
		validation : {
			content : "내용을 입력해주세요",
			delete : "정말로 삭제하시겠어요?",
			keyword : "키워드를 입력해주세요",
			login : "로그인을 해주세요"
		}
	})

	dom.querySelector(".placeholder").innerHTML = "검색어를 입력해주세요";
	app.routeInit();
	app.sesstionInit();
	app.popstate ? bom.onpopstate = function(event) {app.routeInit()} : "";
})(window, document);