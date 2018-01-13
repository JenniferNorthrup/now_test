// Include the necessary modules.
var sys = require( "sys" );
var http = require( "http" );
var url = require( "url" );
var path = require( "path" );
var fileSystem = require( "fs" );


// ---------------------------------------------------------- //
// ---------------------------------------------------------- //


// Create an instance of the HTTP server.
var server = http.createServer(
    function( request, response ){
        var scriptName = request.url;

        var requestdFilePath = path.join( process.cwd(), scriptName );

        fileSystem.readFile(
            requestdFilePath,
            "binary",
            function( error, fileBinary ){
                if (error){
                    response.writeHead( 404 );
                    response.end();
                    return;
                }

                response.writeHead( 200 );
                response.write( fileBinary, "binary" );
                response.end();

            }
        );
    }
);

server.listen( 8080 );

// ---------------------------------------------------------- //

// Create a local memory space for further now-configuration.
(function(){
    var nowjs = require( "now" );


    // After we have set up our HTTP server to serve up "Static"
    // files, we pass it off to the NowJS connector to have it
    // augment the server object. This will prepare it to serve up
    // the NowJS client module (including the appropriate port
    // number and server name) and basically wire everything together
    // for us.
    //
    // Everyone contains an object called "now" (ie. everyone.now) -
    // this allows variables and functions to be shared between the
    // server and the client.
    var everyone = nowjs.initialize( server );

    var primaryKey = 0;

    everyone.connected(
        function(){
            this.now.uuid = ++primaryKey;
        }
    );


    // Add a broadcast function to *every* client that they can call
    // when they want to sync the position of the draggable target.
    // In the context of this callback, "this" refers to the
    // specific client that is communicating with the server.
    everyone.now.syncPosition = function( position ){

        // Now that we have the new position, we want to broadcast
        // this back to every client except the one that sent it
        everyone.now.filterUpdateBroadcast( this.now.uuid, position );

    };


    // We want the "update" messages to go to every client except
    // the one that announced it (as it is taking care of that on
    // its own site). As such, we need a way to filter our update
    // broadcasts. By defining this filter method on the server, it
    // allows us to cut down on some server-client communication.
    everyone.now.filterUpdateBroadcast = function( masterUUID, position ){

        // Make sure this client is NOT the same client as the one
        // that sent the original position broadcast.
        if (this.now.uuid == masterUUID){
            return;
        }

        // If we've made it this far, then this client is a slave
        // client, not a master client.
        everyone.now.updatePosition( position );

    };

})();

// ---------------------------------------------------------- //

// Write debugging information to the console to indicate that
// the server has been configured and is up and running.
sys.puts( "Server is running on 8080" );