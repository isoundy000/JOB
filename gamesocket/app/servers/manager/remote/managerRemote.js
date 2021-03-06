module.exports = {};

module.exports.transMoney = function (msg, uid, cb) {
	const pomelo = require('pomelo');
	const GPB = new(require(pomelo.app.getBase()+'/app/consts/Base_Param.js'))();
	const redis=pomelo.app.get('redis');
	const async=require('async');
	const PUB = new(require(pomelo.app.getBase()+'/app/lib/public_fun.js'))();
	const dbmaster=pomelo.app.get('dbmaster');
	var logId=0;
	var lib_games = new (require(pomelo.app.getBase()+'/app/lib/lib_games.js'))(); //扣款寫入member_amount_log,回傳amount_log Index ID

	async.series({
		A: function(callback_A){
			console.error('callbackA');
			/*var sql ="CALL spModifyAmount(?,?,?,?,?,?,@id); SELECT @id;";
			dbmaster.spquery(sql,[51,0,0,'',uid,msg.amount,0],(data) =>{
			    var logId = data.rows[3][0]['@id'];
			    //console.log(logId);
			    callback_A(0,logId);
			    if (data.ErrorCode!=0) {
			      callback_A(-1,logId);
			    }
			    //console.log(fields);
			});*/
			var struct_amount = new (require(pomelo.app.getBase()+'/app/lib/struct_sql.js'))(); //amount_log SQL
			struct_amount.params.type = 51;
			struct_amount.params.game_id = 0;
			struct_amount.params.game_name = 0;
		    //mid,金額,amountlogSQL
			lib_games.DeductMoney(uid,msg.amount,struct_amount,function(result)
			{
			  console.error('callbackA DB');
			  switch(result)
			  {
			    case -1:
			      console.log('查無此id');
			      callback_A(-1,result);
			      break;
			    case -2: 
			      console.log('餘額不足');
			      callback_A(-2,result);
			      break;
			    case -3:
			      console.log('扣款失敗');
			      callback_A(-3,result);
			      break;
			    case -4:
			      console.log('寫log失敗');
			      callback_A(-4,result);
			      break;
			    default:
			       //result是扣款成功後寫入amount的id
			      logId=result;
			      callback_A(0,result);
			      break;
			  }
			});
		},
		B: function(callback_B){
			console.error('callbackB');
			//GET/POST 到API
			var http = require('http'); 
			var qs = require('querystring'); 
			   
			var data = { 
			    ON: logId, 
			    ID: uid,
			    AM: msg.amount};//這是需要提交到ToCBIN的Data 
			var content = qs.stringify(data); 
			var options = { 
			    hostname: "lobby.fa88999.com", 
			    port: 8088, 
			    path: "/ToCBIN.php?" + content, 
			    method: 'GET' 
			}; 
			var req = http.request(options, function (res) { 
				console.log('callbackBRES');
				//console.log(res);
			    //console.log('STATUS: ' + res.statusCode); 
			    //console.log('HEADERS: ' + JSON.stringify(res.headers)); 
			    res.setEncoding('utf8'); 
			    res.on('data', function (chunk) {
			    	console.error('callbackB data chunk');
			        console.log('BODY: ' + chunk);
			        var data = JSON.parse(chunk)
			        if(data.ErrorCode==0){
			            callback_B(null,0);
			        }else{
			    		callback_B(1,data.ErrorMessage);
			        }
			    });
			});
			req.on('error', function (e) { 
			    console.log('problem with request: ' + e.message); 
			}); 
			req.end();
		},
		C: function(callback_C){
			console.error('callbackC');
			/*let sql ="CALL spSelectMemberMem100(?);";
			dbmaster.spquery(sql,[uid],(data) =>{
			    //res = data.rows[3][0]['@a'];
			    console.log(data.rows[0][0]['mem100']);
			    callback_C(null,data.rows[0][0]['mem100']);
			    if (data.ErrorCode!=0) {
			      return console.warn(data.message);
			    }
			});*/
			var struct_mem100 = new (require(pomelo.app.getBase()+'/app/lib/struct_sql.js'))();
			var lib_mem100 = new (require(pomelo.app.getBase()+'/app/lib/lib_SQL.js'))("users",struct_mem100);
			struct_mem100.select.mem100 = "1";
			struct_mem100.where.mid = uid;
			lib_mem100.Select(function(data){
				console.log('callbackC DB');
			    callback_C(null,data[0].mem100);
			});
		}
	},
	function(err, results)
	{
		if(err){
			cb(null,{'ErrorCode':1,'ErrorMessage':'发生错误:000'});
			
		}else{
			redis.hset(GPB.rKey_USER+uid, "TRANS_TIME", PUB.formatDate()+" "+PUB.formatDateTime());//若Redis掛了就Select users updated_at 欄位?
			cb(null,{'ErrorCode':0,'ErrorMessage':'转出成功已扣除电子游戏帐户！','Newbalance':results.C});
			
		}
	});
	
};