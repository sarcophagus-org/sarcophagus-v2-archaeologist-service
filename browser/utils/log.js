const output = document.getElementById("output");

export function log(txt) {
  console.info(txt);
  output.textContent += `${txt.trim()}\n`;
}