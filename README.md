# Ordinatio

## Technologies:
- NodeJS

## Management:
- GitHub (here)

The certificate and private key to it are self-generated testing ones not intended to be used in production.

## Installation:
Make sure you have installed NodeJS.

Run the command "npm init" in the project working directory. This is the folder with the "server.js" file.
This will launch the project setup wizard, accept the defaults except for the entry point, change that to "server.js".
Next, you should run "node initialisation.js" to set the administrator account.
Finally, if you want to clear the initialisation, run "node clearInit.js".

### Run all of the following to install the dependencies:
```
npm install node-gyp --save
npm install express --save
npm install express-session --save
npm install passport --save
npm install passport-local --save
npm install bcrypt --save
npm install body-parser --save
npm install sqlite3 --save
npm install method-override --save
npm install ejs --save
npm install fs --save
npm install https --save
npm install uuid --save
npm install readline --save
npm install first-run --save
npm install role-acl --save
npm install yesno --save
npm install frappe-gantt --save
npm install snapsvg --save
npm install moment --save
npm install unique-string --save
```
Alternatively, run "bash scripts/install_packages.sh".

The server can now be ran by running "node server.js".
You should see the message "Server up" if all went well.
The main page will now be accessible at "http://localhost:3000".
