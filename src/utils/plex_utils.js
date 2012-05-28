var crypto = require('crypto');
var config = require('../config');

module.exports = (function() {
    function buildPhotoBaseTranscodeUrl(authToken, server, videos, key) {
        var baseUrl = "http://" + server.host + ":" + server.port + "/photo/:/transcode?X-Plex-Token=" + authToken + "&url=";
        for(var i=0; i< videos.length; i++) {
            var video = videos[i];
            var localImageUrl;
            if(video.hasOwnProperty(key)) {
                // Use localhost as transcoding happens locally but keep port
                localImageUrl = "http://127.0.0.1:32400" + video[key];
                video[key + "TranscodeUrl"] = baseUrl + encodeURIComponent(localImageUrl);
            }
        }
        // Now all you have to do is add &width=xx&height=xx
    }

    function buildVideoTranscodeUrlSmooth(partUrl, offset, quality, is3g) {
        return buildVideoTranscodeUrlFromBase("/video/:/transcode/smooth?", partUrl, offset, quality, is3g);
    }

    function buildVideoTranscodeUrlHLS(partUrl, offset, quality, is3g) {
        return buildVideoTranscodeUrlFromBase("/video/:/transcode/segmented/start.m3u8?", partUrl, offset, quality, is3g);
    }

    function buildVideoTranscodeUrlFromBase(base, partUrl, offset, quality, is3g) {
        var now = Math.round(new Date().getTime()/1000);
        var localVideoUrl = "http://127.0.0.1:32400" + partUrl;

        var transcodeUrl = base;
        transcodeUrl += "url=" + encodeURIComponent(localVideoUrl);
        transcodeUrl += "&identifier=com.plexapp.plugins.library";
        //transcodeUrl += "&ratingKey=" + encodeURIComponent(ratingKey);
        transcodeUrl += "&offset=" + encodeURIComponent(offset);
        transcodeUrl += "&quality=" + encodeURIComponent(quality);
        transcodeUrl += "&3g=" + encodeURIComponent(is3g ? 1 : 0);
        //transcodeUrl += "&httpCookies=&userAgent=";
        var msg = transcodeUrl + "@" + now;

        var hmac = crypto.createHmac('sha256', config.transcoding.privateKey).update(msg).digest('base64');

        var result = transcodeUrl;
        result += "&X-Plex-Access-Key=" + encodeURIComponent(config.transcoding.publicKey);
        result += "&X-Plex-Access-Time=" + encodeURIComponent(now);
        result += "&X-Plex-Access-Code=" + encodeURIComponent(hmac);
        return result;
    }

    function getAuthToken(req) {
        return (req.session.server.hasOwnProperty('accessToken') ? req.session.server.accessToken : req.session.plexToken);
    }

    function populateRatingKeyFromKey(array) {
        for(var i=0; i<array.length;i++) {
            var elem = array[i]
            if(!elem.hasOwnProperty("ratingKey") && elem.hasOwnProperty("key")) {
                var idx = elem.key.lastIndexOf("/");
                elem.ratingKey = elem.key.substring(idx+1);
            }
        }
    }

    return {
        buildPhotoBaseTranscodeUrl: buildPhotoBaseTranscodeUrl,
        buildVideoTranscodeUrlHLS: buildVideoTranscodeUrlHLS,
        buildVideoTranscodeUrlSmooth: buildVideoTranscodeUrlSmooth,
        getAuthToken: getAuthToken,
        populateRatingKeyFromKey: populateRatingKeyFromKey
    }

})();