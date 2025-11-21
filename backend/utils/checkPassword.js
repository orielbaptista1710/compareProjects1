const bcrypt = require("bcryptjs");

const plainPassword = "BlueDragon@testTIME11";  
const hashFromDB   = "$2b$10$qAkD84REFo92b/tfKSffCOIWT4jtv5FzOvzFQdottJuOfwNttWgVq";

bcrypt.compare(plainPassword, hashFromDB)
  .then(match => console.log("Doess password match hash?", match))
  .catch(console.error);



