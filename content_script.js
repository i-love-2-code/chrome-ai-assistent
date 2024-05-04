
systemPromptDefault = `
     Du bist ein hilfreicher Assistent und bekommst von einem Browser-Plugin ein bereinigtes HTML. 
	 Extrahiere aus diesem HTML den Haupt-Inhalt und fasse ihn in einem JSON in DEUTSCHER SPRACHE zusammen.
	 
	 Hier der Aufbau des JSON:
	 
	 {
		 "title" : TITEL_DEINER_ZUSAMMENFASSUNG,
		 "content" : DEINE_KURZE_ZUSAMMENFASSUNG,
		 "BEWERTUNG" : 1_BIS_5_5_IST_AM_BESTEN_ALS_INT,
		 "BEWERTUNG_DETAIL" : ERLÄUTERUNG_DEINER_BEWERTUNG
     }
	 
	 Als Bewertung gib bitte deine eigene Bewertung ab. Bewerte dabei Inhalt, Neutralität, Mehrwert und Echtheit der Information. 
	 Wenn du dir bei der Echtheit nicht sicher bist, bewerte den Inhalt Schritt für Schritt mit dir zur Verfügung stehenden
	 Informationen und errechne dir einen Echtheitsscore. Ist der hoch ist alles gut, sonst geh von Fakenews aus.
	 Bewerte Fakenews und Clickbait immer sehr schlecht! Bewahre damit den User davor seine Zeit zu verschwenden.
	 Bewertung von 1 ist sehr schlecht, Bewertung von 5 heißt sehr gut. 
	 In BEWERTUNG_DETAIL erkläre deine Bewertung kurz. Erläutere auf JEDEN FALL warum du Punkte abgezogen hast.
	
	 Antworte nur mit dem JSON!
	 Gib unter keinen Umständen noch mehr Informationen in deiner Antwort!
	 `;




systemPromptYt = `
     Du bist ein hilfreicher Assistent und bekommst von einem Browser-Plugin das Transkript eines Youtube-Videos. 
	 Fasse den Inhalt ausführlich in einem JSON in DEUTSCHER SPRACHE zusammen.
	 
	 Hier der Aufbau des JSON:
	 
	 {
		 "title" : TITEL_DEINER_ZUSAMMENFASSUNG,
		 "content" : DEINE_ZUSAMMENFASSUNG,
		 "BEWERTUNG" : 1_BIS_5_5_IST_AM_BESTEN_ALS_INT,
		 "BEWERTUNG_DETAIL" : ERLÄUTERUNG_DEINER_BEWERTUNG
     }
	 
	 Als Bewertung gib bitte deine eigene Bewertung ab. Bewerte dabei Inhalt, Neutralität, Mehrwert und Echtheit der Information. 
	 Wenn du dir bei der Echtheit nicht sicher bist, bewerte den Inhalt Schritt für Schritt mit dir zur Verfügung stehenden
	 Informationen und errechne dir einen Echtheitsscore. Ist der hoch ist alles gut, sonst geh von Fakenews aus.
	 Bewerte Fakenews und Clickbait immer sehr schlecht! Bewahre damit den User davor seine Zeit zu verschwenden.
	 Bewertung von 1 ist sehr schlecht, Bewertung von 5 heißt sehr gut. 
	 In BEWERTUNG_DETAIL erkläre deine Bewertung kurz. Erläutere auf JEDEN FALL jeden Punkt den du abgezogen hast.
	
	 Antworte nur mit dem JSON!
	 Gib unter keinen Umständen noch mehr Informationen in deiner Antwort!
	 `;




function createPopup(jsonData) {

    const popupHTML = `
    <div id="lm-popup" class="lm-popup" style="display: none;">
      <div class="lm-popup-header">
        <h3 class="lm-popup-title"></h3>
        <span class="lm-popup-close">&times;</span>
      </div>
      <div class="lm-popup-content">
        <p class="lm-popup-summary"></p>
        <div class="lm-popup-rating">
          <div class="lm-popup-stars"></div>
          <p class="lm-popup-rating-detail"></p>
        </div>
      </div>
    </div>
  `;

    const popupContainer = document.createElement('div');
    popupContainer.innerHTML = popupHTML.trim();
    document.body.appendChild(popupContainer.firstChild);

    const popup = document.getElementById('lm-popup');
    const title = popup.querySelector('.lm-popup-title');
    const summary = popup.querySelector('.lm-popup-summary');
    const ratingStars = popup.querySelector('.lm-popup-stars');
    const ratingDetail = popup.querySelector('.lm-popup-rating-detail');

    title.textContent = jsonData.title;
    summary.textContent = jsonData.content;

    ratingStars.innerHTML = '';
    for (let i = 0; i < 5; i++) {
        const star = document.createElement('span');
        star.innerHTML = "&bigstar;";
        star.classList.add('lm-popup-star');
        if (i < jsonData.BEWERTUNG) {
            star.classList.add('filled');
        }
        ratingStars.appendChild(star);
    }

    ratingDetail.textContent = jsonData.BEWERTUNG_DETAIL;

    const closeBtn = popup.querySelector('.lm-popup-close');
    closeBtn.addEventListener('click', () => {
        popup.style.display = 'none';
    });

    popup.style.display = 'block';
}


function sendToLLM(cleanContent, systemPrompt) {
   
    systemPrompt = systemPrompt.trim();

    console.log("clean: " + cleanContent.length);

    const requestMessages = [
        {role: 'system', content: systemPrompt},
        {role: 'user', content: cleanContent}
    ];

    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            stream: false,
            messages: requestMessages,
            temperature: 0.15
        })
    };

    fetch('http://localhost:11434/v1/chat/completions', requestOptions)
        .then(response => {
            if (response.ok && response.status === 200) {
                return response.json();
            } else {
                alert("Fehler")
                throw new Error('Network response was not ok.');
            }
        })
        .then(data => {
            const jsonData = JSON.parse(data.choices[0].message.content);
            createPopup(jsonData);
        })
        .catch(error => console.error(error));
}


function removeLineBreaks(node) {
    if (node.nodeType === Node.TEXT_NODE) {
        node.nodeValue = node.nodeValue.replace(/[\r\n]+/g, '');
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        for (let i = 0; i < node.attributes.length; i++) {
            const attribute = node.attributes[i];
            attribute.value = attribute.value.replace(/[\r\n]+/g, '');
        }
    }

    const childNodes = Array.from(node.childNodes);
    for (let i = 0; i < childNodes.length; i++) {
        removeLineBreaks(childNodes[i]);
    }
}

function removeAttributes(node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
        node.removeAttribute('style');
        for (let i = node.attributes.length - 1; i >= 0; i--) {
            node.removeAttributeNode(node.attributes.item(i));
        }
    }

    for (let i = 0; i < node.childNodes.length; i++) {
        removeAttributes(node.childNodes[i]);
    }
}


function removeElements(node) {
    if (node.nodeType === Node.ELEMENT_NODE && ["ASIDE", "FIGURE", "NOSCRIPT", "SVG", "PATH", "STYLE", "SCRIPT"].includes(node.tagName)) {
        node.parentNode.removeChild(node);
    } else {
        for (let i = 0; i < node.childNodes.length; i++) {
            removeElements(node.childNodes[i]);
        }
    }
}

function removeEmptyHtmlElements(content) {
    const tagsToRemove = [
        "button", "span", "br", "b", "small", "i", "a", "svg", "use", "input", "form", "fieldset", "a-analytics", "a-script"
    ];

    for (let i = 0; i < tagsToRemove.length; i++) {
        let currentTag = tagsToRemove[i];
        content = content.replaceAll("<" + currentTag + ">", "");
        content = content.replaceAll("</" + currentTag + ">", "");
        content = content.replaceAll("  ", " ");
    }

    return content;
}

function getCleanContent() {
    let documentClone = document.cloneNode(true);
    removeLineBreaks(documentClone.documentElement);
    let bodyClone = documentClone.body.cloneNode(true);

    console.log("raw: " + bodyClone.outerHTML.length)

    removeAttributes(bodyClone);
    removeElements(bodyClone);
    let cleanContent = bodyClone.outerHTML;

    cleanContent = removeEmptyHtmlElements(cleanContent);
    console.log("clean: " + cleanContent)
	return cleanContent;
}



function getContentFromYoutube() {
	
	$("expand").click();
	const lst = document.getElementsByTagName("yt-button-shape");
	
	for(let i = 0, max = lst.length; i < max; i++) 
		if(lst[i].textContent === "Transkript anzeigen") { 
			lst[i].firstChild.click(); 
			break; 
		}
	
	window.setTimeout(
		function(){
			
			let isTranscript = false
			let content = "";
			const context = $("panels")
			
			let lst = context.getElementsByTagName("yt-formatted-string");

			for(let i = 0, max = lst.length; i < max; i++)  {
				if(isTranscript && lst[i].textContent != "") 
					content += lst[i].textContent + "\n";
				
				if(lst[i].textContent === "Transkript") 
					isTranscript = true;  	
			}
			
			sendToLLM(content, systemPromptYt);
		},
		2000
	);
}





function isYtVideo() {
	return window.location.href.startsWith(
		'https://www.youtube.com/watch?v='
	)
}



$ =  function(id) {
	return document.getElementById(id);
};


// 1. youtube oder nicht?
if(isYtVideo()) {
    // auf yt-video, content auf neue Art ermitteln	
	getContentFromYoutube();	
	
} else {
	// nicht auf yt-video
	cleanContent = getCleanContent();	
	sendToLLM(cleanContent, systemPromptDefault);
}



