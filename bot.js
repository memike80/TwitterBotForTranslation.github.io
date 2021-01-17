// Our Twitter library
var Twit = require('twit');

// Imports the Google Cloud client library
const {Translate} = require('@google-cloud/translate').v2;

// Creates a Google Translate client
const translate = new Translate();

// We need to include our configuration file
var T = new Twit(require('./config.js'));

// This is the URL of a search for the latest tweets on the '#coronavirus' hashtag.
var postSearch = {q: "#coronavirus", count: 9, result_type: "recent"}; 

// This function finds the latest tweet with the #COVID-19 hashtag, and retweets it.
function retweetLatest() {
	T.get('search/tweets', postSearch, function (error, data) {
	   // log out any errors and responses
	   console.log(error, data);
	   // If our search request to the server had no errors...
	   if (!error) {
           // get the text
           getText();
           
           // ...then we grab the ID of the tweet we want to retweet...
		   var retweetId = data.statuses[0].id_str; 
		   // ...and then we tell Twitter we want to retweet it!
		   T.post('statuses/retweet/' + retweetId, {}, function (error, response) {
               if (response) {
                   console.log('Success! Check your bot, it should have retweeted something.')
               }
			   // If there was an error with our Twitter call, we print it out here.
			   if (error) {
                   console.log('There was an error with Twitter:', error);
			   }
		   })
       }
	   // However, if our original search request had an error, we want to print it out here.
	   else {
           console.log('There was an error with your hashtag search:', error);
	   }
    });
}

function getText() {
	var text;

	return new Promise(function(resolve, reject) {
		T.get('search/tweets', postSearch, function (error, data) {
			// log out any errors and responses
			console.log(error, data);
			// If our search request to the server had no errors...
			if (!error) {
				// get the text from the post and store it into an array  
				text = data.statuses[0].text;
				resolve(text);
			} else {
				console.log('Something wrong, check your syntax!', error);
				reject(text);
			}
		})
	});
}

async function translateTweet() {
	// Create variable to hold translated tweet
	var translatedTweet;

	return new Promise(async function(resolve, reject) {
		// Translates tweetText from getText() into language of choice
		// stored in the language variable. Here, we are translating
		// into Chinese (lang code: zh)
		var tweetText = await getText();
		var language = "es";
		let [translations] = await translate.translate(tweetText, language);
		translations = Array.isArray(translations) ? translations : [translations];
		console.log('Translations:');
		translations.forEach((translation, i) => {
			translatedTweet = `${tweetText[i]} => (${language}) ${translation}`;
		});
		resolve(translatedTweet);
	});
}

async function postTranslatedTweet() {
	// Wait for tweet to be translated and then store in variable
	var translatedTweet = await translateTweet();
	
	// Post translated tweet
	T.post('statuses/update', { status: translatedTweet }, function(err, data, response) {
		console.log(data)
	});
}

// Run the tweetTranslation function
postTranslatedTweet();

// ...and then every hour after that. Time here is in milliseconds, so
// 1000 ms = 1 second, 1 sec * 60 = 1 min, 1 min * 60 = 1 hour --> 1000 * 60 * 60
setInterval(postTranslatedTweet, 1000 * 60 * 60);
