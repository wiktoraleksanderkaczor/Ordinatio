installation:

First install node.js

Copy the contents of this folder to location of your choosing

From the same folder as server.js, run the following commands

npm init
this will set up the project, accept the defaults except entry point, change to server.js

then run the following to install all the required packages:
npm install express --save
npm install express-flash --save
npm install express-session --save
npm install passport --save
npm install passport-local --save
npm install bcrypt --save
npm install body-parser --save
npm install sqlite3 --save
npm install method-override --save
npm install ejs --save

now you can run node dbCreate.js to create the users.sql database file, this only has to be done once
the server can now be launched by running node server.js

you should see the message "Server up"

the login/registration page will now be accessible at http://localhost:3000

