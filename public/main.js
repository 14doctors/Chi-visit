/**
 * Updated Frontend Code
 * File: public/main.js
 * This now calls your secure API endpoint instead of exposing the API key
 */

// Remove the import for GoogleGenAI since we'll use our API endpoint
// import {FunctionDeclaration, GoogleGenAI, Type} from '@google/genai';

const HOMEBASE_ADDRESS = "1537 West Barry Avenue, Chicago, IL 60657";
const HOMEBASE_CAPTION = "This is HomeBase: 1537 West Barry Avenue, Chicago, IL 60657";
const HOMEBASE_ACTION_ID = "SHOW_HOMEBASE";

const presets = [
  ['🏠 HomeBase', HOMEBASE_ACTION_ID],
  ['🏙️ Mainstream Attractions', `Please recommend **only one** well-known and popular mainstream attraction in Chicago **from the following list**. Explain why it's a famous landmark or highly-rated tourist spot.
List of allowed attractions:
- Griffin Museum of Science and Industry
- Adler Planetarium
- Chicago Navy Pier
- Chicago Fed Money Museum
- Willis Tower (aka Sears Tower)
- Hancock Tower
- The Art Institute of Chicago
- Chicago History Museum
- Field Museum
- Grant Park (Fountain)
- Soldier Field
- Wrigley Field
- Museum of Contemporary Art
- Miracle Mile
- Lake Front Path
- Lincoln Park Zoo
- Museum of Illusion – Chicago
- Chicago Cultural Center
- Chicago Architecture Center Boat Tour`],
  ['🍽️ Restaurants', 'Recommend an interesting restaurant in Chicago. What kind of food does it serve and what makes it special?'],
  ['✨ Unique Eats', 'Suggest a truly unique or unconventional dining experience in Chicago. What makes it stand out?'],
  ['🗽 Metropolitan', 'Show me a really interesting large district or neighborhood in Chicago.'],
  ['🌿 Green', 'Take me somewhere with beautiful nature and greenery within Chicago. What makes it special?'],
  ['🏔️ Remote', 'If I wanted to find a quiet, somewhat "remote-feeling" spot in Chicago, where would that be? How would I get there?'],
  ['🌌 Surreal', 'Think of a totally surreal location or experience in Chicago, where is it? What makes it so surreal?'],
];

const captionDiv = document.querySelector('#caption');
const frame = document.querySelector('#embed-map');

async function generateContent(prompt) {
  try {
    // Call your secure API endpoint
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Handle the response
    if (data.functionCalls && data.functionCalls.length > 0) {
      // Look for recommendPlace function calls
      for (const fn of data.functionCalls) {
        if (fn.name === 'recommendPlace') {
          const location = fn.args.location;
          const caption = fn.args.caption;
          renderMap(location);
          captionDiv.textContent = caption;
          captionDiv.classList.remove('hidden');
          return;
        }
      }
    }

    // If no function call, display the text response
    if (data.text) {
      captionDiv.textContent = data.text;
    } else {
      captionDiv.textContent = 'Sorry, I couldn\'t find a specific place for that. Try a different request!';
    }
    captionDiv.classList.remove('hidden');

  } catch (error) {
    console.error('Error generating content:', error);
    captionDiv.textContent = 'Sorry, I encountered an error. Please try again.';
    captionDiv.classList.remove('hidden');
  }
}

function renderMap(location) {
  // Note: You might want to move this Maps API key to environment variables too
  // and create another API endpoint for map rendering, or use a public key with restrictions
  const MAPS_EMBED_API_KEY = 'api key';
  frame.src = `https://www.google.com/maps/embed/v1/place?key=${MAPS_EMBED_API_KEY}&q=${encodeURIComponent(location)}`;
}

async function main() {
  if (
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }

  const div = document.querySelector('#presets');
  for (const preset of presets) {
    const p = document.createElement('button');
    p.textContent = preset[0];
    
    if (preset[1] === HOMEBASE_ACTION_ID) {
      p.setAttribute('aria-label', `Go to HomeBase at ${HOMEBASE_ADDRESS}`);
    } else {
      p.setAttribute('aria-label', `Get suggestions for ${preset[0]} in Chicago`);
    }

    p.addEventListener('click', async () => {
      captionDiv.classList.add('hidden'); 
      frame.src = ''; 
      
      if (preset[1] === HOMEBASE_ACTION_ID) {
        captionDiv.textContent = 'Loading HomeBase...';
        captionDiv.classList.remove('hidden');
        renderMap(HOMEBASE_ADDRESS);
        captionDiv.textContent = HOMEBASE_CAPTION;
      } else {
        captionDiv.textContent = 'Thinking...';
        captionDiv.classList.remove('hidden');
        try {
          await generateContent(preset[1]);
        } catch (e) {
          console.error('Error generating content:', e);
          captionDiv.textContent = 'Sorry, I encountered an error. Please try again.';
          captionDiv.classList.remove('hidden');
        }
      }
    });
    div.append(p);
  }

  // Initial map
  renderMap('Chicago, Illinois');
  captionDiv.textContent = 'Explore Chicago! Click a preset to discover hidden gems.';
  captionDiv.classList.remove('hidden');
}

main();
