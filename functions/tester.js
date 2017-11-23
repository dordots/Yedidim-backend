// Import Admin SDK
var admin = require("firebase-admin");


// Fetch the service account key JSON file contents
var serviceAccount = require("path/to/serviceAccountKey.json");

// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://yedidim-sandbox-2.firebaseio.com/"
});

// Get a database reference to our blog
var db = admin.database();
var ref = db.ref("server/saving-data/fireblog");