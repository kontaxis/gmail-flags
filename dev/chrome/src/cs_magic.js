var verbose = 0;
var debug = 0;

var magic_ik = 0; // magic token specific to a gmail account

if (debug || 1)
	console.log("[!] [PROLOGUE] " + document.URL);

/*
 * handles the respone to a geoip lookup request, 
 * updates DOM with visual indicators 
 */
function geolookup_handler() {
	if(this.readyState == this.DONE) {
		if (this.status == 200) 
		{
			var geo_obj = null;
			geo_obj = JSON.parse(this.responseText);
			if (debug || 1)
				console.log("[+] geolocation metadata: " + this.responseText 
					+ " (" + this.containerID + ")");

			var original_ip_source_meta = "";
			if (geo_obj) {
				/* if country is US, display state flag instead of city */
				if (geo_obj.country_name == "United States" 
					&& geo_obj.region_name != "") 
				{
					original_ip_source_meta = 
						this.original_ip_source 
						+ ", <img src='" 
							+ chrome.extension.getURL("flags/us/" 
								+ geo_obj.region_name.toLowerCase().replace(/ /g,"-")+".svg") 
							+ "' width=64 " 
							+ "alt='" + geo_obj.city + ", " + geo_obj.region_name + "' " 
							+ "title='" + geo_obj.city + ", " + geo_obj.region_name + "' >";
				}
				/* else just display city */
				else {
					if (geo_obj.city != "")
						original_ip_source_meta = 
							this.original_ip_source + ", " + geo_obj.city;
					else
						original_ip_source_meta = 
							this.original_ip_source + ", N/A";
				}
			} else original_ip_source_meta = this.original_ip_source + ", N/A, N/A";

			if (geo_obj.country_name == "Reserved") geo_obj = null;

			/* draw */
			var container = document.getElementById(this.containerID);
			container.style.borderWidth = "2px";
			container.style.borderStyle = "dashed";
			container.style.borderColor = "red";
			container.innerHTML = 
				"" + original_ip_source_meta 
				+ ((geo_obj)?(", <img src='" 
					+ chrome.extension.getURL("flags/" 
						+ geo_obj.country_code.toUpperCase() + ".png") 
					+ "' alt='" + geo_obj.country_name + "' " 
					+ "title='" + geo_obj.country_name + "'>"):",?") 
				+ ""; 

		} 
		else 
			console.log("[+] geolocation lookup failed (" 
				+ this.original_source_ip + "," + this.containerID + ")");
	}
}

/* 
 * handles the response to a request for 
 * the original message (incl. envelope headers). 
 * extracts sender's IP, 
 * resolves it to a geographic location
 */
function xmlhttp_handler() {
	if(this.readyState == this.DONE) {
		if(this.status == 200) 
		{
			if (debug || 1)
				console.log("[+] headers retrieved (" + this.containerID + ")");

			/* contains all IP address sources as extracted 
				from the 'received from' headers of the message */
			var ip_sources = new Array();

			/* print the 'from' line of the message. 
				used to easily identify a message in the console. */
			if (verbose || 1)
				console.log(this.responseText.match(new RegExp('From:[^\n]+','gi')));

			/* extract 'received from' headers */
			var rcv_from 
				= this.responseText.match(new RegExp('Received: from[^)]+','gi'));

			if (rcv_from == null) {
				if (debug) {
					console.log("\n--- BEGIN MESSAGE DUMP --- --- ---\n");
					console.log(this.responseText);
					console.log("\n---   END MESSAGE DUMP --- --- ---\n");
				}
				return;
			}

			/* for each message header extract the source IP address */
			if (debug)
				console.log("\n--- --- --- BEGIN MESSAGE HEADERS --- --- ---\n");

			for (var i = 0; i < rcv_from.length; i++) {
				if (debug)
					console.log(rcv_from[i]);

				/* get the part inside the parenthesis */
				var rcv_from_actual = rcv_from[i].split('(');
				if (rcv_from_actual == "") continue;
				if (rcv_from_actual.length < 2) continue;
				rcv_from_actual = rcv_from_actual[1];

				/* get the part inside the brackets [...] */
				var rcv_from_ipaddr 
//					= rcv_from_actual.match(new RegExp('\\[[^\\]]+','gi'));
				// match against something that looks like an IP address and ends with a space or ] or ) - doing this to avoid matching IP-adresses-prefixed domains (e.g., 127.0.0.1-dynclient.foobar.com)
					= rcv_from_actual.match(
						new RegExp('[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+[\\]\\) ]','gi'));
				if (rcv_from_ipaddr == null) continue;
				// get first (and should be only) match
				rcv_from_ipaddr = rcv_from_ipaddr[0];
				// strip away last character (see regexp above)
				rcv_from_ipaddr 
					= rcv_from_ipaddr.substring(0,rcv_from_ipaddr.length-1);
//				rcv_from_ipaddr = rcv_from_ipaddr.split('[');
//				if (rcv_from_ipaddr.length < 2) continue;
//				rcv_from_ipaddr = rcv_from_ipaddr[1];

				if (debug)
					console.log("[*] '" + rcv_from[i] + "' produced '" 
						+ rcv_from_ipaddr +"'");

				/* push IP source in the array */
				ip_sources.push(rcv_from_ipaddr);
			}
			if (debug)
				console.log("\n--- --- ---   END MESSAGE HEADERS --- --- ---\n");

			/* reverse the IP sources array so that the bottom 
				headers extract comes first */
			ip_sources = ip_sources.reverse();

			/* process IP sources in the array, 
				discard any private IP addresses 
				and get the first good candidate */
			for (var i = 0; i < ip_sources.length; i++) 
			{
				if (debug)
					console.log("[x] considering " + ip_sources[i]);
				if (ip_sources[i].match(new RegExp('^127\\.0\\.0\\.1','gi'))) continue;
				if (ip_sources[i].match(new RegExp('^10\\.','gi'))) continue;
				if (ip_sources[i].match(new RegExp('^192\\.168\\.','gi'))) continue;

				if (verbose)
					console.log("[x] source IP address is: " + ip_sources[i]);

				// Resolve IP address to a geographic location
				var geoclient = new XMLHttpRequest();
				geoclient.original_ip_source = ip_sources[i];
				geoclient.containerID = this.containerID;
				geoclient.onreadystatechange = geolookup_handler;
				geoclient.open("GET", "http://freegeoip.net/json/" 
					+ geoclient.original_ip_source, true); // asynchronous
				geoclient.send(null);

				/* don't process any more source IP addresses in the array. 
					first match is what we are looking for. */
				break; 
			}
		}
	}
}


if (
document.URL == "https://mail.google.com/mail/u/0/" || 
document.URL == "https://mail.google.com/mail/ca/u/0/" || 
document.URL.indexOf("https://mail.google.com/mail/?shva=1#") == 0 || 
document.URL.indexOf("https://mail.google.com/mail/u/0/#") == 0 || 
document.URL.indexOf("https://mail.google.com/mail/u/0/?shva=1#") == 0 || 
document.URL.indexOf("https://mail.google.com/mail/ca/u/0/#") == 0 || 
document.URL.indexOf("https://mail.google.com/mail/ca/u/0/?shva=1#") == 0
)
{
	if (verbose || 1)
		console.log("[!] [RUNNING ] " + document.URL);

	chrome.runtime.sendMessage({get_magic_ik: true}, 
		function(response) {
			if (debug || 1) 
				console.log('[x] magic_ik must be \'' 
					+ response.magic_ik + '\'');
			magic_ik = response.magic_ik;
		}
	);

	window.setInterval(function() {

		if (debug)
			console.log('\n\n---------- tick tock -----------\n');

		/* 'ii gt ...' class names to extract message identifiers 
			(had to smell my fingers for this I) */
		var iigt = document.getElementsByClassName('ii gt');

		/* 
			for each class name that is not 'ii gt undefined' 
			but 'ii gt m<ALNUM_ID> ...' 
			do extract the message identifier and issue an 
			asynchronous HTTP request to retrieve the original 
			message which includes e-mail headers. 
		*/
		for (var i = 0; i < iigt.length; i++) {
			if (iigt[i].getAttribute('class') != 'ii gt undefined') 
			{
				/* print found class names */
				var class_name = iigt[i].getAttribute('class');
				if (class_name == null || class_name == "") {
					if (debug)
						console.log('ABORT1'); 
					continue
				};
				if (debug)
					console.log(class_name); 

				/* extract message id */
				var class_name_frags = class_name.split(' ');
				if (class_name_frags.length < 3) {
					if (debug)
						console.log('ABORT2'); 
					continue;
				}
				var message_id = class_name_frags[2].substring(1);

				if (verbose)
					console.log("[x] message ID is " + message_id);

				/* append an invisible span element to remember we've 
					already processed this message so we don't process it 
					again unless the user navigates away from this thread */
				if (!document.getElementById("processed_message_ids")) {
					var processed_message_ids = document.createElement('span');
					/* make it invisible to the user */
					processed_message_ids.style.display = "none";
					processed_message_ids.id = "processed_message_ids";
					processed_message_ids.innerHTML == "";
					document.getElementsByClassName("ade")[0]
						.appendChild(processed_message_ids);
				} 
				else {/* console.log ('reusing the space...'); */}

				if (document.getElementById("processed_message_ids")
					.innerHTML.indexOf("("+message_id+")") != -1) {
					continue;
				}
				else 
					document.getElementById("processed_message_ids")
						.innerHTML += "("+message_id+") ";

				if (debug)
					console.log("[x] effective message ID is " + message_id);

				/* original message URL (smell my fingers II) */
				if (magic_ik == null || magic_ik == "") {
					if (debug)
						console.log('ABORT4'); 
					continue
				};
				var original_message_url 
					= "https://mail.google.com/mail/u/0/?ui=2&ik=" 
						+ magic_ik + "&view=om&th=" + message_id;

				/* set up a container to hold visual elements 
					(e.g., national flag) */
				var containerID = new Date().getTime() 
					+ parseInt(Math.random() * 1000) + "-" + message_id;
				var container = document.createElement('span');
				container.id = containerID;
				container.innerHTML = ""; //containerID;
				var parentElement = iigt[i].parentNode;
				for (var c = 0; c < parentElement.childNodes.length; c++)
					if (parentElement.childNodes[c].getAttribute('class')=="gE iv gt") {
						parentElement.childNodes[c].appendChild(container);
						break;
					}

				/* fire HTTP request to retrieve original message */
				if (debug || 1) {
					console.log('[x] retrieving headers ' 
						+ original_message_url + " (" + containerID + ")");
				}

				var client = new XMLHttpRequest();
				client.containerID = containerID;
				client.onreadystatechange = xmlhttp_handler;
				client.open("GET", original_message_url, true); // asynchronous
				client.send(null);
			}
		}

	}, 5000);
} 
else 
	if (debug || 1) 
		console.log("[!] [IGNORING] " + document.URL);
