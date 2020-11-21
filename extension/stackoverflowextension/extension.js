// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const natural = require('natural');
const stopword = require('stopword');
const request = require("request");
const zlib = require('zlib');

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
					return;
				}
			});

	});

}



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


