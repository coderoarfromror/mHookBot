'use strict';
const util = require('util'),
    fs = require('fs'),
    express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    Horseman = require('node-horseman'),
    crypto = require('crypto'),
    request = require('request'),
    jsonfile = require('jsonfile'),
    S = require('string'),
    QBatcher = require('qbatcher'),
    sequential = require('promise-sequential'),
     http = require('http'),
     csvWriter = require('csv-write-stream');
var SERVER_URL = '',
    All_Tutorials_ID = '267452350330424',
     wit_token = '3FLIYRSUSX5W3DH6WQAW3CADHYTY36OB',
     strsplit = require('strsplit'),
     FBMessenger = require('fb-messenger'),
    conf = require('./config/constants'),
     Greetings = ["Hello to you :D", "Ahoy ^_^",
    "Hi, I hope you're having a nice day :'D",
    "Howdy! :D",
    "Hi, I'll assest you with any math problem ^_^",
    "Hay, Let's solve some math stuff 😎",
    "Hi,glad to talk to you :D", "Oi ^_^ ",
    "Hay :D"
],
     UnderstandingTexts=[
    "Here are some sample texts. feel free to copy and paste it here and see what happens 😇",
    "And so on not just that. All related texts, I try to understand 😇😇"
],
    NotUnderstanding = ["Sorry , I don't understand,",
    "I'm sorry I don't get it :(",
    "I don't understand what you want try in another form :(",
    "I don't get what you've said. sorry",
    "I apologize but I didn't understand what you've said"
],
  Thanking = [
    "You're welcome ^_^ ",
    "Glad To Help ^_^ ",
    "I hope I was of good use ",
    "you're most welcome ^_^ "
];
const BotDescription = "Hello Name, I'm MathHook a bot that gives you a step by step solution for any math problem through tunneling your problem to Symbolab website that provides that service, then I send you the solution as an image attachment, all rights are reserved to Symbolab Inc.";
//Make an ArrayList of users (just for now) , But then it'll be a database
var Users = jsonfile.readFileSync("Data/Users/Users.json");
var TeachersGroup = [{
    id: "",
    Name: ""
}];
var StudentsGroup = [{
    id: "",
    Name: ""
}]
var PublicGroup = [{
    id: "",
    Name: ""
}];
let secondMe = {
    id: 1218640838256762
}
var me = {
    id: 1424957394212528,
    payload: "",
    Community: {
        Name: "",
        isRegistered: false,
        Class: "",
        Group: "",
        isLogged: false
    }
};
//Users.push(me);
var APP_SECRET = '204f009f74118f41049c66a58cdcb346',
    PAGE_ACCESS_TOKEN = conf.PAGE_TOKEN;
var messenger = new FBMessenger(PAGE_ACCESS_TOKEN)
//Debug Lines
function clickItems() {
    var $buttons = $("span.showButtonText");
    console.log($buttons.length);
    $buttons.each(function(index, $button) {
        console.log($button.innerText);
        $button.click(function() {
            $(this).data('clicked', true);
        });
    });
}

function doStuff(Graph) {
    console.log(Graph);
    if (Graph == true) {
        console.log("Found Graph");
        //horseman.crop("section#Plot_dynaimc.hide", "Graph.png");
    }
}
//console.log(messageText.match(pattern));
//console.log(encodeURIComponent('\lim _{x\to \:3}\left(-\frac{3}{7}x+\frac{4}{11}\right)'));;
//Configuring App
app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
app.use('/webhook', express.static(__dirname + '/public/Solutions'));
app.use(bodyParser.json({
    verify: verifyRequestSignature
}));
// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
//Hello Message
app.get('/', function(req, res) {
    global.SERVER_URL = req.protocol + "://" + req.get('host') + req.originalUrl;
    console.log(req.protocol + "://" + req.get('host') + req.originalUrl);
    res.render('pages/index');
});
app.get('/Solutions/', function(req, res) {
    console.log(req.protocol + "://" + req.get('host') + req.originalUrl);
    res.render('pages/index');
});
//To Verify Token
app.get('/webhook', function(req, res) {
    console.log(req.protocol + "://" + req.get('host') + req.originalUrl);
    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === "MyTestTokenPal") {
        console.log("Validating webhook");
        res.status(200).send(req.query['hub.challenge']);
    } else {
        console.error("Failed validation. Make sure the validation tokens match.");
        res.sendStatus(403);
    }
    //response.render('pages/index');
});
//To Get Message
app.post('/webhook', function(req, res) {
    global.SERVER_URL = req.protocol + "://" + req.get('host') + req.originalUrl;
    console.log("Received Post event");
    var data = req.body;
    // Make sure this is a page subscription
    if (data.object === 'page') {
        // Assume all went well.
        res.sendStatus(200);
        // You must send back a 200, within 20 seconds, to let us know
        // you've successfully received the callback. Otherwise, the request
        // will time out and we will keep trying to resend.
        //  console.log("Data . Object is "+JSON.stringify(data)+" Ends Here");
        // Iterate over each entry - there may be multiple if batched
        data.entry.forEach(function(entry) {
            var pageID = data.entry.id;
            var timeOfEvent = data.entry.time;
            // Iterate over each messaging event
            entry.messaging.forEach(function(event) {
                var CurrentUser = getCurrentUser(event);
                if (event.message) {
                    if (event.message.quick_reply == undefined) {
                        receivedTextMessage(event, CurrentUser);
                    } else {
                        receivedQuickReplyMessage(event, CurrentUser);
                    }
                } else if (event.postback) {
                    receivedPostback(event, CurrentUser);
                } else {
                    console.log("Webhook received unknown event: ", event);
                }
            });
        });

    } else {
        console.log("The update is: ", JSON.stringify(data))
        res.sendStatus(200)
    }

});
//App Listening for requests
app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
setInterval(function() {
    http.get("http://nodebot123.herokuapp.com/");
}, 300000); // every 5 minutes (300000)

setInterval(function() {
    jsonfile.writeFileSync("Data/Users/Users.json", Users, {
        flag: 'w'
    })
}, 300000); // every 5 minutes (300000)
//Verify Json Signature and Solving The Problem
//Get Current User
function getCurrentUser(event) {
    var Exists = false;
    var senderID = event.sender.id;
    let CurrentUser = JSON.parse(JSON.stringify(Users[0]))
    CurrentUser.id = senderID
    console.log("PROM CUrrent user from file")
    console.log("The Whole Users ", JSON.stringify(Users))
    for (var i = 0; i < Users.length; i++) {
        if (Users[i].id == senderID) {
            console.log("The User exists , I'll take the payload");
            console.log("The User Course ", JSON.stringify(Users[i].Courses))
            Exists = true;
            CurrentUser = Users[i];
            break;
        }
    }
    if (!Exists) {
        console.log("Pushing current User")
        Users.push(CurrentUser);
    }
    return CurrentUser;
}
//Search for Examples Payload
function searchPayload(search_query, callback) {
    var re = /\ /g;
    var ExamplesFound = [];
    for (var i = 0; i < search_query.length; i++) {
        search_query[i] = search_query[i].replace(re, '-');
        console.log(search_query[i]);
    }
    var Files = jsonfile.readFileSync("Data/Symbolab.json", 'utf-8');
    Files.forEach(function(File) {
        var Names = Object.keys(File);
        Names.forEach(function(Name) {
            File[Name].forEach(function(FileName) {
                // console.log(Name)
                // console.log(FileName);
                if (Name == "QR") {
                    var FilePath = "Data/Quick Reply/" + FileName;
                } else {
                    var FilePath = "Data/Quick Reply/" + Name + "/" + FileName;
                }
                console.log(FilePath);
                var Template = jsonfile.readFileSync(FilePath, 'utf-8');
                //  Template.quick_replies
                Template.message.quick_replies.forEach(function(quick_reply) {
                    var payload = quick_reply.payload
                     if(payload.match(/More/))
                                return
                    for (var i = 0; i < search_query.length; i++) {
                        console.log(search_query[i]);
                        var regex = new RegExp(search_query[i], "i");
                        if (payload.match(regex)) {
                            var Example = {
                                payload:payload,
                                Name: Name
                            };
                            ExamplesFound.push(Example);
                            console.log("Found it");
                        }
                    }
                });

                // console.log(Template.message.quick_replies);
            })
        })
    })
    if (ExamplesFound.length > 0) {
        console.log(ExamplesFound);
        callback(null, ExamplesFound);
    } else {
        console.log("Found nothing");
        callback("Found nothing", null);
    }
}

function SolveFor(event, payload, message) {
    var url = "";
    var senderID = "";
    var messageText = "";
    if (message == undefined) {
        console.log("Going to Solve " + payload + "and event " + event.message);
        senderID = event.sender.id
        messageText = event.message.text;
    } else {
        console.log("Going to Solve " + payload + "and message " + message);
        senderID = event.id;
        messageText = message
    }
    var query = encodeURIComponent(messageText);
    //Takes the screenshot and Then Send it in a callback
    if (payload == "") {
        url = "http://symbolab.com/solver/step-by-step/" + query;
    } else {
        url = "http://symbolab.com/solver/" + payload + "/" + query;
    }
    var solutionName = 'public/Solutions/' + senderID + '_Solution.png';
    var graphName = 'public/Solutions/' + senderID + '_Graph_Solution.png';
    sendTypingOn(senderID);
    surfSymbolab(url, solutionName, graphName, senderID);
}
//A function for receiving textMessages , not used for now but further in the future it'll be used
function receivedMessage(event) {
    // Putting a stub for now, we'll expand it in the following steps
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var message = event.message;
    console.log(event);
    console.log("Received message for user %d and page %d at %d with message:",
        senderID, recipientID, timeOfMessage);
    console.log(JSON.stringify(message));
    var isEcho = message.is_echo;
    var messageId = message.mid;
    var appId = message.app_id;
    var metadata = message.metadata;

    var messageId = message.mid;

    // You may get a text or attachment but not both
    var messageText = message.text;
    var messageAttachments = message.attachments;
    var quickReply = message.quick_reply;
    if (messageText) {} else if (messageAttachments != undefined) {
        console.log(message);
        //sendTextMessage(senderID, "Message with attachment received");
        //sendButtonMessage(recipientID);
    }

}
//Takes the TextMessageE Event and check for user and the payload then Calls The Solve For Function
function receivedTextMessage(event, CurrentUser) {
    var payload = CurrentUser.payload;
    var messageText = event.message.text;
    var messageAttachments = event.message.attachments;
    var senderID = event.sender.id; 
    var isAttachment = false
    var EmojiRegex = new RegExp(/(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|\ud83c[\udffb-\udfff])?(?:\u200d(?:[^\ud800-\udfff]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff])[\ufe0e\ufe0f]?(?:[\u0300-\u036f\ufe20-\ufe23\u20d0-\u20f0]|\ud83c[\udffb-\udfff])?)*/g);
    console.log("Current User Courses", JSON.stringify(CurrentUser.Courses))
    console.log("User id is ",senderID)
    let fileName = CurrentUser.Courses.searchSub
    if (CurrentUser.gonnaGiveQuery) {
        console.log("Gonna give query")
        let userIndex = Users.indexOf(CurrentUser)
        let intent = Users[userIndex].queryIntent
        Users[userIndex].gonnaGiveQuery = false;
        let sq = [messageText]
        sendTypingOn(CurrentUser.id)
        detectIntent(CurrentUser, intent, sq)
        return
    } else if (CurrentUser.Courses.gonnaSubmitCourse == true) {
        console.log("Gonna Submit course")
        let userIndex = Users.indexOf(CurrentUser)
        receiveCourseSubmission(userIndex, messageText)
        return
    } else if (CurrentUser.Courses.gonnaWatch == true) {
        console.log("Gonna Watch")
        let FoundElements = searchForVids(CurrentUser, messageText)
        let vidsNum = FoundElements.length
        if (vidsNum > 0) {
            let userIndex = Users.indexOf(CurrentUser)
            Users[userIndex].Courses.gonnaWatch = false;
            FoundElements.forEach(function(element) {
                sendOpenGraphTemplate(senderID, element.Link, function(err, res) {
                    if (err) {
                        console.log("Error in open graph temp ", err)
                    } else {
                    }
                })
            })
        } else {
            let userIndex = Users.indexOf(CurrentUser)
            sendTextMessage(senderID, "Sorry couldn't find related videos to watch in this section " + fileName)
            Users[userIndex].Courses.gonnaWatch = false;
        }
        return
    } else if (CurrentUser.Courses.gonnaSearch == true) {
        console.log("Gonna search")
        let FoundElements = searchForVids(CurrentUser, messageText)
        let vidsNum = FoundElements.length
        if (vidsNum > 0) {
            let userIndex = Users.indexOf(CurrentUser)
            Users[userIndex].Courses.gonnaSearch = false;
            sendTextMessage(senderID, "I've found " + vidsNum + " Videos")
            writeAndSendTutorials(senderID, FoundElements, messageText)
        } else {
            var userIndex = Users.indexOf(CurrentUser)
            sendTextMessage(senderID, "Sorry couldn't find related videos when searching in this section " + fileName)
            Users[userIndex].Courses.gonnaSearch = false;
        }
        return
    }
    for (var k = 0; k < Users.length; k++) {
        if (Users[k].id == senderID) {
            console.log("I have the user here :(")
            if (Users[k].Community.isLogged == true) {
                var UserName = Users[k].Community.Name;
                var Group = Users[k].Community.Group;
                if (!messageText && messageAttachments) {
                    isAttachment = true;
                    Chat(Users[k], event.message, Group);
                  //  sendTextMessage(senderID,"Message sent to "+Group+" Group")
                    return;
                }
                console.log("I'm Gonna Chat");
                if (messageText.match(new RegExp("^#w ", "i"))) {
                    var words = strsplit(messageText, /\s+/)
                    getUserName(senderID, function(firstName, lastName) {
                        let senderName = firstName + " " + lastName
                        let recName = words[1] + " " + words[2]
                        console.log("rec name is ", recName)
                        var recipient = getUserId(recName)
                        if (recipient == 0) {
                            sendTextMessage(senderID, "I can't find this person in person in my database")
                        } else if (!recipient.LogStatus) {
                            sendTextMessage(senderID, "Sorry, This Person is not logged to any chat. I can't send him/her anything");
                            return;
                        } else if (recipient.id && recipient.LogStatus) {
                            let newText = "";
                            for (let i = 3; i < words.length; i++) {
                                newText += words[i] + " ";
                            }
                            sendTextMessage(recipient.id, "[Whisper]" + senderName + ": " + newText)
                            sendTextMessage(senderID, "Whisper sent To " + recName + "!")
                            for (let i = 0; i < Users.length; i++) {
                                if (Users[i].id == recipient.id) {
                                    Users[i].Community.lastWhisper.id = senderID;
                                    Users[i].Community.lastWhisper.Name = senderName;
                                }
                            }
                        }
                    })
                    return;
                } else if (messageText.match(new RegExp("^#r ", "i"))) {
                    console.log("It's a reply")
                    for (let i = 0; i < Users.length; i++) {
                        if (Users[i].id == senderID) {
                            var lastWhisperId = Users[i].Community.lastWhisper.id;
                            var lastWisperName = Users[i].Community.lastWhisper.Name;
                            if (lastWhisperId == "") {
                                sendTextMessage(senderID, "You have no non-replied messages.")
                                return
                            }
                            for (let j = 0; j < Users.length; j++) {
                                if (Users[j].id == lastWhisperId) {
                                    if (!(Users[j].Community.isLogged)) {
                                        sendTextMessage(Users[i].id, "Sorry, This Person is not logged to any chat. I can't send him/her anything")
                                        return;
                                    }
                                    if (Users[j].Community.isLogged) {
                                        var replyText = "[Reply]" + lastWisperName + ": " + messageText.replace("#r", "")
                                        Users[j].Community.lastWhisper.id = Users[i].id;
                                        Users[j].Community.lastWhisper.Name = Users[i].Community.Name;
                                        sendTextMessage(lastWhisperId, replyText);
                                    }
                                }
                            }
                        }
                    }
                    return;
                } else if(messageText.match(new RegExp("^#report ","i")))
                {
                    let foundReported=false
                    let namesArray=strsplit(messageText,/\s+/)
                    let reportedName=namesArray[1]+" "+namesArray[2]
                    for(let i=0;i<Users.length;i++) { 
                        let RegularExp=new RegExp(Users[i].Community.Name,"i")
                        if(reportedName.match(RegularExp))
                        {
                            foundReported=true
                        }
                    } 
                    if(!foundReported) {
                        sendTextMessage(senderID,"I couldn't find"+reportedName+" in my database")
                    } else {
                           let reportText=messageText.replace(/^#report /,"").replace(reportedName,"")
                            sendTextMessage(senderID,"Your report has been noted and admin has been notified")
                            sendTextMessage(secondMe.id,"Report from someone to "+reportedName+". "+reportText)
                    }
                    return
                }
                Chat(Users[k], messageText, Group);
               // sendTextMessage(senderID,"Message sent to "+Group+" Group")
                return;
            }
        }
    }
    if (EmojiRegex.test(messageText)) {
        messageText = messageText.replace(EmojiRegex, '');
        if (messageText == "") {
            sendNotUnderstanding(senderID, EmojiRegex.toString());
        }
    }
    console.log(messageText);
    if (messageText) {
        var expressions = {
            ALPHA: /^[a-zA-Z!@#$%?^&_'".;: ]+$/,
            Foreign: /^[\u0600-\uFEFF!@#$%?^&_'".;:a-zA-Z ]+$/,
            NUMERIC: /^[0-9]+$/,
            ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
            MATH: /([-+]?[0-9]*\.?[0-9]+[\/\+\-\*])+([-+]?[0-9]*\.?[0-9]+)/
        };
        if (expressions['ALPHA'].test(messageText)) {
            if (messageText == "detach") {
                detach(CurrentUser)
            } else if (messageText.match(new RegExp("^Examples$", "i"))) {
                sendTextMessage(senderID, "If I'm right I'm going to search for examples for " + (payload != "") ? payload : "");
                sendTypingOn(senderID);
                getExamples(CurrentUser, payload);
            } else {
                console.log("Going to Call Wit");
                sendTypingOn(senderID);
                callWitAI(messageText.toString(), function(error, entities) {
                    if (error) {
                        console.log(error)
                    } else {
                        var sq = [];
                        if (entities.search_query) {
                            for (var i = 0; i < entities.search_query.length; i++) {
                                sq.push(entities.search_query[i].value);
                            }
                        }
                        if (entities.intent) {
                            var intent = entities.intent[0].value;
                            detectIntent(CurrentUser, intent, sq, undefined)
                        } else {
                            sendNotUnderstanding(senderID, messageText);
                            sendTypingOff(senderID);
                        }
                    }

                });
            }
        } else if (expressions['Foreign'].test(messageText)) {
            sendTextMessage(senderID, "Sorry, But I only understand English and Relavent to Math");
        } else {
            if (!(CurrentUser.payload == "")) {
                SolveFor(event, CurrentUser.payload);
            } else {
                SolveFor(event, "");
            }
        }
    } else if (messageAttachments) {
        if(messageAttachments[0].type=="image") {
            let url=messageAttachments[0].payload.url
            console.log(JSON.stringify(CurrentUser)+"DEFINED ?")
            callPixApi(CurrentUser,url,function(err,res) { 
                if(err) {
                    console.log("Error with MathPix",err)
                    sendTextMessage(CurrentUser.id,err)
                } else {
                    console.log(JSON.stringify(res))
                    let latex=res.latex
                    let latex_confidence=res.latex_confidence
                    if(latex_confidence<0.5) {
                         messenger.sendTextMessage(senderID,"Sir I'm not confident if this your equation or not "+latex+"\n if it us, just copy and paste here")
                         return
                    }
                    if(latex.indexOf("\operatorname")>-1)
                    {
                         console.log("I'm to remove operator name")
                        //latex=latex.replace(new RegExp("\\operatorname","g"),"").replace(/\ /g,"")
                    }
                    messenger.sendTextMessage(senderID,"your math problem is "+latex,function(err,res){
                        if(!err)
                        {
                            SolveFor(CurrentUser, "", latex)                            
                        } 
                            
                                    })

                }
            })
            return
        }
        
        //sendTextMessage(senderID, "I'm Programmed to Query Mathematical Problems Only , you can choose Math section from here");
        //sendMainGenericMessage(senderID, "Data/Main.json");
    }
}
//Checks Quick Reply payload to be added for the user to know where to look on symbolab
function receivedQuickReplyMessage(event, CurrentUser) {
    var Linked = false;
    let Quick_Reply = JSON.stringify(event.message.quick_reply);
    let senderID = event.sender.id;
    console.log(Quick_Reply);
    Quick_Reply = Quick_Reply.replace('{"payload":"', '');
    let payload = Quick_Reply.replace('"}', '');
    let UserFound = false;
     if(CurrentUser.Courses.gonnaSearch || CurrentUser.Courses.gonnaSubmitCourse || CurrentUser.Courses.gonnaWatch || CurrentUser.gonnaGiveQuery ) { 
        CurrentUser.Courses.gonnaSearch=false
        CurrentUser.Courses.gonnaSubmitCourse=false
        CurrentUser.Courses.gonnaWatch=false
        CurrentUser.gonnaGiveQuery=false 
    }
    switch (payload) {
        case 'registerStudent':
            Register(senderID, "Student");
            return;
        case 'registerTeacher':
            Register(senderID, "Teacher");
            return;
    }
    if (checkForCourses(senderID, payload)) {
        return;
    }
    if (payload.indexOf("More") > -1) {
        if(payload.indexOf("Quick Reply")>-1) {
            var replyFile= payload.replace(' Quick Reply', '') + '.json'
            let replyPath="Data/Quick Reply/"+replyFile
            sendQuickReply(senderID,replyPath)
            return
        }
        let indexString = strsplit(payload, /\s+/)[1]
        try {
            console.log("Index number from more ", indexString)
            let indexNumber = parseInt(indexString)
            sendGetCourses(senderID, indexNumber)
            return true;
        } catch (err) {
            return true;
        }
    } else if (payload.indexOf('payExamples') > -1) {
        sendTypingOn(CurrentUser.id)
        getExamples(CurrentUser, CurrentUser.payload)
    } else if (payload.indexOf('Example') > -1) {
        console.log("The Whole payload is ", payload)
        let splitString = strsplit(payload, /\s+/)
        let identifier = splitString[1]
        console.log("Identifier is ", identifier)
        if (identifier == "Solve") {
            let Problem = payload.replace(/Example /, "").replace(/Solve /, "").replace(/\\\\/g, '\\')
            console.log("Problem is ", Problem)
            SolveFor(CurrentUser, "", Problem)
            //  surfSymbolab("https://www.symbolab.com/solver/step-by-step",)
        } else if (identifier == "Edit") {
            sendTextMessage(senderID, "Kindly copy and the paste the example then edit and send it back to find a solution.")
        } else if (identifier == "Extra") {
            let userIndex = Users.indexOf(CurrentUser)
            let index = payload.replace(/Example /, "").replace(/Extra /, "")
            let Existance = Users[userIndex].Examples.Existance
            let Texts = Users[userIndex].Examples.Texts
            let FileLocation = Users[userIndex].Examples.FileLocation
            console.log("Index is ", index)
            sendStructuredExamples(CurrentUser, Existance, Texts, FileLocation, index)
        }
    } else if (payload.indexOf('-') > -1 && payload.indexOf('calculator')>-1) {
        let userIndex = Users.indexOf(CurrentUser)
        Users[userIndex].payload = payload
        Linked = true
        console.log("Payload has - in it")
        if (Linked) {
            let hookText = "Now you're Linked to " + payload.replace(/-/g, " ") + ". type your problem whenever you want to get examples press the button. Or type examples or detach whenever you want."
            let hookReply = [{
                content_type: "text",
                title: "🔣 Examples/Exercises",
                payload: "payExamples"
            },
            {
                content_type: "text",
                title: "🔓 Detach",
                payload: "Detach"
            }
    ]
            messenger.sendQuickRepliesMessage(senderID, hookText, hookReply)
        }
    } 
    console.log("Quick Reply is " + event.message.quick_reply);
}
//Surf Symbolab and Take ScreenShot of Solution and Graph
function surfSymbolab(url, solutionName, graphName, senderID) {
    let graphExistance=false;
    var horseman = new Horseman();
    console.log(url);
    horseman.userAgent('default')
        .viewport(2500, 3000)
        .on('consoleMessage', function(msg) {
            console.log(msg);
        })
        .on('error', function(error) {
            console.log(error);
        })
        .open(url)
        .exists('#multipleSolutions > div.new_solution_box_title')
        .then(function(SolutionExistance) {
            if (!SolutionExistance) {
                sendTextMessage(senderID, "Couldn't find Solution for this Problem, Make sure it's valid Mathematical expression");
                return horseman.close();
            }
        })
        .exists('div#canvasZoom')
        .then(function(graphExist) {
            if (graphExist==true) {
                graphExistance=true;
               // return this.crop("section#Plot_dynaimc.hide", graphName);
            } else {
                console.log("No Graph");
            }
        })
        .width("section#multipleSolutions")
        .log()
        .height("section#multipleSolutions")
        .log()
        .count("span.showButtonText")
        .evaluate(clickItems)
        .wait(100)
        .log()
        /*
         .width("section#multipleSolutions")
         .log()
         .height("section#multipleSolutions")
         .log()
         */
        .crop("section#multipleSolutions", solutionName)
        .log()
        .then(function() {
            var graphUrl = '',
                solutionUrl = '';
            horseman.close();
            //Closing
            if (fs.existsSync(solutionName)) {
                console.log('Solution Exists');
                solutionUrl = global.SERVER_URL + '/' + senderID + '_Solution.png';
                console.log(solutionUrl);
                let FoundSolutionText="Found The Solution you want ^_^ "
                messenger.sendTextMessage(senderID,FoundSolutionText,'REGULAR',function(err,res)
                {
                    if(res) {
                if (graphExistance) {
                console.log("There is a graph");
                graphUrl = global.SERVER_URL + '/' + senderID + '_Graph_Solution.png';
                console.log(graphUrl);
                sendImageMessage(senderID, graphUrl, graphName)
                sendTypingOff(senderID);
                            }
                    }
                    setTimeout(function() {
                    sendImageMessage(senderID, solutionUrl, solutionName);
                }, 1000)
                setTimeout(function() {
                    sendButtonMessage(senderID, url);
                }, 2000) 
                });
            } else {
                sendTexMessage(senderID, "Sorry but something went wrong during processing");
            }
        })
        .catch(function(err) {
            // clear current phantom and ready, and create new
            console.log(err);
        })
}
//This Function gets called once in a lifetime
function setGetStartedMessage() {
    var messageData = {
        get_started: {
            payload: "getStarted"
        }
    }
    callSendAPIGetStarted(messageData);
}
//Read JSON file and parse it to send generic message or a Quickreply
function sendMainGenericMessage(recipientId, file) {
    jsonfile.readFile(file, function(err, messageData) {
        console.log(err);
        messageData.recipient.id = recipientId;
        callSendAPI(messageData);
    });
}
//Send Examples to The User of Payload
function getExamples(CurrentUser, payload) {
    console.log("Example payload is",payload);
    let userIndex = Users.indexOf(CurrentUser)
    var Existance = ["", false, false, false];
    var FileLocation = "public/Solutions/" + CurrentUser.id.toString() + "_Example_";
    var Texts = [];
    var Links = [];
    var url = "https://www.symbolab.com/solver/" + payload;
    var horseman = new Horseman();
    horseman.userAgent('default')
        .on('consoleMessage', function(msg) {
            console.log(msg);
        })
        .on('error', function(error) {
            console.log(error);
        })
        .open(url)
        .exists('#Examples')
        .then(function(ExistanceStatus) {
            if (ExistanceStatus) {
                console.log("Exists");
            } else {
                console.log("Doesn't Exist in " + url);
            }
        })
        .evaluate(function() {
            var Texts = [];
            var Links = [];
            var Returned = {};
            var $TextsSelector = $('li span.selectable');
            var $LinksSelector = $('ul.solution-examples li a');

            $TextsSelector.each(function() {
                Texts.push($(this).text());
            });
            $LinksSelector.each(function() {
                Links.push($(this).attr("href"));
            });
            Returned = {
                Texts: Texts,
                Links: Links
            };
            return Returned;
        })
        .then(function(ListItems) {
            Texts = ListItems.Texts;
            Links = ListItems.Links;
            for (var i = 0; i < 3; i++) {
                console.log(Texts[i]);
            }
            for (var i = 0; i < 3; i++) {
                console.log(Links[i]);
            }
        })
        .exists('#Examples > div.solution_box.solution_outside_box.hide > ul > li:nth-child(1)')
        .then(function(firstChild) {
            if (firstChild) {
                return horseman.crop('#Examples > div.solution_box.solution_outside_box.hide > ul > li:nth-child(1)', FileLocation + "0.png")
            }

        })
        .exists('#Examples > div.solution_box.solution_outside_box.hide > ul > li:nth-child(2)')
        .then(function(secondChild) {
            if (secondChild) {
                Existance[1] = true;
                return horseman.crop('#Examples > div.solution_box.solution_outside_box.hide > ul > li:nth-child(2)', FileLocation + "1.png")
            }

        })
        .exists('#Examples > div.solution_box.solution_outside_box.hide > ul > li:nth-child(3)')
        .then(function(thirdChild) {
            if (thirdChild) {
                Existance[2] = true;
                return horseman.crop('#Examples > div.solution_box.solution_outside_box.hide > ul > li:nth-child(3)', FileLocation + "2.png")
            }

        })
        .exists('#Examples > div.solution_box.solution_outside_box.hide > ul > li:nth-child(4)')
        .then(function(fourthChild) {
            if (fourthChild) {
                Existance[3] = true;
                return horseman.crop('#Examples > div.solution_box.solution_outside_box.hide > ul > li:nth-child(4)', FileLocation + "3.png")
            }

        })
        .then(function() {
            horseman.close();
            //var l=0;
            let foundLength = (Existance.length) - 1
            sendTextMessage(CurrentUser.id, "Found " + foundLength + " for " + ((payload == "") ? "General Step by Step Calculator" : payload));
            sendStructuredExamples(CurrentUser, Existance, Texts, FileLocation)
            sendTypingOff(CurrentUser.id);
        });

}

function sendQuickReply(recipientId, file) {

    jsonfile.readFile(file, function(err, messageData) {
        console.log(err);
        messageData.recipient.id = recipientId;
        callSendAPI(messageData);
    });
}
//Call the Send API but for messenger profile
function callSendAPIGetStarted(messageData) {
    request({
        uri: 'https://graph.facebook.com/v2.8/me/messenger_profile',
        qs: {
            access_token: PAGE_ACCESS_TOKEN
        },
        method: 'POST',
        json: messageData
    }, function(error, res, body) {
        if (!error && res.statusCode == 200) {
            var result = body.result;
            console.log(result);
        } else {
            console.error("Unable to set Menu.");
            console.error(res);
            console.error(error);
        }
    });
}
//Call The Send Api For Messages
function callSendAPI(messageData, callback) {
    request({
        uri: 'https://graph.facebook.com/v2.8/me/messages',
        qs: {
            access_token: PAGE_ACCESS_TOKEN
        },
        method: 'POST',
        json: messageData

    }, function(error, res, body) {
        if (!error && res.statusCode == 200) {
            if (callback) {
                callback(null, res)
            }
            console.log(body);
            var recipientId = body.recipient_id;
            var messageId = body.message_id;
            console.log("Successfully sent generic message with id %s to recipient %s",
                messageId, recipientId);
        } else {
            if (callback) {
                callback(err, null)
            }
            console.error("Unable to send message Here.");
            console.error(res.body.error);
            // console.error(error);
        }
    });
}
//Set messageData then send it using callSendAPI
function sendTextMessage(recipientId, messageText) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: messageText,
            metadata: 'This is a metadata'
        }
    }
    callSendAPI(messageData);
}
//Get the Persistent Menu or other Messenger Profile Attributes as JSON Data
function getMessengerProfile(query) {
    request({
        uri: 'https://graph.facebook.com/v2.8/me/messenger_profile',
        qs: {
            fields: query,
            access_token: PAGE_ACCESS_TOKEN
        },
        method: 'GET',
    }, function(error, res, body) {
        if (!error && res.statusCode == 200) {
            console.log(body);
        } else {
            console.error("Unable to get menu.");
            console.error(res);
            console.error(error);
        }
    });
}
//setPersistentMenu()
//Set The Persistent Menu once in a lifetime
function setPersistentMenu() {
    var messageData = jsonfile.readFileSync("./Data/UI/PersistentMenu.json")
    callSendAPIGetStarted(messageData);
}
//Greeting Text for first use
function setGreetingText() {
    var messageData = {
        greeting: [{
            locale: "default",
            text: "Ahoy {{user_first_name}}! Let's Do Some Math Stuff 😎"
        }]
    };
    callSendAPIGetStarted(messageData);
}
//Send For the User How type the Mathematical Expressions
function sendHowToTypeExpressions(CurrentUser, Indicator) {
    if (!Indicator) {
        let elementsPath = "Data/UI/Expressions.json"
        let elements = jsonfile.readFileSync(elementsPath)
        messenger.sendHScrollMessage(CurrentUser.id, elements, 'REGULAR', function(err, res) {
            if (err) {
                console.log("error in typing expressions ", err)

            }
            return
        })
    }
    console.log("Expressions Indicator is", Indicator)

    switch (Indicator) {
        case "Videos":
            sendExpressionVideos(CurrentUser.id)
            break;
        case "PDF":
            sendExpressionPDF(CurrentUser.id)
            break;
        case "Images":
            sendExpressionImages(CurrentUser.id)
            break;
    }
    var firstOpening = "Typing the mathematical expression in messenger is quite simple when you get the handle of it. It's to be in latex. With this symbols show in pictures and videos you'll know how type the most complicated equations on messenger";
    //old send How to type expressions 
    /*
    setTimeout(function() {
        sendTextMessage(recipientId, firstOpening);
    }, 1000);
    setTimeout(function() {
        sendTextMessage(recipientId, videoMessage);
    }, 2000);
    var x = 3000;
    for (var i = 0; i < videosLinks.length; i++) {}
    videosLinks.forEach(function(LinkOfThem) {
        setTimeout(function() {
            sendTextMessage(recipientId, LinkOfThem.Message);
        }, x);
        setTimeout(function() {
            sendVideoMessage(recipientId, LinkOfThem.id);
        }, x + 1000);
        x += 2000;
    });
    setTimeout(function() {
        sendTextMessage(recipientId, pdfMessage.Message);
    }, 9000);
    setTimeout(function() {
        sendFileMessage(recipientId, pdfMessage.id);
    }, 10000);

    setTimeout(function() {
        sendTextMessage(recipientId, ImagesMessage);
    }, 11000);
    // Then Images
    setTimeout(function() {
        sendImageMessage(recipientId, helpImages[0].id, "");
    }, 12000);
    setTimeout(function() {
        sendImageMessage(recipientId, helpImages[0].id, "");
    }, 13000);
*/
}
//Sending How to type Expressions in Videos
function sendExpressionVideos(recipientId) {
    let videoMessage = "You can watch these videos for Examples";
    let videosLinks = [{
        Message: videoMessage
    }, {
        Message: "For solving Integrals",
        Link: "https://youtu.be/F6Vric3IDQo",
        id: "279767462432246"
    }, {
        Message: "For solving Matrices",
        Link: "https://goo.gl/DyHO45",
        id: "279767915765534"
    }, {
        Message: "For solving Series and Limits",
        Link: "https://goo.gl/QoLyU2",
        id: "279768165765509"
    }];
    sequential(videosLinks.map((videosLink) => {
            return function(previousResponse, responses, count) {
                return new Promise(resolve => {
                    if (!videosLink.id) {
                        messenger.sendTextMessage(recipientId, videosLink.Message, 'REGULAR', function(err, res) {
                            resolve(res)
                        })
                        return
                    }
                    messenger.sendTextMessage(recipientId, videosLink.Message, 'REGULAR', function(err, res) {
                        if (err) {
                            console.log("error in videos links", err)
                        } else {
                            sendVideoMessage(recipientId, videosLink.id, function(err, res) {
                                if (!err) {
                                    resolve(res)
                                }

                            })
                        }
                    })
                })

            }
        }))
        .then(res => {
            // ... 
        })
        .catch(err => {
            // ... 
            console.log("error while evaluating", err)
        })
}
//Sending How to type Expressions in PDF
function sendExpressionPDF(recipientId) {
    console.log("Expression is PDF")
    let pdfMessage = {
        Message: "pdf that has the most important Expressions and how to type them",
        id: 266455673763425
    };
    messenger.sendTextMessage(recipientId, pdfMessage.Message, 'REGULAR', function(err, res) {
        if (res) {
            sendFileMessage(recipientId, pdfMessage.id)
        } else if (err) {
            console.log("PDF Expressions error ", err)
        }
    })
}
//Sending How to type Expressions in Images
function sendExpressionImages(recipientId) {
    let ImagesMessage = "And at last few images on the most important symbols";
    let helpImages = [{
        Message: ImagesMessage
    }, {
        No: 1,
        Link: "http://i.imgur.com/5uau6bD.png",
        id: 268294513579541
    }, {
        No: 2,
        Link: "http://i.imgur.com/K8oGomx.png",
        id: 268294510246208
    }]
    sequential(helpImages.map((helpImage) => {
            return function(previousResponse, responses, count) {
                return new Promise(resolve => {
                    if (helpImage.Message) {
                        messenger.sendTextMessage(recipientId, helpImage.Message, 'REGULAR', function(err, res) {
                            resolve(res)
                        })
                        return
                    }
                    sendImageMessage(recipientId, helpImage.id, "", function(err, res) {
                        if (!err) {
                            resolve(res)
                        }
                    })
                })
            }
        }))
        .then(res => {
            // ... 
        })
        .catch(err => {
            // ... 
            console.log("error while evaluating", err)
        })
}
/*
 * Verify that the callback came from Facebook. Using the App Secret from
 * the App Dashboard, we can verify the signature that is sent with each
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req, res, buf) {
    var signature = req.headers["x-hub-signature"];

    if (!signature) {
        // For testing, let's log an error. In production, you should throw an
        // error.
        console.error("Couldn't validate the signature.");
    } else {
        var elements = signature.split('=');
        var method = elements[0];
        var signatureHash = elements[1];

        var expectedHash = crypto.createHmac('sha1', APP_SECRET)
            .update(buf)
            .digest('hex');

        if (signatureHash != expectedHash) {
            throw new Error("Couldn't validate the request signature.");
        }
    }
}

function sendTypingOff(recipientId) {
    console.log("Turning typing indicator off");

    var messageData = {
        recipient: {
            id: recipientId
        },
        sender_action: "typing_off"
    };

    callSendAPI(messageData);
}

function sendTypingOn(recipientId) {
    console.log("Turning typing indicator on");

    var messageData = {
        recipient: {
            id: recipientId
        },
        sender_action: "typing_on"
    };

    callSendAPI(messageData);
}

function sendButtonMessage(recipientId, url) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",
                    elements:[

                        {
                        title:"Solution Link",
                        buttons:
                        [
                    {
                        type: "web_url",
                        url: url,
                        title: "Press Here 💙 #⃣"
                    },
                    {
                      type: "element_share",
                    }
                    ]
                }
                    ]
                    
                }
            }
        }
    };

    callSendAPI(messageData);
}

function sendFileMessage(recipientId, id) {
    //  console.log(global.SERVER_URL + "/MathTyping.pdf");
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "file",
                payload: {
                    attachment_id: id
                }
            }
        }
    };

    callSendAPI(messageData);
}

function sendDestroyableFileMessage(recipientId, FileUrl, File) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "file",
                payload: {
                    url: FileUrl
                }
            }
        }
    };

    callSendAPIforImages(messageData, File);
}

function sendGifMessage(recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "image",
                payload: {
                    url: SERVER_URL + "/assets/instagram_logo.gif"
                }
            }
        }
    };

    callSendAPI(messageData);
}

function sendImageMessage(recipientId, ImageUrl, Image, callback) {
    if (Image == "") {
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "image",
                    payload: {
                        attachment_id: ImageUrl
                    }
                }
            }
        };
        callSendAPI(messageData, function(err, res) {
            if(callback)
            {
            if (!err) {
                callback(null, res)
            } else {
                callback(err, null)
            }
            }
        });
    } else {
        console.log('Here and the Url is ' + ImageUrl);
        var messageData = {
            recipient: {
                id: recipientId
            },
            message: {
                attachment: {
                    type: "image",
                    payload: {
                        is_reusable: true,
                        url: ImageUrl
                    }
                }
            }
        };
        callSendAPIforImages(messageData, Image,function(err,res)
        {
            /*
                if (callback)
                {
                    callback(null,res)
                }
                */
        });
    }
}

function sendVideoMessage(recipientId, LinkUrl, callback) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "video",
                payload: {
                    attachment_id: LinkUrl
                }
            }
        }
    };
    callSendAPI(messageData, function(err, res) {
        if (callback) {
            if (err) {
                callback(err, null)
            } else {
                callback(null, err)
            }
        }

    });
}

function receivedPostback(event, User) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfPostback = event.timestamp;

    // The 'payload' param is a developer-defined field which is set in a postback
    // button for Structured Messages.
    var payload = event.postback.payload;
    if(User.Courses.gonnaSearch || User.Courses.gonnaSubmitCourse || User.Courses.gonnaWatch || User.gonnaGiveQuery ) { 
        User.Courses.gonnaSearch=false
        User.Courses.gonnaSubmitCourse=false
        User.Courses.gonnaWatch=false
        User.gonnaGiveQuery=false 
    }

    if ((payload.indexOf('More')) > -1 && (payload.indexOf('Quick Reply') <= -1)) {
        var file = payload.replace('More ', '') + '.json';
        console.log(file);
        sendMainGenericMessage(senderID, 'Data/' + file);
    } else if ((payload.indexOf('More')) > -1 && (payload.indexOf('Quick Reply') > -1)) {
        var part1 = payload.replace('More ', '');
        var file = part1.replace(' Quick Reply', '') + '.json';
        console.log(file);
        sendQuickReply(senderID, 'Data/Quick Reply/' + file);
    } else if (payload.indexOf('-') > -1 && payload.match(/calculator/,"i")) {
        var Linked = true;
        let payUserIndex = Users.indexOf(User)
        Users[payUserIndex].payload = payload
        if (Linked) {
            let hookText ="Now you're Linked to " + payload.replace(/-/g, " ") + ". type your problem whenever you want to get examples press the button. Or type examples or detach whenever you want."
            let hookReply = [{
                content_type: "text",
                title: "🔣 Examples/Exercise",
                payload: "payExamples"
            },
            {
                content_type: "text",
                title: "🔓 Detach",
                payload: "Detach"
            }
    ]
            messenger.sendQuickRepliesMessage(senderID, hookText, hookReply, 'REGULAR', function(err, res) {
                console.log(err)
            })

        }
    } else if (payload.indexOf('getAll') > -1) {
        let fileName = payload.replace(/getAll /, "")
        if (checkForCourses(senderID, payload, 'getAll', fileName)) {
            return
        }
    } else if (payload.indexOf('search') > -1) {
        console.log("Going to call with flag search")
        let fileName = payload.replace(/search /, "")
        console.log(fileName)
        if (checkForCourses(senderID, payload, 'search', fileName)) {
            return
        }
    } else if (payload.indexOf('watch') > -1) {
        let fileName = payload.replace(/watch /, "")
        if (checkForCourses(senderID, payload, 'watch', fileName)) {
            return
        }
    } else if (payload.indexOf('intent') > -1) {
        let splittedText = strsplit(payload, /\s+/)
        let intent = splittedText[1]
        let text = payload.replace(/intent\ /, "").replace(intent + " ", "")
        detectIntent(User, intent, undefined, "query")
    } else if (payload.indexOf('-') > -1) {
        let payUserIndex = Users.indexOf(User)
        if (Users[payUserIndex].payload == "") {
            Users[payUserIndex].payload = payload
            Linked = true
        }
    } else {
        switch (payload) {
            case 'Bot Introduction':
            getUserName(senderID, function(UserName, LastName) {
                    let Name=UserName+" "+LastName
                   // sendTextMessage(senderID, BotDescription.replace('Name', UserName));
                    sendIntroduction(User,Name,"BotUsing");
                });
            break;
            case 'getStarted':
            case 'Get Started':
                getUserName(senderID, function(UserName, LastName) {
                    let Name=UserName+" "+LastName
                   // sendTextMessage(senderID, BotDescription.replace('Name', UserName));
                    sendIntroduction(User,Name);
                });
                break;
            case 'Typing Expressions':
                sendHowToTypeExpressions(User);
                break;
            case 'Maths Sections':
                sendMathsSections(User)
                break;
            case 'Register':
                askToRegister(senderID, false);
                break;
            case "Change What I'm":
                askToRegister(senderID, true);
                break;
            case 'Talk to Teachers':
                Login(senderID, "Teachers Chat");
                break;
            case 'Talk to Students':
                Login(senderID, "Students Chat");
                break;
            case 'Public Chat':
                Login(senderID, "Public Chat");
                break;
            case 'Opt Out':
                checkOpt(senderID);
                break;
            case 'Get Courses':
                console.log("I got them")
                sendGetCourses(senderID)
                break;
            case 'Submit a Course':
                sendCourseSubmission(User)
                break;
            case 'registerStudent':
                Register(senderID, "Student");
                break;
            case 'registerTeacher':
                Register(senderID, "Teacher");
                break;
            case 'Community Help':
                sendCommunityHelp(senderID);
                break;
            case 'Expressions Videos':
                sendHowToTypeExpressions(User, "Videos")
                break;
            case 'Expressions PDF':
                sendHowToTypeExpressions(User, "PDF")
                break;
            case 'Expressions Images':
                sendHowToTypeExpressions(User, "Images")
                break;
            case 'Understood Texts':
                sendUnderstoodTexts(User)
                break;
            case 'Understood Tutorials':
                 sendUnderstoodCourses(User)
                break;
            case 'Understood Examples':
                 sendUnderstoodExamples(User)
                break;
            case 'Understood Greeting':
                 sendUnderstoodGreeting(User)
                break;
            case 'Understood Thanking':
                sendUnderstoodThanking(User)
                break;
            case 'Understood Identification':
                sendUnderstoodIdentification(User)
                break;
            case 'Understood BotUsing':
                sendUnderstoodBotUsing(User)
                break;


        }
    }
    console.log("Received postback for user %d and page %d with payload '%s' " +
        "at %d", senderID, recipientID, payload, timeOfPostback);
    // When a postback is called, we'll send a message back to the sender to
    // let them know it was successful
}
//Send to the user introduction about the bot
function sendIntroduction(CurrentUser,Name,introductionFlag) {
    let recipientId=CurrentUser.id
    let firstText="Welcome "+Name+". Ready to do some Math stuff ? 😄. You can find solutions for from simple to sophistacated math problmes, search for courses and chat with teachers or students."
    let secondText="What happens with solutions is that my server drives a browser to take a screenshot of the solution which is public and free"
    let thirdText="Where would you like to go?"
    let elementsPath="Data/UI/getStartedRes.json"
    let elements=jsonfile.readFileSync(elementsPath)
     if(introductionFlag=="BotUsing")   
    {
        console.log("Introduction Flag is",introductionFlag)
        firstText=Name+"! 😄. You can choose and surf bot structure from here"
    }
    let TextsArray=[firstText,secondText,thirdText]
    sendTextsSequential(recipientId,TextsArray,function(err,res)
    {
        if(err)
        {
            console.log("error in sending get started res,",err)
        } else {
            if(!introductionFlag)
            {
            messenger.sendHScrollMessage(recipientId,elements)
            return
            } else {
            messenger.sendHScrollMessage(recipientId,elements,'REGULAR',function(err,res)
            {
                let diagramId="279606289115030"
                messenger.sendTextMessage(recipientId,"You can see my structure diagram from here 😇",'REGULAR',function(err,res)
                {
                   sendImageMessage(recipientId,diagramId,"") 
                })
            })
            }
        }
    })
    /*
    setTimeout(function() {
        sendTextMessage(senderID, "You can start deal with me with simple greeting like 'Hay ' , 'Hello' or 'What's up'");
    }, 1000);
    setTimeout(function() {
        sendTextMessage(senderID, "and you can ask me for math course like this way e.g \"i want tutorials for integrals\" or \"I want Matrices courses \" and so on I'll try to get it ^_^ ");
    }, 2000);
    setTimeout(function() {
        sendTextMessage(senderID, "you can also ask me for examples for typed math equations in speciality e.g \"I want examples on integral\" or \"I want you to give me examples on series \" and so on I'll yet try to get it ^_^ ");
    }, 3000);
    setTimeout(function() {
        sendTextMessage(senderID, "Yet you can surf maths sections from here and from the main menu you choose the section you want ^_^ get hooked to it and then send your equation or get examples ^_^ ");
    }, 4000);
    setTimeout(function() {
        sendMainGenericMessage(senderID, "Data/Main.json");
    }, 5000)
    */
}
//Send Math Section
function sendMathsSections(CurrentUser) {
    let recipientId=CurrentUser.id
    messenger.sendTextMessage(recipientId,"Get Hooked to a calculator. Solve problems!",'REGULAR',function(err,res) {
        if(err)
        {
            console.log("Something went wrong with sending Math Sections ")
        } else { 
             sendMainGenericMessage(recipientId, 'Data/Main.json');
        }
    })
   
}
function getUserName(recipientId, callback) {
    request({
        uri: 'https://graph.facebook.com/v2.8/' + recipientId,
        qs: {
            access_token: PAGE_ACCESS_TOKEN,
            fields: 'first_name,last_name'
        },
        method: 'GET'
    }, function(error, res) {
        if (!error && res.statusCode == 200) {
            var body = JSON.parse(res.body);
            var UserName = body.first_name;
            var LastName = body.last_name;
            callback(UserName, LastName);
        } else {
            //console.error("Unable to send message Here.");
            //console.error(res.body.error);
            // console.error(error);
        }
    });
}

function callSendAPIforImages(messageData,Image,callback) {
    request({
        uri: 'https://graph.facebook.com/v2.8/me/messages',
        qs: {
            access_token: PAGE_ACCESS_TOKEN
        },
        method: 'POST',
        json: messageData

    }, function(error, res, body) {
        if (!error && res.statusCode == 200) {
            console.log("body is ",JSON.stringify(body));
            var recipientId = body.recipient_id;
            var messageId = body.message_id;
            if (messageId == undefined) {
                console.log("Message to %s wasn't delievered.", recipientId);
            } else {
                if(callback)
                {
                    callback(null,res)
                }
                console.log("Successfully sent generic message with id %s to recipient %s",
                    messageId, recipientId);
                try {
                    if(Image)
                    {
                    console.log("I'm gonna delete %s", Image);
                    fs.unlinkSync(Image);
                    }
                } catch (err) {
                    console.log(err);
                }
            }
        } else {
            console.error("Unable to send message Here.");
            console.error(res.body.error);
            // console.error(error);
        }
    });
}

function callWitAI(query, callback) {
    query = encodeURIComponent(query);
    request({
        uri: "https://api.wit.ai/message?v=27/04/2017&q=" + query,
        qs: {
            access_token: wit_token
        },
        method: 'GET'
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("Successfully got %s ", response.body);
            try {
                body = JSON.parse(response.body);
                for (var i = 0; i < body["entities"]["Intent"]; i++) {
                    // console.log(JSON.stringfy(body.entities.intent));
                }
                callback(null, body.entities);
            } catch (e) {
                callback(e);
            }
        } else {
            console.log(response.statusCode);
            console.error("Unable to send message. %s", error);
            callback(error);
        }
    })
}

function getTutorials(senderID, Keyword) {
    for (var i = 0; i < Keyword.length; i++) {
        if (Keyword[i].match(new RegExp("^all$", "i")) || Keyword[i].match(new RegExp("^math$", "i"))) {
            sendTextMessage(senderID, "I have found 2977 video tutorials for math ^_^ ");
            sendFileMessage(senderID, All_Tutorials_ID);
            return;
        }
    }
    var KeywordFile = '';
    var FoundElements = [];
    var FilesNames = jsonfile.readFileSync("Data/TutorialsNames.json");
    FilesNames.forEach(function(File) {
        var YoutubeLinks = jsonfile.readFileSync("Videos Links/" + File + ".json", 'utf-8');
        YoutubeLinks.forEach(function(Link) {
            var LinkName = JSON.stringify(Link.Name);
            for (var i = 0; i < Keyword.length; i++) {
                var re = new RegExp(Keyword[i], "i");

                if (LinkName.match(re)) {
                    if (KeywordFile == '') {
                        KeywordFile = Keyword[i];
                    }
                    console.log(LinkName + "   " + File);
                    Link.Section = File;
                    FoundElements.push(Link);
                }

            }
        })
    });
    var ResultsCount = FoundElements.length;
    if (ResultsCount > 0) {
        let FoundText="Found " + ResultsCount + " videos for " + KeywordFile + "."
           messenger.sendTextMessage(senderID,FoundText,'REGULAR',function(err,res)
           {
               if(res) {
                     writeAndSendTutorials(senderID, FoundElements, KeywordFile)
               } else {
                     console.log("Error with sending the number of results")
               }
           });
    } else {
        sendTextMessage(senderID, "Sorry I haven't found any results of tutorials on " + Keyword);
    }
}

//Send to tell the user I don't understand
function sendNotUnderstanding(senderID, messageText) {
    var Random = Math.floor(Math.random() * (NotUnderstanding.length - 1));
    // sendTextMessage(senderID,);
    /*
    setTimeout(function () {
        sendTextMessage(senderID, "I understand things like \"give examples for series\" or \"i want courses for pi\" or \"How to start\" ^_^ ")
    }, 1000);
    */
    let notUnderstandingPath = "Data/UI/notUnderstanding.json"
    let elements = jsonfile.readFileSync(notUnderstandingPath)
    let firstButtons = elements[0].buttons
    let secondButtons = elements[0].buttons
    elements[0].subtitle = NotUnderstanding[Random] + " " + elements[0].subtitle
    for (let i = 0; i < firstButtons.length; i++) {
        firstButtons.payload += messageText
    }
    for (let i = 0; i < secondButtons.length; i++) {
        secondButtons.payload += messageText
    }
    messenger.sendHScrollMessage(senderID, elements)
    /*
    messenger.sendButtonsMessage(senderID, NotUnderstanding[Random] + ". were any if these your intention ?", firstButtons, function(err, res) {
        if (!err) {
            messenger.sendButtonsMessage(senderID, "Or these ?", secondButtons)
        }
    })
    */
}

//Replying to thanks message
function sendThanking(senderID) {
    var Random = Math.floor(Math.random() * (Thanking.length - 1));
    sendTextMessage(senderID, Thanking[Random]);
}

function askToRegister(senderID, Change) {
    for (var i = 0; i < Users.length; i++) {
        {
            if (Users[i].id == senderID) {
                var RegisterStatus = Users[i].Community.isRegistered;
                let userClass=Users[i].Community.Class;
                switch (RegisterStatus) {
                    case true:
                        if (!Change) {
                            // Login(Users[i].id,Users[i].Community.Group)
                            let changeButtons = [{
                                type: "postback",
                                title: "👨 Change",
                                payload: "Change What I'm"
                            }]
                            messenger.sendButtonsMessage(senderID, "You're a "+userClass+". Change if you're a teacher or a student?", changeButtons)
                            console.log("Saying he's logged: ", senderID);
                            return;
                        }
                        break;
                    case false:
                        break;
                }
            }
        }
    }
    var messageData = {
        "recipient": {
            "id": senderID
        },
        "message": {
            "text": "Alright Would you Like to Register as a Student or a Teacher?",
            "quick_replies": [{
                    "content_type": "text",
                    "title": "👦 Student",
                    "payload": "registerStudent"
                },
                {
                    "content_type": "text",
                    "title": "👨 Teacher",
                    "payload": "registerTeacher"
                }
            ]
        }
    };
    console.log("Asking him who he is: ", senderID);
    callSendAPI(messageData);
}

function Register(senderID, Type) {

    getUserName(senderID, function(FirstName, LastName) {
        for (var i = 0; i < Users.length; i++) {
            if (Users[i].id == senderID) {
                Users[i].Community.Name = FirstName + " " + LastName
                console.log("I've set the name to: ", Users[i].Community.Name)
                Users[i].Community.isRegistered = true;
                Users[i].Community.Class = Type;
                console.log("Registering : %s as %s", Users[i].id.toString(), Users[i].Community.Class)
                sendTextMessage(senderID, "Now I've Registered you as a " + Type);
                setTimeout(function() {
                    var Texts = ["Talk to Teachers", "Talk to Students", "Public Chat"];
                    sendButtonsMessage(senderID, Texts, "Join a Chat")
                }, 500)
            }
        }
    });
}

function checkOpt(senderID) {
    for (var i = 0; i < Users.length; i++) {
        if (Users[i].id == senderID) {
            console.log("I have the user is OPT and He's in the array");
            console.log("Log status:", Users[i].Community.isLogged);
            switch (Users[i].Community.isLogged) {
                case false:
                    console.log("It's ", Users[i].Community.isLogged);
                    sendTextMessage(senderID, "Sorry! but you're not logged to any Chat");
                    console.log("Sending He's logged: ", Users[i].id);
                    break;
                case true:
                    let UserName = Users[i].Community.Name;
                    let UserGroup = Users[i].Community.Group;
                    Users[i].Community.isLogged = false;
                    Chat(Users[i], " Has left the Chat [Admin Message]", UserGroup)
                    sendTextMessage(senderID, "Now You're out of "+UserGroup+", you can ask me to Solve math equations ^^");
                    console.log("Opting out: ", Users[i].id)
            }
        }
    }
}

function Login(senderID, Type) {
    console.log("I'm going to log him")
    var onlineUsers = []
    for (let i = 0; i < Users.length; i++) {
        if (Users[i].Community.Group == Type && Users[i].id != senderID && Users[i].Community.isLogged) {
            var onlineUser = {
                id: Users[i].id,
                Name: Users[i].Community.Name
            }
            onlineUsers.push(onlineUser)
        }
    }
    for (let i = 0; i < Users.length; i++) {
        if (Users[i].id == senderID) {
            var userClass = Users[i].Community.Class;
            if (Users[i].Community.isRegistered == false) {
                // sendTextMessage(senderID,"You're not Registered. Kindly Register First ^_^");
                let RegisteryButtons = [{
                    type: "postback",
                    title: "👨 Register",
                    payload: "Register"
                }]
                messenger.sendButtonsMessage(Users[i].id, "You're not Registered. Kindly Register First ^_^", RegisteryButtons)
                return;
            }
            if (Type.match(new RegExp(userClass, "i")) || Type == "Public Chat") {
                Users[i].Community.Group = Type;
                let userName = Users[i].Community.Name;
                let UserGroup = Users[i].Community.Group;
                console.log(Users[i].Community.Name + "Groups is " + Users[i].Community.Group)
                if (!(Users[i].Community.isLogged)) {
                    Chat(Users[i], " Has Joined Chat [Admin Message]", UserGroup)
                }
                Users[i].Community.isLogged = true;
                let Buttons = [{
                        type: "postback",
                        title: "🆘 Community Help",
                        payload: "Community Help"
                    },
                    {
                        type: "postback",
                        title: "🚶 Opt Out",
                        payload: "Opt Out"
                    }
                ];
                sendTextMessage(senderID, "Now you're In The " + Type + " ^_^");
                setTimeout(function() {
                    var onlinerUsersNum = onlineUsers.length;
                    sendTextMessage(senderID, "The " + Type + " Has " + onlinerUsersNum + " Active Member");
                }, 700)
                setTimeout(function() {
                    if (onlineUsers.length == 0) {
                        messenger.sendButtonsMessage(senderID, "if you wish Help press this button", Buttons)
                        return;
                    }
                    var sendText = "The Name\/Names is\/are\n"
                    onlineUsers.forEach(function(user) {
                        console.log("User Name in loop: ", user.Name)
                        sendText += user.Name + "\n"
                    })
                    console.log("Names are: ", sendText)
                    //sendTextMessage(senderID,sendText)
                    messenger.sendButtonsMessage(senderID, sendText + "Press The Button if you want help", Buttons)
                }, 1200)
            } else {
                sendTextMessage(senderID, "Sorry but you're a " + Users[i].Community.Class + ". you can't chat in this place. ");
            }
        }
    }
}

function Chat(Sender, message, Group) {
    var senderName = Sender.Community.Name;
    var senderClass = Sender.Community.Class;
    var senderID = Sender.id;
    var isAttachment = false;
    if (typeof message != "string") {
        console.log("The message is Attachment")
        console.log(JSON.stringify(message))
        isAttachment = true;
    }
    // console.log("SenderName: %s , Message: %s, Group %s",senderName,message,Group)
    var items = [];
    for (var i = 0; i < Users.length; i++) {
        if (Users[i].Community.Group == Group && Users[i].id != senderID && Users[i].Community.isLogged == true) {
            console.log("Going to Push %s For THE Chat ", Users[i].Community.Name)
            var sendText = ""
            if (!isAttachment) {
                sendText = (Group == "Public Chat") ? "[" + senderClass + "]" + senderName + ": " + message : senderName + ": " + message
            }
            var item = {
                method: 'POST',
                path: '/me/messages?access_token=' + PAGE_ACCESS_TOKEN,
                body: {
                    recipient: {
                        id: Users[i].id
                    },
                    message: {}
                }
            }
            if (isAttachment) {
                var item1 = JSON.parse(JSON.stringify(item));
                sendText = (Group == "Public Chat") ? "[" + senderClass + "]" + senderName : senderName
                item1.body.message = {
                    text: sendText
                }
                item.body.message = {
                    attachment: JSON.parse(JSON.stringify(message.attachments[0]))
                }
                items.push(item1);
            } else {
                item.body.message = JSON.parse(JSON.stringify({
                    text: sendText
                }))
            }
            console.log("Item with text is ", JSON.stringify(item1))
            items.push(item);
        }
    }
    console.log("Items are: ", items)
    QBatcher.run(items, function(item) {

            return new Promise(function(resolve) {
                callSendAPI(item.body)
            });
        }, 2, 5000)
        .then(function(results) {
            console.log(results);
        });

}

function sendButtonsMessage(recipientId, Texts, sentText) {
    var Buttons = [];
    for (var i = 0; i < Texts.length; i++) {
        var Button = {
            type: "postback",
            title: Texts[i],
            payload: Texts[i]
        }
        Buttons.push(Button)
    }

    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: sentText,
                    buttons: Buttons
                }
            }
        }
    };

    callSendAPI(messageData);
}

function getUserId(name) {
    let NameFound = false;
    for (let i = 0; i < Users.length; i++) {
        if (Users[i].Community.Name.match(new RegExp(name, "i"))) {
            NameFound = true;
            return {
                id: Users[i].id,
                LogStatus: Users[i].Community.isLogged
            };
        }
    }
    if (!NameFound) {
        return 0;
    }
}

function sendCommunityHelp(recipientId) {
    sendTextMessage(recipientId, "When you get logged to a chat what you type will be in that group chat. and if you wish to talk to someone privately type #w The Person Full Name Then the message for Exampe. #w Elton John What's up?. and as Reply #r Nothing much ")
    setTimeout(function() {
        sendTextMessage(recipientId, "And to Report someone type #report and the person full name followed by the reason. #Report Ahmed Mashhour for an insult.")
    }, 600)
}

function sendGetCourses(senderID, index, sentString) {
    let FilesNames = jsonfile.readFileSync("Data/TutorialsNames.json")
    let shortedFilesNames = jsonfile.readFileSync("Data/shortedTutorialsNames.json")
    let begin, end
    let RepliesArray = []
    let morePush = true;
    sentString = sentString || "Would you like courses in ? "
    begin = index || 0
    end = index + 9 || 9
    if ((FilesNames.length - index) <= 9) {
        end = FilesNames.length
        morePush = false;
    }
    let moreButton = {
        content_type: "text",
        title: "More",
        payload: "More " + end
    }
    // let newReply=FilesNames.slice(index,index+9)
    for (let i = begin; i < end; i++) {
        let QuickReply = {
            content_type: "text",
            title: shortedFilesNames[i],
            payload: FilesNames[i]
        }
        RepliesArray.push(QuickReply)
    }
    if (morePush) {
        RepliesArray.push(moreButton)
    }
    console.log("repliesa are ", RepliesArray)
    messenger.sendQuickRepliesMessage(senderID, sentString, RepliesArray, 'REGULAR', function(err, res) {
        console.log("err: ", err)
        console.log("res: ", res)
    })
}

function sendOpenGraphTemplate(senderID, url, callback) {
    let messageData = {
        recipient: {
            id: senderID
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "open_graph",
                    elements: [{
                        url: url,
                        buttons: [{
                                type: "web_url",
                                url: url,
                                title: "View More"
                            },
                            {
                                type: "element_share"
                            }
                        ]
                    }]
                }
            }
        }
    }
    callSendAPI(messageData, function(err, res) {
        if (err) {
            callback(err, null)
        } else {
            callback(null, res)
        }
    })
}

function checkForCourses(senderID, payload, flag, fileName) {
    let FilesNames = jsonfile.readFileSync("Data/TutorialsNames.json")
    let watchString = "Kindly type the course videos in " + fileName + " names separated by a comma to watch on messenger, if you don't know a name you can press Get All, choose one or few. Then press Watch on Messenger back."
    let searchString = "Alright now! Just type the keyword you want to search in " + fileName
    if (flag) {
        let userIndex = null
        for (let i = 0; i < Users.length; i++) {
            if (Users[i].id == senderID) {
                userIndex = i
            }
        }
        let searchSub = Users[userIndex].Courses.searchSub
        if (fileName == "Menu") {
            let method = ""
            if (flag == "watch") {
                Users[userIndex].Courses.gonnaWatch = true
                method = "watch"
            } else if (flag == "search") {
                console.log("The User flag is search and in menu ", flag)
                Users[userIndex].Courses.gonnaSearch = true
                method = "search"
            }
            console.log("In menu and search sub is ", searchSub)
            if (searchSub == "") {
                sendGetCourses(senderID, undefined, "What Section of Math would you like to search in ?")
            } else if (searchSub != "") {
                console.log("Method is ", method)
                if (method == "search") {
                    sendTextMessage(senderID, searchString.replace(fileName, searchSub));
                } else if (method == "watch") {
                    sendTextMessage(senderID, watchString.replace(fileName, searchSub))
                }
            }
            return true;
        }
        if (flag == 'getAll') {
            let getFile = jsonfile.readFileSync("Videos Links/" + fileName + ".json")
            sendTextMessage(senderID, "I've found " + getFile.length + " Videos")
            writeAndSendTutorials(senderID, getFile, fileName)
        } else if (flag == 'search') {
            console.log("fileName != Menu")
            Users[userIndex].Courses.gonnaSearch = true;
            Users[userIndex].Courses.searchSub = fileName;
            sendTextMessage(senderID, searchString);
        } else if (flag == 'watch') {
            Users[userIndex].Courses.gonnaWatch = true;
            Users[userIndex].Courses.searchSub = fileName;
            sendTextMessage(senderID, watchString)
        }
        return true;
    }
    let coursePayload = false;
    for (let i = 0; i < FilesNames.length; i++) {
        if (payload == FilesNames[i]) {
            let buttons = [{
                    type: "postback",
                    title: "📥 Get All",
                    payload: "getAll " + payload
                },
                {
                    type: "postback",
                    title: "📂 Search",
                    payload: "search " + payload
                },
                {
                    type: "postback",
                    title: "😎 Watch On Messenger",
                    payload: "watch " + payload
                }
            ]
            for (let i = 0; i < Users.length; i++) {
                if (senderID == Users[i].id) {
                    sendTextMessage(Users[i].id, "Now from main menu you can select search or watch for " + payload)
                    Users[i].Courses.searchSub = payload
                    messenger.sendButtonsMessage(senderID, "What would you like to do in " + payload + " ?", buttons, 'REGULAR', function(err, res) {
                        console.log("erro in sending buttons ", err)
                    })
                    break;
                }
            }
            coursePayload = true;
        }
    }
    return coursePayload;
}

function writeAndSendTutorials(senderID, FoundElements, KeywordFile) {
    let TutorialsFile = 'public/Solutions/' + KeywordFile.replace(/ /g, '_') + '_' + 'Tutorials.csv';
    let TutorialsUrl = global.SERVER_URL + '/' + KeywordFile.replace(/ /g, '_') + '_' + 'Tutorials.csv';
    try {
        var writer = csvWriter({
            headers: ["Section", "Name", "Youtube Link"]
        });
        writer.pipe(fs.createWriteStream(TutorialsFile));
        FoundElements.forEach(function(Element, index, array) {
            writer.write({
                Section: Element.Section || KeywordFile,
                Name: Element.Name,
                "Youtube Link": Element.Link
                // "Direct Download Link": Element.ShortenedUrl
            }, function(err) {
                if (index == array.length - 1) {
                    console.log("Finished Writing");
                    writer.end();
                }
            });
        })
        setTimeout(function() {
            sendDestroyableFileMessage(senderID, TutorialsUrl, TutorialsFile);
        }, 700)
    } catch (err) {
        console.log(err);
    }
}

function testOCR(imagePath) {
    Tesseract.recognize(imagePath)
        .progress(message => console.log(message))
        .catch(err => console.error(err))
        .then(result => console.log(result))
        .finally(resultOrError => console.log(resultOrError))
}

function base64_encode(file) {
    // read binary data
    let bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    console.log(new Buffer(bitmap).toString('base64'))
    return new Buffer(bitmap).toString('base64');
}

function searchForVids(CurrentUser, messageText) {
    let fileName = CurrentUser.Courses.searchSub
    let openedFile = jsonfile.readFileSync("Videos Links/" + fileName + ".json")
    let FoundElements = []
    let messageArray = strsplit(messageText, /,/)
    for (let i = 0; i < openedFile.length; i++) {
        for (let j = 0; j < messageArray.length; j++) {
            if (openedFile[i].Name.match(new RegExp(messageArray[j], "i"))) {
                FoundElements.push(openedFile[i])
            }
        }
    }
    return FoundElements
}

function sendCourseSubmission(CurrentUser) {
    let userIndex = Users.indexOf(CurrentUser)
    Users[userIndex].Courses.gonnaSubmitCourse = true;
    console.log("User id is :", Users[userIndex].id)
    sendTextMessage(Users[userIndex].id, "Okay ^^! as I want to expand my courses database for the help of others you can help me and get credit. if you're a teacher of math or you have a good course in mind you like. You can submit its link for review (by admins) and will be included. Kindly Send its link (be it video, article, posts anything) in the next text and when the review is done I'll send you a text ^^")
}

function receiveCourseSubmission(userIndex, messageText) {
    Users[userIndex].Courses.gonnaSubmitCourse = false
    Users[userIndex].Courses.SubmittedCourse = messageText
    getUserName(Users[userIndex].id, function(firstName, lastName) {
        Users[userIndex].Community.Name = firstName + " " + lastName
        let userName = Users[userIndex].Community.Name
        sendTextMessage(me.id, userName + " sent Course and Link: " + messageText)
        sendTextMessage(secondMe.id, userName + " sent Course and Link: " + messageText)
    })
    sendTextMessage(Users[userIndex].id, "Your Submission has been sent to my developer thanks for the initative ^^")
}
/*
trainWitBot("Hell yaah I like you","Thanking",undefined,function(err)
{
    console.log("Error is ",err)
})
*/

function trainWitBot(text, value, search_query, callback) {
    let body = [{
        text: text,
        entities: [{
            entity: "intent",
            value: value
        }]
    }]
    if (search_query) {
        body[0].entities[1] = {
            entity: "wit$search_query",
            value: search_query
        }
    }
    request({
        uri: "https://api.wit.ai/samples?v=28/05/2017",
        qs: {
            access_token: wit_token
        },
        method: 'POST',
        json: body
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("Successfully got %s ", response.body);
            try {
                console.log("Sent status ", body.sent)
                console.log("N thing ", body.n)
            } catch (e) {
                callback(e);
            }
        } else {
            console.log(response.statusCode);
            console.error("Unable to send message. %s", error);
            callback(error);
        }
    })
}

function sendGreeting(senderID) {
    let rNo = Math.floor(Math.random() * (Greetings.length - 1));
    console.log(rNo);
    sendTextMessage(senderID, Greetings[rNo]);
    setTimeout(function() {
        sendTextMessage(senderID, "You can start by saying something like \"how to start\" or \"how to use\"");
    }, 1000)
}

function detectIntent(CurrentUser, intent, sq, messageText) {
    let senderID = CurrentUser.id
    if (messageText) {
        switch (intent) {
            case "Examples":
            case "Tutorials":
                askForsearchQuery(CurrentUser, intent)
                sendTypingOff(CurrentUser.id)
                return;
            default:
                break;
        }
        console.log("MessageTEXT IS", messageText)
    }
    if (intent == "Greeting") {
        sendGreeting(senderID)
    } else if (intent == "Identification") {
        let IdentificationTexts=[
            "I'm MathHook a messenger bot to assist you in your math problems, help you with courses and get teachers and students together 😇",
            "Here's a diagram "]
        let diagramId="279606289115030"
        sendTextsSequential(senderID,IdentificationTexts,function(err,res)
        {
            if(err)
            {
                console.log("error in Identification",err)
            } else {
                sendImageMessage(senderID,diagramId,"")
            }
        })
    } else if (intent == "Thanking") {
        sendThanking(senderID);
    } else if (intent == "BotUsing") {
        getUserName(senderID,function(firstName,lastName)
        {
            let Name=firstName+" "+lastName
        sendIntroduction(CurrentUser,Name,"BotUsing");
        })
    } else if (sq) {
        if (intent == "Tutorials" && (sq.length > 0)) {
            console.log("The user wants %s", intent);
            console.log("And the tutorials are on %s", sq);
            messenger.sendTextMessage(senderID, "I'm going to search for courses for " + sq[0],'REGULAR',function(err,res)
            {
                if(res) {
                    getTutorials(senderID, sq);
                } else {
                    console.log("Error in sending searching text,",err)
                }
            });
            sendTypingOff(CurrentUser.id)
            //sendTextMessage(senderID, "The user meant "+intent);
        } else if (intent.match(new RegExp("^Examples$", "i")) && (sq.length > 0)) {
            console.log("The user wants %s", intent);
            console.log("And the tutorials are on %s", sq);
            //sendTextMessage(senderID, "I'm going to search for examples for " + sq[0]);
            searchPayload(sq, function(error, Examples) {
                if (error) {
                    sendTextMessage(senderID, "Sorry couldn't find any Examples results for " + sq);
                    sendTypingOff(CurrentUser.id)
                    return;
                }
                getExamples(CurrentUser, Examples[0].payload);
            });
        } else if ((intent.match(new RegExp("^Examples$", "i")) || intent == "Tutorials") && (sq.length == 0)) {
            sendTextMessage(senderID, "Sorry I couldn't catch the thing you want " + intent + " for :( , you could try again with simplier way");
            sendTypingOff(CurrentUser.id)
        } else {
            console.log("I don't understand ", messageText)
            sendNotUnderstanding(senderID, messageText);
            sendTypingOff(senderID);
        }
    }

}
//sendImageMessage(senderID,"http://img.pixady.com/2017/05/341839_structure.png")
function askForsearchQuery(CurrentUser, intent) {
    let senderID = CurrentUser.id
    let userIndex = Users.indexOf(CurrentUser)
    Users[userIndex].gonnaGiveQuery = true
    Users[userIndex].queryIntent = intent
    sendTextMessage(senderID, "Okey! ^^ can you type what you want " + intent + " for in the next text")
}

function sendStructuredExamples(CurrentUser, Existance, Texts, FileLocation, index) {
    var first = 1
    if (index != undefined) {
        first = parseInt(index)
    }
    let second = first + 1
    let userIndex = Users.indexOf(CurrentUser)
    Users[userIndex].Examples.Existance = Existance
    Users[userIndex].Examples.Texts = Texts
    Users[userIndex].Examples.FileLocation = FileLocation
    let QuickReplies = [{
        content_type: "text",
        title: "Solve",
        payload: "Example Solve "
    }, {
        content_type: "text",
        title: "Edit",
        payload: "Example Edit "
    }, {
        content_type: "text",
        title: "Next",
        payload: "Example Extra " + second
    }]
    if (second == ((Existance.length))) {
        console.log("Second is ", second)
        QuickReplies.splice(2, 1)
    }
    var x = 1;
    // for (var i = 1; i < 4; i++) {
    if (Existance[first]) {
        let sentText = Texts[first].replace(/\\:/g, ' ').replace(/\$/g, '')
        var ImageUrl = global.SERVER_URL + '/' + CurrentUser.id.toString() + "_Example_" + first + ".png";
        messenger.sendTextMessage(CurrentUser.id, sentText, 'REGULAR', function(err, res) {
            messenger.sendImageMessage(CurrentUser.id, ImageUrl, 'REGULAR', function(err, res) {
                console.log("Probme before concat", QuickReplies[0].payload)
                QuickReplies[0].payload += sentText
                console.log("Probme after concat", QuickReplies[0].payload)
                fs.unlinkSync(FileLocation + first + ".png")
                messenger.sendQuickRepliesMessage(CurrentUser.id, "What to do ?", QuickReplies)
            })
        });
    }
}

function sendUnderstoodTexts(CurrentUser)
{
    let elementsPath="Data/UI/UnderstoodTexts.json"
    let elements=jsonfile.readFileSync(elementsPath)
    let sentText = "I understand few texts related of certain intentions. Choose one and see examples of texts 🆕"
    messenger.sendTextMessage(CurrentUser.id, sentText, 'REGULAR', function(err, res) {
        if (res) {
             messenger.sendHScrollMessage(CurrentUser.id,elements,'REGULAR',function(err,res)
             {
                if(err)
                {
                    console.log(err)
                }
             })
        }
    })

}
function detach(CurrentUser)
{
                 let DetachedPayload = null;
                 var DetachingBool = false;
                 DetachedPayload=CurrentUser.payload
                 CurrentUser.payload=""
                 DetachingBool=true
                if (DetachingBool) {
                    sendTextMessage(CurrentUser.id, "Successfully detached from " + DetachedPayload + " now you're linked to general calculator");
                }
}
function sendUnderstoodCourses(CurrentUser) {
    let recipientId=CurrentUser.id
    let TextsArray=[
    UnderstandingTexts[0],
    "I want tutorials for integrals (where Integrals is the Keyword)",
    "I want Matrices courses. (where Matrices is the Keyword)",
    "Give courses for Math",
    UnderstandingTexts[1]
    ]
    sendTextsSequential(recipientId,TextsArray)
}
function sendUnderstoodExamples(CurrentUser) {
    let recipientId=CurrentUser.id
    let TextsArray=[
        UnderstandingTexts[0],
        "Give examples for integral",
        "give me examples on series",
        "I want few examples on integral",
        UnderstandingTexts[1]
    ]
    sendTextsSequential(recipientId,TextsArray)
}
function sendUnderstoodGreeting(CurrentUser) {
    let recipientId=CurrentUser.id
    let TextsArray=[
        UnderstandingTexts[0],
        "Hello, Hi, Ahoy, What's up or Hay",
        UnderstandingTexts[1]
    ]
    sendTextsSequential(recipientId,TextsArray)
}
function sendUnderstoodThanking(CurrentUser) {
    let recipientId=CurrentUser.id
    let TextsArray=[
        UnderstandingTexts[0],
        "Thanks , Thank you , I love you.",
        UnderstandingTexts[1]
    ]
    sendTextsSequential(recipientId,TextsArray)
}
function sendUnderstoodIdentification(CurrentUser) {
    let recipientId=CurrentUser.id
    let TextsArray=[
        UnderstandingTexts[0],
        "What are you ?. Who are you ?. What do you do ?. What's that bot, MathHook?",
        UnderstandingTexts[1]
    ]
    sendTextsSequential(recipientId,TextsArray)
}
function sendUnderstoodBotUsing(CurrentUser) {
    let recipientId=CurrentUser.id
    let TextsArray=[
        UnderstandingTexts[0],
        "How do I use you ?. How do I use you ?. How can I use this bot ?.",
        UnderstandingTexts[1]
    ]
    sendTextsSequential(recipientId,TextsArray)
}
function sendTextsSequential(recipientId,TextsArray,callback) {
    sequential(TextsArray.map((Text) => {
            return function(previousResponse, responses, count) {
                return new Promise(resolve => {
                    messenger.sendTextMessage(recipientId,Text,'REGULAR',function(err,res)
                    {
                        if(res)
                        {
                            resolve(res)
                        } else {
                            console.log("error in understood Texts",err)
                        }
                    })
                })

            }
        }))
        .then(res => {
            // ...
            if(callback)
            {
                callback(null,res)
            } 
        })
        .catch(err => {
            // ... 
            console.log("error while evaluating", err)
        })

}
function getVideosId() {
    let TutorialsFile = 'public/Solutions/Integrals_Examples.mp4' ;
    let TutorialsUrl = 'https://522c793e.ngrok.io/webhook/SeriesandLimits.mp4'
    sendImageMessage(1218640838256762,TutorialsUrl,"fwefger",function(err,res)
    {
        if(err) {
            console.log("err with getting id ",err)
        } else {
            console.log("res with getting id is",res)
        }
    })
    
}
function callPixApi(CurrrentUser,url,callback) {
    let app_id="ahmed"
    let app_key="351c21bcb820c5f16f296c40a7c8049f"
    console.log("Url of image is",url)
    console.log("User id is ",CurrrentUser.id)
    let uri="https://api.mathpix.com/v3/latex"
    let messageData={
        "url":url
    }
    request({
        uri: "https://api.mathpix.com/v3/latex",
        headers: {
            app_id:app_id,
            app_key:app_key,
            "Content-Type":"application/json"
        },
        method: 'POST',
        json:messageData
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("Successfully got body ", JSON.stringify(body))
            try {
                let detection_map=body.detection_map
                let latex_confidence=body.latex_confidence
                let latex=body.latex
                let err=body.error
                //console.log("Pix response body is",JSON.parse(response.body));
                if(err)
                {
                    callback(err,null)
                    console.log("error in pix",err)
                    return
                }
                if(detection_map)
                {
                    if(detection_map.is_printed==1) {
                      //  sendTextMessage(CurrentUser.id,"This equations is printed.")
                        console.log("This equations is printed.")
                    }
                }
                  console.log("Latex is ",latex)
                    console.log("Latex confidence is ",latex_confidence)
                   callback(null, {latex:latex,
                    latex_confidence:parseFloat(latex_confidence)
                }); 
            } catch (e) {
                callback(e);
            }
        } else {
            console.log(response.statusCode);
            console.error("Unable to send message. %s", error);
            console.error("Unable to send message. RESPONSE", response.statusCode);
            callback(error);
        }
    })
}