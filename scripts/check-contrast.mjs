const pairs = [
  ['Acción primaria clara', '#ffffff', '#914600'],
  ['Texto principal claro', '#2d2540', '#fffaf4'],
  ['Texto secundario claro', '#645b78', '#ffffff'],
  ['Marca clara', '#914600', '#ffffff'],
  ['Error claro', '#b4232f', '#fff0f1'],
  ['Éxito claro', '#176b32', '#f1fff4'],
  ['Recompensa clara', '#765000', '#fff5d6'],
  ['Acción primaria oscura', '#1f1930', '#ffd19a'],
  ['Texto principal oscuro', '#fdf7ed', '#1f1930'],
  ['Texto secundario oscuro', '#d7cddf', '#2b2340'],
  ['Marca oscura', '#ffd48a', '#1f1930'],
  ['Error oscuro', '#ffb4bb', '#411f25'],
  ['Éxito oscuro', '#a7e9b9', '#173a24'],
  ['Recompensa oscura', '#ffe08a', '#493915'],
];

const luminance = hex => {
  const channels = hex.slice(1).match(/../g).map(value => Number.parseInt(value, 16) / 255);
  const linear = channels.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
};

for (const [name, foreground, background] of pairs) {
  const foregroundLum = luminance(foreground);
  const backgroundLum = luminance(background);
  const ratio = (Math.max(foregroundLum, backgroundLum) + 0.05) / (Math.min(foregroundLum, backgroundLum) + 0.05);
  const result = ratio >= 4.5 ? 'AA' : 'FALLA';
  console.log(`${name}|${foreground}|${background}|${ratio.toFixed(2)}:1|${result}`);
}
