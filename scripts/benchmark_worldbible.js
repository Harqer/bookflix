
const entries = [];
const types = ['character', 'location', 'timeline', 'theme', 'other'];
for (let i = 0; i < 10000; i++) {
  entries.push({
    metadata: {
      type: types[i % types.length],
      name: `Entry ${i}`
    }
  });
}

function originalLogic(entries) {
  const characters = entries.filter(e => e.metadata?.type === 'character').map(e => e.metadata);
  const locations = entries.filter(e => e.metadata?.type === 'location').map(e => e.metadata);
  const timeline = entries.filter(e => e.metadata?.type === 'timeline').map(e => e.metadata);
  const themes = entries.filter(e => e.metadata?.type === 'theme').map(e => e.metadata);
  return { characters, locations, timeline, themes };
}

function optimizedLogic(entries) {
  const characters = [];
  const locations = [];
  const timeline = [];
  const themes = [];

  for (const e of entries) {
    const metadata = e.metadata;
    if (!metadata) continue;
    switch (metadata.type) {
      case 'character':
        characters.push(metadata);
        break;
      case 'location':
        locations.push(metadata);
        break;
      case 'timeline':
        timeline.push(metadata);
        break;
      case 'theme':
        themes.push(metadata);
        break;
    }
  }
  return { characters, locations, timeline, themes };
}

// Warmup
for (let i = 0; i < 100; i++) {
  originalLogic(entries);
  optimizedLogic(entries);
}

const iterations = 1000;

console.time('Original');
for (let i = 0; i < iterations; i++) {
  originalLogic(entries);
}
console.timeEnd('Original');

console.time('Optimized');
for (let i = 0; i < iterations; i++) {
  optimizedLogic(entries);
}
console.timeEnd('Optimized');

// Correctness check
const res1 = originalLogic(entries);
const res2 = optimizedLogic(entries);
console.log('Correctness check:', JSON.stringify(res1) === JSON.stringify(res2));
