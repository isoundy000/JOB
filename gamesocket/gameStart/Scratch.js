module.exports = function SetGame(pomelo,app,gameName)
{
	const async = app.get('async');
	const gameInit = require(app.getBase()+'/app/services/'+gameName+'/'+gameName+'Init.js');
	const GameProc_Base = require(app.getBase()+'/app/lib/GameProc_Base.js');
	const GPB = new GameProc_Base(6053,gameName,"刮刮樂");

	const ErrorHandler_Base = require(app.getBase()+'/app/lib/ErrorHandler_Base.js');
	const EHB = new ErrorHandler_Base();

	const gameFilter = require(app.getBase()+'/app/servers/'+gameName+'/filter/'+gameName+'Filter');
	app.configure('production|development', gameName, function() {

	    app.set("errorHandler",EHB.errorHandler);//errorHandler 名稱固定 參數在底層 D:\GIT\gamesocket\node_modules\pomelo\lib\util\constants.js
			app.filter(gameFilter());
			// app.set("BETG_TABLE",gameConfig.BETG_TABLE);
			// app.set("CASINOID",gameConfig.CASINOID);
			// app.set("GAMES_TABLE",gameConfig.GAMES_TABLE);
		  async.series({
		    A:function(callback_A){
		      GPB.Run();
		      callback_A(null,0);
		    },
		    B:function(callback_B){
		      gameInit.init(111);
		      callback_B(null,0);
		    },
		    C:function(callback_C){
		      gameInit.init(222);
		      callback_C(null,0);
		    },
		    D:function(callback_D){
		      gameInit.init(333);
		      callback_D(null,0);
		    },
		    E:function(callback_D){
		      gameInit.init(444);
		      callback_D(null,0);
		    },
		  },function(err, results) {
		    console.log(gameName+"初始化完成");
		    });
	});

}