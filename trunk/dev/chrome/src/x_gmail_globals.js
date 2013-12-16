/* 
 * this script is injected by the background page 
 * via chrome.tabs.executeScript to extract the 
 * magic_ik value from the GLOBALS array. 
 * It's a little bit of black magic as usual. 
 */

/* get all page scripts */
var scripts = document.getElementsByTagName('script');

/* find the GLOBALS array */
for (var i = 0; i < scripts.length; i++) 
{
	var match = scripts[i].innerHTML.match(
		 new RegExp('GLOBALS=\\[[^\\]]+','gi'));

	if (match) 
	{
		var globals = match[0];
		/* tokenize array based on , */
		if (globals) globals = globals.split(',')
		var magic_ik = null;
		/* last expression evaluated is the return value */
		null;
		if (globals && globals.length > 8) magic_ik = globals[9];
		if (magic_ik) magic_ik.replace(/\"/gi,'');
	}
}

