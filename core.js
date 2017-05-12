var request = require('request'),
    format = require( "./format.js" );

var processar = function( opt ){
    var _text = opt.text.toLowerCase();

    if ( _text.substring( 0, 6 ) == '/start' )
        return bot.sendMessage( opt.from.id, "Ok, iniciou. Escolhe a opção no teclado abaixo!!!", {
            keyboard: ["Listar", "Cadastrar"],
            resize_keyboard: true,
            one_time_keyboard: true
        });

    if ( _text.substring( 0, 3 ) == 'add' )
        _cadTeste( opt );

    else if ( _text.substring( 0, 3 ) == 'lst' )
        _lstTeste( opt );

    else if ( _text.substring( 0, 4 ) == 'test' )
        _testar( opt );

    else if ( _text.substring( 0, 3 ) == 'log' )
        _lstLog( opt );

    else
        bot.sendMessage( opt.from.id, "Nada!!!" );

},  _cadTeste = function( opt ){
    var _url = opt.text.toLowerCase().substring( 4 );

    db.alert.save({
        data: new Date(),
        chatId: opt.from.id,
        url: _url
    }, function( err, dds ){
        console.info( err );
        console.info( dds );

        if ( err )
            bot.sendMessage( opt.from.id, "Pau no cadastro.\n"+err );

        else
            bot.sendMessage( opt.from.id, "Cadastro feito com sucesso." );
    });

},  _lstTeste = function( opt ){
    db.alert.find({chatId: opt.from.id}, function( err, lst ){
        console.info( lst );

        if ( err )
            bot.sendMessage( opt.from.id, err );

        else if ( lst.length < 1 )
            bot.sendMessage( opt.from.id, "Lista zerada.\nAdicione alertas primeiro." );

        else
            for ( var x = 0; x < lst.length; x++ )
                bot.sendMessage( opt.from.id, (x+1)+": "+lst[x].url );
    });

},  _lstLog = function( opt ){
    var _num = opt.text.substring( 4 ).trim();

    if ( !_num || _num.length < 1 || isNaN( _num ) )
        return bot.sendMessage( opt.from.id, 'Alerta não cadastrado.' );

    db.alert.find({}, function( err, lst ){
        if ( lst.length < _num )
            return bot.sendMessage( opt.from.id, 'Alerta não cadastrado.' );

        if ( !lst[_num-1].testes || lst[_num-1].testes.length < 1 )
            return bot.sendMessage( opt.from.id, 'Nenhum teste feito para esse alerta.' );

        var _txt = "";

        for ( var x = 0; x < lst[_num-1].testes.length; x++ ){

            var data = new Date( lst[_num-1].testes[x].data );
            var dia = format.string.completar( data.getDate().toString(), 2 ),
                mes = format.string.completar( ( data.getMonth()+1 ).toString(), 2 ),
                ano = data.getFullYear(),
                hora = format.string.completar( data.getHours().toString(), 2 ),
                minuto = format.string.completar( data.getMinutes().toString(), 2 ),
                segundo = format.string.completar( data.getSeconds().toString(), 2 );

            _txt += dia+'/'+mes+'/'+ano+' '+hora+':'+minuto+':'+segundo+' ['+lst[_num-1].testes[x].status+']'+( lst[_num-1].testes[x].tempo ? '['+lst[_num-1].testes[x].tempo+'ms]\n' : '' );
        }

        bot.sendMessage( opt.from.id, _txt );
    });

},  _testar = function( opt ){
    var _num = opt.text.substring( 5 ).trim();

    if ( !_num || _num.length < 1 || isNaN( _num ) )
        return bot.sendMessage( opt.from.id, 'Alerta não cadastrado.' );

    db.alert.find({}, function( err, lst ){
        if ( lst.length < _num )
            return bot.sendMessage( opt.from.id, 'Alerta não cadastrado.' );

        if ( !lst[_num-1].testes )
            lst[_num-1].testes = [];

        var _dtIni = new Date();

        request({
            url: lst[_num-1].url,
            method: 'GET',

        }, function(error, response, body){
            var _tst = {
                data: new Date()};

            _tst.tempo = _tst.data - _dtIni;
            _tst.status = response ? response.statusCode : false;

            lst[_num-1].testes.push( _tst );

            db.alert.update({_id: lst[_num-1]._id}, {$set: {testes: lst[_num-1].testes}});

            bot.sendMessage( lst[_num-1].chatId, _tst.status+' >> '+lst[_num-1].url+' ['+_tst.tempo+'ms]' );
        });
    });
};

exports.processar = processar;
