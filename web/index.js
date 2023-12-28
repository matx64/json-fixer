const jsonInput = document.getElementById("json-input");
const jsonOutput = document.getElementById("json-output");
const fixBtn = document.getElementById("btn-fix");

fixBtn.addEventListener("click", (_) => {
  const jsonParser = new JSONParser();

  const fixedJson = jsonParser.parseAndFix(jsonInput.value.trim());

  jsonOutput.value = JSON.stringify(JSON.parse(fixedJson), null, 2);
});
