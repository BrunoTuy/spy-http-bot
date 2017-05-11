var	TelegramBot = require('node-telegram-bot-api'),
    mongojs = require('mongojs'),
	request = require('request'),
	_config = require('./config.json'),
	core = require('./core.js');

global.bot = new TelegramBot( _config.tokenBot, {polling: true});

bot.on('message', (msg) => {
	console.info( msg.from.id+' >> '+msg.text );

	db.logIN.save({
		cadastro: new Date(),
		mensagem: msg
	}, function( err, dds ){
		if ( err ){
			console.info( '*** *** *** Não estou conseguindo salvar mensagem no banco!' );
			console.info( err );
			console.info( msg );
		}
	});

    bot.sendMessage( msg.from.id, msg.text );
    core.processar( msg );
});

global.db = mongojs(_config.mongo.base, _config.mongo.colecoes);
