import fs from 'fs';

const content = fs.readFileSync('App.tsx', 'utf-8');

// The block we want to move starts with "{isMoreSettingsOpen && ("
// and ends with "{renderColorPickerModal()}"

const startStr = "        {isMoreSettingsOpen && (";
const endStr = "        {renderColorPickerModal()}";

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr) + endStr.length;

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find start or end bounds.");
  process.exit(1);
}

const extractedBlock = content.substring(startIndex, endIndex);

// Remove the block from its current location
let newContent = content.substring(0, startIndex) + content.substring(endIndex);

// Wrap the extracted block in a new function:
const modalWrapper = `
  const renderAdditionalModals = () => (
    <>
${extractedBlock}
    </>
  );
`;

// Insert the wrapper just before "if (phase === GamePhase.SETUP)"
const setupIndex = newContent.indexOf("  if (phase === GamePhase.SETUP) {");
if (setupIndex === -1) {
  console.log("Could not find GamePhase.SETUP.");
  process.exit(1);
}

newContent = newContent.substring(0, setupIndex) + modalWrapper + newContent.substring(setupIndex);

// Replace all instances of "{renderSettingsModal()}" with "{renderSettingsModal()}\n        {renderAdditionalModals()}"
newContent = newContent.replace(/\{renderSettingsModal\(\)\}/g, "{renderSettingsModal()}\n        {renderAdditionalModals()}");

fs.writeFileSync('App.tsx', newContent);
console.log("Modals moved successfully!");
