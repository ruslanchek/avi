var http = require('http');
var _ = require('underscore');
var md5 = require('MD5');

var API = function(options){
	var secret = '321d6a221f8926b5ec41ae89a3b2ae7b';

	var commonParams = _.extend({
		marker: '16886',
		host: 'beta.aviasales.ru',
		locale: 'ru',
		user_ip: '127.0.0.1'
	}, options);

	var getSignature = function(data){
		var str = '',
			objectSorted = [];

		_.each(data, function(val, key){
        	if(_.isArray(val)){
        		_.each(val, function(item){
					objectSorted.push({
						needSort: true,
						key: key,
						val: item
					});
        		});

        	} else {
                objectSorted.push({
                	val: val,
                	key: key
                });
            }
	    });

	    objectSorted = _.sortBy(objectSorted, 'key');

		var comp = [];

		_.each(objectSorted, function(item){
			if(_.isObject(item.val) && !_.isArray(item.val)){
				if(item.needSort === true){
					var items = [];

					_.each(item.val, function(val, key){
						items.push({
							val: val,
							key: key
						});
					});

					items = _.sortBy(items, 'key');

					_.each(items, function(item){
						str += item.val + ':';
					});
				}else{
					_.each(item.val, function(item){
						str += item + ':';
					});
				}
			}else{
				str += item.val + ':';
			}	
		});

		str = str.substr(0, str.length - 1);

		return md5(secret + ':' + str);
	};

	var request = function(params, done){
		var dataPre = _.extend(params, commonParams);
		var signature = getSignature(dataPre);

		dataPre.signature = signature;

		var data = JSON.stringify(dataPre);
		var result = '';

		var req = http.request({
			host: 'api.travelpayouts.com',
			port: 80,
			path: '/v1/flight_search',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
	        	'Content-Length': Buffer.byteLength(data)
			}
		}, function(res) {
			res.setEncoding('utf8');
		});

		req.on('response', function (res) {
		    var data = "";

		    res.on('data', function (chunk) {
		        data += chunk;
		    });

		    res.on('end', function(){
		    	try{
		    		var out = JSON.parse(data);
		    		done(true, out);

		    	}catch(e){
		    		console.error(data);
					done(false, null);
		    	}
		    });
		});

		req.on('error', function(e) {
			return done(false, null);
		});

		req.write(data);
		req.end();
	};

	this.search = function(data, done){
		var params = {
			trip_class: 'Y',
			passengers: {
				adults: 1,
				infants: 0,
				children: 0
			},
			segments: [
				{date: '2015-05-25', destination: 'LED', origin: 'MOW'},
				{date: '2015-06-18', destination: 'MOW', origin: 'LED'}
			]
		};

		request(params, done);
	};
};

exports = module.exports = function(req, res) {
	var api = new API({
		user_ip: '127.0.0.1'
	});

	if(req.query && req.query.request){
		var data = {};

		api.search(data, function(status, data){
			return res.json({
				status: status,
				data: data
			});
		});
	}else{
		return res.json({
			status: false,
			message: 'Error: request is empty'
		});
	}
};