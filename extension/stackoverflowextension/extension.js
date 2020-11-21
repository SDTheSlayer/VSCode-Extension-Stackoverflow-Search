// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const natural = require('natural');
const stopword = require('stopword');
const request = require("request");
const zlib = require('zlib');
// var showdown  = require('showdown');

var panel;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	
	vscode.commands.registerCommand('stackoverflowextension.start', function() {
		panel = vscode.window.createWebviewPanel('mainpage', 'Search Engine', vscode.ViewColumn.One, {enableScripts: true});
		const pathhtml = vscode.Uri.file(path.join(context.extensionPath, 'app.html'));
		const currentPath = vscode.Uri.file(path.join(context.extensionPath)).path;
		panel.webview.html = fs.readFileSync(pathhtml.fsPath, 'utf-8');
			
		
		panel.webview.onDidReceiveMessage(message => {
			switch(message.command)
			{
				case 'alert':
					MainFunction(message.text);
					// TestServerFunction();
					vscode.window.showErrorMessage(message.text);
					return;
				}
			});
		// panel.webview.postMessage({ command: 'refactor' });

	});

}


// function TestServerFunction() {
// 			// console.log("Body markdown:" + response.items[0].body_markdown)
// 		var converter = new showdown.Converter();
//     	var html = converter.makeHtml("My problem is really weird. I have to sort an list like:\r\n\r\n    list1=[&quot;S01E01&quot;,&quot;S02E010&quot;, &quot;S02E013&quot;, &quot;S02E02&quot;, &quot;S02E03&quot;]\r\n\r\nand I want result like:\r\n\r\n    list1=[&quot;S01E01&quot;,&quot;S02E02&quot;, &quot;S02E03&quot;, &quot;S02E010&quot;, &quot;S02E013&quot;]\r\n\r\nI used `sort()`, `sorted()`, `map()` methods but these methods couldn&#39;t sort this list as it is already sorted. \r\nIf you type &quot;010&quot;&gt;&quot;02&quot; in python console it will return **false**.\r\n\r\n\r\n**_Please suggest me any way to debug this problem._**\r\n\r\n\r\n[See the console screenshots][2]\r\n\r\n\r\n  [1]: https://i.stack.imgur.com/oDERn.png\r\n  [2]: https://i.stack.imgur.com/Jb7BF.png\r\n");
// 		console.log("HTML" + html);
		
// }
// Could not use spacy
/**
 * @param {string} message
 */
function MainFunction(message)
{	
	
	const tokeniser = new natural.WordTokenizer();
	var tokens = tokeniser.tokenize(message);
	for(var i=0;i<tokens.length;i++)
	{
		// Got lower case tokens
		// Punctuations already removed
		tokens[i] = tokens[i].toLowerCase();
	}

	// To remove stopwords
	const afterremovingstopwords = stopword.removeStopwords(tokens);
	// console.log(afterremovingstopwords);

	var data;
	request("http://127.0.0.1:5000/search/" + afterremovingstopwords, function(error, response, body) {
		// console.log(body);
		data = body.split(',');
		ProcessIds(data);
	})
}

/**
 * @param {string[]} data
 */
async function ProcessIds(data) {
	// console.log(data);
	var ids = [];
	for(var i=0;i<data.length-1;i++)
	{
		let temp = data[i].split('/');
		ids.push(temp[temp.length-1]);
	}
	

	var questions_url = "https://api.stackexchange.com/2.2/questions/";
	var answers_url = "https://api.stackexchange.com/2.2/questions/";
	for (var i=0;i<ids.length-1;i++)
	{
		questions_url += ids[i] + ';';
		answers_url += ids[i] + ';';
	}
	questions_url += ids[ids.length - 1] + "?site=stackoverflow&filter=!9_bDDx5Ia";
	answers_url += ids[ids.length - 1] + "/answers?site=stackoverflow&filter=!9_bDE(S2a";

	var JSONData = {}
	var OrderedUrls = []
	// First get question data [title, body]
	var reqData = {
		url: questions_url,
		method:"get",
		headers: {'Accept-Encoding': 'gzip'}
	}
	var gunzip = zlib.createGunzip();
	var json = "";
	gunzip.on('data', function(data){
		json += data.toString();
	});
	gunzip.on('end', function(){
		var response = (JSON.parse(json));
		var questions = response.items;
		for (var i=0;i<questions.length;i++)
		{
			OrderedUrls.push(questions[i].question_id);
			var question = {"title":questions[i].title,"body":questions[i].body}
			JSONData[questions[i].question_id] = question;
		}
		// console.log(JSONData);
		GetAnswers(answers_url, JSONData, OrderedUrls);
	});
	request(reqData)
		.pipe(gunzip)

}

function GetAnswers(answers_url, JSONData, OrderedUrls) {
	var reqData = {
		url: answers_url,
		method:"get",
		headers: {'Accept-Encoding': 'gzip'}
	}
	var gunzip = zlib.createGunzip();
	var json = "";
	gunzip.on('data', function(data){
		json += data.toString();
	});
	gunzip.on('end', function(){
		var response = (JSON.parse(json));
		var answers = response.items;
		for (var i=0;i<answers.length;i++)
		{
			var answer = {"body":answers[i].body}
			if ("answers" in JSONData[answers[i].question_id])
			{
				JSONData[answers[i].question_id]["answers"].push(answer);
			}
			else
			{	
				JSONData[answers[i].question_id]["answers"] = [answer];
			}
		}
		console.log(JSONData);
		console.log(OrderedUrls);
		panel.webview.postMessage({JSONData:JSONData, OrderedUrls:OrderedUrls});
	});
	request(reqData)
		.pipe(gunzip)
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}



// TODO: Add condition for python3 or python
// CMD: python_script/bin/python3 script.py afterremovingstopwords currentpath
// cp.exec(currentPath + '/python_script/bin/python3 ' + currentPath + '/python_script/script.py ' + afterremovingstopwords + " " + currentPath, (err, stdout, _) => {

// 	if (err) {
// 		console.log('error: ' + err);
// 	}
// 	else
// 	{
// 		console.log('data:', stdout);
// 		data = stdout.split(',');
// 		ProcessIds(data);
// 	}

// });

/*

Question i -> title -> all answers

JSONData[question_id] = {title:"title", "body": body, answers:[answer1_body, answer2_body]}

*/

// console.log("Body markdown:" + response.items[0].body_markdown)
// var converter = new showdown.Converter();
// var html = converter.makeHtml(response.items[0].body_markdown);
// console.log("HTML" + html);
// GetAnswers(response);