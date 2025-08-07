// ==UserScript==
// @name         Dav Proposal Button
// @namespace    http://tampermonkey.net/
// @version      0.6
// @author       Konstantinos Boutis
// @description  Inject a button next to Markdown Guide above the text editor and generates a message for Dav.
// @match        https://issues.amazon.com/*
// ==/UserScript==

(function () {
    'use strict';

    console.log('✅ Tampermonkey script loaded');

    // Resize helper
    function autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    function attachAutoResize(textarea) {
        if (!textarea._autoResizeAttached) {
            textarea.addEventListener('input', () => autoResizeTextarea(textarea));
            textarea._autoResizeAttached = true;
        }
    }

    const interval = setInterval(() => {
        const toolbars = document.querySelectorAll('div[class*="toolbar"]');
        let found = false;

        toolbars.forEach(toolbar => {
            if (toolbar.innerHTML.includes('SIMFlavoredMarkdown')) {
                if (!toolbar.querySelector('#generateDavBtn')) {
                    const button = document.createElement('button');
                    button.id = 'generateDavBtn';
                    button.textContent = 'Generate Dav Comment';
                    button.style.marginLeft = '0px';
                    button.style.padding = '1px 2px';
                    button.style.fontSize = '10px';
                    button.style.cursor = 'pointer';

                    button.addEventListener('click', () => {
                        const message = `Below you can find attached a zip folder with DSP area shifts/Jurisdiction shifts as per our Delivery Area Visualiser (DAV).

You can use these snips to communicate the change in areas to each of the DSPs

Each colour represents a change of the DSPs PA(Preferred Area) and/or Jurisdictional Change:

🟪 - Retained Area

🟥 - Lost Area

🟩 - Gained Area`;

                        const textarea = document.getElementById('issue-conversation');
                        if (textarea) {
                            textarea.value = message;
                            textarea.dispatchEvent(new Event('input', { bubbles: true }));
                            textarea.dispatchEvent(new Event('change', { bubbles: true }));

                            autoResizeTextarea(textarea); // initial resize
                            attachAutoResize(textarea); // make dynamic

                        } else {
                            alert('❌ Could not find the textarea.');
                        }
                    });

                    toolbar.appendChild(button);
                    console.log('✅ Button added to Markdown toolbar');
                }

                found = true;
            }
        });

        if (found) clearInterval(interval);
    }, 1000);
})();
