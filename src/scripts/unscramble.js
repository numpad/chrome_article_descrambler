
function descr_fixword(desc, gibberish) {
	const normalized_word = desc.normalize_word(gibberish);
	const punctuation = desc.collect_punctuation(gibberish);

	const potential_words = desc.dictionary[normalized_word] || [];
	
	let output_word;
	if (potential_words.length === 0) {
		output_word = `<span class="descrambler-gibberish">${gibberish}</span>`;
		punctuation.length = 0;
	} else if (potential_words.length === 1) {
		output_word = potential_words[0];
	} else {
		const html_potential_words = potential_words.map((word, index) => {
			return `<span class="descrambler-undecided-word" data-index="${index}">${word}</span>`;
		}).join('/');
		output_word = `<span class="descrambler-undecided">${html_potential_words}</span>`;
	}
	
	// position punctation
	const punctuation_left = punctuation.filter(char => (desc.punctuation_weights[char] || 0) < 0)
		.sort((a, b) => (desc.punctuation_weights[a] || 0) - (desc.punctuation_weights[b] || 0));
	const punctuation_right = punctuation.filter(char => (desc.punctuation_weights[char] || 0) > 0)
		.sort((a, b) => (desc.punctuation_weights[a] || 0) - (desc.punctuation_weights[b] || 0));
	
	return `${punctuation_left.join('')}${output_word}${punctuation_right.join('')}`;
}

function descr_fixarticle(desc, article) {
	const realtext = article.split(' ')
		.map(word => descr_fixword(desc, word))
		.join(' ');

	return realtext;
}

/**
 * Usage:
 * const descrambler = descr_init(<dictionary>);
 * const text = descr_fixarticle(descrambler, "ieD uenaketll hrccntNaehi:");
 * console.log('Readable Article:', text);
 */
function descr_init(dict) {
	return {
		dictionary: dict,
		normalize_word: (word) => word.toLowerCase().replaceAll(/[^a-zäöüß]/g, '').split('').sort().join(''),
		collect_punctuation: (gibberish) => gibberish.replaceAll(/[a-zA-ZäöüÄÖÜß]/g, '').split(''),
		punctuation_weights: {
			'(': -3, ')':  3,
			'[': -2, ']':  2,
			'„': -2, '“':  2,
			'.':  4, ',':  4, '!': 4, '?': 4, '*': '4',
			':':  5, ';':  5,
		},
	};
}

function onDescramble() {
	const wordlist = chrome.runtime.getURL("assets/words_de_sorted.json");
	fetch(wordlist).then(response => response.json().then(dictionary => {

		const descrambler = descr_init(dictionary);

		// descramble
		[...document.querySelectorAll(".text:not(.descramble-complete)")]
			.forEach(el => {
				el.classList.add('descramble-complete');
				el.innerHTML = descr_fixarticle(descrambler, el.innerText);

				[...el.querySelectorAll('.descrambler-undecided-word')].forEach(el_word => {
					el_word.addEventListener('click', (e) => {
						e.target.parentElement.classList.remove('descrambler-undecided');
						e.target.parentElement.classList.add('descrambler-decided');
						e.target.parentElement.innerHTML = e.target.innerHTML;
					});
				});
			});

		// remove blur
		[...document.querySelectorAll(".text,.text-blurred")]
			.forEach(e => e.classList.remove("text-blurred"));

		chrome.runtime.sendMessage({ status: 'descramble-complete' });
	}));
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.message === 'descramble') {
		onDescramble();
	}
});

