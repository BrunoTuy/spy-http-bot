var request = require('request');

var _processar = function( opt ){
    var _text = opt.text.toLowerCase();

    if ( _text.substring( 0, 6 ) == '/start' )
        return bot.sendMessage( opt.from.id, "Ok, iniciou. Escolhe a opção no teclado abaixo!!!", {
            keyboard: ["Listar", "Cadastrar"],
            resize_keyboard: true,
            one_time_keyboard: true
        });

    if ( _text.substring( 0, 5 ) == 'lista' )
        return _lstTeste( opt );

    if ( _text.substring( 0, 4 ) == 'ping' )
        return _ping( opt );

    bot.sendMessage( opt.from.id, "Nada!!!" );

},  _lstTeste = function( opt ){
    db.teste.find({chatId: opt.from.id}, function( err, lst ){
        console.info( lst );

        if ( err )
            bot.sendMessage( opt.from.id, err );

        else
            for ( var x = 0; x < lst.length; x++ )
                bot.sendMessage( opt.from.id, JSON.stringify( lst[x] ) );
    });

},  _ping = function( opt ){
    var _url = opt.text.toLowerCase().substring( 5 );

    db.teste.save({
        chatId: opt.from.id,
        url: _url
    }, function( err, dds ){
        console.info( err );
        console.info( dds );
    });

    request({
        url: _url,
        method: 'GET',

    }, function(error, response, body){
        console.info( 'URL: '+_url );

        console.info( 'error' );
        console.info( error );

//        console.info( 'response' );
//        console.info( response );

        if ( response )
            console.info( response.statusCode );

        else
            console.info( 'erro na requisição' );
   });

    return 'pingar -> '+_url.trim();
};

exports.processar = _processar;
