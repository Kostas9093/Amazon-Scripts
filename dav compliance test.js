async function setDAVCompliance() {

  const labels = issue.labels;
  const node = issue.getCustomField("node");
  const typeOfChange = issue.getCustomField("type_of_change");

  const compliantLabelId = "22d55243-c769-464d-97bb-6e997678f94c";

  const isCompliant = labels.some(label => label.id === compliantLabelId);

  if (isCompliant) {
       
    return;
  }


  let reasoning = "";
  let complianceValue = "Non-Compliant";

    if (typeof node === "string" && node.length > 0) {
  const firstChar = node.charAt(0);
   
   if (firstChar === "H"){
      reasoning = "AMXL";
      complianceValue;
    } else if (firstChar === "E") {
      reasoning = "HUB";
      complianceValue = "N/A";
    } else if (firstChar === "V") {
      reasoning = "Volta Station";
      complianceValue = "N/A";
    }

    if (reasoning !== "") {
    
      await issue.edit({
        path: "/customFields/string/dav_compliance",
        editAction: "PUT",
        data: { "id": "dav_compliance", "value" : complianceValue }
      });
      await issue.edit({
        path: "/customFields/string/dav_not_used_reasoning",
        editAction: "PUT",
        data: { "id": "dav_not_used_reasoning", "value" : reasoning }
      });
      return;
    }
  }

  const naConditions = ["Hard Constraints",
    "Compatibility Area",
    "ORDT Service Type",
    "Investigation Required | Hard Constraint Not Respected",
    "MicroMobility (Bikers/Walkers)",
    "SD Acceleration"];

  if (naConditions.includes(typeOfChange)) {
    
    await issue.edit({
      path: "/customFields/string/dav_compliance",
      editAction: "PUT",
      data: { "id" : "dav_compliance", "value": "N/A" }
    });
    await issue.edit({
      path: "/customFields/string/dav_not_used_reasoning",
      editAction: "PUT",
      data: { "id" : "dav_not_used_reasoning", "value": "N/A" }
    });
    return;
  }

  
  await issue.edit({
    path: "/customFields/string/dav_compliance",
    editAction: "PUT",
    data: { "id": "dav_compliance", "value" : "Non-Compliant" }
  });

  await issue.edit({
    path: "/customFields/string/dav_not_used_reasoning",
    editAction: "PUT",
    data: { "id": "dav_not_used_reasoning", "value" : "" }
  });

}
setDAVCompliance();






const reason = issue.getCustomField("dav_not_used_reasoning")?.value;
const compliance = issue.getCustomField("dav_compliance")?.value;





async function checkDavReason() {
    const reasonField = issue.getCustomField("dav_not_used_reasoning");
    const complianceField = issue.getCustomField("dav_compliance");

    const reason = reasonField ? reasonField.value : null;
    const compliance = complianceField ? complianceField.value : null;

    if (compliance === "Non-Compliant" && reason === "N/A") {
        await issue.addComment(`⚠️ Note for Specialist ⚠️
SIM is not DAV Compliant. Ensure "DAV Not Used Reasoning" custom field is updated.`);
    }
};

checkDavReason();





async function checkDavReason(){
    
    const reason = issue.getCustomField("dav_not_used_reasoning")?.value;
    const compliance = issue.getCustomField("dav_compliance")?.value;
  
  if (compliance === "Non-Compliant" && reason === "N/A")
  {
      
   await issue.addComment(`⚠️ Note for Specialist ⚠️
SIM is not DAV Compliant. Ensure "DAV Not Used Reasoning" custom field is updated.`)
  }

};

checkDavReason();