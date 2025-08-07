function setDAVCompliance() {
  const labels = issue.labels;

  // Check for specific label
  for (let j = 0; j < labels.length; j++) {
    if (labels[j].id === "22d55243-c769-464d-97bb-6e997678f94c") {
      issue.edit({
        path: "/customFields/string/dav_compliance",
        editAction: "PUT",
        data: {
          id: "dav_compliance",
          value: "Compliant"
        }
      });
      return; // Stop here if compliant condition met
    }
  }

  // If label not found, check type_of_change
  const typeOfChange = issue.getCustomField("type_of_change");

  const naConditions = [
    "Hard Constraints",
    "Compatibility Area",
    "ORDT Service Type",
    "DS/XPT Deprecation"
  ];

  const complianceValue = naConditions.includes(typeOfChange)
    ? "N/A"
    : "Non-Compliant";

  // Apply the result
  issue.edit({
    path: "/customFields/string/dav_compliance",
    editAction: "PUT",
    data: {
      id: "dav_compliance",
      value: complianceValue
    }
  });
}

setDAVCompliance();