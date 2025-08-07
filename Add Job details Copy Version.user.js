// ==UserScript==
// @name         Add job details to SIM/TT
// @namespace    http://amazon.com
// @version      1.5
// @description  Shows the user's title next to their name in TT, SIM and other sites. Customize what is shown via the menu options.
// @match        https://tt.amazon.com/*
// @match        https://issues.amazon.com/*
// @match        https://sim.amazon.com/*
// @match        https://i.amazon.com/*
// @match        https://issues-pdx.amazon.com/*
// @match        https://sage.amazon.com/*
// @match        https://sage.amazon.dev/*
// @match        https://refresh.sage.amazon.dev/*
// @match        https://t.corp.amazon.com/*
// @match        https://code.amazon.com/reviews/*
// @match        https://w.amazon.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @grant        GM_info
// @grant        GM_addStyle
// @require      https://m.media-amazon.com/images/G/01/javascript/lib/jquery/jquery-3.2.1.min._CB471786240_.js
// @require      https://m.media-amazon.com/images/G/01/javascript/lib/lodash/lodash-4.17.10.min._CB1533851207_.js
// @require      https://drive-render.corp.amazon.com/view/ebowden@/public/scripts/lib/popper.min.js
// @require      https://drive-render.corp.amazon.com/view/ebowden@/public/scripts/lib/tippy-bundle.umd.min.js
// @connect      phonetool.amazon.com
// @updateURL    https://code.amazon.com/packages/DevScripts-ebowden/blobs/mainline/--/src/job-details.user.js?raw=1
// @downloadURL  https://code.amazon.com/packages/DevScripts-ebowden/blobs/mainline/--/src/job-details.user.js?raw=1

// ==/UserScript==

// Source code: https://code.amazon.com/packages/DevScripts-ebowden/blobs/mainline/--/src/job-details.user.js

/** CHANGE LOG **

1.5
- added script to w.amazon.com

 1.4
 - move script to code.amazon.com package
 - removed metrics

 1.3
 - added role to popover
 - added script to sage.amazon.dev

 1.2
 - fixed whitespace and parens issue around alias
 - fixed new sage issue after searching

 1.1
 - fixed styling on new sage
 - removed popover on tt since it already exists
 - added menu items to show/hide different job details for each site

 1.0
 - Release 1.0!
 - added a sweet popover on hover
 - added support for the new sage site
 - added support for CR code review site
 - added new improved metrics

 0.18
 - fixed lodash conflicting if the namespace is already on the page.

 0.17
 - fixed updateURL

 0.16
 -update for t.corp page structure change

 0.15
 -updated download location
 -updated method name

 0.14
 -fixed script not working on i.amazon.com

 0.13
 -fixed bug where multiple calls at once wouldn't show the job details

 0.12
 -removed GM. notation support, no one is using greasemonkey anymore...
 -code cleanup

 0.11
 -Violentmonkey fix

 0.10
 -fixed sim title issue
 -added toggle show name (click on tampermonkey icon in chrome or right-click page in firefox to see menu)
 -added stats
 -added firefox support

 0.9
 -added details to t.corp, the new tt tool
 -added details for every phone tool link on the pages
 -added details for tt creator
 -added promise to cache to prevent multiple details from showing

 0.8
 -added details to SIM creator
 -added label if not found in phonetool
 -fixed bug when SIMs had a lot of comments
 -added checks that will increase performance

 0.7
 -Added script to sage.amazon.com
 -fixed issue not working on SIM

 0.6
 -fixed bug where username had @amazon.com
 -changed tenure delimiter to a pipe

 **/

(function ($, _, tippy) {
  "use strict";

  //used to add events to elements that get added to page dynamically after load
  //selector is the node you want to callback on
  function addObserver(
    topContainers,
    selector,
    onCreateCallback,
    onRemoveCallback
  ) {
    var targetNodes = $(topContainers);
    var MutationObserver =
      window.MutationObserver || window.WebKitMutationObserver;
    var observer = new MutationObserver(mutationHandler);

    //--- Add a target node to the observer. Can only add one node at a time.
    targetNodes.each(function () {
      //tells the observer what to observe
      //other values include: childList(added,removed), characterData, attributes, subtree(observe subtree as well), attributeFilter
      observer.observe(this, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    });

    function mutationHandler(mutationRecords) {
      mutationRecords.forEach(function (mutation) {
        //on add
        if (onCreateCallback && mutation.addedNodes.length > 0) {
          var $addedNodes = $(mutation.addedNodes).find(selector);
          var $filteredAdded = $(mutation.addedNodes).filter(selector);

          if ($addedNodes.length > 0) {
            onCreateCallback($addedNodes, arguments);
          }

          if ($filteredAdded.length > 0) {
            onCreateCallback($filteredAdded, arguments);
          }
        }

        //on remove
        if (onRemoveCallback && mutation.removedNodes.length > 0) {
          var $removedNodes = $(mutation.removedNodes).find(selector);
          var $filteredRemoved = $(mutation.removedNodes).filter(selector);
          if ($removedNodes.length > 0) {
            onRemoveCallback($removedNodes, arguments);
          }

          if ($filteredRemoved.length > 0) {
            onCreateCallback($filteredRemoved, arguments);
          }
        }
      });
    }
  }

  function getCrossSiteJson(url) {
    return new Promise(function (resolve, reject) {
      //GM_xmlhttpRequest gets around same origin policys
      GM_xmlhttpRequest({
        method: "GET",
        url: url,
        headers: { Accept: "application/json" },
        onload: function (response) {
          var result = JSON.parse(response.responseText);
          resolve(result);
        },
        onerror: function (response) {
          reject(response.statusText);
        },
      });
    });
  }

  function addToEl($els, data) {
    $els.addClass(modifiedCssClass);

    if (data.error) {
      $els.append(" (not in phonetool)");
      return;
    } else if (!data.name) {
      $els.append(" (has left Amazon)");
      return;
    }

    // trim whitespace and parens
    var trimmed = $els
      .first()
      .text()
      .replace(/[\s\(\)]/g, "");
    $els.text(trimmed);

    if (toggleUsernameValue) {
      $els.prepend(data.name + " (");
      $els.append(")");
    }

    $els.append(" - " + data.job_title);

    if (toggleTenureValue) {
      var tenure = (data.tenure_days / 365).toFixed(1) + "y";
      $els.append(" (L" + data.job_level + "|" + tenure + ")");
    }

    if (toggleDeptValue) {
      $els.after(" - <i>" + data.department_name + "</i>");
    }

    const photoUrl = `https://internal-cdn.amazon.com/badgephotos.amazon.com/?uid=${data.login}`;
    const slackUrl = `https://my.slack.com/app_redirect?channel=@${data.login}`;
    const emailUrl = `mailto:${data.login}@amazon.com`;
    const chimeUrl = `https://app.chime.aws/conversations/new?email=${data.login}@amazon.com`;

    // add popover element
    // todo: this should only happen once per user, it currently happens once per link
    if (!removePopover) {
      tippy($els.get(), {
        onShow(instance) {
          // Code here is executed every time the tippy shows

          if (!instance._image_loaded) {
            const div = $("<div>").css({
              display: "flex",
              flexDirection: "row",
            });
            const img = $("<img>")
              .attr(
                "style",
                "margin-right: 10px; max-width: 120px !important; max-height: 160px !important"
              )
              .attr("src", photoUrl);
            const info = $("<div>").css({ textAlign: "left" }).append(`
                        <b>Name</b>: ${data.name} (${data.login})
                        <br>
                        <b>Role</b>: ${data.job_title}
                        <br>
                        <b>Level</b>: ${data.job_level}
                        <br>
                        <b>Tenure</b>: ${data.total_tenure_formatted}
                        <br>
                        <b>Team</b>: <i>${data.department_name}</i>
                        <br>
                        <b>Building</b>: ${data.building}
                        <br>
                        <b>Location</b>: ${data.city}, ${data.country}
                        <br>
                        <a class="${modifiedCssClass}" href="${
              phoneToolUrl + data.login
            }" target="_blank">Phonetool</a> |
                        <a href="${slackUrl}" target="_blank">Slack</a> |
                        <a href="${chimeUrl}" target="_blank">Chime</a> |
                        <a href="${emailUrl}" target="_blank">Email</a>
                    `);
//console.log(data.name);
            div.append(img);
            div.append(info);

            instance.setContent(div.get(0));

            instance._image_loaded = true;
          }
        },
        allowHTML: true,
        interactive: true,
        zIndex: 99999,
        interactiveBorder: 10,
        maxWidth: 500, // this needs to be set or it defaults on the el to 250, additionally styling also set at the bottom of this file
        theme: "light",
      });
    }
  }

  function appendJobDetails($els, href, id) {
    var cache = nameMap[id];

    //if name has already been cached use the cache instead
    if (_.has(cache, "data")) {
      addToEl($els, cache.data);
      return;
    }

    if (!_.has(cache, "promise")) {
      nameMap[id] = {
        promise: getCrossSiteJson(href)
          .then(function (data) {
            var _cache = nameMap[id];
            addToEl(_cache.els, data);
            //add name to cache to be used for future calls
            _cache.data = data;
          })
          .catch(function (status) {
            if (status) {
              console.log(
                "Add-Job-Details Scripts - error retrieving job details:" +
                  status
              );
            } else {
              console.log("Add-Job-Details Scripts - sign into midway!");
            }
          }),
        els: $els,
      };
    } else {
      //if any new elements are added while the promise is still unresolved, add them to the cache
      cache.els = cache.els.add($els);
    }
  }

  function calcOnUniqueNames($nodesFound, userCallbackFn) {
    var elsToModify = $nodesFound.not("." + modifiedCssClass);

    if (elsToModify.length === 0) {
      return;
    }

    //we only want to call one api call per user, this reduces a lot of redundant calls
    var uniqueUsers = elsToModify
      .map(function (i, el) {
        if (userCallbackFn) {
          return userCallbackFn(i, el);
        }
        return $(el)
          .text()
          .trim()
          .replace("@amazon.com", "")
          .replace(/.*\((.*?)\).*/, "$1"); //this is for the author for TT's
      })
      .toArray()
      .filter(function (value, index, self) {
        return !!value && self.indexOf(value) === index;
      });

    uniqueUsers.forEach(function (name) {
      var $els = elsToModify.filter(':contains("' + name + '")');
      var href = phoneToolUrl + name + ".json";
      appendJobDetails($els, href, name);
    });
  }

  //This creates a debouncer that gets used by the Observable.
  //This is useful when an element gets added multiple times to the page and we only want to perform the operation when it's done loading
  function addObservableDebounce(
    parent,
    observerSelector,
    findSelector,
    callbackFn
  ) {
    var activityDebounce = _.debounce(function () {
      var selector = findSelector || observerSelector;

      //once debounce is done we need to find all of them.
      var nodes = $(parent).find(selector);
      calcOnUniqueNames(nodes);
      callbackFn && callbackFn();
    });

    addObserver(parent, observerSelector, function ($nodesFound) {
      activityDebounce();
    });
  }

  function setupMenuItem(name, hostname) {
    var toggleKey = `toggle_${name}_${hostname}`;
    // defaults to true
    var toggleValue =
      GM_getValue(toggleKey) !== undefined ? GM_getValue(toggleKey) : true;

    var menuTitle = toggleValue
      ? `hide ${name} for ${hostname}`
      : `show ${name} for ${hostname}`;
    GM_registerMenuCommand(menuTitle, function () {
      var val = !toggleValue;
      GM_setValue(toggleKey, val);
      window.location.reload();
    });

    return toggleValue;
  }

  var phoneToolUrl = "https://phonetool.amazon.com/users/";
  var nameMap;
  var modifiedCssClass;

  // menu items
  var toggleUsernameValue;
  var toggleTenureValue;
  var toggleDeptValue;

  var removePopover = false;

  var host = window.location.host;
  var pathname = window.location.pathname;

  function init() {
    nameMap = {};
    modifiedCssClass = "add-job-details-modified-username";

    toggleUsernameValue = setupMenuItem("username", host);
    toggleTenureValue = setupMenuItem("tenure", host);
    toggleDeptValue = setupMenuItem("department", host);

    // ** t corp and tt pages ** //
    if (host == "t.corp.amazon.com" || host == "tt.amazon.com") {
      removePopover = true;

      addObservableDebounce("body", ".sim-userPopover--name");
    }

    // ** SIM pages ** //
    var simPages = [
      "issues.amazon.com",
      "sim.amazon.com",
      "i.amazon.com",
      "issues-pdx.amazon.com",
    ];
    if (simPages.indexOf(host) >= 0) {
      var simSelectors = [
        "#requester-identity-pane span.editable-field-display-text", // sim author
        'a[href*="phonetool.amazon.com"].activity-actor', // all phonetool links
      ].join(",");

      addObservableDebounce("body", simSelectors);
    }

    // ** old sage pages ** //
    if (host == "sage.amazon.com") {
      var sageSelectors = [
        ".udetails a", // posters
        ".csig a", // commenters
      ].join(",");

      // page is static so no need to do fancy debouncing
      var nodes = $(sageSelectors);
      calcOnUniqueNames(nodes);
    }

    // ** new sage pages ** //
    if (host == "refresh.sage.amazon.dev" || host == "sage.amazon.dev") {
      var newSageSelectors = [];

      if (pathname.includes("/posts/") || pathname.includes("/questions/")) {
        newSageSelectors = [
          '.user-badge-container a[href*="/users/"]', // posters
          '.markdown-renderer + a[href*="/users/"]', // commenters
        ].join(",");
      } else {
        newSageSelectors = [
          'small a[href*="/users/"]', // left pane posters, right pane doesn't work as intended
        ].join(",");
      }

      addObservableDebounce("body", newSageSelectors);
    }

    // CR review site
    if (host == "code.amazon.com") {
      // todo: this is commented as currently there are issues with reviewers having double names due to ajax loading in the name
      //toggleUsernameValue = false;

      // this is a work around so we know when the links all the links are added but only find the ones that are aliases
      var crObsSelectors = [
        '[ng-if="ctrl.addAlias"] a', // author
        ".entity-content span a", // find when reviewers are added
        'a[href*="/reviews/to-entity/USER"]', // find when commenters are added
      ].join(",");

      var crFindSelector = [
        '[ng-if="ctrl.addAlias"] a', // author
        'codex-ui-user-pic + span a[href*="/reviews/to-entity/"]', // reviewers links
        'a[href*="/reviews/to-entity/USER"]', // commenters links
      ].join(",");

      addObservableDebounce(
        "body",
        crObsSelectors,
        crFindSelector,
        function () {
          // author css
          // todo consider adding css styling at the separator level
          $('[ng-if="ctrl.addAlias"]').css({
            maxWidth: 250,
            textAlign: "center",
          });
        }
      );
    }

    // Wiki site
    if (host == "w.amazon.com") {
      var wSelectors = [".xdocLastModification .wikilink a"].join(",");

      // page is static so no need to do fancy debouncing
      var wNodes = $(wSelectors);
      calcOnUniqueNames(wNodes);
    }
  }

  console.log("Add job details to SIM/TT script loaded");

  try {
    init();
  } catch (e) {
    throw e;
  }

  // tippy popover styling
  GM_addStyle(`
        .tippy-box {
            min-width: 365px;
        }
    `);

  // tippy light theme
  GM_addStyle(
    `.tippy-box[data-theme~=light]{color:#26323d;box-shadow:0 0 20px 4px rgba(154,161,177,.15),0 4px 80px -8px rgba(36,40,47,.25),0 4px 4px -2px rgba(91,94,105,.15);background-color:#fff}.tippy-box[data-theme~=light][data-placement^=top]>.tippy-arrow:before{border-top-color:#fff}.tippy-box[data-theme~=light][data-placement^=bottom]>.tippy-arrow:before{border-bottom-color:#fff}.tippy-box[data-theme~=light][data-placement^=left]>.tippy-arrow:before{border-left-color:#fff}.tippy-box[data-theme~=light][data-placement^=right]>.tippy-arrow:before{border-right-color:#fff}.tippy-box[data-theme~=light]>.tippy-backdrop{background-color:#fff}.tippy-box[data-theme~=light]>.tippy-svg-arrow{fill:#fff}`
  );
})(window.jQuery, _.noConflict(), window.tippy);
