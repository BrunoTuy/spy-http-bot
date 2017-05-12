var _completString = function( str, tamanho, direcao, complemento ){
    if ( !str )
        str = "";

    if ( !tamanho )
        return str;

    if ( !direcao || ~[ "E", "D" ].indexOf( direcao ) )
        direcao = 'E';

    if ( !complemento )
        complemento = "0";

    while ( str.length < tamanho )
        str = ( direcao == 'E' ? complemento : '' )+str+( direcao == 'D' ? complemento : '' );

    return str;
};

exports.string = {
    completar: _completString};
