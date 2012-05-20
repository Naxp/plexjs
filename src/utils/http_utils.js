var http = require('http');
var https = require('https');
var xml2js = require('xml2js');

module.exports = function(secure, options, type, success, failure) {
    console.log(options);
    var serverReq = (secure ? https : http).request(options, function(serverRes) {
        var result = "";
        serverRes.setEncoding('utf8');
        serverRes.on('data', function(chunk){
            result += chunk;
        });
        serverRes.on('end', function(){
            if(serverRes.statusCode >= 400) {
                failure({statusCode: serverRes.statusCode, msg: "Error contacting server"});
                return;
            }
            if(type == 'xml') {
                var parser = new xml2js.Parser({ mergeAttrs: true });
                parser.parseString(result, function(err, data) {
                    if(data.hasOwnProperty('size')) {
                        if(data.size == "0") {
                            // Return 404 when accessing an empty MediaContainer
                            failure({statusCode: 404, msg: "Answer is empty"});
                            return;
                        }
                    }
                    success(data);
                    return;
                });
                return;
            }
            if(type == 'json') {
                success(JSON.parse(result));
                return;
            }
            success(result);
            return;
        });

    }).on('error', function(err) {
            failure({statusCode: 500, msg: err.message});
            return;
        }).end();
};