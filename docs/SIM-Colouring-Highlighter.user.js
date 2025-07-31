// ==UserScript==
// @name         SIM Colouring and Label Highlighter (Fixed Service Type Handling)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Highlight SIMs based on labels and OFD, excluding specific service types (including ORDT Service Type Request) from OFD coloring, but still using label colors where applicable.
// @author       Konstantinos Boutis
// @match        https://issues.amazon.com/issues/search*
// @downloadURL  https://kostas9093.github.io/Amazon-Script/SIM-Colouring-Highlighter.user.js
// @updateURL    https://kostas9093.github.io/Amazon-Script/SIM-Colouring-Highlighter.user.js
// ==/UserScript==

(function () {
    'use strict';

    const labelColorMap = {
        'Proposed': '#D8BFD8',
        'Notice':  '#c2c1c1ff'
    };

    const combinedColor = 'linear-gradient(to right, #D8BFD8 50%, #c2c1c1ff 50%)';
    const greenColor = '#d4edda';
    const amberColor = '#ffdf78ff';
    const redColor = '#fab1b7ff';
    const redBorder = '2px solid red';

    const excludedServiceTypes = [
        'ORDT Service Type Request',
        'Compatibility Area',
        'Investigation',
        'Hard Constraints',
        'Investigation Required'
    ];

    function parseDMY(dateStr) {
        const [day, month, year] = dateStr.split('/').map(Number);
        return new Date(year, month - 1, day);
    }

    function getDayDifference(targetDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return Math.floor((targetDate - today) / (1000 * 60 * 60 * 24));
    }

    function getWeekDifference(targetDate) {
        return getDayDifference(targetDate) / 7;
    }

    function extractServiceType(titleText) {
        // Try pattern: - Service Type -
        const dashPattern = titleText.match(/- (.+?) -/);
        if (dashPattern) {
            return dashPattern[1].trim();
        }

        // Fallback: check if title starts with a known service type phrase
        for (const type of excludedServiceTypes) {
            const lowerType = type.toLowerCase();
            if (titleText.toLowerCase().includes(lowerType)) {
                return type;
            }
        }

        return null;
    }

    function applyColoring() {
        const simItems = document.querySelectorAll('li.queue-item');

        simItems.forEach(item => {
            let labelMatched = false;

            const labels = item.querySelectorAll('span.label[title]');
            const labelTitles = Array.from(labels).map(label => label.getAttribute('title'));

            if (labelTitles.includes('Notice') && labelTitles.includes('Proposed')) {
                item.style.backgroundImage = combinedColor;
                labelMatched = true;
            } else {
                for (const title of labelTitles) {
                    if (labelColorMap[title]) {
                        item.style.backgroundColor = labelColorMap[title];
                        labelMatched = true;
                        break;
                    }
                }
            }

            const titleEl = item.querySelector('b.queue-item-title');
            const titleText = titleEl?.title || '';
            const match = titleText.match(/\[(\d{2}\/\d{2}\/\d{4})\]/);
            const serviceType = extractServiceType(titleText);

            const isExcluded = excludedServiceTypes.some(ex =>
                serviceType?.toLowerCase() === ex.toLowerCase()
            );

            if (match) {
                const ofdDate = parseDMY(match[1]);
                const dayDiff = getDayDifference(ofdDate);
                item.style.border = (dayDiff >= 0 && dayDiff <= 3) ? redBorder : '';

                if (!labelMatched && !isExcluded) {
                    const weekDiff = getWeekDifference(ofdDate);
                    if (weekDiff > 4) {
                        item.style.backgroundColor = greenColor;
                    } else if (weekDiff > 3) {
                        item.style.backgroundColor = amberColor;
                    } else {
                        item.style.backgroundColor = redColor;
                    }
                }
            } else {
                item.style.border = '';
            }
        });
    }

    const observer = new MutationObserver(applyColoring);
    observer.observe(document.body, { childList: true, subtree: true });

    applyColoring();
})();
