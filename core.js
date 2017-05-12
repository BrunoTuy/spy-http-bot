var request = require('request'),
    format = require( "./format.js" );

var processar = function( opt ){
    var _text = opt.text.toLowerCase();

    if ( _text.substring( 0, 6 ) == '/start' )
        return bot.sendMessage( opt.from.id, "Ok, iniciou.\nEscolhe a opção no teclado abaixo!?!?", {
            reply_markup: JSON.stringify({
                force_reply: true,
                keyboard: [['Cadastrar Alerta','Listar'],['Testar agora']]})
        });

    else {
        _getContext({
            userId: opt.from.id,
            chatId: opt.chat.id,
            callback: function( _cnx ){

                if ( _text == 'cadastrar alerta' )
                    _setContext({
                        userId: opt.from.id,
                        chatId: opt.chat.id,
                        context: "add",
                        callback: function( _cnx ){
                            bot.sendMessage( opt.from.id, "Agora digita a URL completa!" );
                        }
                    });

               else if ( _text == 'testar agora' )
                    _setContext({
                        userId: opt.from.id,
                        chatId: opt.chat.id,
                        context: "test",
                        callback: function( _cnx ){
                            opt.btn = true;

                            _lstTeste( opt );
                        }
                    });

                else if ( _cnx.context == "add" ){
                    _cadTeste( opt );

                    _setContext({
                        userId: opt.from.id,
                        chatId: opt.chat.id,
                        context: "",
                        callback: function( _cnx ){
                        }
                    });
                }

                else if ( _cnx.context == "test" ){
                    if ( _text == "voltar" ){
                        _menu( opt );

                        _setContext({
                            userId: opt.from.id,
                            chatId: opt.chat.id,
                            context: "",
                            callback: function( _cnx ){
                            }
                        });
                    }

                    else
                        _testar( opt );
                }

                else if ( _text == 'listar' )
                    _lstTeste( opt );

                else if ( _text.substring( 0, 4 ) == 'test' )
                    _testar( opt );

                else if ( _text.substring( 0, 3 ) == 'log' )
                    _lstLog( opt );

                else
                    bot.sendMessage( opt.from.id, "Nada!!!" );
            }
        });
    }

},  _getContext = function( opt ){
    db.context.find({
        userId: opt.userId,
        chatId: opt.chatId
    }, function( err, lst ){
        if ( err ){
            console.info( 'ERRO: '+err );

            opt.callback({context: false});
        }

        if ( lst.length < 1 )
            opt.callback({context: false});

        else
            opt.callback(lst[0]);
    });
 
},  _setContext = function( opt ){
    var _opt = opt;

    _getContext({
        userId: opt.userId,
        chatId: opt.chatId,
        callback: function( _cnx ){
            if ( !_cnx._id )
                db.context.save({
                    userId: opt.userId,
                    chatId: opt.chatId,
                    context: opt.context
                }, function( err, dds ){
                    opt.callback(dds);
                });

            else
                db.context.update({_id: _cnx._id},{$set: {context: opt.context}}, function( err, dds ){
                    opt.callback( dds );
                });
        }
    });

    _getContext( _opt );
 
},  _cadTeste = function( opt ){
    var _url = opt.text.toLowerCase();

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

        else {
            var _keys = [],
                _txt = "";

            for ( var x = 0; x < lst.length; x++ ){
                _txt += lst[x].url+"\n";
                _keys.push([ lst[x].url ]);
            }

            _keys.push([ "Voltar" ]);

            if ( opt.btn )
                bot.sendMessage( opt.from.id, "Escolhe o alerta logo abaixo!?!?", {
                    reply_markup: JSON.stringify({
                        force_reply: true,
                        keyboard: _keys})
                });

            else
                bot.sendMessage( opt.from.id, _txt );
        }
    });

},  _lstLog = function( opt ){
    var _num = opt.text.substring( 4 ).trim();

    if ( !_num || _num.length < 1 || isNaN( _num ) )
        return bot.sendMessage( opt.from.id, 'Alerta não cadastrado.' );

    db.alert.find({chatId: opt.from.id}, function( err, lst ){
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
    var _url = opt.text.trim();

    db.alert.find({url: _url}, function( err, lst ){
        if ( lst.length < 1 )
            return bot.sendMessage( opt.from.id, 'Alerta não cadastrado.' );

        var _dtIni = new Date();

        if ( !lst[0].testes )
            lst[0].testes = [];

        request({
            url: lst[0].url,
            method: 'GET',

        }, function(error, response, body){
            var _tst = {
                data: new Date()};

            _tst.tempo = _tst.data - _dtIni;
            _tst.status = response ? response.statusCode : false;

            lst[0].testes.push( _tst );

            db.alert.update({_id: lst[0]._id}, {$set: {testes: lst[0].testes}});

            bot.sendMessage( lst[0].chatId, _tst.status+' >> '+lst[0].url+' ['+_tst.tempo+'ms]' );
        });
    });

},  _menu = function( opt ){
    bot.sendMessage( opt.from.id, "Escolhe a opção no teclado abaixo!?!?", {
        reply_markup: JSON.stringify({
            force_reply: true,
            keyboard: [['Cadastrar Alerta','Listar'],['Testar agora']]})
    });
};

exports.processar = processar;
