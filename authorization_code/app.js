/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var client_id = '3b461a01c0ec4429bea5efaedc9d6206'; //'CLIENT_ID'; // Your client id
var client_secret = 'b46e7bbf14964da99658bfe217fae4d1'; // 'CLIENT_SECRET'; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // 'REDIRECT_URI'; // Your redirect uri
// var access_token = 'BQAMdCS4g3DMM5usvvNzxaZj26rjd1XkRK7fDvjBgn9iw179YsccTHwhmPOwsYT_KdE8OIe4UpBHptsysNYaWGhaszKyEdfoAXRFefIlQQsVmWrHzQLrhR2sgiaHiUSd5bkMjvBUy91r5GytiCp7m0KHbQc7';
var accessToken;
var api;
var userID;

var baseURL = 'https://api.spotify.com';
var $ = require('jQuery');

// var SpotifyWebApi = require('spotify-web-api-js');
// var spotifyApi = new SpotifyWebApi();
// spotifyApi.setPromiseImplementation(Q);



/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cookieParser());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// var urlencodedParser = bodyParser.urlencoded({ extended: false });

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;


        accessToken = access_token;

        var options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
          // var json = JSON.parse(response);
          userID = body.id;
          // console.log('hello hello');
        });

        // we can also pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});



// $(document).ready(function() {
//   console.log('ready');
// });

// app.getAristsAlbums = (id) => $.ajax({
// 	url: `https://api.spotify.com/v1/artists/${id}/albums`,
// 	method: 'GET',
// 	dataType: 'json',
// 	data: {
// 		album_type: 'album',
// 	}
// });

app.get('/playlistName', function(req, res) {
  let playlist = req.query.playlist;
  let genre = req.query.genre;

  var playlistID;

  let playlist_access_token = 'BQDYTh9RVBnvU8rwzzQEkJch4N-pO3vYGRDyI3cMTH_70U1rbZQagi2OE_vp3qCinzyD81DjPU-NRIJygf99rUUIP3rNCYFGtR4gvaCWRbGWK824N45-NeHU7IUAc1EeUBfBcRQtoxKmi0hw6yKQiDoe1h6wJTpKaSkspYy6Jp0vy1syOxWVC2BtcXRgyP3hFbOwVOfW9lgA3sJt12LpMwIWYOn0p-ac';
  let tracks_access_token = 'BQBt1XyIvAY2fVHRuDcVEBqwjdCHzOfipEduB6ogzRqc4v56u-SbJyk9rbGKvpg9Z9wNDtGbEW24WhOgPw0RqMijI7H4mjHE_tshjicrArvJ-33mGVaPIlRZGaTqwim3ldMFf9gjGUb7Fuvz';
  let features_access_token = 'BQAcgrgpN6lm6mat9QYzcGz0q2eqmyGB1NXQP99OMElWjc-_xV94fozgArLfyRoBa0zAu0Slgw3l_895zTn_XtUlfjUlLndRnZlSVrhIhu2hd8xxeLixH5CcgsomQ8Qa0U2kGbTn';
  let playlistID_access_token = 'BQBuue-MbaNSjxNW9EUbqzGa95yOiqMo6zV_8qZVWX2bzYp4boEV2yp11XbE4RuU7Awnk5vWe8YkomEuRXsJD4_JCFu85QqCmUVY7zll0gJde9tCXJ2DfmPnIAW3wDwGnMY2o6RAlFZIzGGKBM7ayGmM';
  let addTrack_access_token = 'BQACpfKLAg2kax7llDyVoUKLR_L_lvA3Hl_Q8FSzb2DbMJq7abqEAMvbKUt78sDJ8P6KRWf2kN_ui1jvsydDpOZtIoiutcpUPOWn9hBqnfSfc5Ymv9wTXUit-1TQLKe8__u0z0eS9AixWP2C2X8BY6E_9Zo8h6_HEGsFmRsGWK5JG38xpTR9S7Sn_dK5vVl9pohCgA6WCed56KuZ5Urnb2qzXmWWAma5';

  // Create playlist
  var playlistOptions = {
    method: 'POST',
    url: baseURL + '/v1/users/' + userID + '/playlists',
    headers: { 'Accept': 'application/json',
              'Authorization': 'Bearer ' + playlist_access_token,
               'Content-Type':'application/json'},
    scope: 'playlist-modify-public playlist-modify-private',
    body: JSON.stringify({name: playlist, public: false}),
    json:true
  };

  request.post(playlistOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      console.log('kfdsfkdllsf');
    }

    else {
      console.error(error);
      // console.error(body);
    }

    // Get playlist ID
    var playlistID_Options = {
      method: 'GET',
      url: baseURL + '/v1/me/playlists',
      headers: {'Accept': 'application/json',
                'Authorization': 'Bearer ' + playlistID_access_token},
      scope: 'playlist-read-private',
      json:true
    };

    request.get(playlistID_Options, function(error, response, body) {
      if(!error && response.statusCode === 200) {
        var playlists = body;

        // console.log(body);
        // console.log(playlists.items[0].id);
        playlistID = playlists.items[0].id;

      }

      else {
        console.error(error);
      }
    });
  });


  // Get user's saved tracks
  var trackOptions = {
    method: 'GET',
    url: baseURL + '/v1/me/tracks',
    headers:{ 'Accept': 'application/json',
              'Authorization' : 'Bearer ' + tracks_access_token
    },
    scope: 'user-library-read',
    json:true
  };

  request.get(trackOptions, function(error, response, body) {
    if(!error && response.statusCode === 200) {
      // console.log(body);

      var tracks = body;

      for(i=0; i<tracks.items.length; i++) {
        var currentTrack = tracks.items[i].track;

        console.log(currentTrack.name);

        // Get audio features of current track
        var featuresOptions = {
          method: 'GET',
          url: baseURL+'/v1/audio-features/'+currentTrack.id,
          headers:{ 'Accept': 'application/json',
                    'Authorization' : 'Bearer ' + features_access_token
          },
          json:true
        }

        request.get(featuresOptions, function(error, response, body) {
          var features = body;
          // console.log(features.energy);

          if(genre === 'Workout' && features.energy > 0.6) {
            // Add track to playlist
            var addTrackOptions = {
              method: 'POST',
              url: baseURL + '/v1/users/' + userID + '/playlists/' + playlistID + '/tracks',
              headers:{
                'Accept': 'application/json',
                'Authorization' : 'Bearer ' + addTrack_access_token,
                'Content-Type':'application/json'
              },
              scope:'playlist-modify-public playlist-read-private',
              body: JSON.stringify({uris: [features.uri]}),
              json:true
            }

            request.post(addTrackOptions, function(error, response, body) {
              if(!error && response.statusCode === 200) {
                console.log('works');
              }

              else {
                console.log(error);
              }

              res.send('Done');
            });
          }

          else if(genre == 'Dance' && features.danceability > 0.3) {
            // Add track to playlist
            var addTrackOptions = {
              method: 'POST',
              url: baseURL + '/v1/users/' + userID + '/playlists/' + playlistID + '/tracks',
              headers:{
                'Accept': 'application/json',
                'Authorization' : 'Bearer ' + addTrack_access_token,
                'Content-Type':'application/json'
              },
              scope:'playlist-modify-public playlist-read-private',
              body: JSON.stringify({uris: [features.uri]}),
              json:true
            }

            request.post(addTrackOptions, function(error, response, body) {
              if(!error && response.statusCode === 200) {
                console.log('works');
              }

              else {
                console.log(error);
              }

              res.send('Done');
            });
          }


        });

      }
      // res.send(tracks.items[0].track.name);

    }

    else {
      console.error(error);
    }
  });

// Old code
  // var headers = {
  //     'Accept': 'application/json',
  //     'Authorization': 'Bearer BQBCAFed9hvDs_4D1bWDSeGlX0u9pxpUrnLA2EQOk_X5D4w4YxqYhWTGev6ZzNP57jTF3CtOLuH7KNLzPvJubJF-WvANLxLIhfW3YFl-qFxDtPBDRPp-AFNMFhitLuGSR0PoZTCLXBYZgY10-l89IJdNMylwCJFWtdqfKtP-buwvGigJrjQn0LQjkKKDe23s6ocq-ZhU0aLTCizgCkcO0BG7kmeYplee',
  //     'Content-Type': 'application/json'
  // };
  //
  // var dataString = '{"description":"Newplaylistdescription","public":false,"name":"Workout"}';
  //
  // var options = {
  //     url: 'https://api.spotify.com/v1/users/mao.alex/playlists',
  //     method: 'POST',
  //     headers: headers,
  //     body: dataString
  // };
  //
  // function callback(error, response, body) {
  //     if (!error && response.statusCode == 200) {
  //         console.log(body);
  //     }
  //
  //     else {
  //       console.log('error');
  //     }
  // }
  //
  // request(options, callback);

  // spotifyApi.setAccessToken(access_token);
  //
  // spotifyApi.getArtistAlbums('43ZHCT0cAZBISjO8DG9PnE')
  // .then(function(data) {
  //   console.log('Artist albums', data);
  // }, function(err) {
  //   console.error(err);
  // });

  // res.send('BLAH BLAH BLAH');
  // res.send(req.query.playlist);

  // var $ = require('jQuery');
  // let apiURL = baseURL + '/v1/me/'

  // res.send(apiURL);

  // app.userID = (id) => $.ajax({
  //   url: app.baseURL + '/v1/me/',
  //   // beforeSend:function(xhr) {
  //   //   xhr.setRequestHeader("Authorization", "Bearer " + accessToken)
  //   // },
  //   headers:{ Authorization: 'Bearer ' + accessToken },
  //   method: 'GET',
  //   dataType: 'json',
  //   // success: function(data) {
  //   //   var json = JSON.parse(data);
  //   //   // res.send(json.stringify());
  //   //   console.log(json.stringify());
  //   // },
  //   // error: function() {
  //   //   console.log('Error retrieving API');
  //   // }
  // });

  // fetch(apiURL, {
  //   method: 'GET',
  //   headers:{Authorization: 'Bearer ' + accessToken},
  //
  //
  // });

  // app.getArists = (artist) => $.ajax({
  // 	url: 'https://api.spotify.com/v1/search',
  //
  // 	method: 'GET',
  // 	dataType: 'json',
  // 	data: {
  // 		type: 'artist',
  // 		q: artist
  // 	},
  //
  //     success: function(data) {
  //       alert(data);
  //       console.log('success');
  //       // var json = JSON.parse(data);
  //       // console.log(json.stringify());
  //     },
  //     error: function() {
  //         console.log('Error retrieving API');
  //       }
  //
  // });

  // res.send(req.query.playlist);


  // $.ajax({
  //   url: apiURL,
  //   method: 'GET',
  //   dataType: 'json'
  //   });

  // $.getJSON(apiURL, function(data) {
  //   res.send(data.stringify());
  // });

  // res.send(url);
// res.send(userID);

});

console.log('Listening on 8888');
app.listen(8888);
