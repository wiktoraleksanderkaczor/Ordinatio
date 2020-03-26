const moment = require('moment');
const dateOne = "2001-04-10";
const dateTwo = "2001-04-15";
const dateThree = "2001-04-20";

console.log(moment(dateTwo).isBetween(dateOne, dateThree));

const timeOne = "1200";
const timeTwo = "1230";
const timeThree = "1300";

const momentOne = "2001-04-10 12:00";
const momentTwo = "2001-04-10 12:30";
const momentThree = "2001-04-10 13:00";

const lol1 = moment(momentOne).format("YYYY-MM-DDTHH:mm:ssZ");
const lol2 = moment(momentTwo).format("YYYY-MM-DDTHH:mm:ssZ");
const lol3 = moment(momentThree).format("YYYY-MM-DDTHH:mm:ssZ");
console.log(lol1);
console.log(lol2);
console.log(lol3);

console.log(moment(lol2).isBetween(lol1, lol3));