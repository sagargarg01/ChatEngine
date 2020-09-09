const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;

// connect to mongo
mongo.connect('mongodb://localhost', function(err, clientDB){
   if(err){ console.log("ERROR IN CONNECTION MONGODB", err); return;}

   var db = clientDB.db('mongochat');

   console.log("CONNECTED TO DATABASE SUCCESSFULLY");

   // Connect to socket.io
   client.on('connection', function(socket){
      let chat = db.collection('chats');

      // create function to send status 
      sendStatus = function(s){
         socket.emit('status', s);
      }

      // get chats from mongo collection
       chat.find().limit(100).sort({_id:1}).toArray(function(err, result){
          if(err){console.log("ERROR IN FETCHING MESSAGES FROM DB", err); return;}

         //  Emit Messages
         socket.emit('output', result);
       });

      //  Handle input events
      socket.on('input', function(data){
         let name = data.name;
         let message = data.message;

         // check for name and message
         if(name == '' || message == ''){
            // Send error status
            sendStatus("Please enter a name and message");
         }
         else {
            // Insert Messages
            chat.insert({name: name, message: message}, function(){
               client.emit('output', [data]);

               // Send Status Object
               sendStatus({
                  message: 'Message Sent',
                  clear: true
               });
            });
         }
      });
      // handle Clear
      socket.on('clear', function(data){
         // remove all chats from collection
         chat.remove({}, function(){
            // Emit cleared
            socket.emit('cleared');
         });
      })
   });
});