// ==UserScript==
// @name         Proposal Button
// @namespace    http://tampermonkey.net/
// @version      0.6
// @author       Konstantinos Boutis
// @description  Inject a button next to Markdown Guide above the text editor and generates a default proposal and gets details for station name, OFD date, country and PAAT approval links from the title.
// @match        https://issues.amazon.com/*
// @match        https://sim.amazon.com/issues/search*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    console.log('✅ Tampermonkey script loaded');




    function extractCountry() {
        const span = document.querySelector('span.editable-field-display-text');
        if (!span) return null;

        const matches = [...span.textContent.matchAll(/\[([^\]]+)\]/g)];
        if (matches.length >= 3) {
            return matches[0][1].toLowerCase(); // lowercase country
        }
        return null;
    }

    function extractStationCode() {
        const span = document.querySelector('span.editable-field-display-text');
        if (!span) return null;

        const matches = [...span.textContent.matchAll(/\[([^\]]+)\]/g)];
        if (matches.length >= 2) {
            return matches[1][1];
        }
        return null;
    }

    function extractDate() {
        const span = document.querySelector('span.editable-field-display-text');
        if (!span) return null;

        const matches = [...span.textContent.matchAll(/\[([^\]]+)\]/g)];
        if (matches.length >= 3) {
            return matches[2][1];
        }
        return null;
    }

    function formatDateForLink(dateStr) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            const [day, month, year] = parts;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        return dateStr;
    }



    function extractCycle(serviceType){
        if (serviceType === 'ORDT'){
         return `**cycle 1**`;
        }else if (serviceType === 'Hard Constraints'){
         return `**cycle 1**`;
        }else if (serviceType === 'Compatibility Area'){
         return `**cycle 1**`;
       }else if (serviceType === 'MicroMobility (Bikers/Walkers)'){
         return `**cycle 1**`;
       }else if (serviceType === 'SameDay Launch'){
         return `**cycle SD**`;
       }else if (serviceType === 'MCO/SCO'){
         return `**cycle 1 , cycle 2**`;
        }else{
        const fallback = extractCycleFallback();
        return `**${fallback}**`;}
    }


    //extract service type from  both <p> and <code> elements
        function extractCycleFallback() {
    const elements = document.querySelectorAll('p, code');

    for (const el of elements) {
        if (el.innerText.toLowerCase().includes('cycles impacted')) {
            const lines = el.innerText
                .split('\n')
                .map(line => line.trim())
                .filter(Boolean);

            const index = lines.findIndex(line => line.toLowerCase().includes('cycles impacted'));
            if (index !== -1 && lines[index + 1]) {
                const value = lines[index + 1].replace(/"/g, '').trim();

                switch (value.toLowerCase()) {
                    case 'SD': return 'cycle SD';
                    case 'SD_A': return 'cycle SD_A';
                    case 'SD_B': return 'cycle SD_B';
                    case 'SD_C': return 'cycle SD_C';
                    case 'SD_D': return 'cycle SD_D';
                    case 'Cycle SD': return 'cycle SD';
                    case 'Cycle 1': return 'cycle 1';
                    case 'cycle 1': return 'cycle 1';
                    case 'cycle 2': return 'cycle 2';
                    default: return 'cycle';
                }
            }
        }
    }

    return 'cycle ??';
}


function getServiceMessage(serviceType) {

        if (serviceType === 'ORDT') {
        return `**Hard Constraints**
Additional RGUs have been created to accommodate ORDT highlighted areas.
Hard constraints have been setup in new RGU as:
Must be one of:

-Service type:
ORDT Extra large cargo
ORDT Parcel?

-Service Provider:
Must be one of`;
    } else if (serviceType === 'Hard Constraints') {
        return `**Hard Constraints**
`;
    }
    else if (serviceType === 'MicroMobility (Bikers/Walkers)') {
        return `**RGU Coverage**

**Master Trace**

**Hard Constraints**
`;
    }
 else if (serviceType === 'DSP On/Off Boarding') {
        return `
**DSP (incl. on/off boarding)**
DSP +++ has now been offboarded/onboarded.


**RGU Coverage**

**Compatibility area**

Compatibility areas should cover a minimum of 80% of the DSPs volume and only exclude difficult zones for new driver, regardless of what DSP delivers in the area.
Please raise a new SIM for compatibility area and provide polygons with an area recommendation for Both DSPs.

In future requests, kindly ensure the inclusion of additional RGUs that align with nursery compatibility, in adherence to our [Tenets](https://w.amazon.com/bin/view/EUCO/Processes/EUCOSM/Configuration/RGUs/Tenets/).
`;
    } else if (serviceType === 'DSP Share Change') {
        return `**RGU Coverage**

**Compatibility area**

Compatibility areas should cover a minimum of 80% of the DSPs volume and only exclude difficult zones for new driver, regardless of what DSP delivers in the area.
Please raise a new SIM for compatibility area and provide polygons with an area recommendation for Both DSPs.

In future requests, kindly ensure the inclusion of additional RGUs that align with nursery compatibility, in adherence to our [Tenets](https://w.amazon.com/bin/view/EUCO/Processes/EUCOSM/Configuration/RGUs/Tenets/).
`;
    }else if (serviceType === 'Compatibility Area') {
        return `**Compatibility area**
The compatibility area coverage is currently at **++% for DSP ++**  which does not adhere our Tenets, however volume coverage for DSP ++ appears to be enough (++%), so at this point we will proceed with your request.
Compatibility areas should cover a minimum of 80% of the DSPs volume and only exclude difficult zones for new driver, regardless of what DSP delivers in the area.
Please raise a new SIM for compatibility area and provide polygons with an area recommendation for Both DSPs.

In future requests, kindly ensure the inclusion of additional RGUs that align with nursery compatibility, in adherence to our [Tenets](https://w.amazon.com/bin/view/EUCO/Processes/EUCOSM/Configuration/RGUs/Tenets/).
`;
    }
else if(serviceType === 'Jurisdiction Change'){return`**RGU Coverage**
New attainment area has been covered with RGU

**GHOST RGU**
GHOST RGU has been created on the lost part of RGU
`}
    else if (serviceType === 'OJ Creation'){return`**RGU Coverage**
RGU adjustments have been completed to accommodate OJ creation.

**Compatibility area**
Newly gained OJ area has been included within the compatibility area.
Compatibility areas should cover a minimum of 80% of the DSPs volume and only exclude difficult zones for new driver, regardless of what DSP delivers in the area.
In future requests, kindly ensure the inclusion of additional RGUs that align with nursery compatibility, in adherence to our [Tenets](https://w.amazon.com/bin/view/EUCO/Processes/EUCOSM/Configuration/RGUs/Tenets/).
`}
        else if (serviceType === 'OJ Removal'){return`**RGU Coverage**
RGU adjustments have been completed OJ Removal.

**Compatibility area**
Newly gained OJ area has been included within the compatibility area.
Compatibility areas should cover a minimum of 80% of the DSPs volume and only exclude difficult zones for new driver, regardless of what DSP delivers in the area.
In future requests, kindly ensure the inclusion of additional RGUs that align with nursery compatibility, in adherence to our [Tenets](https://w.amazon.com/bin/view/EUCO/Processes/EUCOSM/Configuration/RGUs/Tenets/).
`}
    else if (serviceType === 'Recommended RGU Adjustment'){return`**RGU Coverage**
RGU adjustments have been completed.

**Compatibility area**

Compatibility areas should cover a minimum of 80% of the DSPs volume and only exclude difficult zones for new driver, regardless of what DSP delivers in the area.
In future requests, kindly ensure the inclusion of additional RGUs that align with nursery compatibility, in adherence to our [Tenets](https://w.amazon.com/bin/view/EUCO/Processes/EUCOSM/Configuration/RGUs/Tenets/).
`}
    else {
        return `**RGU Coverage**

**Compatibility area**

**Master Trace**

**Hard Constraints**

**GHOST RGUs**

Compatibility areas should cover a minimum of 80% of the DSPs volume and only exclude difficult zones for new driver, regardless of what DSP delivers in the area.
Please raise a new SIM for compatibility area and provide polygons with an area recommendation for Both DSPs.

In future requests, kindly ensure the inclusion of additional RGUs that align with nursery compatibility, in adherence to our [Tenets](https://w.amazon.com/bin/view/EUCO/Processes/EUCOSM/Configuration/RGUs/Tenets/).
`;
    }
}
    function extractServiceTypeOnly() {
    const span = document.querySelector('span.editable-field-display-text');
    if (!span) return null;



    const text = span.textContent;
    let serviceType = null;
    // Try Pattern B: Find text between first and second dashes
    const dashPattern = text.match(/- (.+?) -/);
    if (dashPattern) {
        return dashPattern[1].trim();
    }

    // Try Pattern A: Known types
    const knownTypes = ['ORDT', 'Investigation', 'Hard Constraints', 'Jurisdiction Change', 'Compatibility Area', 'DSP On/Off Boarding', 'DSP Share Change', 'Recommended RGU Adjustment', 'RGU Adjustment'];
    const lowerText = text.toLowerCase();
    for (const type of knownTypes) {
        if (lowerText.includes(type.toLowerCase())) {
            return type;
        }
    }

    return null; // no match
}

     function paatOption(serviceType){
        if (serviceType === 'DSP On/Off Boarding'){
         return `using the **Preferred Area Assignment Tool (PAAT) - Option 3**. You can read more about the PAAT by following [this link](https://approvals.amazon.com/Approval/Details/4691616).`;
        }else if (serviceType === 'DSP Share Change'){
         return `using the **Preferred Area Assignment Tool (PAAT) - Option 3**. You can read more about the PAAT by following [this link](https://approvals.amazon.com/Approval/Details/4691616).`;
        }else if (serviceType === 'Jurisdiction Change'){
         return `using the **Preferred Area Assignment Tool (PAAT) - Option 3**. You can read more about the PAAT by following [this link](https://approvals.amazon.com/Approval/Details/4691616).`;
        }else {
            return '';}
    }

    function getPaatMessage(serviceType, approvalLink){
 if (serviceType === 'DSP On/Off Boarding'){
         return `**PAAT Usage**
PAAT Option 3 was used for this deployment. If you would like to override PAAT3 output, please raise approvals link and gain approval from the relevant Stakeholder [here](${approvalLink})`;
        }else if (serviceType === 'DSP Share Change'){
         return `**PAAT Usage**
PAAT Option 3 was used for this deployment. If you would like to override PAAT3 output, please raise approvals link and gain approval from the relevant Stakeholder [here](${approvalLink})`;
        }else if (serviceType === 'Jurisdiction Change'){
         return `**PAAT Usage**
PAAT Option 3 was used for this deployment. If you would like to override PAAT3 output, please raise approvals link and gain approval from the relevant Stakeholder [here](${approvalLink})`;
       }else{
        return '';}
    }



    const approvalLinks = {
        uk: 'https://approvals.amazon.com/Template/Details/161093',
        meu: 'https://approvals.amazon.com/template/details/172663',
        seu: 'https://approvals.amazon.com/template/details/177887'
    };

    const meuCountries = ['meu', 'de', 'at', 'nl'];
    const seuCountries = ['seu', 'fr', 'es', 'it', 'be'];

    function getApprovalLink(countryCode) {
        countryCode = countryCode.toLowerCase();

        if (countryCode === 'uk') return approvalLinks.uk;
        if (meuCountries.includes(countryCode)) return approvalLinks.meu;
        if (seuCountries.includes(countryCode)) return approvalLinks.seu;
        return approvalLinks.seu; // fallback
    }

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


function extractAliasFromAssignableField() {
    const icons = document.querySelectorAll('i.icon-user');

    for (const icon of icons) {
        // Look for span.editable-field-display-trigger in the same parent or nearby
        const container = icon.closest('div');
        const span = container?.querySelector('span.editable-field-display-trigger');

        if (span) {
            const alias = span.textContent.trim();
            console.log("✅ Found alias near icon-user:", alias);
            return alias;
        }
    }

    console.log("❌ No matching alias found");
    return null;
}



function extractFullNameFromDOMMatchingAlias(alias) {
    const links = document.querySelectorAll('a.activity-actor.hint-top.add-job-details-modified-username');

    for (const link of links) {
        const text = link.textContent.trim();
        const match = text.match(/\(([^)]+)\)/);
        if (match && match[1] === alias) {
            return text.split('(')[0].trim();
        }
    }

    return '';
}


    const interval = setInterval(() => {
        const toolbars = document.querySelectorAll('div[class*="toolbar"]');
        let found = false;

        toolbars.forEach(toolbar => {
            if (toolbar.innerHTML.includes('SIMFlavoredMarkdown')) {
                if (!toolbar.querySelector('#generateProposalBtn')) {
                    const button = document.createElement('button');
                    button.id = 'generateProposalBtn';
                    button.textContent = 'Generate Proposal';
                    button.style.marginLeft = '0px';
                    button.style.padding = '1px 2px';
                    button.style.fontSize = '10px';
                    button.style.cursor = 'pointer';

                    button.addEventListener('click', () => {

                        const station = extractStationCode() || 'STATION';
                        const rawDate = extractDate();
                        const date = rawDate ? formatDateForLink(rawDate) : 'DATE';
                        const country = extractCountry() || 'seu';
                        const approvalLink = getApprovalLink(country);
                        const domain = (country === 'uk') ? `co.uk` : (country === 'be') ? `fr` : (country === 'at') ? `de` : country;
                        const code = (country === 'be') ? 'be-' :
                        (country === 'at') ? 'at-' : '' ;
                        const serviceType = extractServiceTypeOnly();
                        const service = getServiceMessage(serviceType);
                        const paat = paatOption(serviceType);
                        const paatUsage = getPaatMessage(serviceType, approvalLink);

                        const alias = extractAliasFromAssignableField();
                       const fullName = alias ? extractFullNameFromDOMMatchingAlias(alias) : 'COSM Team';

                        const cycle = extractCycle(serviceType);

                        const message = `Dear **${station}**,

Thank you for contacting the **EU COSM** team!

We have reviewed your request and have prepared a new RGU configuration ${paat} \n The new configuration will impact ${cycle}.

Below are the key changes that we have made:

${service}
${paatUsage}
We kindly request that you review the proposal and provide your approval or suggest any additional changes within the **next 48 hours**. If no response is received within this timeframe, the proposed changes will be implemented as of the **OFD date** (see title).

You can access the current and proposed stage(s) by following the links below:
- **Current:** []()
- **Proposed:** [${date}](https://${code}logistics.amazon.${domain}/internal/jas/jurisdiction/${station}/${date}/view)

Please do not hesitate to contact us if you have any questions or concerns.

Best regards
${fullName}`;

                        const textarea = document.getElementById('issue-conversation');
                        if (textarea) {
                            textarea.value = message;
                            textarea.dispatchEvent(new Event('input', { bubbles: true }));
                            textarea.dispatchEvent(new Event('change', { bubbles: true }));

                            autoResizeTextarea(textarea); // initial resize
                            attachAutoResize(textarea); // make dynamic

                            console.log(`✅ Message inserted for station: ${station}`);
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
