var request = require('request'),
    format = require( "./format.js" );

var processar = function( opt ){
    var _text = opt.text.toLowerCase();

    if ( _text.substring( 0, 6 ) == '/start' ){
        bot.sendMessage( opt.from.id, "Olá\n\nEsse bot tem a finalidade de monitorar URLs" );
        _menu( opt );
    }

    else {
        _getContext({
            userId: opt.from.id,
            chatId: opt.chat.id,
            callback: function( _cnx ){
                console.info( 'CNX: '+_cnx.context );

                if ( _text == 'cadastrar' )
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

                else if ( _text == 'editar' )
                    _setContext({
                        userId: opt.from.id,
                        chatId: opt.chat.id,
                        context: "edit",
                        callback: function( _cnx ){
                            opt.btn = true;

                            _lstTeste( opt );
                        }
                    });


                else if ( _text == 'listar testes' )
                    _setContext({
                        userId: opt.from.id,
                        chatId: opt.chat.id,
                        context: "log",
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

                else if ( _text == "voltar" && ( [ "test", "log" ].indexOf( _cnx.context ) > -1 || _cnx.context.substring( 0, 7 ) == "urledit" ) ){
                    _menu( opt );

                    _setContext({
                        userId: opt.from.id,
                        chatId: opt.chat.id,
                        context: "",
                        callback: function( _cnx ){
                        }
                    });
                }

                else if ( _cnx.context == "test" )
                    _testar( opt );

                else if ( _cnx.context == "log" )
                    _lstLog( opt );

                else if ( _cnx.context == 'edit' )
                    _setContext({
                        userId: opt.from.id,
                        chatId: opt.chat.id,
                        context: "urledit "+_text,
                        callback: function( _cnx ){
                            bot.sendMessage( opt.from.id, ".", {
                                reply_markup: JSON.stringify({
                                    force_reply: true,
                                    keyboard: [['Agendar Teste'],['Voltar']]})
                            });
                        }
                    });
  
                else if ( _cnx.context.substring( 0, 7 ) == 'urledit' )
                    _setContext({
                        userId: opt.from.id,
                        chatId: opt.chat.id,
                        context: "urlagd "+_cnx.context.substring( 8 ),
                        callback: function( _cnx ){
                             bot.sendMessage( opt.from.id, "Informe o tempo em minutos." );
                        }
                    });
 
                else if ( _cnx.context.substring( 0, 6 ) == 'urlagd' ){
                    if ( _text.length < 1 || isNaN( _text ) )
                          return bot.sendMessage( opt.from.id, "Informe o tempo em minutos." );

                    _setContext({
                        userId: opt.from.id,
                        chatId: opt.chat.id,
                        context: "",
                        callback: function( ){
                            var _num = parseInt( _text );

                            db.alert.update({url: _cnx.context.substring( 7 )}, {$set: {tempoAgd: _num}});

                            _menu( opt );
                        }
                    });
                }
 
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

},  _cadTeste = function( opt ){
    var _url = opt.text.toLowerCase();

    db.alert.save({
        data: new Date(),
        userId: opt.from.id,
        chatId: opt.chat.id,
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
    db.alert.find({
        userId: opt.from.id,
        chatId: opt.chat.id
    }, function( err, lst ){
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
    var _url = opt.text.toLowerCase();

    db.test.find({
        chatId: opt.chat.id,
        userId: opt.from.id,
        url: _url
    },{
        data: true,
        status: true,
        url: true,
        tempo: true
    },{
       sort: [["data", "desc"]] 
    }, function( err, lst ){
        if ( lst.length < 1 )
            return bot.sendMessage( opt.from.id, 'Nenhum teste feito para esse alerta.' );

        var _txt = "";

        for ( var x = 0; x < 20 && x < lst.length; x++ ){
            var data = new Date( lst[x].data );
            var dia = format.string.completar( data.getDate().toString(), 2 ),
                mes = format.string.completar( ( data.getMonth()+1 ).toString(), 2 ),
                ano = data.getFullYear(),
                hora = format.string.completar( data.getHours().toString(), 2 ),
                minuto = format.string.completar( data.getMinutes().toString(), 2 ),
                segundo = format.string.completar( data.getSeconds().toString(), 2 );

            _txt = dia+'/'+mes+'/'+ano+' '+hora+':'+minuto+':'+segundo+' ['+lst[x].status+']['+lst[x].tempo+'ms]\n'+_txt;
        }

        bot.sendMessage( opt.from.id, _txt );
    });

},  _testar = function( opt ){
    var _url = opt.text.trim(),
        _userId = opt.from.id,
        _chatId = opt.chat.id;

    db.alert.find({
        userId: _userId,
        chatId: _chatId,
        url: _url
    }, function( err, lst ){
        if ( lst.length < 1 ){
            if ( !opt.silent )
                return;

            return bot.sendMessage( opt.from.id, 'Alerta não cadastrado.' );
        }

        var _dtIni = new Date();

        request({
            url: lst[0].url,
            method: 'GET',

        }, function(error, response, body){
            var _tst = {
                data: new Date(),
                url: _url,
                userId: _userId,
                chatId: _chatId};

            _tst.tempo = _tst.data - _dtIni;
            _tst.status = response ? response.statusCode : false;

            db.test.save(_tst);
            db.alert.update({_id: lst[0]._id}, {$set: {ultimoTeste: new Date()}});

            if ( !opt.silent )
                bot.sendMessage( lst[0].chatId, _tst.status+' >> '+lst[0].url+' ['+_tst.tempo+'ms]' );
        });
    });

},  _menu = function( opt ){
    bot.sendMessage( opt.from.id, "Escolhe a opção no teclado abaixo!?!?", {
        reply_markup: JSON.stringify({
            force_reply: true,
            keyboard: [['Cadastrar','Editar'],['Testar agora', 'Listar testes']]})
    });

},  _agd = function( ){
    db.alert.find({tempoAgd: {$gt: 0}}, function( err, lst ){
        var _dt = new Date();

        for ( var x = 0; x < lst.length; x++ ){
            if ( !lst[x].ultimoTeste || lst[x].tempoAgd*60000 < (_dt - lst[x].ultimoTeste) )
                _testar({
                    silent: true,
                    from: {id: lst[x].userId},
                    chat: {id: lst[x].chatId},
                    text: lst[x].url 
                });
        }
    });

    setTimeout( _agd, 45000 );
};

setTimeout( _agd, 1000); 

exports.processar = processar;
