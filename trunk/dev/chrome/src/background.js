/*
 * This background page injects x_gmail_globals.js to 
 * ultimately retrieve the GLOBALS JavaScript array 
 * from the Gmail tab to extract some magic values. 
 */

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) 
	{
		/*console.log(sender.tab ? 
			"from a content script:" + sender.tab.url :
			"from the extension");*/

		if (request.get_magic_ik) 
		{
			chrome.tabs.executeScript(
				sender.tab.id, 
				{file: "x_gmail_globals.js", allFrames: true}, 
				function(result) {
					if (result) {
						//alert(result[0]);
						sendResponse({magic_ik: result[0]});
					} else {
						/*alert('no result');*/
					}
			});
		}

		return true;
	}
);
