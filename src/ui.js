
function sendMessageDescramble() {
	const classlist = document.querySelector('#input_content_finder_classlist').value;

	chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
		const active_tab = tabs[0];
		chrome.tabs.sendMessage(active_tab.id, {
			message: 'descramble',
			params: {
				classlist: classlist,
			},
		});
		
		document.querySelector('#btn-unlock').disabled = 'disabled';
	});
}

document.addEventListener("DOMContentLoaded", () => {
	document.querySelector("#btn-unlock").addEventListener("click", sendMessageDescramble);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.status === 'descramble-complete') {
		document.querySelector('#btn-unlock').disabled = '';
	}
});

