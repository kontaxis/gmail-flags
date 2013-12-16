------------
| WARNINGS |
------------

1. This extension is issuing one (1) extra HTTP request towards Gmail 
	for every message you open. Viewing the list of messages (displaying 
	only sender and subject) does not incur any such overhead. 
	Viewing a thread of messages (or conversations) issues one (1) extra 
	request towards Gmail for every message the body of which you view -- 
	by default only one message (the last one) is displayed but if you open 
	another message from that conversation or choose to expand all messages, 
	additional requests will be issued. 
	In other words, you will more or less double the amount of requests you 
	issue towards Gmail. I do not expect that to cause any problems in terms 
	of exceeding some quota or triggering some anomaly detection system but 
	you have been warned!

2. This extension uses an external Web service for resolving IP addresses 
	to geographic locations. This external Web service is http://freegeoip.net/. 
	As it does not utilize HTTPS but plain HTTP, this extension is transmitting 
	unencrypted HTTP requests containing (just) the IP address of the sender of 
	each message. 
	Nevertheless, this could reveal to someone passively 	monitoring this 
	unecrypted network channel the source of your e-mail messages (country, 
	city, company or even individual). 
	Keep in mind that there is *nothing* in these requests to hint that you 
	are looking up the source IP address of your e-mail messages. It just 
	appears that you are looking IP addresses. Still, that may cause you 
	some trouble under certain situations. You have been warned!

